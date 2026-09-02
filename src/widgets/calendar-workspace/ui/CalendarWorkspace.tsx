import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { DateSelectArg, DatesSetArg, DayCellMountArg, EventClickArg } from '@fullcalendar/core';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { mockCalendars, CalendarSidebar } from '@entities/calendar';
import { EventDetails, mockEvents, type CalendarEvent } from '@entities/event';
import { toFullCalendarEvents } from '@entities/event/lib/fullCalendar';
import { CalendarViewSwitcher, type CalendarRouteView } from '@features/calendar-navigation';
import { CreateEventButton, CreateEventModal, type CreateEventInput } from '@features/create-event';
import { formatRouteDate, resolveRouteDate } from '@shared/lib/date';
import { AiAssistant } from '@widgets/ai-assistant';

import styles from './CalendarWorkspace.module.css';

type CalendarWorkspaceProps = {
  view: CalendarRouteView;
  firstDay: string;
};

const fullCalendarViewByRoute: Record<CalendarRouteView, string> = {
  month: 'dayGridMonth',
  week: 'timeGridWeek',
  list: 'listWeek'
};

const workDayStartMinutes = 8 * 60;
const workDayEndMinutes = 20 * 60;
const timeSlotMinutes = 30;

export function CalendarWorkspace({ view, firstDay }: CalendarWorkspaceProps) {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const dayCellCleanups = useRef(new WeakMap<HTMLElement, () => void>());
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [selectedEventId, setSelectedEventId] = useState(mockEvents[0]?.id ?? null);
  const selectedDate = resolveRouteDate(firstDay);
  const [visibleDate, setVisibleDate] = useState(selectedDate);
  const [calendarTitle, setCalendarTitle] = useState('');
  const [newEventRange, setNewEventRange] = useState<{
    startsAt: Date;
    endsAt: Date;
    initialTitle?: string;
    initialAttendees?: string[];
  } | null>(null);

  const calendarEvents = useMemo(
    () => toFullCalendarEvents(events, mockCalendars),
    [events]
  );

  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

  const handleViewChange = (nextView: CalendarRouteView) => {
    navigate(`/${nextView}/${visibleDate}`);
  };

  const handleEventClick = (click: EventClickArg) => {
    setSelectedEventId(click.event.id);
  };

  const handleDatesSet = (dateInfo: DatesSetArg) => {
    setCalendarTitle(dateInfo.view.title);
    setVisibleDate(formatRouteDate(dateInfo.view.calendar.getDate()));
  };

  const moveCalendar = (direction: 'prev' | 'next' | 'today') => {
    calendarRef.current?.getApi()[direction]();
  };

  const openEventModal = () => {
    setNewEventRange(createDefaultMeetingRange(new Date(`${visibleDate}T10:00:00`)));
  };

  const scheduleWithColleague = (startsAt: Date, colleague: string) => {
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    setNewEventRange({
      startsAt,
      endsAt,
      initialTitle: `Синхронизация с ${colleague.split(' ')[0]}`,
      initialAttendees: [colleague]
    });
  };

  const handleDateSelect = (selection: DateSelectArg) => {
    if (selection.allDay) {
      setNewEventRange(createDefaultMeetingRange(selection.start));
      return;
    }

    setNewEventRange({ startsAt: selection.start, endsAt: selection.end });
  };

  const mountDayTimeSelector = (cell: DayCellMountArg) => {
    if (view !== 'month') return;

    const frame = cell.el.querySelector<HTMLElement>('.fc-daygrid-day-frame');
    if (!frame) return;

    frame.classList.add(styles.timeSelectable);
    let cancelActiveSelection = () => {};

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.button !== 0 ||
        target.closest('.fc-event, .fc-daygrid-day-number, .fc-more-link')
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const frameRect = frame.getBoundingClientRect();
      const contentTop = 38;
      const contentHeight = Math.max(frameRect.height - contentTop - 8, 1);
      const startMinute = getMinuteFromPointer(event.clientY, frameRect.top + contentTop, contentHeight);
      const selection = document.createElement('div');
      selection.className = styles.timeSelection;
      frame.append(selection);

      const updateSelection = (clientY: number) => {
        const currentMinute = getMinuteFromPointer(
          clientY,
          frameRect.top + contentTop,
          contentHeight
        );
        const rangeStart = Math.min(startMinute, currentMinute);
        const rangeEnd = Math.min(
          workDayEndMinutes,
          Math.max(startMinute, currentMinute) + timeSlotMinutes
        );
        const startRatio =
          (rangeStart - workDayStartMinutes) / (workDayEndMinutes - workDayStartMinutes);
        const durationRatio =
          (rangeEnd - rangeStart) / (workDayEndMinutes - workDayStartMinutes);

        selection.style.top = `${contentTop + startRatio * contentHeight}px`;
        selection.style.height = `${Math.max(durationRatio * contentHeight, 5)}px`;
        selection.dataset.time = `${formatTime(rangeStart)}–${formatTime(rangeEnd)}`;

        return { rangeStart, rangeEnd };
      };

      let selectedRange = updateSelection(event.clientY);
      const handlePointerMove = (moveEvent: PointerEvent) => {
        selectedRange = updateSelection(moveEvent.clientY);
      };
      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        selection.remove();

        setNewEventRange({
          startsAt: createDateAtMinutes(cell.date, selectedRange.rangeStart),
          endsAt: createDateAtMinutes(cell.date, selectedRange.rangeEnd)
        });
      };

      cancelActiveSelection = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        selection.remove();
      };
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp, { once: true });
    };

    frame.addEventListener('pointerdown', handlePointerDown);
    dayCellCleanups.current.set(cell.el, () => {
      cancelActiveSelection();
      frame.removeEventListener('pointerdown', handlePointerDown);
    });
  };

  const unmountDayTimeSelector = (cell: DayCellMountArg) => {
    dayCellCleanups.current.get(cell.el)?.();
    dayCellCleanups.current.delete(cell.el);
  };

  const closeEventModal = () => {
    setNewEventRange(null);
    calendarRef.current?.getApi().unselect();
  };

  const handleCreateEvent = (input: CreateEventInput) => {
    const id = crypto.randomUUID();
    const event: CalendarEvent = {
      id,
      calendarId: 'team',
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      attendees: input.attendees,
      owner: 'Вы',
      location: input.location,
      videoMeetingUrl: input.createVideoMeeting ? `https://video.calendar.local/${id}` : undefined,
      status: 'confirmed'
    };

    setEvents((current) => [...current, event]);
    setSelectedEventId(id);
    closeEventModal();
  };

  return (
    <section className={styles.root}>
      <AiAssistant
        events={events}
        onCreateMeeting={openEventModal}
        onScheduleWithColleague={scheduleWithColleague}
      />
      <div className={styles.workspace}>
        <div className={styles.sidebar}>
          <CalendarSidebar calendars={mockCalendars} />
          <EventDetails event={selectedEvent} />
        </div>
        <div className={styles.content}>
          <div className={styles.toolbar}>
            <div className={styles.heading}>
              <h1>{calendarTitle || 'Рабочее расписание'}</h1>
              <div className={styles.dateNavigation} aria-label="Навигация по датам">
                <button aria-label="Предыдущий период" onClick={() => moveCalendar('prev')} type="button">
                  ‹
                </button>
                <button className={styles.todayButton} onClick={() => moveCalendar('today')} type="button">
                  Сегодня
                </button>
                <button aria-label="Следующий период" onClick={() => moveCalendar('next')} type="button">
                  ›
                </button>
              </div>
            </div>
            <div className={styles.actions}>
              <CalendarViewSwitcher onChange={handleViewChange} value={view} />
              <CreateEventButton onClick={openEventModal} />
            </div>
          </div>
          <div className={styles.calendarSurface}>
            <FullCalendar
              allDaySlot={false}
            datesSet={handleDatesSet}
            dayCellDidMount={mountDayTimeSelector}
            dayCellWillUnmount={unmountDayTimeSelector}
              dayMaxEvents={3}
              displayEventTime={false}
              eventClick={handleEventClick}
              events={calendarEvents}
              firstDay={1}
              headerToolbar={false}
              height="auto"
              initialDate={selectedDate}
              initialView={fullCalendarViewByRoute[view]}
              key={`${view}-${selectedDate}`}
              locale="ru"
              nowIndicator
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              ref={calendarRef}
            selectable={view === 'week'}
              select={handleDateSelect}
              selectMirror
            />
          </div>
        </div>
      </div>
      {newEventRange ? (
        <CreateEventModal
          endsAt={newEventRange.endsAt}
          initialAttendees={newEventRange.initialAttendees}
          initialTitle={newEventRange.initialTitle}
          key={`${newEventRange.startsAt.toISOString()}-${newEventRange.endsAt.toISOString()}`}
          onClose={closeEventModal}
          onCreate={handleCreateEvent}
          startsAt={newEventRange.startsAt}
        />
      ) : null}
    </section>
  );
}

function createDefaultMeetingRange(date: Date) {
  const startsAt = new Date(date);
  startsAt.setHours(10, 0, 0, 0);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

  return { startsAt, endsAt };
}

function getMinuteFromPointer(clientY: number, contentTop: number, contentHeight: number) {
  const ratio = Math.min(0.999, Math.max(0, (clientY - contentTop) / contentHeight));
  const slotCount = (workDayEndMinutes - workDayStartMinutes) / timeSlotMinutes;
  const slot = Math.min(slotCount - 1, Math.round(ratio * slotCount));

  return workDayStartMinutes + slot * timeSlotMinutes;
}

function createDateAtMinutes(date: Date, minutes: number) {
  const result = new Date(date);
  result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return result;
}

function formatTime(minutes: number) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0');
  const remainder = String(minutes % 60).padStart(2, '0');
  return `${hours}:${remainder}`;
}
