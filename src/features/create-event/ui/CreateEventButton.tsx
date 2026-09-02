import styles from './CreateEventButton.module.css';

type CreateEventButtonProps = {
  onClick: () => void;
};

export function CreateEventButton({ onClick }: CreateEventButtonProps) {
  return (
    <button className={styles.button} onClick={onClick} type="button">
      Новое событие
    </button>
  );
}
