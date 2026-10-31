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
 const period=key==='short'?'단기 관찰':'장기 실적 관찰';
 return `<section class="strategy-panel" data-strategy="${key}"><div class="selection-heading"><h2>${key==='short'?'단타 후보':'장기 후보'}</h2><span class="strategy-period">${period} / ${items.length}개</span></div><div class="candidate-grid">${Array.from({length:4},(_,index)=>{const c=items[index];if(!c)return `<div class="candidate-card candidate-empty"><h3>추가 후보를 기다리고 있습니다</h3><p>조건을 충족하는 기업이 있을 때만 표시합니다.</p></div>`;const s=c.scenario;return `<button class="candidate-card" data-candidate="${esc(c.stockCode)}" data-horizon="${key}" aria-label="${esc(c.name)} ${key==='short'?'단타':'장기'} 상세 분석"><span class="candidate-rank">${index+1}</span><div class="candidate-identity"><h3>${esc(c.name)}</h3><small>${esc(c.market)} / ${esc(c.stockCode)}<br>종가 ${deskMoney(c.close)}원</small></div><div class="candidate-return"><span>예상 수익성</span><strong>산출 보류</strong><small>예측 검증 전</small></div><div class="candidate-context"><p>${c.reasons.map(esc).join('<br>')}</p>${deskSpark(c.series,c.name)}</div><div class="candidate-open"><span>상세 분석 보기</span>${deskArrow}</div><small class="candidate-footnote">실제 가격·위험을 상세 화면에서 확인</small></button>`;}).join('')}</div></section>`;
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
scenarioChart=function(s,series=[]){return renderPriceEvidence(series);};
$('#heroTitle').innerHTML='투자할 기업을,<br>깊이 읽어보세요.';
$('.hero-copy>p').innerHTML='단타와 장기, 서로 다른 기준으로 찾은 투자 후보.<br>선정 이유와 가격 위험을 비교하고 기업의 속사정까지 읽어보세요.';
const art=document.createElement('div');art.className='hero-art-frame';art.innerHTML='<div class="liquid-fallback" aria-hidden="true">V</div>';$('.hero').append(art);
$('.workspace-label').textContent='나의 리서치';$('.nav-sub').textContent='리서치 도구';$('.profile strong').textContent='나의 리서치';$('.profile small').textContent='국내 주식';$('.top-date').textContent=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'short'}).format(new Date());
$('.side-note p').innerHTML='가격만 보기 전에,<br>기업의 이유를 읽으세요.';
const toolsBar=document.createElement('div');toolsBar.className='desk-tools';toolsBar.innerHTML='<div class="desk-source-list"><span><strong>DART</strong>공시와 재무</span><span><strong>KRX</strong>종가와 거래량</span><span><strong>NAVER</strong>뉴스의 맥락</span></div><form class="desk-search"><label class="sr-only" for="deskCompanyQuery">기업명 또는 종목코드</label><input id="deskCompanyQuery" placeholder="기업명 또는 종목코드" maxlength="80" required><button type="submit">기업 분석</button></form>';
$('.live-banner').after(toolsBar);toolsBar.querySelector('form').onsubmit=event=>{event.preventDefault();const query=$('#deskCompanyQuery').value.trim();if(query){selectedHorizon='short';startActualResearch(query,30);}};
// Label data readiness in plain language; provider errors still use the existing flow.
const deskSources=actions.sources;actions.sources=()=>deskSources();
renderSelection(null);
