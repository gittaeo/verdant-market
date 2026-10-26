import { env } from 'cloudflare:workers';
import { runResearch, ResearchError } from '../../../lib/market-research.mjs';

export async function POST(request: Request) {
  // This Site is owner-private. Sites dispatch authenticates browser and service
  // requests before this shared, read-only research endpoint is reached.
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: '허용되지 않은 요청입니다.' }, { status: 403 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: '요청을 읽을 수 없습니다.' }, { status: 400 }); }
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (query.length > 80 || ![7,30,90].includes(body.days)) return Response.json({ error: '종목명과 조회 기간을 확인해 주세요.' }, { status: 400 });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (type: string, data: unknown) => { if (!closed) { try { controller.enqueue(encoder.encode(JSON.stringify({ type, data }) + '\n')); } catch { closed = true; } } };
      try {
        const result = await runResearch({ query, days: body.days, key: (env as any).DART_API_KEY || process.env.DART_API_KEY, krxKey:(env as any).KRX_API_KEY || process.env.KRX_API_KEY, newsClientId:(env as any).NAVER_NEWS_CLIENT_ID||process.env.NAVER_NEWS_CLIENT_ID,newsClientSecret:(env as any).NAVER_NEWS_CLIENT_SECRET||process.env.NAVER_NEWS_CLIENT_SECRET, signal: request.signal, onProgress: (event: unknown) => send('progress', event) });
        send('result', result);
      } catch (error) {
        send('error', { code: error instanceof ResearchError ? error.code : 'internal', message: error instanceof ResearchError ? error.message : '분석을 완료하지 못했습니다. 다시 시도해 주세요.' });
      } finally { if (!closed) { try { controller.close(); } catch {} } }
    }
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
