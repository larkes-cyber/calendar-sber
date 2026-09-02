import { createBrowserRouter } from 'react-router-dom';

import { HomePage } from '@pages/home';
import { NotFoundPage } from '@pages/not-found';

import { AppLayout } from './ui/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: ':view/:firstDay',
        element: <HomePage />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
]);
