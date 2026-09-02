import { Outlet } from 'react-router-dom';

import { AttentionAdExperience } from '@features/attention-ad';
import { AppHeader } from '@widgets/app-header';

export function AppLayout() {
  return (
    <AttentionAdExperience>
      <div className="app-shell">
        <AppHeader />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </AttentionAdExperience>
  );
}
