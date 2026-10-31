import { env } from 'cloudflare:workers';
import {checkNewsConnection} from '../../../lib/news-health.mjs';
export async function GET() {
 const clientId=(env as any).NAVER_NEWS_CLIENT_ID||process.env.NAVER_NEWS_CLIENT_ID;
 const clientSecret=(env as any).NAVER_NEWS_CLIENT_SECRET||process.env.NAVER_NEWS_CLIENT_SECRET;
 const newsHealth=await checkNewsConnection({clientId,clientSecret});
 return Response.json({dart:Boolean((env as any).DART_API_KEY||process.env.DART_API_KEY),krxConfigured:Boolean((env as any).KRX_API_KEY||process.env.KRX_API_KEY),newsConfigured:Boolean(clientId&&clientSecret),newsHealth,news:newsHealth.status==='available',investorConfigured:Boolean(((env as any).KIS_APP_KEY||process.env.KIS_APP_KEY)&&((env as any).KIS_APP_SECRET||process.env.KIS_APP_SECRET)),prices:false,intraday:false,execution:'cloud'},{headers:{'Cache-Control':'no-store'}});
}
