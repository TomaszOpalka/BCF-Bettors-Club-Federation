import { getRouletteColor } from '@bcf/shared-types';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  CHIP_VALUES,
  OUTSIDE_BET_LABELS,
  describeBet,
  totalStake,
  type OutsideBetKind,
} from '@/lib/bets';
import { useRouletteStore } from '@/stores/rouletteStore';
import styles from './BetPanel.module.scss';

/** Klasyczny układ stołu: 3 rzędy po 12 numerów, zero z boku. */
const NUMBER_ROWS = [0, 1, 2].map((row) => Array.from({ length: 12 }, (_, i) => i * 3 + (3 - row)));

const OUTSIDE_BETS: OutsideBetKind[] = ['red', 'black', 'green', 'even', 'odd', 'low', 'high'];

export function BetPanel() {
  const [chip, setChip] = useState<number>(CHIP_VALUES[0]);

  const phase = useRouletteStore((state) => state.phase);
  const balance = useRouletteStore((state) => state.balance);
  const bets = useRouletteStore((state) => state.bets);
  const lastSettlement = useRouletteStore((state) => state.lastSettlement);
  const placeBet = useRouletteStore((state) => state.placeBet);
  const clearBets = useRouletteStore((state) => state.clearBets);
  const resetBalance = useRouletteStore((state) => state.resetBalance);

  const locked = phase === 'spinning';
  const staked = totalStake(bets);

  return (
    <div className={styles.panel}>
      <div className={styles.balanceRow}>
        <div>
          <span className={styles.label}>Balans</span>
          <strong className={styles.balance}>{balance} pkt</strong>
        </div>
        <div className={styles.stakeBox}>
          <span className={styles.label}>W grze</span>
          <strong>{staked} pkt</strong>
        </div>
      </div>

      {lastSettlement && (
        <p className={lastSettlement.net >= 0 ? styles.win : styles.loss}>
          Wynik {lastSettlement.pocket}: {lastSettlement.net >= 0 ? '+' : ''}
          {lastSettlement.net} pkt
        </p>
      )}

      <div className={styles.chips}>
        <span className={styles.label}>Żeton</span>
        {CHIP_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.chip} ${chip === value ? styles.chipActive : ''}`}
            onClick={() => setChip(value)}
          >
            {value}
          </button>
        ))}
      </div>

      <div className={styles.table}>
        <button
          type="button"
          className={`${styles.zero} ${styles.number}`}
          disabled={locked || chip > balance}
          onClick={() => placeBet('number', chip, 0)}
        >
          0
        </button>

        <div className={styles.numbers}>
          {NUMBER_ROWS.flat().map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.number} ${styles[getRouletteColor(value)]}`}
              disabled={locked || chip > balance}
              onClick={() => placeBet('number', chip, value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.outside}>
        {OUTSIDE_BETS.map((kind) => (
          <button
            key={kind}
            type="button"
            className={`${styles.outsideBet} ${styles[`outside-${kind}`] ?? ''}`}
            disabled={locked || chip > balance}
            onClick={() => placeBet(kind, chip)}
          >
            {OUTSIDE_BET_LABELS[kind]}
          </button>
        ))}
      </div>

      <div className={styles.slip}>
        <span className={styles.label}>Kupon</span>
        {bets.length === 0 ? (
          <p className={styles.empty}>Brak zakładów — wybierz żeton i kliknij pole.</p>
        ) : (
          <ul className={styles.betList}>
            {bets.map((bet) => (
              <li key={bet.id}>
                <span>{describeBet(bet)}</span>
                <strong>{bet.amount} pkt</strong>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="secondary" onClick={clearBets} disabled={locked || bets.length === 0}>
          Wyczyść kupon
        </Button>
        <Button variant="ghost" onClick={resetBalance} disabled={locked}>
          Reset balansu
        </Button>
      </div>
    </div>
  );
}
