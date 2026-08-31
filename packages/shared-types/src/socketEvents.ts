import type { BingoBoard } from './bingo';
import type { RouletteResult, RouletteRound, RouletteStateSnapshot } from './roulette';

export interface BingoCellToggledPayload {
  index: number;
  marked: boolean;
  updatedAt: number;
}

export interface SocketErrorPayload {
  message: string;
  /** Ustawiane przy odrzuconym spinie — kiedy (czas serwera) można spróbować ponownie. */
  retryAt?: number;
}

export interface ServerToClientEvents {
  'roulette:state': (payload: RouletteStateSnapshot) => void;
  'roulette:spin-started': (payload: RouletteRound) => void;
  'roulette:result': (payload: RouletteResult) => void;
  'roulette:error': (payload: SocketErrorPayload) => void;
  'bingo:state': (payload: BingoBoard) => void;
  'bingo:cell-toggled': (payload: BingoCellToggledPayload) => void;
  'bingo:updated': (payload: BingoBoard) => void;
}

export interface ClientToServerEvents {
  'roulette:spin': () => void;
  'bingo:cell-toggle': (payload: { index: number }) => void;
}
