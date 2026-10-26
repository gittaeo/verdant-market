// KIS official inquire-investor, KRX venue (J). Read-only market data.
const base='https://openapi.koreainvestment.com:9443';
const tokenCache=new Map();
const numeric=v=>v==null||String(v).trim()===''||String(v).trim()==='-'?null:Number.isFinite(Number(String(v).replaceAll(',','')))?Number(String(v).replaceAll(',','')):null;
export function normalizeInvestorRows(rows,asOf){
 const map=new Map();
 for(const row of rows){const date=String(row.stck_bsop_date||'');if(!/^\d{8}$/.test(date)||date>asOf||map.has(date))continue;const foreign=numeric(row.frgn_ntby_qty),institution=numeric(row.orgn_ntby_qty);map.set(date,{date,foreign,institution});}
 return [...map.values()].sort((a,b)=>b.date.localeCompare(a.date));
}
export function summarizeInvestorFlow(rows,{asOf,series=[]}={}){
 const sorted=[...rows].filter(r=>r.date<=asOf).sort((a,b)=>b.date.localeCompare(a.date));
 const latestDates=series.slice(-5).map(r=>r.date);
 const streak=key=>{let n=0;for(const r of sorted){if(r[key]>0)n++;else break;}return n;};
 const window=n=>{const slice=sorted.slice(0,n);const complete=slice.length===n&&sorted[0]?.date===asOf&&slice.every(r=>Number.isFinite(r.foreign)&&Number.isFinite(r.institution))&&latestDates.every(d=>slice.some(r=>r.date===d));if(!complete)return {status:'insufficient',observations:slice.length,required:n};
 const foreign=slice.reduce((a,r)=>a+r.foreign,0),institution=slice.reduce((a,r)=>a+r.institution,0),bothDays=slice.filter(r=>r.foreign>0&&r.institution>0).length;
 const volumes=slice.map(r=>series.find(p=>p.date===r.date)?.volume);const denominator=volumes.every(v=>Number.isFinite(v)&&v>0)?volumes.reduce((a,b)=>a+b,0):null;
 return {status:'available',observations:n,foreign,institution,bothDays,intensity:denominator?(foreign+institution)/denominator*100:null,foreignPositiveDays:slice.filter(r=>r.foreign>0).length,institutionPositiveDays:slice.filter(r=>r.institution>0).length,qualified:foreign>0&&institution>0&&bothDays>=Math.ceil(n*.4)};};
 return {status:sorted[0]?.date===asOf?'available':sorted.length?'stale':'empty',asOf:sorted[0]?.date||null,foreignStreak:streak('foreign'),institutionStreak:streak('institution'),short:window(5),long:window(20),unit:'shares',source:'한국투자증권 · KRX시장 투자자 일별 순매수',rows:sorted,limitations:'순매수 수량 기준입니다. 당일·장중 잠정치는 제외하고 KRX 종가 기준일에 맞췄습니다. 60일 추이·기관 세부 주체·장중 수급은 미평가입니다.'};
}
export function createInvestorClient({appKey,appSecret,fetcher=fetch,now=()=>Date.now()}={}){
 let failed=null;
 async function token(signal){
 const cached=tokenCache.get(appKey);if(cached&&cached.expires>now()+60000)return cached.value;
 const response=await fetcher(base+'/oauth2/tokenP',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({grant_type:'client_credentials',appkey:appKey,appsecret:appSecret}),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('authentication');const data=await response.json();if(!data.access_token)throw Error('authentication');tokenCache.set(appKey,{value:data.access_token,expires:now()+Math.min(Number(data.expires_in)||3600,86400)*1000});return data.access_token;
 }
 return async({stockCode,asOf,series,signal})=>{
 if(!appKey||!appSecret)return {status:'not_connected',message:'수급 미확인 · 한국투자증권 Open API 앱키 연결 필요'};
 if(failed)return {status:failed,message:'수급 공급원 인증·한도 확인 필요'};
 try{if(!/^\d{6}$/.test(stockCode)||!/^\d{8}$/.test(asOf))throw Error('validation');const access=await token(signal);
 const url=new URL(base+'/uapi/domestic-stock/v1/quotations/inquire-investor');url.search=new URLSearchParams({FID_COND_MRKT_DIV_CODE:'J',FID_INPUT_ISCD:stockCode}).toString();
 const response=await fetcher(url,{headers:{authorization:'Bearer '+access,appkey:appKey,appsecret:appSecret,tr_id:'FHKST01010900',custtype:'P'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)});
 if(!response.ok){failed=[401,403].includes(response.status)?'unauthorized':response.status===429?'rate_limit':null;throw Error('upstream');}
 const data=await response.json();if(data.rt_cd!=='0'||!Array.isArray(data.output))throw Error('format');
 return summarizeInvestorFlow(normalizeInvestorRows(data.output,asOf),{asOf,series});
 }catch(error){if(signal?.aborted)throw Error('cancelled');if(error.message==='authentication')failed='unauthorized';return {status:failed||'unavailable',message:'수급 조회 실패 · 순매수를 0으로 간주하지 않습니다.'};}
 };
}
export function flowEvidence(flow,horizon){
 const w=flow?.[horizon];if(flow?.status!=='available'||w?.status!=='available')return {checked:false,qualified:false,score:0,label:flow?.status==='stale'?'수급 기준일 불일치':'수급 미확인',reasons:[]};
 const fmt=n=>`${n>0?'+':''}${Math.round(n).toLocaleString('ko-KR')}주`;
 const score=Math.min(20,w.bothDays/w.observations*20)+(w.foreign>0?10:-10)+(w.institution>0?10:-10)+Math.max(-10,Math.min(10,w.intensity||0));
 return {checked:true,qualified:w.qualified,score,label:w.qualified?'외인·기관 순매수 확인':'수급 조건 미충족',reasons:[`${w.observations}개 거래일 외국인 ${fmt(w.foreign)} · 기관 ${fmt(w.institution)}`,`동반 순매수 ${w.bothDays}/${w.observations}일 · 연속 외인 ${flow.foreignStreak}일 / 기관 ${flow.institutionStreak}일`,...(w.intensity!=null?[`거래량 대비 합산 순매수 ${w.intensity.toFixed(2)}%`]:[])]};
}
