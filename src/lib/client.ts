import { consola } from "consola";
import type { AuthResponse } from "../types/taiga-api.js";
import { TaigaAPIError } from "./errors.js";

export interface TaigaClientOptions {
  baseUrl: string;
  authToken?: string;
  verbose?: boolean;
  maxRetries?: number;
  onTokenRefresh?: (token: string) => void | Promise<void>;
}

export class TaigaClient {
  private authToken?: string;
  private readonly apiBase: string;
  private readonly verbose: boolean;
  private readonly maxRetries: number;
  private readonly onTokenRefresh?: (token: string) => void | Promise<void>;

  constructor(options: TaigaClientOptions) {
    this.authToken = options.authToken;
    this.verbose = options.verbose ?? false;
    this.maxRetries = options.maxRetries ?? 3;
    this.onTokenRefresh = options.onTokenRefresh;
    const normalized = options.baseUrl.replace(/\/+$/, "");
    this.apiBase = normalized.endsWith("/api/v1") ? normalized : `${normalized}/api/v1`;
  }

  get apiUrl(): string {
    return this.apiBase;
  }

  setAuthToken(token: string | undefined): void {
    this.authToken = token;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("auth", {
      method: "POST",
      body: { type: "normal", username, password },
      skipAuth: true,
    });
    this.authToken = response.auth_token;
    return response;
  }

  async refreshToken(): Promise<string> {
    if (!this.authToken) {
      throw new TaigaAPIError("No auth token to refresh", 401);
    }
    const response = await this.request<{ auth_token: string }>("auth/refresh", {
      method: "POST",
      skipAuth: true,
      headers: { Authorization: `Bearer ${this.authToken}` },
    });
    this.authToken = response.auth_token;
    await this.onTokenRefresh?.(response.auth_token);
    return response.auth_token;
  }

  async get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    return this.request<T>(path, { method: "GET", query });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PUT", body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body });
  }

  async delete(path: string): Promise<void> {
    await this.request<void>(path, { method: "DELETE" });
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>(path, { method: "POST", body: formData, isFormData: true });
  }

  private async request<T>(
    path: string,
    options: {
      method: string;
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      headers?: Record<string, string>;
      skipAuth?: boolean;
      isFormData?: boolean;
      retried?: boolean;
      retryCount?: number;
    },
  ): Promise<T> {
    const url = new URL(
      path.startsWith("http") ? path : `${this.apiBase}/${path.replace(/^\//, "")}`,
    );
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = { ...options.headers };
    if (!options.isFormData) {
      headers["Content-Type"] = "application/json";
    }
    if (!options.skipAuth && this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const init: RequestInit = {
      method: options.method,
      headers,
    };
    if (options.body !== undefined) {
      init.body = options.isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body);
    }

    if (this.verbose) {
      consola.info(`${options.method} ${url.toString()}`);
    }

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new TaigaAPIError(
        `Network error (${detail}). Target: ${url.origin}. Verify the instance URL with "taiga config get" or login again with --url.`,
        0,
        error,
      );
    }

    if (response.status === 401 && !options.skipAuth && !options.retried && this.authToken) {
      await this.refreshToken();
      return this.request<T>(path, { ...options, retried: true });
    }

    if (response.status === 429) {
      const retryCount = (options.retryCount ?? 0) + 1;
      if (retryCount <= this.maxRetries) {
        const delay = Math.min(1000 * 2 ** retryCount, 10000);
        await new Promise((r) => setTimeout(r, delay));
        return this.request<T>(path, { ...options, retryCount });
      }
      throw new TaigaAPIError("Rate limited by Taiga API (429). Try again later.", 429);
    }

    if (!response.ok) {
      let detail: unknown;
      try {
        detail = await response.json();
      } catch {
        detail = await response.text();
      }
      const message =
        typeof detail === "object" && detail !== null && "_error_message" in detail
          ? String((detail as { _error_message: string })._error_message)
          : `API error ${response.status} ${response.statusText}`;
      throw new TaigaAPIError(message, response.status, detail);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }
}
