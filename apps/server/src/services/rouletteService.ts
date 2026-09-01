import { randomInt, randomUUID } from 'node:crypto';
import {
  ROULETTE_HISTORY_SIZE,
  ROULETTE_POCKET_COUNT,
  SPIN_COOLDOWN_MS,
  SPIN_DURATION_MS,
  getRouletteColor,
  type RouletteResult,
  type RouletteRound,
  type RouletteStateSnapshot,
} from '@bcf/shared-types';
import { store } from '../state/store';

export type SpinOutcome =
  | { ok: true; round: RouletteRound }
  | { ok: false; message: string; retryAt: number };

type ResultListener = (result: RouletteResult) => void;

/**
 * Serwer jest jedynym źródłem losowania (node:crypto) i jedynym zegarem rundy.
 * Klient dostaje `startedAt` + `durationMs` i tylko odtwarza animację.
 */
class RouletteService {
  private round: RouletteRound | null = null;
  private cooldownUntil = 0;
  private settleTimer: NodeJS.Timeout | null = null;
  private readonly listeners = new Set<ResultListener>();

  getSnapshot(): RouletteStateSnapshot {
    return {
      phase: this.round ? 'spinning' : 'idle',
      round: this.round,
      history: [...store.get().rouletteHistory],
      cooldownUntil: this.cooldownUntil,
      serverTime: Date.now(),
    };
  }

  requestSpin(): SpinOutcome {
    const now = Date.now();

    if (this.round) {
      return {
        ok: false,
        message: 'Runda już trwa.',
        retryAt: this.round.startedAt + this.round.durationMs + SPIN_COOLDOWN_MS,
      };
    }

    if (now < this.cooldownUntil) {
      const secondsLeft = Math.ceil((this.cooldownUntil - now) / 1000);
      return {
        ok: false,
        message: `Chwila przerwy - kolejny spin za ${secondsLeft} s.`,
        retryAt: this.cooldownUntil,
      };
    }

    // Fair random: crypto.randomInt jest bezstronny (odrzuca resztę z zakresu).
    const pocket = randomInt(0, ROULETTE_POCKET_COUNT);

    const round: RouletteRound = {
      roundId: randomUUID(),
      number: pocket,
      color: getRouletteColor(pocket),
      startedAt: now,
      durationMs: SPIN_DURATION_MS,
    };

    this.round = round;
    this.settleTimer = setTimeout(() => this.settle(round), SPIN_DURATION_MS);
    this.settleTimer.unref?.();

    return { ok: true, round };
  }

  onResult(listener: ResultListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private settle(round: RouletteRound): void {
    this.settleTimer = null;
    this.round = null;
    this.cooldownUntil = Date.now() + SPIN_COOLDOWN_MS;

    const result: RouletteResult = {
      roundId: round.roundId,
      number: round.number,
      color: round.color,
      endedAt: Date.now(),
    };

    store.update((draft) => {
      draft.rouletteHistory = [result, ...draft.rouletteHistory].slice(0, ROULETTE_HISTORY_SIZE);
    });

    for (const listener of this.listeners) {
      listener(result);
    }
  }
}

export const rouletteService = new RouletteService();
