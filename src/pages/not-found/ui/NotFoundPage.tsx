import { Link } from 'react-router-dom';

import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <section className={styles.root}>
      <h1>Страница не найдена</h1>
      <Link to="/">Вернуться в календарь</Link>
    </section>
  );
}
