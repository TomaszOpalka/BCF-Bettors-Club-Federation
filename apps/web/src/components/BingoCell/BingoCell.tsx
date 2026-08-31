import type { BingoCell as BingoCellData } from '@bcf/shared-types';
import styles from './BingoCell.module.scss';

interface BingoCellProps {
  cell: BingoCellData;
  onToggle: (index: number) => void;
}

export function BingoCell({ cell, onToggle }: BingoCellProps) {
  return (
    <button
      type="button"
      className={`${styles.cell} ${cell.marked ? styles.marked : ''}`}
      aria-pressed={cell.marked}
      onClick={() => onToggle(cell.index)}
    >
      <span className={styles.text}>{cell.text}</span>

      {cell.marked && (
        <svg className={styles.cross} viewBox="0 0 100 100" aria-hidden="true">
          <line x1="14" y1="14" x2="86" y2="86" />
          <line x1="86" y1="14" x2="14" y2="86" />
        </svg>
      )}
    </button>
  );
}
