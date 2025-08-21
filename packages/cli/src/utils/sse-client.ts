import * as http from "http";
import * as https from "https";
import * as url from "url";
import { EventEmitter } from "events";

export interface SSEClientOptions {
  headers?: Record<string, string>;
  timeout?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  reconnectBackoffMultiplier?: number;
  maxReconnectInterval?: number;
}

export interface SSEEvent {
  event: string;
  data: any;
  id?: string;
  retry?: number;
}

export class SSEError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SSEError';
  }
}

export class SSEClient extends EventEmitter {
  private request?: http.ClientRequest;
  private response?: http.IncomingMessage;
  private reconnectAttempts = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private isConnected = false;
  private isReconnecting = false;
  private shouldReconnect = true;
  private lastEventId?: string;

  constructor(
    private url: string,
    private options: SSEClientOptions = {}
  ) {
    super();
    this.options = {
      timeout: 30000,
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
      reconnectBackoffMultiplier: 2,
      maxReconnectInterval: 30000,
      ...options,
    };
  }

  connect(): void {
    if (this.isConnected || this.isReconnecting) {
      return;
    }

    this.isReconnecting = true;
    this.emit('connecting');

    const parsed = url.parse(this.url);
    const mod = parsed.protocol === 'https:' ? https : http;

    const headers = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      'User-Agent': 'FlowLock-Agent/1.0',
      ...this.options.headers,
    };

    // Include Last-Event-ID if we have one
    if (this.lastEventId) {
      headers['Last-Event-ID'] = this.lastEventId;
    }

    this.request = mod.request(
      {
        method: 'GET',
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.path,
        headers,
      },
      (response) => {
        this.handleResponse(response);
      }
    );

    // Set timeout
    if (this.options.timeout) {
      this.request.setTimeout(this.options.timeout, () => {
        this.handleError(new SSEError('Connection timeout', 'TIMEOUT'));
      });
    }

    this.request.on('error', (error) => {
      this.handleError(new SSEError(`Connection error: ${error.message}`, 'CONNECTION_ERROR'));
    });

    this.request.end();
  }

  private handleResponse(response: http.IncomingMessage): void {
    if (response.statusCode !== 200) {
      this.handleError(new SSEError(`HTTP ${response.statusCode}: ${response.statusMessage}`, 'HTTP_ERROR'));
      return;
    }

    this.response = response;
    this.isConnected = true;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.emit('connected');

    response.setEncoding('utf8');
    
    let buffer = '';
    response.on('data', (chunk: string) => {
      buffer += chunk;
      this.processBuffer(buffer);
      buffer = this.getBufferRemainder(buffer);
    });

    response.on('end', () => {
      this.handleDisconnection();
    });

    response.on('error', (error) => {
      this.handleError(new SSEError(`Response error: ${error.message}`, 'RESPONSE_ERROR'));
    });
  }

  private processBuffer(buffer: string): void {
    let index: number;
    while ((index = buffer.indexOf('\n\n')) !== -1) {
      const eventData = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      
      if (eventData.trim()) {
        this.parseEvent(eventData);
      }
    }
  }

  private getBufferRemainder(buffer: string): string {
    const lastDoubleNewline = buffer.lastIndexOf('\n\n');
    if (lastDoubleNewline !== -1) {
      return buffer.slice(lastDoubleNewline + 2);
    }
    return buffer;
  }

  private parseEvent(eventData: string): void {
    const lines = eventData.split(/\r?\n/);
    let event = 'message';
    let data = '';
    let id: string | undefined;
    let retry: number | undefined;

    for (const line of lines) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        if (data) data += '\n';
        data += line.slice(5).trim();
      } else if (line.startsWith('id:')) {
        id = line.slice(3).trim();
      } else if (line.startsWith('retry:')) {
        const retryValue = parseInt(line.slice(6).trim(), 10);
        if (!isNaN(retryValue)) {
          retry = retryValue;
        }
      }
    }

    // Update last event ID
    if (id) {
      this.lastEventId = id;
    }

    // Parse JSON data if possible
    let parsedData: any = data;
    try {
      if (data) {
        parsedData = JSON.parse(data);
      }
    } catch {
      // Use raw data if JSON parsing fails
    }

    const sseEvent: SSEEvent = {
      event,
      data: parsedData,
      id,
      retry,
    };

    this.emit('event', sseEvent);
    this.emit(event, parsedData, sseEvent);

    // Update reconnect interval if specified
    if (retry && retry > 0) {
      this.options.reconnectInterval = retry;
    }
  }

  private handleError(error: SSEError): void {
    this.cleanup();
    this.emit('error', error);
    
    if (this.shouldReconnect) {
      this.scheduleReconnect();
    }
  }

  private handleDisconnection(): void {
    if (this.isConnected) {
      this.cleanup();
      this.emit('disconnected');
      
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer) {
      return;
    }

    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
      this.emit('error', new SSEError('Maximum reconnection attempts reached', 'MAX_RECONNECT_ATTEMPTS'));
      return;
    }

    const baseInterval = this.options.reconnectInterval || 1000;
    const multiplier = this.options.reconnectBackoffMultiplier || 2;
    const maxInterval = this.options.maxReconnectInterval || 30000;
    
    const interval = Math.min(
      baseInterval * Math.pow(multiplier, this.reconnectAttempts),
      maxInterval
    );

    this.reconnectAttempts++;
    
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay: interval });
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, interval);
  }

  private cleanup(): void {
    this.isConnected = false;
    this.isReconnecting = false;

    if (this.request) {
      this.request.destroy();
      this.request = undefined;
    }

    if (this.response) {
      this.response.destroy();
      this.response = undefined;
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    this.cleanup();
    this.emit('disconnected');
  }

  get connected(): boolean {
    return this.isConnected;
  }

  get connecting(): boolean {
    return this.isReconnecting;
  }
}

export function createSSEClient(url: string, options?: SSEClientOptions): SSEClient {
  return new SSEClient(url, options);
}