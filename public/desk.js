'use strict';
// Presentation only. Research, ranking and scenario calculations stay server-side.
const deskArrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';
const deskRefresh='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M19 8a8 8 0 1 0 1 7M19 3v5h-5"/></svg>';
const deskMoney=n=>Number(n).toLocaleString('ko-KR');
function deskSpark(series,name){
 const prices=(series||[]).map(p=>p.close).filter(p=>Number.isFinite(p)&&p>0);if(prices.length<2)return '';
 const low=Math.min(...prices),high=Math.max(...prices),range=high-low;
 return `<svg class="candidate-spark" viewBox="0 0 100 36" role="img" aria-label="${esc(name)}의 실제 최근 ${prices.length}개 종가 흐름"><path d="M0 33H100" stroke="currentColor" stroke-opacity=".2"/><polyline points="${prices.map((p,i)=>`${i*100/(prices.length-1)},${range?30-(p-low)/range*24:18}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
}
candidateGroup=function(key,title,items){
 const period=key==='short'?'5거래일 시나리오':'12개월 시나리오';
 return `<section class="strategy-panel" data-strategy="${key}"><div class="selection-heading"><h2>${key==='short'?'단타 후보':'장기 후보'}</h2><span class="strategy-period">${period} / ${items.length}개</span></div><div class="candidate-grid">${Array.from({length:4},(_,index)=>{const c=items[index];if(!c)return `<div class="candidate-card candidate-empty"><h3>추가 후보를 기다리고 있습니다</h3><p>조건을 충족하는 기업이 있을 때만 표시합니다.</p></div>`;const s=c.scenario;return `<button class="candidate-card" data-candidate="${esc(c.stockCode)}" data-horizon="${key}" aria-label="${esc(c.name)} ${key==='short'?'단타':'장기'} 상세 분석"><span class="candidate-rank">${index+1}</span><div class="candidate-identity"><h3>${esc(c.name)}</h3><small>${esc(c.market)} / ${esc(c.stockCode)}<br>종가 ${deskMoney(c.close)}원</small></div><div class="candidate-return"><span>기준 시나리오</span><strong>${s?fmtReturn(s.returns.base):'보류'}</strong><small>${s?`보수 ${fmtReturn(s.returns.bear)}<br>낙관 ${fmtReturn(s.returns.bull)}`:'비교 자료 부족'}</small></div><div class="candidate-context"><p>${c.reasons.map(esc).join('<br>')}</p>${deskSpark(c.series,c.name)}</div><div class="candidate-open"><span>상세 분석 보기</span>${deskArrow}</div><small class="candidate-footnote">예상 수익성은 검증 전 가정값입니다</small></button>`;}).join('')}</div></section>`;
};
const deskEmptyArt=(long=false)=>long?'<svg viewBox="0 0 112 112" fill="none" aria-hidden="true"><path d="M19 91V50h15v41M48 91V34h15v57M77 91V19h15v72" stroke="currentColor" stroke-width="1.5"/><path d="M13 99h86M27 41l28-16 29-13" stroke="currentColor" stroke-opacity=".4"/></svg>':'<svg viewBox="0 0 112 112" fill="none" aria-hidden="true"><circle cx="56" cy="56" r="40" stroke="currentColor" stroke-opacity=".3"/><path d="M56 16v80M16 56h80M28 74l18-23 16 10 21-28" stroke="currentColor" stroke-width="1.5"/><circle cx="83" cy="33" r="4" fill="currentColor"/></svg>';
const renderSelectionBeforeDesk=renderSelection;
renderSelection=function(selection){
 renderSelectionBeforeDesk(selection);
 const title=selectionBoard.querySelector('.selection-title'),meta=title?.nextElementSibling;
 if(title){const top=document.createElement('div');top.className='desk-board-top';const copy=document.createElement('div');title.before(top);copy.append(title);if(meta)copy.append(meta);top.append(copy);const refresh=document.createElement('button');refresh.className='desk-refresh';refresh.innerHTML=deskRefresh+'<span>다시 리서치</span>';refresh.onclick=()=>startActualResearch('',7);top.append(refresh);}
 if(selection?.status==='available'){
 const columns=document.createElement('div');columns.className='strategy-columns';const groups=[...selectionBoard.querySelectorAll('.strategy-panel')];if(groups.length){groups[0].before(columns);groups.forEach(group=>columns.append(group));}
 }else if(!selection){
 const gaps=selectionBoard.querySelector('.brief-gaps');if(gaps)gaps.outerHTML=`<div class="desk-empty"><article><div><h3>빠른 흐름을 읽는 단타</h3><p>최근 가격과 거래량을 살피고, 단기 관찰에 적합한 기업을 최대 4개 추립니다.</p></div>${deskEmptyArt()}</article><article><div><h3>실적의 방향을 보는 장기</h3><p>매출과 이익의 변화를 비교하고, 오래 지켜볼 기업을 최대 4개 추립니다.</p></div>${deskEmptyArt(true)}</article></div><p class="desk-empty-note">아직 조회 전입니다. 상단의 ‘단타·장기 후보 찾기’를 누르면 실제 자료로 리서치를 시작합니다.</p>`;
 const top=selectionBoard.querySelector('.desk-board-top p');if(top)top.textContent='가격, 실적, 공시를 함께 읽는 두 가지 관점';
 }
};
scenarioChart=function(s){
 if(!s)return '<div class="brief-gaps">예상 경로를 계산할 비교 자료가 충분하지 않습니다.</div>';
 const values=Object.values(s.paths).flat().map(p=>p.price),lo=Math.min(...values)*.97,hi=Math.max(...values)*1.03;
 const x=step=>70+step*86,y=price=>200-(price-lo)/(hi-lo)*160;
 const colors={bear:'#8d433a',base:'#245941',bull:'#295e85'};
 const grid=Array.from({length:4},(_,i)=>{const price=lo+(hi-lo)*i/3;return `<path d="M70 ${y(price)}H586" stroke="#c4cfc2" stroke-width=".7"/><text x="58" y="${y(price)+4}" text-anchor="end" fill="#344c3f" font-size="12">${Math.round(price).toLocaleString()}</text>`;}).join('');
 return `<section class="projection-panel"><h3>가능한 가격의 경로</h3><p>${receiptDate(s.asOf)} 종가 ${deskMoney(s.basePrice)}원에서 시작한 ${esc(s.horizon)} 가정 시나리오</p><div class="scenario-legend"><span><i></i>보수</span><span><i></i>기준</span><span><i></i>낙관</span></div><svg viewBox="0 0 620 244" role="img" aria-label="${esc(s.horizon)} 보수·기준·낙관 가정 경로. 확률 예측이 아닙니다.">${grid}${Object.entries(s.paths).map(([key,points])=>`<polyline points="${points.map(p=>`${x(p.step)},${y(p.price)}`).join(' ')}" fill="none" stroke="${colors[key]}" stroke-width="${key==='base'?2.5:1.5}" stroke-dasharray="${key==='base'?'0':'5 5'}"/><circle cx="${x(6)}" cy="${y(points.at(-1).price)}" r="3" fill="${colors[key]}"/>`).join('')}<text x="70" y="232" fill="#344c3f" font-size="12">기준일</text><text x="586" y="232" text-anchor="end" fill="#344c3f" font-size="12">${esc(s.horizon)} 후</text></svg><div class="scenario-metrics">${Object.entries(s.returns).map(([key,value])=>`<div><small>${{bear:'보수',base:'기준',bull:'낙관'}[key]}</small><strong>${fmtReturn(value)}</strong><span>${deskMoney(Math.round(s.basePrice*(1+value/100)))}원</span></div>`).join('')}</div><details class="brief-raw"><summary>계산 가정과 해석</summary><p>${esc(s.method)}</p><p>${esc(s.limitations)}</p></details></section>`;
};
$('#heroTitle').innerHTML='투자할 기업을,<br>깊이 읽어보세요.';
$('.hero-copy>p').innerHTML='단타와 장기, 서로 다른 기준으로 찾은 투자 후보.<br>선정 이유와 수익 시나리오를 비교하고 기업의 속사정까지 읽어보세요.';
const art=document.createElement('div');art.className='hero-art-frame';art.innerHTML='<div class="liquid-fallback" aria-hidden="true">V</div>';$('.hero').append(art);
$('.workspace-label').textContent='나의 리서치';$('.nav-sub').textContent='리서치 도구';$('.profile strong').textContent='나의 리서치';$('.profile small').textContent='국내 주식';$('.top-date').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'short'}).format(new Date());
$('.side-note p').innerHTML='가격만 보기 전에,<br>기업의 이유를 읽으세요.';
const toolsBar=document.createElement('div');toolsBar.className='desk-tools';toolsBar.innerHTML='<div class="desk-source-list"><span><strong>DART</strong>공시와 재무</span><span><strong>KRX</strong>종가와 거래량</span><span><strong>NAVER</strong>뉴스의 맥락</span></div><form class="desk-search"><label class="sr-only" for="deskCompanyQuery">기업명 또는 종목코드</label><input id="deskCompanyQuery" placeholder="기업명 또는 종목코드" maxlength="80" required><button type="submit">기업 분석</button></form>';
$('.live-banner').after(toolsBar);toolsBar.querySelector('form').onsubmit=event=>{event.preventDefault();const query=$('#deskCompanyQuery').value.trim();if(query){selectedHorizon='short';startActualResearch(query,30);}};
// Label data readiness in plain language; provider errors still use the existing flow.
const deskSources=actions.sources;actions.sources=()=>deskSources();
renderSelection(null);
