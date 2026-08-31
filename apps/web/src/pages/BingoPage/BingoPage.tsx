import { Link } from 'react-router-dom';
import { BingoGrid } from '@/components/BingoGrid/BingoGrid';
import { toggleBingoCell } from '@/hooks/useSocket';
import { useBingoStore } from '@/stores/bingoStore';
import { useRouletteStore } from '@/stores/rouletteStore';
import styles from './BingoPage.module.scss';

export function BingoPage() {
  const board = useBingoStore((state) => state.board);
  const connected = useRouletteStore((state) => state.connected);

  if (!board) {
    return <p className={styles.loading}>{connected ? 'Wczytuję planszę…' : 'Łączę z serwerem…'}</p>;
  }

  const marked = board.cells.filter((cell) => cell.marked).length;

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <div>
          <h1>{board.title}</h1>
          <p>
            Kliknij pole, żeby postawić krzyżyk — zmiana od razu leci do wszystkich otwartych
            przeglądarek. Treść pól ustawia admin.
          </p>
        </div>

        <div className={styles.meta}>
          <span className={styles.counter}>
            {marked}/{board.cells.length}
          </span>
          <Link to="/bingo/admin" className={styles.adminLink}>
            Panel admina
          </Link>
        </div>
      </header>

      <BingoGrid board={board} onToggle={toggleBingoCell} />
    </div>
  );
}
