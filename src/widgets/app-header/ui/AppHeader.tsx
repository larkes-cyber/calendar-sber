import styles from './AppHeader.module.css';

export function AppHeader() {
  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <span className={styles.logo}>Calendar Sber</span>
        <nav className={styles.nav} aria-label="Основная навигация">
          <a href="/month/now">Календарь</a>
          <a href="/month/now#settings">Настройки</a>
        </nav>
      </div>
    </header>
  );
}
