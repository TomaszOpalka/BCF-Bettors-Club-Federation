import type { BingoBoard } from '@bcf/shared-types';
import { BingoCell } from '@/components/BingoCell/BingoCell';
import styles from './BingoGrid.module.scss';

interface BingoGridProps {
  board: BingoBoard;
  onToggle: (index: number) => void;
}

export function BingoGrid({ board, onToggle }: BingoGridProps) {
  return (
    <div className={styles.grid}>
      {board.cells.map((cell) => (
        <BingoCell key={cell.index} cell={cell} onToggle={onToggle} />
      ))}
    </div>
  );
}
