import type { ClientToServerEvents, ServerToClientEvents } from '@bcf/shared-types';
import { io, type Socket } from 'socket.io-client';

export type BcfSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function createOptions() {
  return {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  };
}

const serverUrl = import.meta.env.VITE_SERVER_URL;

/**
 * Jedna instancja na całą aplikację. Bez `VITE_SERVER_URL` łączymy się z tym
 * samym originem - w dev Vite proxuje /socket.io na backend.
 */
export const socket: BcfSocket = serverUrl
  ? io(serverUrl, createOptions())
  : io(createOptions());
