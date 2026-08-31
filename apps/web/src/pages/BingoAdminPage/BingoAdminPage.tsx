import {
  BINGO_CELL_COUNT,
  BINGO_MAX_CELL_LENGTH,
  BINGO_MAX_TITLE_LENGTH,
  type BingoBoard,
} from '@bcf/shared-types';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { adminApi } from '@/lib/adminApi';
import styles from './BingoAdminPage.module.scss';

type Session = 'checking' | 'anonymous' | 'admin';

export function BingoAdminPage() {
  const [session, setSession] = useState<Session>('checking');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('');
  const [cells, setCells] = useState<string[]>(() => Array<string>(BINGO_CELL_COUNT).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadBoard = useCallback((board: BingoBoard) => {
    setTitle(board.title);
    setCells(board.cells.map((cell) => cell.text));
  }, []);

  useEffect(() => {
    let cancelled = false;

    adminApi
      .me()
      .then(() => adminApi.getBoard())
      .then((board) => {
        if (cancelled) return;
        loadBoard(board);
        setSession('admin');
      })
      .catch(() => {
        if (!cancelled) setSession('anonymous');
      });

    return () => {
      cancelled = true;
    };
  }, [loadBoard]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await adminApi.login(password);
      loadBoard(await adminApi.getBoard());
      setSession('admin');
      setPassword('');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Logowanie nie powiodło się.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      await adminApi.saveBoard({ title, cells });
      setNotice('Zapisano — plansza odświeżyła się u wszystkich.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Zapis nie powiódł się.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      loadBoard(await adminApi.resetMarks());
      setNotice('Krzyżyki wyczyszczone.');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Reset nie powiódł się.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await adminApi.logout().catch(() => undefined);
    setSession('anonymous');
    setNotice(null);
  };

  if (session === 'checking') {
    return <p className={styles.loading}>Sprawdzam sesję…</p>;
  }

  if (session === 'anonymous') {
    return (
      <div className={styles.loginWrapper}>
        <Card title="Panel admina" className={styles.loginCard}>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <label htmlFor="admin-password">Hasło administratora</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={styles.input}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" disabled={busy} fullWidth>
              {busy ? 'Loguję…' : 'Zaloguj'}
            </Button>
            <Link to="/bingo" className={styles.backLink}>
              ← Wróć do planszy
            </Link>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <div>
          <h1>Panel admina — bingo</h1>
          <p>Edytuj treść 25 pól. Zapis rozsyła nową planszę do wszystkich otwartych przeglądarek.</p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Wyloguj
        </Button>
      </header>

      <Card title="Tytuł planszy">
        <input
          type="text"
          value={title}
          maxLength={BINGO_MAX_TITLE_LENGTH}
          onChange={(event) => setTitle(event.target.value)}
          className={styles.input}
        />
      </Card>

      <Card title="Pola (5 × 5)">
        <div className={styles.cellGrid}>
          {cells.map((text, index) => (
            // eslint-disable-next-line react/no-array-index-key -- pozycja pola JEST jego tożsamością
            <label key={index} className={styles.cellField}>
              <span>{index + 1}</span>
              <textarea
                value={text}
                maxLength={BINGO_MAX_CELL_LENGTH}
                rows={3}
                onChange={(event) =>
                  setCells((previous) =>
                    previous.map((value, i) => (i === index ? event.target.value : value)),
                  )
                }
              />
            </label>
          ))}
        </div>
      </Card>

      {error && <p className={styles.error}>{error}</p>}
      {notice && <p className={styles.notice}>{notice}</p>}

      <div className={styles.actions}>
        <Button onClick={handleSave} disabled={busy}>
          {busy ? 'Zapisuję…' : 'Zapisz planszę'}
        </Button>
        <Button variant="danger" onClick={handleReset} disabled={busy}>
          Wyczyść krzyżyki (nowy dzień)
        </Button>
        <Link to="/bingo" className={styles.backLink}>
          Podgląd planszy →
        </Link>
      </div>
    </div>
  );
}
