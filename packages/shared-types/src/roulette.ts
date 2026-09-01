/**
 * Kontrakt ruletki wspólny dla `apps/web` i `apps/server`.
 * Losowanie ZAWSZE po stronie serwera (node:crypto) - klient wyłącznie animuje.
 */

/** Kolejność pól na kole ruletki europejskiej (zgodnie z ruchem wskazówek zegara od 0). */
export const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

/** Numery czerwone; reszta (poza zerem) jest czarna. */
export const RED_NUMBERS: readonly number[] = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
];

/** 37 pól: 0 (zielone) + 1..36. */
export const ROULETTE_POCKET_COUNT = EUROPEAN_WHEEL_ORDER.length;

/** Długość animacji spinu - ta sama na serwerze i kliencie. */
export const SPIN_DURATION_MS = 7_000;

/** Przerwa po rundzie, zanim ktokolwiek może zakręcić ponownie. */
export const SPIN_COOLDOWN_MS = 5_000;

/** Ile ostatnich wyników serwer trzyma w historii. */
export const ROULETTE_HISTORY_SIZE = 20;

export type RouletteColor = 'green' | 'red' | 'black';

export function getRouletteColor(pocket: number): RouletteColor {
  if (pocket === 0) return 'green';
  return RED_NUMBERS.includes(pocket) ? 'red' : 'black';
}

/** Pozycja numeru na kole (indeks w EUROPEAN_WHEEL_ORDER) - potrzebna do animacji. */
export function getWheelIndex(pocket: number): number {
  return EUROPEAN_WHEEL_ORDER.indexOf(pocket as (typeof EUROPEAN_WHEEL_ORDER)[number]);
}

/** Trwająca runda. `number` jest znany od razu - klient animuje dojazd do wyniku. */
export interface RouletteRound {
  roundId: string;
  number: number;
  color: RouletteColor;
  /** Znacznik czasu SERWERA (epoch ms) - klient koryguje o własny offset zegara. */
  startedAt: number;
  durationMs: number;
}

export interface RouletteResult {
  roundId: string;
  number: number;
  color: RouletteColor;
  endedAt: number;
}

export type RoulettePhase = 'idle' | 'spinning';

/** Pełny stan wysyłany przy połączeniu - pozwala wskoczyć w środek trwającego spinu. */
export interface RouletteStateSnapshot {
  phase: RoulettePhase;
  round: RouletteRound | null;
  history: RouletteResult[];
  cooldownUntil: number;
  /** Czas serwera w momencie wysyłki - klient liczy z tego offset zegara. */
  serverTime: number;
}
