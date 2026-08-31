/** Kontrakt bingo wspólny dla `apps/web` i `apps/server`. */

export const BINGO_SIZE = 5;
export const BINGO_CELL_COUNT = BINGO_SIZE * BINGO_SIZE;
export const BINGO_MAX_TITLE_LENGTH = 80;
export const BINGO_MAX_CELL_LENGTH = 120;

export interface BingoCell {
  index: number;
  text: string;
  marked: boolean;
}

export interface BingoBoard {
  title: string;
  cells: BingoCell[];
  updatedAt: number;
}

/** Treść planszy edytowana przez admina (bez zaznaczeń). */
export interface BingoBoardContent {
  title: string;
  cells: string[];
}
