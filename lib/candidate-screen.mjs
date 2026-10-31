import {priceEvidence} from './price-evidence.mjs';
import {flowEvidence} from './investor-flow.mjs';
import {fetchKrxDay} from './krx-market.mjs';
export function scenarioFor(series,financials,horizon){
 const evidence=priceEvidence(series);if(!evidence)return null;
 return {version:'observations-v1',status:'withheld',horizon:horizon==='long'?'12개월':'5거래일',basePrice:evidence.rows.at(-1).close,asOf:evidence.rows.at(-1).date,returns:null,paths:{},evidence,method:'실제 비수정 종가·고가·저가·거래량으로 관측 구간을 요약합니다. 미래 가격은 생성하지 않습니다.',limitations:'현재 최대 5거래일만 수집합니다. 장기 수정주가·기업행동·시장 및 업종 비교·과거 시점 검증이 없어 예상 수익률과 상승 확률을 산출하지 않습니다.'};
}
export function rankCandidates(items){
 const valid=items.filter(x=>x.series.length>=3&&x.quote.turnover>0&&!x.risk);
 const shortScore=x=>{const a=x.series[0].close,z=x.quote.close,vol=x.series.slice(0,-1).reduce((s,r)=>s+r.volume,0)/(x.series.length-1);return (z/a-1)*100+Math.min(3,x.quote.volume/Math.max(1,vol))*2;};
 const longScore=x=>Math.min(100,x.financials?.revenue?.growth||0)+Math.min(100,x.financials?.operating?.growth||0)+(x.financials?.cash?.value>0?10:0);
 const shortChecked=valid.some(x=>flowEvidence(x.flow,'short').checked),longChecked=valid.some(x=>flowEvidence(x.flow,'long').checked);
 const short=valid.filter(x=>!shortChecked||flowEvidence(x.flow,'short').qualified).filter(x=>x.quote.close>x.series[0].close).sort((a,b)=>shortScore(b)+flowEvidence(b.flow,'short').score-shortScore(a)-flowEvidence(a.flow,'short').score).slice(0,4);
 const used=new Set(short.map(x=>x.quote.stockCode));
 const long=valid.filter(x=>!longChecked||flowEvidence(x.flow,'long').qualified).filter(x=>!used.has(x.quote.stockCode)&&x.financials?.revenue?.growth>0&&x.financials?.operating?.growth>0&&x.financials?.operating?.value>0).sort((a,b)=>longScore(b)+flowEvidence(b.flow,'long').score-longScore(a)-flowEvidence(a.flow,'long').score).slice(0,4);
 const pack=(x,h)=>({stockCode:x.quote.stockCode,name:x.quote.name,market:x.quote.market,close:x.quote.close,asOf:x.quote.date,turnover:x.quote.turnover,scenario:scenarioFor(x.series,x.financials,h),reasons:h==='short'?[`최근 ${x.series.length}개 종가 상승 흐름`,`거래대금 ${Math.round(x.quote.turnover/1e8).toLocaleString()}억원 · 유동성 상위군`]:[`매출 전년 동기 +${x.financials.revenue.growth.toFixed(1)}%`,`영업이익 전년 동기 +${x.financials.operating.growth.toFixed(1)}% · ${x.financials.period.label}`],flow:x.flow,flowEvidence:flowEvidence(x.flow,h),financials:x.financials,series:x.series});
 return {short:short.map(x=>pack(x,'short')),long:long.map(x=>pack(x,'long')),flowCoverage:{short:{checked:valid.filter(x=>flowEvidence(x.flow,'short').checked).length,total:valid.length,mode:shortChecked?'flow_screened':'preliminary'},long:{checked:valid.filter(x=>flowEvidence(x.flow,'long').checked).length,total:valid.length,mode:longChecked?'flow_screened':'preliminary'}}};
}
export async function screenMarket({key,now,signal,onProgress,disclosures,financialFor,flowFor,fetcher=fetch}){
 if(!key)return {status:'unavailable',short:[],long:[],message:'KRX 연결이 필요합니다.'};
 const d=new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)+'T00:00:00Z'),days=[];
 for(let i=0;i<14&&days.length<5;i++){d.setUTCDate(d.getUTCDate()-1);if([0,6].includes(d.getUTCDay()))continue;const date=d.toISOString().slice(0,10).replaceAll('-','');const rows=[];for(const market of ['KOSPI','KOSDAQ'])rows.push(...await fetchKrxDay({key,market,date,signal,fetcher}));if(rows.length)days.push(rows);}
 const latest=days[0]||[];
 const pool=latest.filter(x=>/^\d{6}$/.test(x.stockCode)&&x.close>0&&x.turnover>=1e10&&!/스팩|리츠|우선주|[0-9]우|우B$|우$/.test(x.name)).sort((a,b)=>b.turnover-a.turnover).slice(0,24);
 const items=[];
 for(const quote of pool){if(signal?.aborted)throw Error('cancelled');onProgress({stage:'coverage',message:`후보 ${items.length+1}/${pool.length} · ${quote.name} 실적·위험 공시 확인`});const series=days.map(rows=>rows.find(r=>r.stockCode===quote.stockCode)).filter(Boolean).reverse();let financials;try{financials=await financialFor(quote.stockCode)}catch{financials={status:'unavailable'}};const flow=flowFor?await flowFor({stockCode:quote.stockCode,asOf:quote.date,series,signal}):{status:'not_connected'};items.push({quote,series,financials,flow,risk:disclosures.some(e=>e.stockCode===quote.stockCode&&/유상증자|전환사채|영업정지|소송/.test(e.title))});}
 const ranked=rankCandidates(items);
 return {status:'available',...ranked,asOf:latest[0]?.date,universe:latest.length,reviewed:pool.length,message:'코스피·코스닥 일별 자료 → 거래대금 100억원 이상 상위 24개 → 단타 추세·거래량 / 장기 실적 성장 순. 두 목록은 중복 제외. 조건 충족 종목이 부족하면 빈자리를 유지합니다.',methodVersion:'screen-v2-flow',limitations:'최근 5개 비수정 종가와 최근 정기보고서 기준입니다. 뉴스는 상세 진입 시 수집하며 현재 순위에는 반영하지 않습니다. 수급 연결 시 5일·20일 외인·기관 누적 순매수 양수 및 동반 순매수 40% 이상을 통과해야 합니다. 수급 확인 자료가 전혀 없으면 기존 기준의 예비 후보로 표시합니다. 전 종목 심층 분석·백테스트는 미완료입니다.'};
}
