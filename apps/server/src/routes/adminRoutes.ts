import { Router } from 'express';
import { z } from 'zod';
import {
  BINGO_CELL_COUNT,
  BINGO_MAX_CELL_LENGTH,
  BINGO_MAX_TITLE_LENGTH,
} from '@bcf/shared-types';
import {
  adminCookieOptions,
  clearLoginAttempts,
  isLoginRateLimited,
  registerFailedLogin,
  requireAdmin,
  signAdminToken,
  verifyPassword,
} from '../auth/adminAuth';
import { config } from '../config';
import { bingoService } from '../services/bingoService';
import type { TypedServer } from '../socket/types';

const loginSchema = z.object({
  password: z.string().min(1),
});

const boardSchema = z.object({
  title: z.string().trim().max(BINGO_MAX_TITLE_LENGTH),
  cells: z.array(z.string().trim().max(BINGO_MAX_CELL_LENGTH)).length(BINGO_CELL_COUNT),
});

export function createAdminRouter(io: TypedServer): Router {
  const router = Router();

  router.post('/login', (req, res) => {
    const ip = req.ip ?? 'unknown';

    if (isLoginRateLimited(ip)) {
      res.status(429).json({ error: 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.' });
      return;
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success || !verifyPassword(parsed.data.password)) {
      registerFailedLogin(ip);
      res.status(401).json({ error: 'Nieprawidłowe hasło.' });
      return;
    }

    clearLoginAttempts(ip);
    res.cookie(config.adminCookieName, signAdminToken(), adminCookieOptions);
    res.json({ ok: true });
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie(config.adminCookieName, { ...adminCookieOptions, maxAge: undefined });
    res.json({ ok: true });
  });

  router.get('/me', requireAdmin, (_req, res) => {
    res.json({ role: 'admin' });
  });

  router.get('/bingo', requireAdmin, (_req, res) => {
    res.json(bingoService.getBoard());
  });

  router.put('/bingo', requireAdmin, (req, res) => {
    const parsed = boardSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Nieprawidłowa treść planszy (wymagane 25 pól).' });
      return;
    }

    const board = bingoService.setContent(parsed.data);
    io.emit('bingo:updated', board);
    res.json(board);
  });

  router.post('/bingo/reset', requireAdmin, (_req, res) => {
    const board = bingoService.resetMarks();
    io.emit('bingo:updated', board);
    res.json(board);
  });

  return router;
}
