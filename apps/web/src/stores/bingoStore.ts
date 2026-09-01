import type { BingoBoard, BingoCellToggledPayload } from '@bcf/shared-types';
import { create } from 'zustand';

interface BingoState {
  board: BingoBoard | null;
  setBoard: (board: BingoBoard) => void;
  applyToggle: (payload: BingoCellToggledPayload) => void;
}

export const useBingoStore = create<BingoState>()((set) => ({
  board: null,

  setBoard: (board) => set({ board }),

  // Serwer jest źródłem prawdy - przyjmujemy wyłącznie potwierdzoną deltę.
  applyToggle: ({ index, marked, updatedAt }) =>
    set((state) => {
      if (!state.board) return state;
      return {
        board: {
          ...state.board,
          updatedAt,
          cells: state.board.cells.map((cell) =>
            cell.index === index ? { ...cell, marked } : cell,
          ),
        },
      };
    }),
}));
