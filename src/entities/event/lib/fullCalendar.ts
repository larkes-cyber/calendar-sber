import type { EventInput } from '@fullcalendar/core';

import type { CalendarMeta } from '@entities/calendar';

import type { CalendarEvent } from '../model/types';

const eventBackgroundByCalendar: Record<string, string> = {
  team: '#e4f7e8',
  engineering: '#e7f0ff',
  external: '#fff0dc'
};

export function toFullCalendarEvents(
  events: CalendarEvent[],
  calendars: CalendarMeta[]
): EventInput[] {
  const calendarById = new Map(calendars.map((calendar) => [calendar.id, calendar]));

  return events.map((event) => {
    const calendar = calendarById.get(event.calendarId);

    return {
      id: event.id,
      title: event.title,
      start: event.startsAt,
      end: event.endsAt,
      display: 'block',
      backgroundColor: eventBackgroundByCalendar[event.calendarId] ?? '#edf0ee',
      borderColor: 'transparent',
      textColor: calendar?.color,
      extendedProps: {
        calendarId: event.calendarId,
        owner: event.owner,
        status: event.status
      }
    };
  });
}
