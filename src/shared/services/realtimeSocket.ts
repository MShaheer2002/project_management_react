import { io, type Socket } from 'socket.io-client';

type ConnectInput = {
  token: string;
  workspaceId: string;
  clientVersion?: string;
};

const SOCKET_URL = process.env.BASE_URL || 'http://localhost:8000';
const LOG_PREFIX = '[RealtimeSocket]';

class RealtimeSocketService {
  private socket: Socket | null = null;
  private authKey: string | null = null;
  private listeners = new Set<(socket: Socket | null) => void>();

  private log(message: string, payload?: unknown) {
    if (!import.meta.env.DEV) return;
    if (payload === undefined) {
      console.info(`${LOG_PREFIX} ${message}`);
      return;
    }
    console.info(`${LOG_PREFIX} ${message}`, payload);
  }

  private bindCoreLogs(socket: Socket) {
    socket.on('connect', () => {
      this.log('connected', { socketId: socket.id, transport: socket.io.engine.transport.name });
    });

    socket.on('disconnect', (reason) => {
      this.log('disconnected', { reason });
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      this.log('reconnect_attempt', { attempt });
    });

    socket.io.on('reconnect', (attempt) => {
      this.log('reconnected', { attempt });
    });

    socket.io.on('reconnect_error', (error) => {
      this.log('reconnect_error', { message: error.message });
    });

    socket.on('connect_error', (error) => {
      this.log('connect_error', { message: error.message });
    });
  }

  connect(input: ConnectInput): Socket {
    const nextAuthKey = `${input.workspaceId}:${input.token}`;
    if (this.socket && this.authKey === nextAuthKey) {
      if (!this.socket.connected) {
        this.log('reusing existing socket and reconnecting');
        this.socket.connect();
      }
      return this.socket;
    }

    this.disconnect();
    this.log('creating socket connection', { workspaceId: input.workspaceId });

    const socket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      auth: {
        token: input.token,
        workspaceId: input.workspaceId,
        clientVersion: input.clientVersion ?? 'web-frontend',
      },
    });

    this.bindCoreLogs(socket);
    this.socket = socket;
    this.authKey = nextAuthKey;
    this.notifyListeners();
    return socket;
  }

  getSocket() {
    return this.socket;
  }

  subscribe(listener: (socket: Socket | null) => void) {
    this.listeners.add(listener);
    listener(this.socket);

    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: string, payload?: unknown) {
    if (!this.socket?.connected) return;
    this.socket.emit(event, payload);
  }

  disconnect() {
    if (!this.socket) return;
    this.log('disconnecting socket');
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.authKey = null;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.socket));
  }
}

export const realtimeSocket = new RealtimeSocketService();
