/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Adres backendu. Pusty w dev — Vite proxuje /api i /socket.io na serwer. */
  readonly VITE_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
