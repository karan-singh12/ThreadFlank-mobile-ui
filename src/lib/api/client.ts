import { API_BASE_URL, API_TIMEOUT_MS } from "./config";

/** Success envelope produced by the backend's TransformInterceptor. */
export type ApiResponse<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: { requestId?: string; version?: string; pagination?: unknown };
  timestamp: string;
};

export type ApiFieldError = { field: string; message: string };

/** Error envelope produced by the backend's HttpExceptionFilter. */
type ApiErrorBody = {
  success: false;
  statusCode: number;
  message: string | string[];
  error?: string;
  errors?: ApiFieldError[];
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: ApiFieldError[];

  constructor(status: number, message: string, fieldErrors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  /** Status 0 means the request never got a response (offline, wrong host, timeout). */
  get isNetworkError() {
    return this.status === 0;
  }
}

/** A render was refused because the balance is too low (HTTP 402). */
export class OutOfCreditsError extends ApiError {
  constructor(message: string) {
    super(402, message);
    this.name = "OutOfCreditsError";
  }
}

function friendlyServerMessage(status: number) {
  if (status === 502 || status === 503 || status === 504) {
    return "Our servers are busy right now. Please try again in a moment.";
  }
  return "Something went wrong on our side. Please try again in a moment.";
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  timeoutMs?: number;
};

/** Called with every 401 on an authenticated request so the session can end (set by AuthProvider). */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/**
 * JSON request against the backend. Unwraps the error envelope into ApiError with friendly
 * copy, and enforces a timeout (React Native has no AbortSignal.timeout/any).
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { method = "GET", body, token, signal, timeoutMs = API_TIMEOUT_MS } = options;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  // FormData sets its own multipart boundary header; everything else is JSON.
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(
      0,
      timedOut ? "The server took too long to respond. Please try again." : "Can't reach the server. Check your connection and try again."
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || (payload && payload.success === false)) {
    const errorBody = payload as ApiErrorBody | null;
    if (response.status === 401 && token) onUnauthorized?.();
    if (response.status >= 500) {
      console.warn(`[api] ${method} ${path} → ${response.status}`, errorBody?.message);
      throw new ApiError(response.status, friendlyServerMessage(response.status));
    }
    const message = Array.isArray(errorBody?.message) ? errorBody.message.join(", ") : errorBody?.message;
    if (response.status === 402) throw new OutOfCreditsError(message || "You're out of credits.");
    throw new ApiError(response.status, message || "Something went wrong. Please try again.", errorBody?.errors ?? []);
  }

  return payload as ApiResponse<T>;
}

/** A local file (image picker / camera result) as a multipart part. */
export type LocalFile = { uri: string; name: string; type: string };

export function filePart(file: LocalFile) {
  // React Native's FormData accepts { uri, name, type } objects for file parts.
  return { uri: file.uri, name: file.name, type: file.type } as unknown as Blob;
}
