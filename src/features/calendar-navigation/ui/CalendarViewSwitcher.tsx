import type { CalendarRouteView } from '../model/types';

import styles from './CalendarViewSwitcher.module.css';

type CalendarViewSwitcherProps = {
  value: CalendarRouteView;
  onChange: (view: CalendarRouteView) => void;
};

const options: Array<{ value: CalendarRouteView; label: string }> = [
  { value: 'month', label: 'Месяц' },
  { value: 'week', label: 'Неделя' },
  { value: 'list', label: 'Список' }
];

export function CalendarViewSwitcher({ value, onChange }: CalendarViewSwitcherProps) {
  return (
    <div className={styles.root} role="tablist" aria-label="Вид календаря">
      {options.map((option) => (
        <button
          aria-selected={option.value === value}
          className={styles.option}
          key={option.value}
          onClick={() => onChange(option.value)}
          role="tab"
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
