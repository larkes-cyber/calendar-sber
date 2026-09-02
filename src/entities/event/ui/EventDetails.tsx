import type { CalendarEvent } from '../model/types';

import styles from './EventDetails.module.css';

type EventDetailsProps = {
  event: CalendarEvent | null;
};

const statusLabel = {
  planned: 'Запланировано',
  confirmed: 'Подтверждено',
  done: 'Завершено'
};

export function EventDetails({ event }: EventDetailsProps) {
  if (!event) {
    return (
      <aside className={styles.root}>
        <p className={styles.empty}>Выберите событие в календаре.</p>
      </aside>
    );
  }

  return (
    <aside className={styles.root}>
      <span className={styles.status}>{statusLabel[event.status]}</span>
      <h2>{event.title}</h2>
      <dl className={styles.meta}>
        <div>
          <dt>Начало</dt>
          <dd>{formatDateTime(event.startsAt)}</dd>
        </div>
        <div>
          <dt>Окончание</dt>
          <dd>{formatDateTime(event.endsAt)}</dd>
        </div>
        <div>
          <dt>Владелец</dt>
          <dd>{event.owner}</dd>
        </div>
        {event.location ? (
          <div>
            <dt>Место</dt>
            <dd>{event.location}</dd>
          </div>
        ) : null}
        {event.attendees?.length ? (
          <div>
            <dt>Участники</dt>
            <dd>{event.attendees.join(', ')}</dd>
          </div>
        ) : null}
      </dl>
      {event.videoMeetingUrl ? (
        <a className={styles.videoLink} href={event.videoMeetingUrl} rel="noreferrer" target="_blank">
          Подключиться к видеовстрече
        </a>
      ) : null}
      {event.description ? <p className={styles.description}>{event.description}</p> : null}
    </aside>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}
