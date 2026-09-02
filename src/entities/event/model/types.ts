export type CalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  owner: string;
  location?: string;
  description?: string;
  status: 'planned' | 'confirmed' | 'done';
};
