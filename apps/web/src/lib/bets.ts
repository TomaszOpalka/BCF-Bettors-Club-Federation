import { getRouletteColor } from '@bcf/shared-types';

/**
 * Zakłady są na tym etapie w pełni lokalne (fake punkty w localStorage).
 * Gdy dojdzie Supabase, rozliczanie przeniesiemy na serwer - kształt `Bet` zostaje.
 */
export type OutsideBetKind = 'red' | 'black' | 'green' | 'even' | 'odd' | 'low' | 'high';
export type BetKind = OutsideBetKind | 'number';

export interface Bet {
  id: string;
  kind: BetKind;
  /** Ustawiane tylko dla `kind: 'number'`. */
  number?: number;
  amount: number;
}

export const CHIP_VALUES = [10, 25, 50, 100] as const;
export const STARTING_BALANCE = 1_000;

/** Mnożnik całkowitej wypłaty (stawka × mnożnik) przy trafieniu. */
const PAYOUT_MULTIPLIER: Record<BetKind, number> = {
  number: 36,
  green: 36,
  red: 2,
  black: 2,
  even: 2,
  odd: 2,
  low: 2,
  high: 2,
};

export const OUTSIDE_BET_LABELS: Record<OutsideBetKind, string> = {
  red: 'Czerwone',
  black: 'Czarne',
  green: 'Zero (zielone)',
  even: 'Parzyste',
  odd: 'Nieparzyste',
  low: '1–18',
  high: '19–36',
};

export function describeBet(bet: Bet): string {
  if (bet.kind === 'number') return `Numer ${bet.number}`;
  return OUTSIDE_BET_LABELS[bet.kind];
}

export function isWinningBet(bet: Bet, pocket: number): boolean {
  const color = getRouletteColor(pocket);

  switch (bet.kind) {
    case 'number':
      return bet.number === pocket;
    case 'red':
      return color === 'red';
    case 'black':
      return color === 'black';
    case 'green':
      return pocket === 0;
    case 'even':
      return pocket !== 0 && pocket % 2 === 0;
    case 'odd':
      return pocket % 2 === 1;
    case 'low':
      return pocket >= 1 && pocket <= 18;
    case 'high':
      return pocket >= 19 && pocket <= 36;
  }
}

/** Zwraca sumę wypłat (wraz ze zwrotem stawki) dla trafionych zakładów. */
export function settleBets(bets: Bet[], pocket: number): number {
  return bets.reduce(
    (total, bet) => (isWinningBet(bet, pocket) ? total + bet.amount * PAYOUT_MULTIPLIER[bet.kind] : total),
    0,
  );
}

export function totalStake(bets: Bet[]): number {
  return bets.reduce((total, bet) => total + bet.amount, 0);
}
