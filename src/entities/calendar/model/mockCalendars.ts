import type { CalendarMeta } from './types';

export const mockCalendars: CalendarMeta[] = [
  {
    id: 'team',
    name: 'Команда',
    color: '#16845b',
    isVisible: true,
    source: 'local'
  },
  {
    id: 'engineering',
    name: 'Разработка',
    color: '#3276db',
    isVisible: true,
    source: 'caldav'
  },
  {
    id: 'external',
    name: 'Внешние',
    color: '#d97724',
    isVisible: true,
    source: 'webcal'
  }
];
