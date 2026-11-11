/** Browser-side fetch helper: parses JSON and turns API errors into Error(message). */
export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error('Network error — check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as { error?: string } | null;

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const jsonHeaders = { 'Content-Type': 'application/json' };
