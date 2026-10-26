const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&#39;',"'");
const safeURL=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:null}catch{return null}};
export async function loadNews({query,clientId,clientSecret,signal,fetcher=fetch,now=new Date()}) {
  if(!clientId||!clientSecret||!query)return {status:'not_connected',items:[],message:'NAVER API HUB 뉴스 검색의 Client ID·Client Secret이 필요합니다.'};
  try{
    const url=new URL('https://naverapihub.apigw.ntruss.com/search/v1/news');
    url.search=new URLSearchParams({query,display:'20',sort:'date',format:'json'}).toString();
    const response=await fetcher(url.toString(),{headers:{'X-NCP-APIGW-API-KEY-ID':clientId,'X-NCP-APIGW-API-KEY':clientSecret},signal:signal||AbortSignal.timeout(20000)});
    if(!response.ok)return {status:[401,403].includes(response.status)?'unauthorized':'unavailable',items:[],message:'뉴스 공급원의 권한·이용 한도를 확인해 주세요.'};
    const data=await response.json();if(!Array.isArray(data.items))throw Error();
    const seen=new Set(), cutoff=now.getTime()-30*86400000;
    const items=data.items.filter(item=>Number.isFinite(Date.parse(item.pubDate))).map(item=>({title:clean(item.title),snippet:clean(item.description),url:safeURL(item.originallink)||safeURL(item.link),publishedAt:new Date(item.pubDate).toISOString(),collectedAt:now.toISOString()})).filter(item=>{
      const date=Date.parse(item.publishedAt);if(!item.url||date>now.getTime()||date<cutoff||seen.has(item.url))return false;seen.add(item.url);return true;
    });
    return {status:'available',items,source:'NAVER API HUB 뉴스 검색',fullText:false,message:'제목·검색 요약 패시지입니다. 기사 본문 전체를 수집하지 않습니다.'};
  }catch{return {status:'unavailable',items:[],message:'뉴스 조회에 실패했습니다. 다른 자료의 분석은 유지합니다.'};}
}
