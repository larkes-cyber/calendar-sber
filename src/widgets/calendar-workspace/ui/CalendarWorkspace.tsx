import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { EventClickArg } from '@fullcalendar/core';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { mockCalendars, CalendarSidebar } from '@entities/calendar';
import { EventDetails, mockEvents } from '@entities/event';
import { toFullCalendarEvents } from '@entities/event/lib/fullCalendar';
import { CalendarViewSwitcher, type CalendarRouteView } from '@features/calendar-navigation';
import { CreateEventButton } from '@features/create-event';
import { resolveRouteDate } from '@shared/lib/date';

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
  const [selectedEventId, setSelectedEventId] = useState(mockEvents[0]?.id ?? null);
  const selectedDate = resolveRouteDate(firstDay);

  const calendarEvents = useMemo(
    () => toFullCalendarEvents(mockEvents, mockCalendars),
    []
  );

  const selectedEvent = mockEvents.find((event) => event.id === selectedEventId) ?? null;

  const handleViewChange = (nextView: CalendarRouteView) => {
    navigate(`/${nextView}/${selectedDate}`);
  };

  const handleEventClick = (click: EventClickArg) => {
    setSelectedEventId(click.event.id);
  };

  return (
    <section className={styles.root}>
      <CalendarSidebar calendars={mockCalendars} />
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div>
            <p className={styles.caption}>Календарь</p>
            <h1>Рабочее расписание</h1>
          </div>
          <div className={styles.actions}>
            <CalendarViewSwitcher onChange={handleViewChange} value={view} />
            <CreateEventButton />
          </div>
        </div>
        <div className={styles.calendarSurface}>
          <FullCalendar
            allDaySlot={false}
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
            selectable
          />
        </div>
      </div>
      <EventDetails event={selectedEvent} />
    </section>
  );
}
