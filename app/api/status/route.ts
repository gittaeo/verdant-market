import { env } from 'cloudflare:workers';
export function GET() {
  return Response.json({ dart: Boolean((env as any).DART_API_KEY || process.env.DART_API_KEY), krxConfigured:Boolean((env as any).KRX_API_KEY || process.env.KRX_API_KEY), investorConfigured:Boolean(((env as any).KIS_APP_KEY||process.env.KIS_APP_KEY)&&((env as any).KIS_APP_SECRET||process.env.KIS_APP_SECRET)), prices: false, news: false, intraday: false, execution: 'cloud' }, { headers: { 'Cache-Control': 'no-store' } });
}
