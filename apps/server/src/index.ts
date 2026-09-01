import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { config, warnAboutInsecureDefaults } from './config';
import { createAdminRouter } from './routes/adminRoutes';
import { bingoService } from './services/bingoService';
import { registerBingoHandlers } from './socket/bingoHandlers';
import { registerRouletteBroadcast, registerRouletteHandlers } from './socket/rouletteHandlers';
import type { TypedServer } from './socket/types';
import { store } from './state/store';

warnAboutInsecureDefaults();

const app = express();
const httpServer = createServer(app);

const io: TypedServer = new Server(httpServer, {
  cors: { origin: config.corsOrigins, credentials: true },
});

app.set('trust proxy', 1);
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

/** Publiczny odczyt planszy - przydatny przy pierwszym renderze i do debugowania. */
app.get('/api/bingo', (_req, res) => {
  res.json(bingoService.getBoard());
});

app.use('/api/admin', createAdminRouter(io));

// W produkcji serwer wystawia zbudowany frontend na tym samym porcie.
if (existsSync(config.webDistPath)) {
  app.use(express.static(config.webDistPath));
  app.get(/^\/(?!api|socket\.io).*/, (_req, res) => {
    res.sendFile(join(config.webDistPath, 'index.html'));
  });
}

registerRouletteBroadcast(io);

io.on('connection', (socket) => {
  registerRouletteHandlers(io, socket);
  registerBingoHandlers(io, socket);
});

httpServer.listen(config.port, config.host, () => {
  console.log(`[bcf] Serwer działa na http://localhost:${config.port}`);
});

function shutdown(signal: string): void {
  console.log(`[bcf] ${signal} - zapisuję stan i zamykam serwer.`);
  store.flush();
  io.close();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
