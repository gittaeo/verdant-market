// Transparent title/snippet screening; neither full-text analysis nor price attribution.
const positive=[['실적 개선',/흑자\s*전환|사상\s*최대\s*(실적|이익)|영업이익.{0,12}(증가|급증)|실적.{0,8}(상회|호조)/,'일회성 이익인지, 다음 분기에도 이어질지 공시 수치와 비교하세요.'],['수요·사업 확대',/공급\s*계약|수주\s*(확대|성공|확보)|수요\s*(증가|회복)|양산\s*(개시|시작)|가격\s*인상/,'규모·기간·마진과 실제 매출 반영 시점을 확인하세요.'],['주주환원',/자사주\s*(매입|소각)|배당\s*(확대|증가)/,'확정 공시, 실행 일정과 발행주식 대비 규모를 확인하세요.']];
const negative=[['실적·수요 위험',/적자\s*(전환|확대)|영업이익.{0,12}(감소|급감)|실적.{0,8}(하회|부진)|수요\s*(감소|둔화)|흑자\s*전환\s*(실패|불발)/,'실적 발표·가이던스에서 규모와 지속성을 확인하세요.'],['자금·법률 위험',/유상증자|전환사채|소송|제재|영업\s*정지|리콜/,'공시 원문에서 희석 규모·법적 진행 단계·손실 부담을 확인하세요.'],['시장 충격',/폭락|급락|하락|악재/,'이미 발생한 가격 변화의 보도일 수 있습니다. 새로운 정보인지 확인하세요.']];
const normalized=s=>String(s||'').replace(/[^가-힣a-zA-Z0-9]/g,'').toLowerCase();
function similar(a,b){const grams=s=>new Set(Array.from({length:Math.max(0,s.length-2)},(_,i)=>s.slice(i,i+3)));const x=grams(a),y=grams(b);if(!x.size||!y.size)return a===b;let same=0;for(const v of x)if(y.has(v))same++;return same/(x.size+y.size-same)>.65;}
export function selectNewsEvidence({company,news,asOf,now=new Date()}={}){
 const result={partial:Boolean(news?.partial),status:news?.status||'not_connected',support:[],risk:[],watch:[],excluded:0,duplicates:0,reviewed:0,method:'제목·검색 요약의 기업명·사건 표현 규칙 선별. 본문 검증·인과 분석·수익률 계산은 수행하지 않음.'};
 if(!company?.name||news?.status!=='available')return result;
 const name=normalized(company.name),seen=[];
 const candidates=[];
 for(const item of news.items||[]){result.reviewed++;
  const title=normalized(item.title);
  let url;try{url=new URL(item.url);if(!['http:','https:'].includes(url.protocol))throw Error();}catch{result.excluded++;continue;}
  const time=Date.parse(item.publishedAt);if(!Number.isFinite(time)||time>now.getTime()||now.getTime()-time>30*86400000){result.excluded++;continue;}
  if(!title.includes(name)||/연예|김구라|걸그룹|팬들|캠페인\s*모델|성과교류회/.test(item.title)){result.excluded++;continue;}
  if(seen.some(x=>similar(x,title))){result.duplicates++;continue;}seen.push(title);
  // Direction uses title only: a snippet may refer to another company or comparison period.
  const pos=positive.find(([,pattern])=>pattern.test(item.title)),neg=negative.find(([,pattern])=>pattern.test(item.title));
  const uncertain=/전망|예상|기대|가능성|루머|부인|아니다|않|취소|철회|불발|실패|승소|해소|하락\s*멈/.test(item.title);
  const bucket=uncertain?'watch':pos&&!neg?'support':neg&&!pos?'risk':'watch';
  const signal=bucket==='watch'?null:(bucket==='support'?pos:neg);
  const watchContext=/목표주가|바겐세일|저평가|기회/.test(item.title)?['가치평가·의견','가격 매력에 관한 평가·의견 보도입니다. 실현된 수익이나 기업의 확정 실적과 구분합니다.','평가에 사용한 이익 추정치·배수·평가 기간과 반대 의견을 확인하세요.']:/협력|공급|HBM|올트먼|오픈AI/.test(item.title)?['사업·공급 논의','사업·협력 또는 공급 관련 보도입니다. 접촉·논의와 확정 계약은 구분해야 합니다.','확정 계약·공시 여부, 고객·공급량·마진과 매출 반영 시점을 확인하세요.']:null;
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(time)).replaceAll('-','');
  candidates.push({...item,sourceHost:url.hostname,bucket,topic:signal?.[0]||watchContext?.[0]||'방향 판단 보류',reason:bucket==='watch'&&watchContext?watchContext[1]:uncertain?'전망·부인·조건 변경 등의 표현이 있어 실현된 방향 근거로 쓰지 않았습니다.':signal?`제목에서 ‘${signal[0]}’ 관련 표현을 확인했습니다. 기업 영향은 원문·공시 확인이 필요합니다.`:pos&&neg?'긍정·위험 표현이 함께 있어 한 방향의 근거로 쓰지 않았습니다.':'해당 기업이 제목에 등장하지만 방향을 판단할 사건 근거가 부족합니다.',check:signal?.[2]||watchContext?.[2]||'사건 규모·실행 여부와 관련 공시를 확인한 뒤 시나리오 근거로 판단하세요.',timing:asOf&&day>asOf?'기준 종가 이후 기사':asOf&&day===asOf?'기준 종가 당일 · 장 마감 전후 미확인':'기준 종가 이전 기사',_time:time});
 }
 candidates.sort((a,b)=>b._time-a._time);
 for(const item of candidates){const {_time,...safe}=item;if(result[item.bucket].length<3)result[item.bucket].push(safe);}
 result.status='available';return result;
}
