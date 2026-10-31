import {loadNews} from './news-search.mjs';
// Probe independently of DART. Cache auth checks to avoid a request on every render.
export function createNewsHealthChecker({clock=Date.now}={}){
 let cached=null,pending=null;
 return async function({clientId,clientSecret,fetcher=fetch}={}){
  if(!clientId||!clientSecret)return {status:'not_connected',checkedAt:null};
  const identity=clientId+'\0'+clientSecret;
  if(cached?.identity===identity&&cached.expires>clock())return cached.result;
  if(pending?.identity===identity)return pending.promise;
  const promise=(async()=>{const now=new Date(clock());const news=await loadNews({query:'삼성전자',clientId,clientSecret,fetcher,now,signal:AbortSignal.timeout(8000)});const result={status:news.status,checkedAt:now.toISOString(),sampleCount:news.items.length};cached={identity,result,expires:clock()+(news.status==='available'?300000:30000)};return result;})();
  pending={identity,promise};try{return await promise;}finally{if(pending?.promise===promise)pending=null;}
 };
}
export const checkNewsConnection=createNewsHealthChecker();
