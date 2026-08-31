import type { BingoBoard, BingoBoardContent } from '@bcf/shared-types';

const API_BASE = `${import.meta.env.VITE_SERVER_URL ?? ''}/api`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => undefined);
    throw new Error(message ?? `Błąd żądania (${response.status})`);
  }

  return (await response.json()) as T;
}

export const adminApi = {
  login: (password: string) =>
    request<{ ok: true }>('/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),

  logout: () => request<{ ok: true }>('/admin/logout', { method: 'POST' }),

  /** 200 = sesja aktywna, 401 = trzeba się zalogować. */
  me: () => request<{ role: 'admin' }>('/admin/me'),

  getBoard: () => request<BingoBoard>('/admin/bingo'),

  saveBoard: (content: BingoBoardContent) =>
    request<BingoBoard>('/admin/bingo', { method: 'PUT', body: JSON.stringify(content) }),

  resetMarks: () => request<BingoBoard>('/admin/bingo/reset', { method: 'POST' }),
};
