import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './chat';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  app: 'english',
  systemPrompt: 'You are a tutor.',
  messages: [{ role: 'user', content: 'Hello!' }],
};

describe('api/chat POST (relay 프록시)', () => {
  beforeEach(() => {
    vi.stubEnv('RELAY_URL', 'https://relay.example.com');
    vi.stubEnv('RELAY_SECRET', 'test-secret');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('유효 요청을 relay 로 X-Relay-Secret 과 함께 중계하고 SSE 를 그대로 돌려준다', async () => {
    const relayBody = new Response('data: {"type":"done"}\n\n').body;
    const fetchMock = vi.fn(
      async () =>
        new Response(relayBody, {
          status: 200,
          headers: { 'content-type': 'text/event-stream' },
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await POST(makeRequest(VALID_BODY));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://relay.example.com/api/chat');
    expect(new Headers(init.headers).get('X-Relay-Secret')).toBe('test-secret');
    expect(JSON.parse(init.body as string)).toEqual(VALID_BODY);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(await res.text()).toContain('"type":"done"');
  });

  it('app 이 english 가 아니면 400', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, app: 'health' }));
    expect(res.status).toBe(400);
  });

  it('messages 가 비어 있으면 400', async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, messages: [] }));
    expect(res.status).toBe(400);
  });

  it('JSON 이 아니면 400', async () => {
    const req = new Request('http://localhost/api/chat', { method: 'POST', body: 'not-json' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('RELAY_URL·RELAY_SECRET 미설정 시 503', async () => {
    vi.stubEnv('RELAY_URL', '');
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(503);
  });

  it('relay transport 실패 시 SSE error 이벤트로 변환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }),
    );
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(await res.text()).toContain('"type":"error"');
  });

  it('relay 가 비정상 응답이면 SSE error 이벤트로 변환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 401 })),
    );
    const res = await POST(makeRequest(VALID_BODY));
    expect(await res.text()).toContain('"type":"error"');
  });
});
