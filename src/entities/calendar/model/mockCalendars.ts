import type { CalendarMeta } from './types';

export const mockCalendars: CalendarMeta[] = [
  {
    id: 'team',
    name: 'Команда',
    color: '#16794c',
    isVisible: true,
    source: 'local'
  },
  {
    id: 'engineering',
    name: 'Разработка',
    color: '#2f6fbb',
    isVisible: true,
    source: 'caldav'
  },
  {
    id: 'external',
    name: 'Внешние',
    color: '#9a5a13',
    isVisible: true,
    source: 'webcal'
  }
];
