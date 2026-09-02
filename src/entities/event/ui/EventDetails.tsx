import styles from './EventDetails.module.css';

const importantMeetings = [
  {
    badge: 'ОБЯЗАТЕЛЬНО',
    date: '3 сентября',
    time: '10:00–11:30',
    title: 'Планирование спринта',
    meta: 'Вся команда · Zoom',
    tone: 'yellow'
  },
  {
    badge: 'НЕ ПРОПУСТИТЬ',
    date: '4 сентября',
    time: '12:00–13:00',
    title: 'Груминг бэклога',
    meta: 'Product + Dev · Переговорка 4',
    tone: 'pink'
  },
  {
    badge: 'СРОЧНО',
    date: '5 сентября',
    time: '16:00–17:00',
    title: 'Ретро спринта',
    meta: 'Вся команда · Zoom',
    tone: 'blue'
  },
  {
    badge: 'ВАЖНО',
    date: '8 сентября',
    time: '11:00–12:00',
    title: 'Демо для стейкхолдеров',
    meta: 'Product + Business · Большой зал',
    tone: 'orange'
  }
] as const;

export function EventDetails() {
  return (
    <aside className={styles.root} aria-labelledby="important-meetings-title">
      <div className={styles.heading}>
        <span className={styles.alertIcon} aria-hidden="true">
          !
        </span>
        <div>
          <span className={styles.eyebrow}>Внимание</span>
          <h2 id="important-meetings-title">Важные встречи</h2>
        </div>
      </div>

      <ul className={styles.list}>
        {importantMeetings.map((meeting) => (
          <li className={`${styles.meeting} ${styles[meeting.tone]}`} key={meeting.title}>
            <div className={styles.meetingTopline}>
              <span className={styles.badge}>{meeting.badge}</span>
              <span className={styles.date}>{meeting.date}</span>
            </div>
            <strong>{meeting.title}</strong>
            <span className={styles.time}>{meeting.time}</span>
            <span className={styles.meta}>{meeting.meta}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
