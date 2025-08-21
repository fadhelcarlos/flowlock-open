import * as http from "http";
import * as https from "https";
import * as url from "url";

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  maxRetryDelay?: number;
  retryMultiplier?: number;
}

export interface HttpRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface HttpResponse<T = any> {
  statusCode: number;
  statusMessage?: string;
  headers: http.IncomingHttpHeaders;
  data: T;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
    public code?: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class AuthError extends HttpError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, null, 'AUTH_FAILED');
    this.name = 'AuthError';
  }
}

export class NetworkError extends HttpError {
  constructor(message: string, originalError?: Error) {
    super(`Network error: ${message}`, undefined, null, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}

export class TimeoutError extends HttpError {
  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`, undefined, null, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

export class HttpClient {
  private defaultOptions: HttpClientOptions;

  constructor(options: HttpClientOptions = {}) {
    this.defaultOptions = {
      timeout: 30000, // 30 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
      maxRetryDelay: 10000, // 10 seconds
      retryMultiplier: 2,
      ...options,
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateRetryDelay(attempt: number): number {
    const { retryDelay = 1000, maxRetryDelay = 10000, retryMultiplier = 2 } = this.defaultOptions;
    const delay = retryDelay * Math.pow(retryMultiplier, attempt - 1);
    return Math.min(delay, maxRetryDelay);
  }

  private isRetryableError(error: Error): boolean {
    if (error instanceof AuthError) return false;
    if (error instanceof HttpError) {
      // Don't retry client errors (4xx), except 408, 429
      if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        return error.statusCode === 408 || error.statusCode === 429;
      }
      // Retry server errors (5xx)
      if (error.statusCode && error.statusCode >= 500) {
        return true;
      }
    }
    if (error instanceof NetworkError || error instanceof TimeoutError) {
      return true;
    }
    return false;
  }

  private makeRequest<T>(
    requestUrl: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    return new Promise((resolve, reject) => {
      const parsed = url.parse(requestUrl);
      const mod = parsed.protocol === "https:" ? https : http;
      const timeout = options.timeout || this.defaultOptions.timeout || 30000;

      const req = mod.request(
        {
          method: options.method || "GET",
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.path,
          headers: {
            "content-type": "application/json",
            "user-agent": "FlowLock-Agent/1.0",
            ...(options.headers || {}),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const statusCode = res.statusCode || 0;
              
              // Handle authentication errors
              if (statusCode === 401 || statusCode === 403) {
                reject(new AuthError(
                  statusCode === 401 ? 'Authentication failed - invalid or expired token' 
                  : 'Access denied - insufficient permissions'
                ));
                return;
              }

              // Handle other HTTP errors
              if (statusCode >= 400) {
                let errorMessage = `HTTP ${statusCode}: ${res.statusMessage}`;
                let errorData = null;
                
                try {
                  errorData = data ? JSON.parse(data) : null;
                  if (errorData && errorData.error) {
                    errorMessage = `HTTP ${statusCode}: ${errorData.error}`;
                  }
                } catch {
                  // Use raw data if JSON parsing fails
                  if (data) {
                    errorMessage = `HTTP ${statusCode}: ${data.slice(0, 200)}`;
                  }
                }
                
                reject(new HttpError(errorMessage, statusCode, errorData));
                return;
              }

              // Parse successful response
              let parsedData: T;
              try {
                parsedData = data ? JSON.parse(data) : ({} as T);
              } catch (e) {
                parsedData = { ok: false, error: "invalid_json", raw: data } as T;
              }

              resolve({
                statusCode,
                statusMessage: res.statusMessage,
                headers: res.headers,
                data: parsedData,
              });
            } catch (error) {
              reject(new HttpError(`Response parsing error: ${error}`, res.statusCode));
            }
          });
        }
      );

      // Set timeout
      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new TimeoutError(timeout));
      });

      // Handle request errors
      req.on("error", (error: Error) => {
        if (error.message.includes('ENOTFOUND')) {
          reject(new NetworkError('DNS lookup failed - check your internet connection and URL', error));
        } else if (error.message.includes('ECONNREFUSED')) {
          reject(new NetworkError('Connection refused - service may be down', error));
        } else if (error.message.includes('ETIMEDOUT')) {
          reject(new TimeoutError(timeout));
        } else {
          reject(new NetworkError(error.message, error));
        }
      });

      // Send request body if present
      if (options.body) {
        const bodyStr = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
        req.write(bodyStr);
      }

      req.end();
    });
  }

  async request<T = any>(
    requestUrl: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const { retries = this.defaultOptions.retries || 3 } = this.defaultOptions;
    let lastError: Error;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        return await this.makeRequest<T>(requestUrl, options);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on the last attempt or if error is not retryable
        if (attempt > retries || !this.isRetryableError(lastError)) {
          throw lastError;
        }

        // Calculate delay with jitter
        const baseDelay = this.calculateRetryDelay(attempt);
        const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
        const delay = baseDelay + jitter;
        
        console.warn(`Request failed (attempt ${attempt}/${retries + 1}): ${lastError.message}. Retrying in ${Math.round(delay)}ms...`);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  async get<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>(url, { method: "GET", headers });
    return response.data;
  }

  async post<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>(url, { method: "POST", body, headers });
    return response.data;
  }

  async put<T = any>(url: string, body?: any, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>(url, { method: "PUT", body, headers });
    return response.data;
  }

  async delete<T = any>(url: string, headers?: Record<string, string>): Promise<T> {
    const response = await this.request<T>(url, { method: "DELETE", headers });
    return response.data;
  }
}

// Export default instance
export const httpClient = new HttpClient();

// Convenience function for backward compatibility
export async function fetchJson<T = any>(
  url: string,
  options: HttpRequestOptions = {}
): Promise<T> {
  return httpClient.request<T>(url, options).then(response => response.data);
}