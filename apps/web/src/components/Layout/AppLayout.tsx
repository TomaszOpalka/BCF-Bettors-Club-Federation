import { Suspense } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useRouletteStore } from '@/stores/rouletteStore';
import styles from './AppLayout.module.scss';

const NAV_ITEMS = [
  { to: '/ruletka', label: 'Ruletka' },
  { to: '/bingo', label: 'Bingo' },
];

export function AppLayout() {
  const connected = useRouletteStore((state) => state.connected);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <NavLink to="/" className={styles.brand}>
          <img src="/images/bcf-logo.png" alt="BCF" className={styles.logo} />
          <span className={styles.brandText}>
            <strong>BCF</strong>
            <small>Bettors Club Federation</small>
          </span>
        </NavLink>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <span className={`${styles.status} ${connected ? styles.online : styles.offline}`}>
          <i />
          {connected ? 'Live' : 'Brak połączenia'}
        </span>
      </header>

      <main className={styles.main}>
        <Suspense fallback={<p className={styles.loading}>Ładuję…</p>}>
          <Outlet />
        </Suspense>
      </main>

      <footer className={styles.footer}>
        <span>Apka jest w pełni zvibe codowana nie podpisuję się pod nią testowałem możliwości</span>
      </footer>
    </div>
  );
}
