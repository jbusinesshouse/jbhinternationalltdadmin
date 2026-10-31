import { supabase } from "./supabase";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

type ErrorBody = {
  error?: string;
  code?: string;
  details?: { fieldErrors?: Record<string, string[]> };
} | null;

function validationMessage(json: ErrorBody): string | null {
  const fields = json?.details?.fieldErrors as Record<string, string[]> | undefined;
  if (!fields) return null;
  const first = Object.entries(fields).find(([, errs]) => errs?.length);
  return first ? `${first[0]}: ${first[1][0]}` : null;
}

/** JSON client for `/api/v1/admin/*` on the Express BFF. */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not configured", 500);
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError("Not signed in", 401);

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(buildUrl(`/admin${path}`, options.query), {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch {
    throw new ApiError(
      "Cannot reach the API. Check NEXT_PUBLIC_API_URL and backend CORS_ORIGINS.",
      0,
      "NETWORK"
    );
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const body = json as ErrorBody;
    throw new ApiError(
      validationMessage(body) || body?.error || `Request failed (${res.status})`,
      res.status,
      body?.code
    );
  }
  return json as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
