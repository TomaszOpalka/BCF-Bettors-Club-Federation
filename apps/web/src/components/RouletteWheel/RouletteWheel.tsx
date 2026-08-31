import { useRef } from 'react';
import { useRouletteStore } from '@/stores/rouletteStore';
import styles from './RouletteWheel.module.scss';
import { useRouletteScene } from './useRouletteScene';

export function RouletteWheel() {
  const containerRef = useRef<HTMLDivElement>(null);
  useRouletteScene(containerRef);

  const phase = useRouletteStore((state) => state.phase);
  const lastResult = useRouletteStore((state) => state.history[0]);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.canvas} aria-hidden="true" />

      <div className={styles.overlay}>
        {phase === 'spinning' ? (
          <span className={styles.spinning}>Kręcimy…</span>
        ) : lastResult ? (
          <span className={`${styles.result} ${styles[lastResult.color]}`}>
            <strong>{lastResult.number}</strong>
            <span className={styles.resultLabel}>ostatni wynik</span>
          </span>
        ) : (
          <span className={styles.idle}>Gotowa do gry</span>
        )}
      </div>
    </div>
  );
}
