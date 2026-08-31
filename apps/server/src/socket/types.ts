import type { ClientToServerEvents, ServerToClientEvents } from '@bcf/shared-types';
import type { Server, Socket } from 'socket.io';

export type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
