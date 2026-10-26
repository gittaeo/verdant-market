// Official KRX daily trading API. Credentials stay in the server request header.
export class KrxError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const paths = { KOSPI:'stk_bydd_trd', KOSDAQ:'ksq_bydd_trd' };
const number = value => value == null || String(value).trim() === '' || String(value).trim() === '-' ? null : (Number.isFinite(Number(String(value).replaceAll(',',''))) ? Number(String(value).replaceAll(',','')) : null);
export function normalizeKrx(row) {
  return { date:row.BAS_DD, stockCode:row.ISU_CD, name:row.ISU_NM, market:row.MKT_NM,
    close:number(row.TDD_CLSPRC), change:number(row.CMPPREVDD_PRC), changePercent:number(row.FLUC_RT),
    open:number(row.TDD_OPNPRC), high:number(row.TDD_HGPRC), low:number(row.TDD_LWPRC),
    volume:number(row.ACC_TRDVOL), turnover:number(row.ACC_TRDVAL), marketCap:number(row.MKTCAP) };
}
export async function fetchKrxDay({key, market='KOSPI', date, fetcher=fetch, signal}) {
  if (!key) throw new KrxError('not_configured','KRX 서버 인증키가 설정되지 않았습니다.');
  if (!paths[market] || !/^\d{8}$/.test(date)) throw new KrxError('validation','KRX 조회 시장과 기준일을 확인해 주세요.');
  let response;
  try { response = await fetcher(`https://data-dbg.krx.co.kr/svc/apis/sto/${paths[market]}?basDd=${date}`, {headers:{AUTH_KEY:key},signal:signal || AbortSignal.timeout(20000)}); }
  catch { throw new KrxError('network','KRX 서버에 연결하지 못했습니다.'); }
  if ([401,403].includes(response.status)) throw new KrxError('unauthorized','KRX가 사용을 허용하지 않았습니다(401/403). 인증키와 해당 데이터 API의 이용 승인을 확인해 주세요.');
  if (response.status===429) throw new KrxError('rate_limit','KRX 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.');
  if (!response.ok) throw new KrxError('upstream','KRX 서버가 정상 응답하지 않았습니다.');
  let payload;try{payload=await response.json()}catch{throw new KrxError('format','KRX 응답 형식을 확인할 수 없습니다.');}
  if (['401','403'].includes(String(payload.respCode))) throw new KrxError('unauthorized','KRX API별 이용 승인과 인증키를 확인해 주세요.');
  if (!Array.isArray(payload.OutBlock_1)) throw new KrxError('format','KRX 일별매매정보 목록을 확인할 수 없습니다.');
  return payload.OutBlock_1.map(normalizeKrx);
}
export async function loadKrxPriceContext({key, stockCode, now=new Date(), signal, fetcher=fetch}) {
  if (!key) return {status:'not_connected',message:'KRX 인증키 미설정',series:[]};
  const koreanDate = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const date = new Date(koreanDate+'T00:00:00Z');
  const series=[];let market=null;
  try {
    // Begin at the previous calendar day: daily closes are not real-time prices.
    for(let attempt=0;attempt<14 && series.length<5;attempt++) {
      date.setUTCDate(date.getUTCDate()-1);
      if([0,6].includes(date.getUTCDay()))continue;
      const day=date.toISOString().slice(0,10).replaceAll('-','');
      for (const candidateMarket of market ? [market] : ['KOSPI','KOSDAQ']) {
        const rows=await fetchKrxDay({key,market:candidateMarket,date:day,signal,fetcher});
        const row=rows.find(r=>r.stockCode===stockCode);
        if(row && row.close!==null){market=candidateMarket;series.push(row);break;}
      }
    }
    series.sort((a,b)=>a.date.localeCompare(b.date));
    return {status:series.length?'available':'empty',series,latest:series.at(-1)||null,
      source:'KRX 일별매매정보',priceType:'unadjusted_daily_close',intraday:false,
      message:series.length?'최근 최대 5거래일의 비수정 종가입니다. 실시간 현재가가 아닙니다.':'최근 조회 범위에 해당 종목 자료가 없습니다.'};
  } catch(error) {
    if(signal?.aborted) throw new KrxError('cancelled','KRX 조회를 취소했습니다.');
    return {status:series.length?'partial':(error.code||'error'),series:series.sort((a,b)=>a.date.localeCompare(b.date)),latest:series.sort((a,b)=>a.date.localeCompare(b.date)).at(-1)||null,
      intraday:false,message:error instanceof KrxError?error.message:'KRX 데이터를 확인하지 못했습니다.'};
  }
}
