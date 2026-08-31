import { timingSafeEqual } from 'node:crypto';
import type { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

/**
 * Minimalny auth na jedno konto (admin) — hasło z ENV + JWT w httpOnly cookie.
 * Pełny system użytkowników dochodzi dopiero na etapie Supabase.
 */
interface AdminTokenPayload {
  role: 'admin';
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function isLoginRateLimited(ip: string): boolean {
  const entry = loginAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    loginAttempts.delete(ip);
    return false;
  }
  return entry.count >= LOGIN_MAX_ATTEMPTS;
}

export function registerFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export function verifyPassword(password: unknown): boolean {
  if (typeof password !== 'string' || password.length === 0) return false;
  return safeCompare(password, config.adminPassword);
}

export function signAdminToken(): string {
  const payload: AdminTokenPayload = { role: 'admin' };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.adminSessionTtlSeconds });
}

export function isValidAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return typeof decoded === 'object' && decoded !== null && 'role' in decoded && decoded.role === 'admin';
  } catch {
    return false;
  }
}

export const adminCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction,
  path: '/',
  maxAge: config.adminSessionTtlSeconds * 1000,
};

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isValidAdminToken(req.cookies?.[config.adminCookieName])) {
    res.status(401).json({ error: 'Brak autoryzacji.' });
    return;
  }
  next();
}
