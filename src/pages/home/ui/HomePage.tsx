import { Navigate, useParams } from 'react-router-dom';

import { CalendarWorkspace } from '@widgets/calendar-workspace';
import { getTodayRouteDate } from '@shared/lib/date';

const availableViews = ['month', 'week', 'list'] as const;

export function HomePage() {
  const { view, firstDay } = useParams();

  if (!view || !firstDay) {
    return <Navigate replace to={`/month/${getTodayRouteDate()}`} />;
  }

  if (!availableViews.includes(view as (typeof availableViews)[number])) {
    return <Navigate replace to={`/month/${getTodayRouteDate()}`} />;
  }

  return <CalendarWorkspace firstDay={firstDay} view={view as 'month' | 'week' | 'list'} />;
}
