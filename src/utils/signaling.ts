type MessageHandler = (data: any) => void;

export class SignalingClient {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: any = null;
  private url: string;
  public isConnected = false;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.isConnected = true;
          this.emit('connection:open', {});
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const action = data.action;
            if (action) {
              this.emit(action, data);
            }
          } catch (e) {
            console.error('Failed to parse signaling message', e);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('Signaling WebSocket error:', err);
          this.emit('connection:error', err);
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('connection:close', {});
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  public send(action: string, payload: Record<string, any> = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...payload }));
    } else {
      console.warn('Cannot send message, WebSocket not open. Action:', action);
    }
  }

  public on(action: string, handler: MessageHandler) {
    if (!this.handlers.has(action)) {
      this.handlers.set(action, new Set());
    }
    this.handlers.get(action)!.add(handler);
    return () => this.off(action, handler);
  }

  public off(action: string, handler: MessageHandler) {
    const set = this.handlers.get(action);
    if (set) {
      set.delete(handler);
    }
  }

  private emit(action: string, data: any) {
    const set = this.handlers.get(action);
    if (set) {
      set.forEach((handler) => handler(data));
    }
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
