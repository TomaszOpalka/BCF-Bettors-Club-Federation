import { lazy } from 'react';
import { createBrowserRouter, Link } from 'react-router-dom';
import { App } from '@/App';
import { BingoAdminPage } from '@/pages/BingoAdminPage/BingoAdminPage';
import { BingoPage } from '@/pages/BingoPage/BingoPage';
import { HomePage } from '@/pages/HomePage/HomePage';

// three.js waży ~600 kB — ładujemy je dopiero przy wejściu na /ruletka.
const RoulettePage = lazy(() =>
  import('@/pages/RoulettePage/RoulettePage').then((module) => ({ default: module.RoulettePage })),
);

function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <h1>404</h1>
      <p>Nie ma tu nic do obstawiania.</p>
      <Link to="/">Wróć na stronę główną</Link>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'ruletka', element: <RoulettePage /> },
      { path: 'bingo', element: <BingoPage /> },
      { path: 'bingo/admin', element: <BingoAdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
