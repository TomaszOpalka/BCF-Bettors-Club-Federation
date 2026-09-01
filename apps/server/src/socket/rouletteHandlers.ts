import { rouletteService } from '../services/rouletteService';
import type { TypedServer, TypedSocket } from './types';

/** Wynik rundy leci do wszystkich - rejestrowane raz, przy starcie serwera. */
export function registerRouletteBroadcast(io: TypedServer): void {
  rouletteService.onResult((result) => {
    io.emit('roulette:result', result);
  });
}

export function registerRouletteHandlers(io: TypedServer, socket: TypedSocket): void {
  // Late joiner dostaje pełny stan i wskakuje w środek trwającej animacji.
  socket.emit('roulette:state', rouletteService.getSnapshot());

  socket.on('roulette:spin', () => {
    const outcome = rouletteService.requestSpin();

    if (!outcome.ok) {
      socket.emit('roulette:error', { message: outcome.message, retryAt: outcome.retryAt });
      return;
    }

    io.emit('roulette:spin-started', outcome.round);
  });
}
