export type CreateEventInput = {
  title: string;
  startsAt: string;
  endsAt: string;
  attendees: string[];
  location?: string;
  createVideoMeeting: boolean;
};
