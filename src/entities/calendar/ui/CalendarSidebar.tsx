import type { CalendarMeta } from '../model/types';

import styles from './CalendarSidebar.module.css';

type CalendarSidebarProps = {
  calendars: CalendarMeta[];
};

const sourceLabel = {
  local: 'Локальный',
  caldav: 'CalDAV',
  webcal: 'WebCal'
};

export function CalendarSidebar({ calendars }: CalendarSidebarProps) {
  return (
    <aside className={styles.root}>
      <div>
        <p className={styles.caption}>Календари</p>
        <h2>Источники</h2>
      </div>
      <div className={styles.list}>
        {calendars.map((calendar) => (
          <label className={styles.item} key={calendar.id}>
            <input type="checkbox" defaultChecked={calendar.isVisible} />
            <span className={styles.color} style={{ backgroundColor: calendar.color }} />
            <span className={styles.name}>{calendar.name}</span>
            <span className={styles.source}>{sourceLabel[calendar.source]}</span>
          </label>
        ))}
      </div>
    </aside>
  );
}
