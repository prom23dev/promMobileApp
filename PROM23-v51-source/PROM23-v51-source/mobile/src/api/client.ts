export class ApiError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions<T> = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  accessToken?: string;
  organizationId?: string;
  idempotencyKey?: string;
  parse: (value: unknown) => T;
};

// Transport for the future Bitrix BFF. Not connected to demo screens.
// Auth/refresh and concrete response schemas are implemented after server contract verification.
export class MobileApiClient {
  private readonly base: URL;
  constructor(baseUrl: string, private readonly transport: typeof fetch = fetch, private readonly timeoutMs = 10000) {
    this.base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
    if (this.base.protocol !== 'https:' || this.base.username || this.base.password || this.base.search || this.base.hash) {
      throw new Error('API требует HTTPS без встроенных реквизитов, query и fragment');
    }
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Некорректный таймаут');
  }

  async request<T>(path: string, options: RequestOptions<T>): Promise<T> {
    if (!path || path.startsWith('/') || path.includes('\\') || path.includes('#')) {
      throw new Error('Ожидается относительный путь API');
    }
    const url = new URL(path, this.base);
    if (url.origin !== this.base.origin || !url.pathname.startsWith(this.base.pathname)) {
      throw new Error('Выход за пределы API запрещён');
    }
    if (options.organizationId && !options.accessToken) throw new Error('Контекст организации требует авторизации');
    const method = options.method ?? 'GET';
    if (method === 'GET' && options.body !== undefined) throw new Error('GET не принимает тело запроса');
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;
    if (options.organizationId) headers['X-Organization-Id'] = options.organizationId;
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
    const abort = new AbortController();
    let timedOut = false;
    const onAbort = () => abort.abort();
    options.signal?.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => { timedOut = true; abort.abort(); }, this.timeoutMs);
    try {
      if (options.signal?.aborted) throw new ApiError('CANCELLED', 0, 'Запрос отменён');
      const response = await this.transport(url.toString(), {
        method, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: abort.signal, credentials: 'omit', redirect: 'error',
      });
      if (!response.ok) {
        // Do not show raw server HTML/errors or include tokens/personal data in logs.
        throw new ApiError(response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : 'HTTP_ERROR', response.status,
          response.status === 401 ? 'Войдите снова' : response.status === 403 ? 'Нет доступа к данным' : 'Не удалось выполнить запрос. Попробуйте ещё раз');
      }
      if (!(response.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) {
        throw new ApiError('INVALID_RESPONSE', response.status, 'Сервер вернул неожиданный ответ');
      }
      let data: unknown;
      try { data = await response.json(); } catch {
        throw new ApiError('INVALID_RESPONSE', response.status, 'Не удалось прочитать ответ сервера');
      }
      try { return options.parse(data); } catch {
        throw new ApiError('INVALID_RESPONSE', response.status, 'Формат данных сервера изменился');
      }
    } catch (error) {
      if (timedOut) throw new ApiError('TIMEOUT', 0, 'Сервер долго отвечает. Проверьте соединение');
      if (options.signal?.aborted) throw new ApiError('CANCELLED', 0, 'Запрос отменён');
      if (error instanceof ApiError) throw error;
      throw new ApiError('NETWORK', 0, 'Нет соединения с сервером');
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
    }
  }
}
