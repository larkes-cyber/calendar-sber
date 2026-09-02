export function getTodayRouteDate() {
  return formatRouteDate(new Date());
}

export function resolveRouteDate(value: string) {
  if (value === 'now') {
    return getTodayRouteDate();
  }

  return value;
}

export function formatRouteDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
