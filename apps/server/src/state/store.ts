import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  BINGO_CELL_COUNT,
  ROULETTE_HISTORY_SIZE,
  type BingoBoard,
  type RouletteResult,
} from '@bcf/shared-types';
import { config } from '../config';

/**
 * Jedyne miejsce z persystencją. Na etapie Supabase podmieniamy wnętrze tego
 * modułu na klienta bazy — serwisy i handlery zostają bez zmian.
 */
export interface PersistedState {
  bingo: BingoBoard;
  rouletteHistory: RouletteResult[];
}

const DEFAULT_BINGO_TITLE = 'BCF Office Bingo';

const DEFAULT_BINGO_CELLS: string[] = [
  'Ktoś mówi „szybki call”',
  'Zepsuty ekspres do kawy',
  'Deploy w piątek',
  '„To działa u mnie lokalnie”',
  'Spotkanie, które mogło być mailem',
  'Ktoś przynosi ciasto',
  'Problem z VPN-em',
  '„Dorzucę to do backlogu”',
  'Zoom bez dźwięku przez 5 minut',
  'Ktoś zapomniał wyciszyć mikrofon',
  'Nowy ticket „na wczoraj”',
  '„Wrzucę to na Slacka”',
  'BCF FREE',
  'Ktoś pyta o status estymacji',
  'Awaria drukarki',
  'Podwójna rezerwacja salki',
  '„Zróbmy z tego POC”',
  'Ktoś je lunch na callu',
  'Merge conflict w tym samym pliku',
  '„Czy to jest gdzieś udokumentowane?”',
  'Ktoś przychodzi po 10:00',
  'Klient zmienia wymagania',
  'Pusty dzbanek wody',
  '„Podbijam temat”',
  'Ktoś wychodzi wcześniej w piątek',
];

function createDefaultBoard(): BingoBoard {
  return {
    title: DEFAULT_BINGO_TITLE,
    cells: DEFAULT_BINGO_CELLS.map((text, index) => ({ index, text, marked: false })),
    updatedAt: Date.now(),
  };
}

function createDefaultState(): PersistedState {
  return { bingo: createDefaultBoard(), rouletteHistory: [] };
}

/** Świadomie pobłażliwe: uszkodzony plik nie może wywalić startu serwera. */
function sanitize(raw: unknown): PersistedState {
  const fallback = createDefaultState();
  if (typeof raw !== 'object' || raw === null) return fallback;

  const candidate = raw as Partial<PersistedState>;
  const board = candidate.bingo;
  if (
    typeof board === 'object' &&
    board !== null &&
    Array.isArray(board.cells) &&
    board.cells.length === BINGO_CELL_COUNT
  ) {
    fallback.bingo = {
      title: typeof board.title === 'string' ? board.title : DEFAULT_BINGO_TITLE,
      updatedAt: typeof board.updatedAt === 'number' ? board.updatedAt : Date.now(),
      cells: board.cells.map((cell, index) => ({
        index,
        text: typeof cell?.text === 'string' ? cell.text : '',
        marked: cell?.marked === true,
      })),
    };
  }

  if (Array.isArray(candidate.rouletteHistory)) {
    fallback.rouletteHistory = candidate.rouletteHistory
      .filter(
        (entry): entry is RouletteResult =>
          typeof entry?.roundId === 'string' && typeof entry?.number === 'number',
      )
      .slice(0, ROULETTE_HISTORY_SIZE);
  }

  return fallback;
}

function load(): PersistedState {
  try {
    if (!existsSync(config.stateFilePath)) return createDefaultState();
    return sanitize(JSON.parse(readFileSync(config.stateFilePath, 'utf8')));
  } catch (error) {
    console.warn('[store] Nie udało się wczytać state.json — startuję z domyślnym stanem.', error);
    return createDefaultState();
  }
}

let state: PersistedState = load();
let saveTimer: NodeJS.Timeout | null = null;

function writeToDisk(): void {
  try {
    mkdirSync(dirname(config.stateFilePath), { recursive: true });
    writeFileSync(config.stateFilePath, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('[store] Zapis state.json nie powiódł się.', error);
  }
}

/** Zapis jest zdebouncowany — klikanie w bingo nie ma bić w dysk przy każdym polu. */
function scheduleSave(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    writeToDisk();
  }, 300);
  saveTimer.unref?.();
}

export const store = {
  get(): Readonly<PersistedState> {
    return state;
  },

  update(mutate: (draft: PersistedState) => void): void {
    mutate(state);
    scheduleSave();
  },

  /** Natychmiastowy zapis — używane przy zamykaniu procesu. */
  flush(): void {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    writeToDisk();
  },

  resetToDefaults(): void {
    state = createDefaultState();
    scheduleSave();
  },
};
