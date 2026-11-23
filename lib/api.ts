export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, credentials: "same-origin" });
  const body = (await res.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (res.status === 401) {
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/login" &&
      window.location.pathname !== "/"
    ) {
      window.location.replace("/login");
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(body?.error ?? res.statusText);
  }

  return body?.data as T;
}

export function post<T>(path: string, payload: unknown): Promise<T> {
  return api<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function patch<T>(path: string, payload: unknown): Promise<T> {
  return api<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function del<T>(path: string): Promise<T> {
  return api<T>(path, { method: "DELETE" });
}
