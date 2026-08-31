import { useEffect, useState } from 'react';
import { BetPanel } from '@/components/BetPanel/BetPanel';
import { RouletteWheel } from '@/components/RouletteWheel/RouletteWheel';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { requestSpin } from '@/hooks/useSocket';
import { useRouletteStore } from '@/stores/rouletteStore';
import styles from './RoulettePage.module.scss';

export function RoulettePage() {
  const connected = useRouletteStore((state) => state.connected);
  const phase = useRouletteStore((state) => state.phase);
  const cooldownUntil = useRouletteStore((state) => state.cooldownUntil);
  const clockOffset = useRouletteStore((state) => state.clockOffset);
  const errorMessage = useRouletteStore((state) => state.errorMessage);
  const history = useRouletteStore((state) => state.history);

  // Tykający zegar, żeby przycisk odblokował się sam po cooldownie.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - (now + clockOffset)) / 1000));
  const spinning = phase === 'spinning';
  const canSpin = connected && !spinning && cooldownLeft === 0;

  const spinLabel = spinning
    ? 'Kręci się…'
    : cooldownLeft > 0
      ? `Kolejny spin za ${cooldownLeft} s`
      : 'Zakręć';

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <h1>Ruletka</h1>
        <p>
          Wynik losuje serwer (<code>node:crypto</code>) i rozsyła go do wszystkich naraz — każdy
          widzi to samo losowanie w tej samej sekundzie.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.wheelColumn}>
          <RouletteWheel />

          <div className={styles.controls}>
            <Button size="lg" onClick={requestSpin} disabled={!canSpin}>
              {spinLabel}
            </Button>

            {!connected && <span className={styles.warning}>Łączę z serwerem…</span>}
            {errorMessage && <span className={styles.warning}>{errorMessage}</span>}
          </div>

          <div className={styles.history}>
            <span className={styles.historyLabel}>Ostatnie wyniki</span>
            {history.length === 0 ? (
              <span className={styles.historyEmpty}>Jeszcze nic nie padło.</span>
            ) : (
              <ul>
                {history.map((result) => (
                  <li key={result.roundId} className={styles[result.color]}>
                    {result.number}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Card title="Zakłady" className={styles.betCard}>
          <BetPanel />
        </Card>
      </div>
    </div>
  );
}
