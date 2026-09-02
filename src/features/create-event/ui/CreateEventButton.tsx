import styles from './CreateEventButton.module.css';

export function CreateEventButton() {
  return (
    <button className={styles.button} type="button">
      Новое событие
    </button>
  );
}
