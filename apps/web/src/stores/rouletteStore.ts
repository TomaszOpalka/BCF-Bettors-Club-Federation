import type {
  RouletteResult,
  RouletteRound,
  RoulettePhase,
  RouletteStateSnapshot,
} from '@bcf/shared-types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STARTING_BALANCE, settleBets, totalStake, type Bet, type BetKind } from '@/lib/bets';

export interface Settlement {
  pocket: number;
  staked: number;
  returned: number;
  net: number;
}

interface RouletteState {
  connected: boolean;
  phase: RoulettePhase;
  round: RouletteRound | null;
  history: RouletteResult[];
  cooldownUntil: number;
  /** serverTime − clientTime; korekta rozjazdu zegarów przy animacji. */
  clockOffset: number;
  errorMessage: string | null;

  balance: number;
  bets: Bet[];
  lastSettlement: Settlement | null;

  setConnected: (connected: boolean) => void;
  applySnapshot: (snapshot: RouletteStateSnapshot) => void;
  startRound: (round: RouletteRound) => void;
  finishRound: (result: RouletteResult) => void;
  setError: (message: string | null) => void;

  placeBet: (kind: BetKind, amount: number, pocket?: number) => void;
  clearBets: () => void;
  resetBalance: () => void;
}

function makeBetId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `bet-${Date.now()}-${Math.random()}`;
}

export const useRouletteStore = create<RouletteState>()(
  persist(
    (set, get) => ({
      connected: false,
      phase: 'idle',
      round: null,
      history: [],
      cooldownUntil: 0,
      clockOffset: 0,
      errorMessage: null,

      balance: STARTING_BALANCE,
      bets: [],
      lastSettlement: null,

      setConnected: (connected) => set({ connected }),

      applySnapshot: (snapshot) =>
        set({
          phase: snapshot.phase,
          round: snapshot.round,
          history: snapshot.history,
          cooldownUntil: snapshot.cooldownUntil,
          clockOffset: snapshot.serverTime - Date.now(),
        }),

      startRound: (round) =>
        set({ phase: 'spinning', round, errorMessage: null, lastSettlement: null }),

      finishRound: (result) => {
        const { bets } = get();
        const staked = totalStake(bets);
        const returned = settleBets(bets, result.number);

        set((state) => ({
          phase: 'idle',
          round: null,
          history: [result, ...state.history].slice(0, 20),
          balance: state.balance + returned,
          bets: [],
          lastSettlement: bets.length
            ? { pocket: result.number, staked, returned, net: returned - staked }
            : null,
        }));
      },

      setError: (errorMessage) => set({ errorMessage }),

      placeBet: (kind, amount, pocket) => {
        const { phase, balance } = get();
        if (phase === 'spinning') {
          set({ errorMessage: 'Runda trwa - zakłady zamknięte.' });
          return;
        }
        if (amount > balance) {
          set({ errorMessage: 'Za mało punktów na tę stawkę.' });
          return;
        }

        set((state) => ({
          balance: state.balance - amount,
          errorMessage: null,
          lastSettlement: null,
          bets: [
            ...state.bets,
            { id: makeBetId(), kind, amount, ...(kind === 'number' ? { number: pocket } : {}) },
          ],
        }));
      },

      clearBets: () =>
        set((state) => ({
          balance: state.balance + totalStake(state.bets),
          bets: [],
          errorMessage: null,
        })),

      resetBalance: () => set({ balance: STARTING_BALANCE, bets: [], lastSettlement: null }),
    }),
    {
      name: 'bcf-roulette',
      // Live'owy stan rundy pochodzi z serwera - lokalnie trzymamy tylko fake balans.
      partialize: (state) => ({ balance: state.balance }),
    },
  ),
);
