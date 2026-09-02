import type { CalendarMeta } from './types';

export const mockCalendars: CalendarMeta[] = [
  {
    id: 'team',
    name: 'Команда',
    color: '#2fb344',
    isVisible: true,
    source: 'local'
  },
  {
    id: 'engineering',
    name: 'Разработка',
    color: '#2f7df4',
    isVisible: true,
    source: 'caldav'
  },
  {
    id: 'external',
    name: 'Внешние',
    color: '#f08c18',
    isVisible: true,
    source: 'webcal'
  }
];
