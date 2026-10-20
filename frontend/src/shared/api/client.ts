export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

async function request(path: string, options: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(`${apiOrigin}/api/v1${path}`, options);
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      'Não foi possível conectar à API. Confira se o backend está em execução.',
      0,
    );
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : 'Não foi possível concluir a solicitação. Tente novamente.';

    throw new ApiError(message, response.status);
  }

  return response;
}

async function jsonRequest<T>(path: string, options: RequestInit): Promise<T> {
  const response = await request(path, options);

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return jsonRequest<T>(path, { signal });
}

export async function apiGetFile(path: string, signal?: AbortSignal): Promise<Blob> {
  const response = await request(path, { signal });

  return response.blob();
}

export function apiWrite<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
) {
  return jsonRequest<T>(path, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
  });
}
