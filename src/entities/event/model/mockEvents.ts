import type { CalendarEvent } from './types';

export const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    calendarId: 'team',
    title: 'Планирование спринта',
    startsAt: '2026-09-03T10:00:00+03:00',
    endsAt: '2026-09-03T11:00:00+03:00',
    owner: 'Product',
    location: 'Zoom',
    description: 'Цели спринта, пропускная способность команды, зависимости.',
    status: 'confirmed'
  },
  {
    id: '2',
    calendarId: 'engineering',
    title: 'Синхронизация AI-агентов',
    startsAt: '2026-09-03T14:30:00+03:00',
    endsAt: '2026-09-03T15:00:00+03:00',
    owner: 'Engineering',
    location: 'Team room',
    description: 'Разделение задач между product agent и engineering agent.',
    status: 'planned'
  },
  {
    id: '3',
    calendarId: 'team',
    title: 'Демо календаря',
    startsAt: '2026-09-04T12:00:00+03:00',
    endsAt: '2026-09-04T13:00:00+03:00',
    owner: 'Team',
    location: 'Main hall',
    description: 'Показ текущего состояния календаря и списка следующих интеграций.',
    status: 'planned'
  },
  {
    id: '4',
    calendarId: 'external',
    title: 'Внешняя встреча',
    startsAt: '2026-09-05T16:00:00+03:00',
    endsAt: '2026-09-05T17:30:00+03:00',
    owner: 'Partners',
    location: 'Office',
    status: 'confirmed'
  }
];
