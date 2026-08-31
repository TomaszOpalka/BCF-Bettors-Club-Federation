import 'dotenv/config';
import { fileURLToPath } from 'node:url';

const DEV_ADMIN_PASSWORD = 'bcf-admin';
const DEV_JWT_SECRET = 'bcf-dev-secret-change-me';

function parseOrigins(raw: string | undefined): string[] {
  return (raw ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? '0.0.0.0',
  isProduction: process.env.NODE_ENV === 'production',

  /** Hasło do panelu admina bingo. */
  adminPassword: process.env.ADMIN_PASSWORD ?? DEV_ADMIN_PASSWORD,
  jwtSecret: process.env.JWT_SECRET ?? DEV_JWT_SECRET,
  adminCookieName: 'bcf_admin',
  /** Ważność sesji admina (sekundy). */
  adminSessionTtlSeconds: 60 * 60 * 12,

  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),

  /** Plik ze stanem — zastąpi go Supabase na kolejnym etapie. */
  stateFilePath: fileURLToPath(new URL('../data/state.json', import.meta.url)),
  /** Build frontendu — jeśli istnieje, serwer wystawia go na tym samym porcie. */
  webDistPath: fileURLToPath(new URL('../../web/dist', import.meta.url)),
} as const;

export function warnAboutInsecureDefaults(): void {
  if (!config.isProduction) return;
  if (config.adminPassword === DEV_ADMIN_PASSWORD) {
    console.warn('[config] UWAGA: ADMIN_PASSWORD nie jest ustawione — używam domyślnego hasła!');
  }
  if (config.jwtSecret === DEV_JWT_SECRET) {
    console.warn('[config] UWAGA: JWT_SECRET nie jest ustawione — sesje admina są do podrobienia!');
  }
}
