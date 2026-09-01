import {
  BINGO_CELL_COUNT,
  type BingoBoard,
  type BingoBoardContent,
  type BingoCellToggledPayload,
} from '@bcf/shared-types';
import { store } from '../state/store';

/**
 * Cała logika planszy w jednym miejscu - przy przejściu na Supabase zmienia się
 * tylko warstwa `store`, publiczne API serwisu zostaje.
 */
class BingoService {
  getBoard(): BingoBoard {
    return structuredClone(store.get().bingo) as BingoBoard;
  }

  /** Zwraca deltę do broadcastu albo null, gdy indeks jest poza planszą. */
  toggleCell(index: number): BingoCellToggledPayload | null {
    if (!Number.isInteger(index) || index < 0 || index >= BINGO_CELL_COUNT) return null;

    let payload: BingoCellToggledPayload | null = null;

    store.update((draft) => {
      const cell = draft.bingo.cells[index];
      if (!cell) return;
      cell.marked = !cell.marked;
      draft.bingo.updatedAt = Date.now();
      payload = { index, marked: cell.marked, updatedAt: draft.bingo.updatedAt };
    });

    return payload;
  }

  /** Edycja treści przez admina - zaznaczenia zostają nietknięte. */
  setContent(content: BingoBoardContent): BingoBoard {
    store.update((draft) => {
      draft.bingo.title = content.title;
      draft.bingo.cells = draft.bingo.cells.map((cell, index) => ({
        index,
        text: content.cells[index] ?? '',
        marked: cell.marked,
      }));
      draft.bingo.updatedAt = Date.now();
    });

    return this.getBoard();
  }

  /** Czyszczenie krzyżyków na nowy dzień - treść pól zostaje. */
  resetMarks(): BingoBoard {
    store.update((draft) => {
      for (const cell of draft.bingo.cells) {
        cell.marked = false;
      }
      draft.bingo.updatedAt = Date.now();
    });

    return this.getBoard();
  }
}

export const bingoService = new BingoService();
