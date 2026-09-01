import { Link } from 'react-router-dom';
import styles from './HomePage.module.scss';

export function HomePage() {
  return (
    <div className={styles.page}>
      <img src="/images/bcf-logo.png" alt="Logo BCF" className={styles.logo} />

      <h1 className={styles.title}>Bettors Club Federation</h1>
      <p className={styles.subtitle}>
        Nie mamy darta, nie mamy bilarda -
      </p>
      <h2>mamy ruletke</h2>

      <div className={styles.actions}>
        <Link to="/ruletka" className={`${styles.tile} ${styles.roulette}`}>
          <span className={styles.tileLabel}>Ruletka</span>
          <span className={styles.tileHint}>Losowanie po stronie serwera, spin dla wszystkich</span>
        </Link>

        <Link to="/bingo" className={`${styles.tile} ${styles.bingo}`}>
          <span className={styles.tileLabel}>Bingo</span>
          <span className={styles.tileHint}>Plansza 5×5, krzyżyki widoczne na żywo</span>
        </Link>
      </div>
    </div>
  );
}
