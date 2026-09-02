export type CalendarEvent = {
  id: string;
  calendarId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  owner: string;
  attendees?: string[];
  location?: string;
  videoMeetingUrl?: string;
  description?: string;
  status: 'planned' | 'confirmed' | 'done';
};
