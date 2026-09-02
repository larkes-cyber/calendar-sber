import { type FormEvent, type KeyboardEvent, useEffect, useState } from 'react';

import type { CreateEventInput } from '../model/types';

import styles from './CreateEventModal.module.css';

type CreateEventModalProps = {
  startsAt: Date;
  endsAt: Date;
  initialTitle?: string;
  initialAttendees?: string[];
  onClose: () => void;
  onCreate: (event: CreateEventInput) => void;
};

const rooms = [
  'Без переговорной',
  'Нева · 4 человека',
  'Волга · 8 человек',
  'Байкал · 12 человек'
];

export function CreateEventModal({ startsAt, endsAt, initialTitle = '', initialAttendees = [], onClose, onCreate }: CreateEventModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [start, setStart] = useState(toDateTimeInputValue(startsAt));
  const [end, setEnd] = useState(toDateTimeInputValue(endsAt));
  const [attendeeInput, setAttendeeInput] = useState('');
  const [attendees, setAttendees] = useState<string[]>(initialAttendees);
  const [location, setLocation] = useState(rooms[0]);
  const [createVideoMeeting, setCreateVideoMeeting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const addAttendee = () => {
    const values = attendeeInput
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value && !attendees.includes(value));

    if (values.length) {
      setAttendees((current) => [...current, ...values]);
      setAttendeeInput('');
    }
  };

  const handleAttendeeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addAttendee();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedTitle = title.trim();
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (!normalizedTitle) {
      setError('Введите название встречи');
      return;
    }

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setError('Время окончания должно быть позже начала');
      return;
    }

    const pendingAttendees = attendeeInput.trim()
      ? attendeeInput.split(',').map((value) => value.trim()).filter(Boolean)
      : [];

    onCreate({
      title: normalizedTitle,
      startsAt: startDate.toISOString(),
      endsAt: endDate.toISOString(),
      attendees: [...new Set([...attendees, ...pendingAttendees])],
      location: location === rooms[0] ? undefined : location,
      createVideoMeeting
    });
  };

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="create-event-title" aria-modal="true" className={styles.modal} role="dialog">
        <div className={styles.header}>
          <div>
            <p>Новая встреча</p>
            <h2 id="create-event-title">Добавить в календарь</h2>
          </div>
          <button aria-label="Закрыть" className={styles.closeButton} onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Название</span>
            <input autoFocus onChange={(event) => setTitle(event.target.value)} placeholder="Например, синхронизация команды" value={title} />
          </label>

          <div className={styles.dateGrid}>
            <label className={styles.field}>
              <span>Начало</span>
              <input onChange={(event) => setStart(event.target.value)} type="datetime-local" value={start} />
            </label>
            <label className={styles.field}>
              <span>Окончание</span>
              <input onChange={(event) => setEnd(event.target.value)} type="datetime-local" value={end} />
            </label>
          </div>

          <label className={styles.field}>
            <span>Коллеги</span>
            <input
              onBlur={addAttendee}
              onChange={(event) => setAttendeeInput(event.target.value)}
              onKeyDown={handleAttendeeKeyDown}
              placeholder="Имя или почта, затем Enter"
              value={attendeeInput}
            />
          </label>

          {attendees.length ? (
            <div className={styles.attendees} aria-label="Добавленные коллеги">
              {attendees.map((attendee) => (
                <span className={styles.attendee} key={attendee}>
                  {attendee}
                  <button aria-label={`Удалить ${attendee}`} onClick={() => setAttendees((current) => current.filter((item) => item !== attendee))} type="button">
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          <label className={styles.field}>
            <span>Переговорная</span>
            <select onChange={(event) => setLocation(event.target.value)} value={location}>
              {rooms.map((room) => <option key={room}>{room}</option>)}
            </select>
          </label>

          <label className={styles.videoOption}>
            <input checked={createVideoMeeting} onChange={(event) => setCreateVideoMeeting(event.target.checked)} type="checkbox" />
            <span>
              <strong>Создать видеовстречу</strong>
              <small>Ссылка появится в деталях события</small>
            </span>
          </label>

          {error ? <p className={styles.error} role="alert">{error}</p> : null}

          <div className={styles.footer}>
            <button className={styles.cancelButton} onClick={onClose} type="button">Отмена</button>
            <button className={styles.submitButton} type="submit">Создать встречу</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function toDateTimeInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
