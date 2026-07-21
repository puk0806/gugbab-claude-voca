/**
 * Vercel 서버리스 함수 — relay `/api/chat` 인증 프록시.
 *
 * 브라우저는 시크릿 없이 본 함수를 호출하고, 함수가 RELAY_SECRET(X-Relay-Secret)을
 * 붙여 relay 로 중계한 뒤 SSE(text/event-stream) 응답을 그대로 스트리밍한다.
 *
 * 본문(app=english, systemPrompt, messages)은 클라이언트가 조립한다
 * (`src/features/conversation/chatRequest.ts`) — 시크릿이 아니므로 노출 무해.
 * 유효성의 단일 소스는 relay(zod) — 여기서는 형태만 얕게 검증.
 *
 * 로컬 개발은 vite dev proxy(vite.config.ts)가 같은 역할을 한다.
 */

export const config = { maxDuration: 60 };

/** 여기서 실제로 검증하는 필드만 주장 — 나머지 유효성의 단일 소스는 relay(zod). */
interface CheckedChatBody {
  readonly app: 'english';
  readonly messages: readonly { content: string }[];
}

const SSE_HEADERS = {
  'content-type': 'text/event-stream; charset=utf-8',
  'cache-control': 'no-cache',
  connection: 'keep-alive',
  'x-accel-buffering': 'no',
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** transport 실패를 클라이언트가 처리 가능한 SSE error 이벤트로 변환. */
function sseErrorResponse(): Response {
  const payload = JSON.stringify({ type: 'error', message: '릴레이 서버 오류가 발생했어요' });
  return new Response(`data: ${payload}\n\n`, { headers: SSE_HEADERS });
}

function isValidBody(body: unknown): body is CheckedChatBody {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    b.app === 'english' &&
    Array.isArray(b.messages) &&
    b.messages.length > 0 &&
    b.messages.every(
      (m) =>
        typeof m === 'object' &&
        m !== null &&
        typeof (m as Record<string, unknown>).content === 'string',
    )
  );
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, '입력을 확인해주세요');
  }
  if (!isValidBody(body)) {
    return jsonError(400, '입력을 확인해주세요');
  }

  const relayUrl = process.env.RELAY_URL;
  const relaySecret = process.env.RELAY_SECRET;
  if (!relayUrl || !relaySecret) {
    return jsonError(503, '릴레이 서버가 설정되지 않았어요');
  }

  let relayRes: Response;
  try {
    relayRes = await fetch(`${relayUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Relay-Secret': relaySecret,
      },
      body: JSON.stringify(body),
      signal: request.signal,
    });
  } catch {
    return sseErrorResponse();
  }

  if (!relayRes.ok || !relayRes.body) {
    return sseErrorResponse();
  }

  return new Response(relayRes.body, { headers: SSE_HEADERS });
}
