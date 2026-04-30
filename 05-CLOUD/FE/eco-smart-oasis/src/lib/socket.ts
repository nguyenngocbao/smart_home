import { io, Socket } from 'socket.io-client';
import { BASE_URL } from './api';

let _socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (_socket?.connected) return _socket;
  _socket?.disconnect();

  _socket = io(BASE_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionDelay: 2000,
  });

  _socket.on('connect',         () => console.log('🔌 Socket connected'));
  _socket.on('disconnect',      (r) => console.warn('🔌 Socket disconnected:', r));
  _socket.on('connect_error',   (e) => console.error('🔌 Socket error:', e.message));

  return _socket;
}

export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}

export function getSocket(): Socket | null {
  return _socket;
}
