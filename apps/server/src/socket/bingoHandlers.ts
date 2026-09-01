import { z } from 'zod';
import { BINGO_CELL_COUNT } from '@bcf/shared-types';
import { bingoService } from '../services/bingoService';
import type { TypedServer, TypedSocket } from './types';

const toggleSchema = z.object({
  index: z.number().int().min(0).max(BINGO_CELL_COUNT - 1),
});

export function registerBingoHandlers(io: TypedServer, socket: TypedSocket): void {
  socket.emit('bingo:state', bingoService.getBoard());

  socket.on('bingo:cell-toggle', (payload) => {
    const parsed = toggleSchema.safeParse(payload);
    if (!parsed.success) return;

    const delta = bingoService.toggleCell(parsed.data.index);
    if (!delta) return;

    // Broadcast do wszystkich łącznie z nadawcą - serwer jest źródłem prawdy.
    io.emit('bingo:cell-toggled', delta);
  });
}
