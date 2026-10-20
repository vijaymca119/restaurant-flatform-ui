// Central HTTP client for the external Java/Spring API (/api/v1).
// The backend is authoritative; this client never fabricates successful responses.

const RAW_BASE = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, "");

export function isApiConfigured() {
  return API_BASE_URL.length > 0;
}

export class ApiError extends Error {
  status: number;
  code?: string | undefined;
  fieldErrors?: Record<string, string> | undefined;
  constructor(status: number, message: string, code?: string | undefined, fieldErrors?: Record<string, string> | undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export class ApiNotConfiguredError extends ApiError {
  constructor() {
    super(0, "The partner API is not connected yet.", "API_NOT_CONFIGURED");
  }
}

export const UNAUTHORIZED_EVENT = "sorteddate:unauthorized";

type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | undefined;
  body?: unknown | undefined;
  query?: Query | undefined;
  signal?: AbortSignal | undefined;
  /** Skip the global 401 -> session-expired handling (used by auth calls). */
  silent401?: boolean | undefined;
}

export function buildUrl(path: string, query?: Query) {
  const url = `${API_BASE_URL}/api/v1${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || "Request failed";
  let code: string | undefined;
  let fieldErrors: Record<string, string> | undefined;
  try {
    const data = await res.json();
    message = data.message ?? data.detail ?? data.title ?? message;
    code = data.code ?? data.type;
    if (Array.isArray(data.errors)) {
      fieldErrors = Object.fromEntries(
        data.errors.map((e: { field?: string | undefined; message?: string | undefined }) => [e.field ?? "", e.message ?? ""]),
      );
    } else if (data.fieldErrors && typeof data.fieldErrors === "object") {
      fieldErrors = data.fieldErrors;
    }
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(res.status, message, code, fieldErrors);
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!isApiConfigured()) throw new ApiNotConfiguredError();
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  let res: Response;
  try {
    const init: RequestInit = {
      method: opts.method ?? "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(opts.body && !isForm ? { "Content-Type": "application/json" } : {}),
      },
    };
    if (opts.body) init.body = isForm ? (opts.body as FormData) : JSON.stringify(opts.body);
    if (opts.signal) init.signal = opts.signal;
    res = await fetch(buildUrl(path, opts.query), init);
  } catch {
    throw new ApiError(0, "We couldn't reach the server. Check your connection and try again.", "NETWORK");
  }
  if (!res.ok) {
    const err = await parseError(res);
    if (res.status === 401 && !opts.silent401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw err;
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Multipart upload with real progress reporting (fetch has no upload progress). */
export function uploadWithProgress<T>(
  path: string,
  form: FormData,
  onProgress: (pct: number) => void,
): Promise<T> {
  if (!isApiConfigured()) return Promise.reject(new ApiNotConfiguredError());
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", buildUrl(path));
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiError(0, "Upload failed. Check your connection and retry.", "NETWORK"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((xhr.responseText ? JSON.parse(xhr.responseText) : undefined) as T);
      } else {
        let msg = "Upload was rejected by the server.";
        try {
          msg = JSON.parse(xhr.responseText).message ?? msg;
        } catch {
          /* ignore */
        }
        reject(new ApiError(xhr.status, msg));
      }
    };
    xhr.send(form);
  });
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
