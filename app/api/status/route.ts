import { env } from 'cloudflare:workers';
export function GET() {
  return Response.json({ dart: Boolean((env as any).DART_API_KEY || process.env.DART_API_KEY), prices: false, news: false, intraday: false, execution: 'cloud' }, { headers: { 'Cache-Control': 'no-store' } });
}
