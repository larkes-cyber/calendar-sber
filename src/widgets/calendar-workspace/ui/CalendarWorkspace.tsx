import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { mockCalendars, CalendarSidebar } from '@entities/calendar';
import { EventDetails, mockEvents } from '@entities/event';
import { toFullCalendarEvents } from '@entities/event/lib/fullCalendar';
import { CalendarViewSwitcher, type CalendarRouteView } from '@features/calendar-navigation';
import { CreateEventButton } from '@features/create-event';
import { formatRouteDate, resolveRouteDate } from '@shared/lib/date';

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

export function CalendarWorkspace({ view, firstDay }: CalendarWorkspaceProps) {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const [selectedEventId, setSelectedEventId] = useState(mockEvents[0]?.id ?? null);
  const selectedDate = resolveRouteDate(firstDay);
  const [visibleDate, setVisibleDate] = useState(selectedDate);
  const [calendarTitle, setCalendarTitle] = useState('');

  const calendarEvents = useMemo(
    () => toFullCalendarEvents(mockEvents, mockCalendars),
    []
  );

  const selectedEvent = mockEvents.find((event) => event.id === selectedEventId) ?? null;

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

  return (
    <section className={styles.root}>
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
            <CreateEventButton />
          </div>
        </div>
        <div className={styles.calendarSurface}>
          <FullCalendar
            allDaySlot={false}
            datesSet={handleDatesSet}
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
            selectable
          />
        </div>
      </div>
    </section>
  );
}
