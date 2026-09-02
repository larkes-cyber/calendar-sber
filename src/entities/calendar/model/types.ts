export type CalendarMeta = {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  source: 'local' | 'caldav' | 'webcal';
};
