'use strict';
// Actual DART research is isolated from the original, explicitly fictional fixtures.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kstTime = value => new Intl.DateTimeFormat('ko-KR', { timeZone:'Asia/Seoul', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date(value));
const receiptDate = value => /^\d{8}$/.test(value || '') ? `${value.slice(0,4)}.${value.slice(4,6)}.${value.slice(6,8)}` : '일자 확인 필요';
let actualResult = null, researchAbort = null, liveStatus = null;
const originalDemoAnalysis = startAnalysis, originalClose = closeModal, originalCancel = cancelAnalysis;
const demoSteps = steps.map(s => [...s]);
const originalHistory = renderHistory;
let snapshots = readStore('verdant-actual-snapshots-v1', []);
if (!Array.isArray(snapshots)) snapshots = [];
snapshots = snapshots.filter(r => r && r.dataMode === 'actual' && typeof r.id === 'string' && Array.isArray(r.events)).slice(0,5);

function newsLabel(news,configured=false) {
 if(news?.status==='available')return Array.isArray(news.items)?`기사 ${news.items.length}건`:'연결 확인';
 return ({company_required:'기업 선택 후 조회',unauthorized:'인증·한도 확인',unavailable:'조회 실패',not_connected:'키 미설정'})[news?.status]||(configured?'조회 전':'키 미설정');
}

// Preserve the supplied brand, with a clearer primary action and data labels.
$('#heroTitle').innerHTML = '시장의 소음 너머,<br><span>움직임의 이유까지.</span>';
$('.hero-copy p').innerHTML = '새로운 기회를 찾고, 내 종목의 변화를 이해하다.<br>공시부터 차근차근, 확인할 수 있는 근거로.';
$('#analyzeButton span').textContent = '오늘의 리서치 시작';
$('.keyboard-hint').innerHTML = '<kbd>↵</kbd> 공시를 한 번에';
$('.mesh-tag').innerHTML = '<span></span>INTELLIGENCE / V.02';
$('#opportunitiesTitle').innerHTML = '전략의 발견 <span>DEMO · TOP 4</span>';
$('.top-date').textContent = 'RESEARCH WORKSPACE';
$('.profile small').textContent = 'EVIDENCE-LED RESEARCH';
$('#historyView .secondary-intro').innerHTML = '실제 공시 조회와 가상 데모의 기록을 구분해 보관합니다.<br>이 브라우저에 저장된 당시 리포트를 다시 확인하세요.';
$('.footer p').innerHTML = '공시 조회는 실제 DART 자료입니다. 후보 카드·시장 지표는 가상 데모입니다.<br>가격·뉴스 연결 전에는 실제 등락과 변동 원인을 확정하지 않습니다.';
$('.source-foot span').textContent = '소스별 연결 상태를 확인하세요';
$('.source-foot').closest('section').querySelector('.signal-output').innerHTML = '<span></span>근거를 하나의 맥락으로';

const demoButton = document.createElement('button');
demoButton.className = 'text-button'; demoButton.dataset.action = 'demo-analysis';
demoButton.innerHTML = '가상 후보 분석 체험 ↗';
$('#opportunities .section-header').append(demoButton);
actions['demo-analysis'] = () => {
  if (researchAbort) return;
  steps.splice(0, steps.length, ...demoSteps);
  $('#analysisTitle').textContent = '가상 데이터로 분석 흐름을 체험합니다.';
  $('#analysisOverlay .analysis-top small').textContent = 'DEMO SIMULATION';
  $('#analysisOverlay .analysis-modal').classList.remove('actual-job');
  $('#analysisOverlay .analysis-modal > p').textContent = '공시·가격·뉴스를 연결하는 화면 예시입니다. 실제 요청은 없습니다.';
  originalDemoAnalysis();
};
actions.analyze = () => startActualResearch('', 7);
startAnalysis = () => startActualResearch('', 7);

async function refreshConnection() {
  try {
    const response = await fetch('/api/status', { cache:'no-store' });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw Error();
    liveStatus = await response.json();
    $('#connectionLine').textContent = liveStatus.dart ? (liveStatus.execution === 'local' ? `DART${liveStatus.krxConfigured?' · KRX':''} PC 연결 준비 · 종목 버튼으로 실제 조회` : '클라우드 연결 확인 필요 · PC 실행 버전 사용 가능') : 'DART 서버 설정 필요';
    $('#connectionLine').textContent += ` / 뉴스 ${newsLabel(liveStatus.newsHealth,liveStatus.newsConfigured)}`;
    $('#dartLed').classList.toggle('ready', Boolean(liveStatus.dart));
    $('.demo-badge').textContent = liveStatus.dart ? '리서치 준비' : 'DEMO · SETUP REQUIRED';
  } catch {
    $('#connectionLine').textContent = '서버에 연결하지 못했습니다 · 다시 시도해 주세요';
    $('.demo-badge').textContent = 'CONNECTION CHECK';
  }
}


function updateCompany(name, code = '') {
  $('#movementCompany').textContent = name;
  $('#movementCode').textContent = code ? `${code} · 기업 리서치` : '기업 리서치';
  $('#movementMark').textContent = name === 'SK하이닉스' ? 'SK' : name.slice(0,1);
  $('#movementMode').textContent = 'ACTUAL SOURCES';
  $('#movementMetric').textContent = '가격 자료 연결 전';
  $('#movementAsOf').textContent = '조회 전';
  $('#movementChart').innerHTML = '<svg viewBox="0 0 500 170" aria-hidden="true"><path d="M0 35H500M0 85H500M0 135H500M80 0V170M180 0V170M280 0V170M380 0V170M480 0V170" stroke="#415136" stroke-width=".5" stroke-dasharray="3 5" fill="none"/></svg><div class="chart-empty">실제 가격으로 확인할 준비 중<span>DAILY PRICE · NOT CONNECTED</span></div>';
  $('#movementConclusion').textContent = '공시를 조회하면 확인된 자료부터 정리해 드립니다.';
  $('#conclusionBadge').textContent = '자료 확인 전';
  $('#chartContext').textContent = '가격·업종 비교 연결 예정';
  $('#movementNote').textContent = '실제 주가의 상승·하락은 가격 자료 연결 후 확인합니다. 공시에서 기업의 변화를 먼저 살펴보세요.';
  $('#movementCoverage').innerHTML = `<span class="coverage-pill">DART <b>조회 전</b></span><span class="coverage-pill">KRX <b>${liveStatus?.krxConfigured?'조회 전':'키 미설정'}</b></span><span class="coverage-pill">NEWS <b>${newsLabel(null,liveStatus?.newsConfigured)}</b></span>`;
}

$$('[data-stock]').forEach(button => button.addEventListener('click', () => {
  const isSamsung = button.dataset.stock === '005930';
  const name = isSamsung ? '삼성전자' : 'SK하이닉스';
  $('#companyQuery').value = name;
  $$('[data-stock]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  updateCompany(name, button.dataset.stock);
  startActualResearch(button.dataset.stock, Number($('#lookupDays').value));
}));
$('#lookupForm').addEventListener('submit', event => {
  event.preventDefault();
  const query = $('#companyQuery').value.trim();
  if (!query) { $('#companyQuery').focus(); showToast('기업명 또는 6자리 종목코드를 입력해 주세요.'); return; }
  updateCompany(query);
  startActualResearch(query, Number($('#lookupDays').value));
});

function stopActualResearch() {
  if (researchAbort) { researchAbort.abort(); researchAbort = null; state.analysis = false; originalClose(); showToast('조회를 취소했습니다. 이전 결과는 유지됩니다.'); }
}
closeModal = function() { if (researchAbort) stopActualResearch(); else originalClose(); };
cancelAnalysis = function() { if (researchAbort) stopActualResearch(); else originalCancel(); };
actions.close = closeModal; actions['cancel-analysis'] = cancelAnalysis;

async function startActualResearch(query, days) {
  if (researchAbort || state.analysis) return;
  originalClose();
  const abort = new AbortController(); researchAbort = abort; state.analysis = true;
  const timeout = setTimeout(() => abort.abort('timeout'), 480000);
  steps.splice(0, steps.length, ['종목과 조회 범위 확인','DART · 공식 기업 목록'], ['공시 목록 수집','DART · 페이지별 실제 조회'], ['근거 자료 정리','접수번호 · 원문 · 제목 유형'], ['후보 선정·관측 위험 계산','KRX 유동성 · DART 실적 비교']);
  $('#analysisTitle').textContent = query ? '기업의 변화를 읽고 있습니다.' : '단타 4개 · 장기 4개 후보를 추립니다.';
  $('#analysisOverlay .analysis-modal').classList.add('actual-job');
  $('#analysisOverlay .analysis-top small').textContent = 'ACTUAL DART REQUEST';
  $('#analysisOverlay .analysis-modal > p').textContent = '실제 서버의 조회 단계입니다. 확인한 자료만 결과에 담습니다.';
  $('#analysisOverlay [data-action="cancel-analysis"]').setAttribute('aria-label','실제 공시 조회 취소');
  $('#analysisProgress').setAttribute('aria-label','실제 조회 진행 단계');
  $('#analysisPercent').textContent = '01 / 04';
  $('#analysisProgress i').style.width = '5%';
  $('#analysisLog').textContent = 'DART 서버에 요청을 전달하고 있습니다.';
  renderSteps(0); beginModal($('#analysisOverlay')); ensureAnimation();
  let receivedResult = false;
  try {
    const response = await fetch('/api/research', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ query, days }), signal:abort.signal });
    if (!response.ok) {
      if (response.status === 401) throw Error('로그인이 필요합니다. 사이트에 로그인한 뒤 다시 시도해 주세요.');
      throw Error('서버가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
    if (!response.headers.get('content-type')?.includes('application/x-ndjson') || !response.body) throw Error('서버 응답을 확인할 수 없습니다. 페이지를 새로 열고 다시 시도해 주세요.');
    const reader = response.body.getReader(), decoder = new TextDecoder(); let buffer = '';
    const consume = line => {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      if (event.type === 'error') throw Object.assign(Error(event.data.message), { code:event.data.code });
      if (event.type === 'progress') {
        const stage = ['company','disclosures','evidence','coverage'].indexOf(event.data.stage);
        renderSteps(Math.max(0,stage));
        $('#analysisPercent').textContent = `0${stage + 1} / 04`;
        $('#analysisProgress i').style.width = `${Math.max(5, stage * 25)}%`;
        $('#analysisProgress').setAttribute('aria-valuenow', String(Math.max(5,stage * 25)));
        $('#analysisLog').textContent = event.data.message;
      }
      if (event.type === 'result') { actualResult = event.data; receivedResult = true; }
    };
    while (true) {
      const {value,done} = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), {stream:!done});
      const lines = buffer.split('\n'); buffer = lines.pop() || '';
      for (const line of lines) consume(line);
      if (done) { if (buffer.trim()) consume(buffer); break; }
    }
    if (!receivedResult) throw Error('조회가 완료되기 전에 연결이 종료됐습니다. 다시 시도해 주세요.');
    if (researchAbort !== abort) return;
    renderSteps(4);
    const snapshot = { ...actualResult, disclosures:undefined, snapshotScope:'displayed_report' };
    snapshots = [snapshot,...snapshots].slice(0,5); writeStore('verdant-actual-snapshots-v1',snapshots);
    researchAbort = null; state.analysis = false; originalClose();
    showView('explore'); renderResearch(actualResult);
    $('#connectionLine').textContent = `DART 조회 확인 · ${kstTime(actualResult.createdAt)} KST · ${actualResult.count.toLocaleString()}건`;
    $('#dartLed').classList.add('ready');
    (actualResult.company?$('#researchResult'):$('#selectionBoard')).scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'start'});
    showToast(actualResult.partial ? '부분 수집 결과입니다. 누락 범위를 함께 확인하세요.' : 'DART 조회 완료 · 실제 공시와 원문을 확인하세요.');
  } catch (error) {
    if (researchAbort !== abort) return;
    researchAbort = null; state.analysis = false; originalClose();
    if (abort.signal.aborted && abort.signal.reason !== 'timeout') { showToast('조회를 취소했습니다.'); return; }
    const message = abort.signal.reason === 'timeout' ? '조회 시간이 길어져 중단했습니다. 잠시 후 다시 시도해 주세요.' : error.message;
    const localAlternative = error.code === 'network' && liveStatus?.execution !== 'local' ? '<p class="data-note">현재 클라우드 환경에서 DART 연결이 실패합니다. 이 PC에서는 프로젝트 폴더의 <strong>VERDANT 실행.cmd</strong>를 더블클릭하면 같은 화면에서 실제 공시를 조회할 수 있습니다.</p><a class="modal-link" href="http://127.0.0.1:5177/" target="_blank" rel="noopener noreferrer"><div>PC 실행 화면 열기<small>실행 파일을 먼저 연 뒤 이용하세요.</small></div><span>↗</span></a>' : '';
    modal(`<h2 id="modalTitle">연결을 다시 확인해 주세요.</h2><div class="error-box">${esc(message)}</div>${localAlternative}<p class="data-note">실패한 요청을 완료된 분석이나 후보 추천으로 기록하지 않았습니다.</p><button class="lookup-button" id="retryResearch">다시 조회하기 ↗</button>`);
    $('#retryResearch').addEventListener('click', () => startActualResearch(query,days));
  } finally { clearTimeout(timeout); }
}

function renderPriceContext(result) {
  const context=result.priceContext, quote=context?.latest;
  const labels={unauthorized:'이용 권한 확인',network:'연결 실패',empty:'조회 자료 없음',not_connected:'미연결',partial:'부분 수집'};
  $('#movementCoverage').innerHTML=`<span class="coverage-pill available">DART <b>${result.count}건</b></span><span class="coverage-pill ${quote?'available':''}">KRX <b>${quote?receiptDate(quote.date):esc(labels[context?.status]||'미연결')}</b></span><span class="coverage-pill ${result.news?.status==='available'?'available':''}">NEWS <b>${newsLabel(result.news,liveStatus?.newsConfigured)}</b></span>`;
  if(!quote){$('#movementNote').textContent=context?.message||'가격 자료가 연결되지 않았습니다.';return;}
  const format=value=>value==null?'자료 없음':Number(value).toLocaleString('ko-KR');
  const percent=quote.changePercent==null?'등락률 자료 없음':`${quote.changePercent>0?'+':''}${quote.changePercent.toFixed(2)}%`;
  $('#movementMetric').innerHTML=`${format(quote.close)}<span style="font-size:13px;color:var(--muted)"> 원</span><span style="display:block;font-size:12px;margin-top:8px;color:${quote.changePercent<0?'var(--red)':'var(--lime)'}">전일 대비 ${esc(percent)}</span>`;
  $('#movementAsOf').textContent=`${receiptDate(quote.date)} · 일별 종가`;
  const series=context.series.filter(row=>Number.isFinite(row.close)),min=Math.min(...series.map(r=>r.close)),max=Math.max(...series.map(r=>r.close));
  const points=series.map((row,i)=>`${(12+i*476/Math.max(1,series.length-1)).toFixed(1)},${(max===min?85:145-(row.close-min)/(max-min)*120).toFixed(1)}`);
  const color=quote.changePercent<0?'#f0a69b':'#c9f58c';
  $('#movementChart').innerHTML=`<svg viewBox="0 0 500 170" role="img" aria-label="${esc(result.company.name)} 실제 일별 종가 ${series.length}개"><path d="M0 25H500M0 85H500M0 145H500" stroke="#415136" stroke-width=".5" stroke-dasharray="3 5"/><text x="8" y="12" fill="#99a79a" font-size="9">${format(max)}원</text><text x="8" y="164" fill="#99a79a" font-size="9">${format(min)}원</text><polyline class="chart-path" points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2"/>${points.map(p=>`<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="3" fill="${color}"/>`).join('')}</svg>`;
  $('#chartContext').textContent=`${receiptDate(series[0].date)} – ${receiptDate(quote.date)} · ${series.length}개 종가`;
  $('#movementNote').textContent=`거래량 ${format(quote.volume)}주 · 거래대금 ${format(quote.turnover)}원. ${context.message} 기업행동을 조정한 수익률 차트가 아닙니다.`;
  $('#movementConclusion').textContent=`${receiptDate(quote.date)} 종가의 전일 대비 등락률은 ${percent}입니다. 변동 원인은 추가 자료가 필요합니다.`;
  $('#conclusionBadge').textContent= context.status==='partial'?'KRX 부분 수집':'공시·종가 확인';
  $('#causeRows').innerHTML=`<div class="cause-row"><span class="cause-number">01</span><div><h4>가격·거래량 · 확인된 사실</h4><p>KRX 기준 종가 ${format(quote.close)}원, 전일 대비 ${esc(percent)}, 거래량 ${format(quote.volume)}주입니다.</p></div><span class="cause-state">KRX</span></div><div class="cause-row"><span class="cause-number">02</span><div><h4>기업 공시 · 별도 확인</h4><p>${result.count?esc(result.events[0]?.title):'선택한 기간에 접수된 공시가 없습니다.'}</p></div><span class="cause-state">DART</span></div><div class="cause-row"><span class="cause-number">03</span><div><h4>관련 뉴스 · ${newsLabel(result.news,liveStatus?.newsConfigured)}</h4><p>${result.news?.status==='available'?'관련 기사와 검색 요약을 아래에서 확인할 수 있습니다. 기사와 가격의 동시 발생만으로 원인을 확정하지 않습니다.':'뉴스의 연결·조회 상태를 확인해 주세요. 업종 비교 자료는 별도로 필요합니다.'}</p></div><span class="cause-state">NEWS</span></div>`;
}
var renderResearch;

renderHistory = function() {
  originalHistory();
  const emptyDemo = $('#historyContent .empty-history');
  if (emptyDemo) emptyDemo.innerHTML = '가상 후보 분석 기록은 아직 없습니다.';
  const section = document.createElement('section');
  section.innerHTML = `<div class="research-header"><div><h3>실제 공시 조회 기록</h3><p>이 브라우저에 최근 5개의 표시 리포트를 저장합니다.<br>다시 조회하지 않고 당시 공시·기준 시각을 엽니다.</p></div></div>${snapshots.length ? snapshots.map((r,i)=>`<div class="actual-history-row"><div><strong>${esc(r.company?.name || '코스피 · 코스닥')} · ${r.count}건${r.partial?' · 부분 수집':''}</strong><small>${kstTime(r.createdAt)} KST · ${receiptDate(r.range.start)} – ${receiptDate(r.range.end)}</small></div><button data-actual-history="${i}">리포트 열기 ↗</button></div>`).join('') : '<p class="data-note">실제 조회 기록이 아직 없습니다. 오늘의 리서치를 시작해 보세요.</p>'}`;
  $('#historyContent').prepend(section);
  $$('[data-actual-history]').forEach(button=>button.addEventListener('click',()=>{
    const result = snapshots[Number(button.dataset.actualHistory)]; if (!result) return;
    showView('explore'); renderResearch(result); $('#researchResult').scrollIntoView({behavior:reduceMotion?'instant':'smooth'});
    showToast('저장된 시점의 리포트를 열었습니다. 최신 조회 결과가 아닙니다.');
  }));
};

$('#exampleMove').addEventListener('click', () => {
  modal(`<h2 id="modalTitle">하락을 이해하는,<br>세 가지 관점.</h2><p>가상기업 ‘노바세미’의 화면 예시입니다.<br>삼성전자·SK하이닉스의 실제 하락이나 그 원인을 설명하는 자료가 아닙니다.</p><div class="movement-headline"><strong>노바세미 · 가상기업</strong><span style="color:var(--red)">예시 −6.2%</span></div><div class="movement-chart"><svg viewBox="0 0 500 170" role="img" aria-label="가상 기업의 하락 추세 예시 차트"><defs><linearGradient id="demoDownFill" x2="0" y2="1"><stop stop-color="#e3a38a" stop-opacity=".18"/><stop offset="1" stop-color="#e3a38a" stop-opacity="0"/></linearGradient></defs><path d="M0 30H500M0 80H500M0 130H500" stroke="#39452f" stroke-dasharray="3 5"/><path d="M0 28L28 25 52 45 80 40 105 65 136 48 166 75 192 68 225 99 250 91 280 114 310 100 345 130 373 115 401 133 430 127 466 147 500 140V170H0Z" fill="url(#demoDownFill)"/><path class="chart-path" d="M0 28L28 25 52 45 80 40 105 65 136 48 166 75 192 68 225 99 250 91 280 114 310 100 345 130 373 115 401 133 430 127 466 147 500 140" stroke="#e0a68d" stroke-width="2" fill="none"/></svg></div><div class="cause-row"><span class="cause-number">01</span><div><h4>시장·업종 영향 / 예시 관측</h4><p>같은 기간 가상 반도체 업종도 하락한 상황입니다. 업종 공통 요인과 기업 고유 요인을 나눠 확인합니다.</p></div><span class="cause-state">가상 관측</span></div><div class="cause-row"><span class="cause-number">02</span><div><h4>기업 이슈 / 예시 해석</h4><p>가상의 실적 전망 하향 소식이 부담이 됐을 가능성이 있습니다. 인과관계와 가격 기여도는 확정할 수 없습니다.</p></div><span class="cause-state">가능성</span></div><div class="cause-row"><span class="cause-number">03</span><div><h4>다음에 확인할 조건</h4><p>실제 실적 수치, 전망 수정 시점, 업종 대비 가격 흐름이 일치하는지 확인합니다. 하락 자체를 저가 매수 근거로 삼지 않습니다.</p></div><span class="cause-state">확인 필요</span></div><div class="demo-note">모든 수치·사건·차트는 디자인용 가상 예시입니다. 원문 자료가 없는 예시를 실제 근거로 연결하지 않습니다.</div>`);
});

const revealObserver = new IntersectionObserver(entries=>entries.forEach(entry=>{
  if (entry.isIntersecting) {entry.target.classList.add('reveal-on');revealObserver.unobserve(entry.target);}
}),{threshold:.08});
$$('.movement-section,.lower-grid,.market-strip').forEach(el=>revealObserver.observe(el));
document.addEventListener('pointermove',event=>{
  if (reduceMotion || event.pointerType !== 'mouse') return;
  const card = event.target.closest('.stock-card'); if (!card) return;
  const rect = card.getBoundingClientRect(); card.style.setProperty('--mx',`${event.clientX-rect.left}px`); card.style.setProperty('--my',`${event.clientY-rect.top}px`);
});
actions.sources = () => modal(`<h2 id="modalTitle">데이터의 기준부터,<br>투명하게.</h2><p>키 설정과 실제 조회 결과를 구분합니다.</p><div class="modal-link"><div>DART · 기업 공시<small>공식 공시 목록·기업 매핑·원문 링크</small></div><span>${liveStatus?.dart?'키 설정 완료':'설정 필요'}</span></div><a class="modal-link" href="https://openapi.krx.co.kr/contents/OPP/USES/service/OPPUSES002_S1.cmd" target="_blank" rel="noopener noreferrer"><div>KRX · 종가·거래량<small>코스피·코스닥 일별매매정보 · 최근 최대 5거래일</small></div><span>${liveStatus?.krxConfigured?'키 설정 완료':'설정 필요'}</span></a><div class="modal-link"><div>NEWS · 이슈 맥락<small>NAVER API HUB · 제목·검색 요약·원문 링크</small></div><span>${newsLabel(liveStatus?.newsHealth,liveStatus?.newsConfigured)}</span></div><p class="data-note">KRX 데이터는 실시간 현재가가 아닌 기준일의 비수정 종가입니다. 가격·뉴스는 기업 상세에서 실제 조회합니다. 연결 확인은 서버 인증 검사 결과이며, 기사 수는 조회한 기업에 따라 달라집니다.</p>`);
refreshConnection();
// A report starts with an evidence-led conclusion; source lists are secondary.
renderResearch = function(result) {
  const c=result.company,b=result.brief,target=$('#researchResult');
  if(c){updateCompany(c.name,c.stockCode);renderPriceContext(result);}
  target.classList.remove('hidden');
  const list=items=>`<ul>${items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`;
  const view=(key,v)=>`<section class="brief-perspective" id="brief-${key}" role="tabpanel" ${key==='long'?'hidden':''}><div class="brief-verdict"><span>${esc(v.horizon)}</span><h3>${esc(v.label)}</h3></div><h4>이렇게 판단한 이유</h4>${list(v.reasons)}<div class="brief-next"><div><h4>다음에 확인할 것</h4>${list(v.checks)}</div><div><h4>판단을 바꿀 조건</h4>${list(v.invalidation.length?v.invalidation:['추가 자료를 확보한 뒤 판단합니다.'])}</div></div>${v.evidence.map(e=>e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.label)} ↗</a>`:`<small>${esc(e.label)} · ${receiptDate(e.date)}</small>`).join('')}</section>`;
  target.innerHTML=`<h3>${esc(c?.name||'오늘의 시장 공시')} 종합 리서치</h3><p>${receiptDate(result.range.start)} – ${receiptDate(result.range.end)} · ${kstTime(result.createdAt)} 수집</p>${b?`<div class="brief-lead"><span>먼저 읽는 결론</span><h2>${esc(b.headline)}</h2><p>${esc(b.overview)}</p></div>${c?`<div class="brief-tabs" role="tablist" aria-label="기간별 분석"><button role="tab" aria-selected="true" aria-controls="brief-short" data-brief-tab="short">단타 · 1–5거래일</button><button role="tab" aria-selected="false" aria-controls="brief-long" data-brief-tab="long">장기 · 6–12개월</button></div>${view('short',b.short)}${view('long',b.long)}`:`<h4>이어서 살펴볼 기업</h4><p>공시 확인 대상이며 상승 추천 순위가 아닙니다.</p><div class="brief-candidates">${b.watchCandidates.map(e=>`<button data-brief-company="${esc(e.stockCode)}"><strong>${esc(e.name)} ↗</strong><span>${esc(e.title)}</span></button>`).join('')}</div>`}<h4 class="brief-section-title">핵심 공시 · 무엇을 봐야 하나요?</h4><div class="brief-events">${b.topEvents.map(e=>`<article><small>${esc(e.name)} · ${receiptDate(e.date)}</small><h4><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.title)} ↗</a></h4><p>${esc(e.takeaway)}</p></article>`).join('')||'<p>조회 기간에 해당 유형의 공시가 없습니다.</p>'}</div><div class="brief-gaps"><strong>분석 범위</strong><p>${esc(b.missing.join(' · '))}</p><small>${esc(b.sourceNotes.join(' '))}</small></div>`:'<p>이전 저장 기록입니다. 다시 조회하면 종합 요약을 볼 수 있습니다.</p>'}<section class="brief-news"><h4>관련 뉴스</h4>${result.news?.status==='available'?`${result.news.items.slice(0,5).map(n=>`<article><a href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">${esc(n.title)} ↗</a><p>${esc(n.snippet)}</p><small>${esc(n.publishedAt.slice(0,10))}</small></article>`).join('')||'<p>최근 검색된 기사가 없습니다.</p>'}<small>검색 요약입니다. 기사 본문 검증·주가와의 인과 분석은 수행하지 않았습니다.</small>`:`<p>${esc(result.news?.message||'뉴스 공급원 미연결')}</p><a href="https://guide.ncloud-docs.com/docs/apihub-application" target="_blank" rel="noopener noreferrer">NAVER API HUB 뉴스 신청 안내 ↗</a>`}</section><details class="brief-raw"><summary>공시 원문 목록 · ${result.count}건 중 최신 ${result.events.length}건</summary><div class="research-grid">${result.events.map(e=>`<article class="evidence-card"><small>${esc(e.name)} · ${receiptDate(e.receiptDate)}</small><h4><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.title)} ↗</a></h4><p>${esc(e.check)}</p></article>`).join('')}</div></details><details class="brief-raw"><summary>수집 범위와 주의사항</summary>${list(result.warnings||[])}</details><div class="result-actions"><button id="exportResearch">리포트 JSON 저장 ↓</button></div>`;
  target.querySelectorAll('[data-brief-tab]').forEach(button=>button.addEventListener('click',()=>{target.querySelectorAll('[data-brief-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===button)));target.querySelectorAll('.brief-perspective').forEach(p=>p.hidden=p.id!==`brief-${button.dataset.briefTab}`);}));
  target.querySelectorAll('[data-brief-company]').forEach(button=>button.addEventListener('click',()=>startActualResearch(button.dataset.briefCompany,30)));
  $('#exportResearch').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`verdant-${c?.stockCode||'market'}-${result.range.end}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
};
// Keep fictional opportunity examples behind an explicit disclosure.
const demoOpportunities=$('#opportunities');
if(demoOpportunities){const wrap=document.createElement('details');wrap.className='brief-demo';wrap.innerHTML='<summary>가상 후보 화면 예시 보기</summary>';demoOpportunities.before(wrap);wrap.append(demoOpportunities);}
// Candidate discovery is the primary journey; company research is drill-down.
let selectedHorizon='short';
const renderCompanyBrief=renderResearch;
const selectionBoard=document.createElement('section');selectionBoard.id='selectionBoard';selectionBoard.className='selection-board';
$('#movementLab').before(selectionBoard);
const fmtReturn=n=>`${n>0?'+':''}${n.toFixed(1)}%`;
function candidateGroup(key,title,items){return `<section><div class="selection-heading"><h2>${title}<span>${items.length} / 4</span></h2></div><div class="candidate-grid">${Array.from({length:4},(_,i)=>{const c=items[i];return c?`<button class="candidate-card" data-candidate="${esc(c.stockCode)}" data-horizon="${key}"><span class="candidate-rank">0${i+1} · ${esc(c.market)}</span><h3>${esc(c.name)} <span>↗</span></h3><small>${esc(c.stockCode)} · ${Number(c.close).toLocaleString()}원</small><div class="candidate-return"><span>예상 수익성</span><strong>${'산출 보류'}</strong><small>${'예측 모델 검증 전'}</small></div><ul>${c.reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><div class="candidate-open">선정 이유·가격 위험 분석 보기 →</div><small>과거 관측 자료 · 예측 검증 대기</small></button>`:`<div class="candidate-card candidate-empty"><span>0${i+1}</span><h3>조건 충족 후보 없음</h3><p>자료가 충분한 종목만 채웁니다.</p></div>`;}).join('')}</div></section>`;}
function renderSelection(selection){
 $('#movementLab').hidden=true;
 selectionBoard.innerHTML=`<h2 class="selection-title">단타·장기 후보 비교</h2><p>시세 기준 ${receiptDate(selection?.asOf)} · ${selection?.universe||0}개 시세 중 ${selection?.reviewed||0}개 실적 검토</p>${selection?.status==='available'?`${candidateGroup('short','단타 후보 · 5거래일',selection.short)}${candidateGroup('long','장기 후보 · 12개월',selection.long)}`:`<div class="brief-gaps">${esc(selection?.message||'아직 조회하지 않았습니다. 위의 후보 찾기를 눌러 주세요.')}</div>`}<details class="brief-raw"><summary>선정 방식과 예상 수익성 계산 기준</summary><p>${esc(selection?.message||'KRX·DART 자료를 조회해 별도 전략으로 선별합니다.')}</p><p>${esc(selection?.limitations||'')}</p><p>예측 수익률은 검증 자료가 부족해 산출을 보류했습니다. 상세 화면에서 실제 종가·일중 범위·거래량과 관측 위험을 확인하세요.</p></details>`;
 selectionBoard.querySelectorAll('[data-candidate]').forEach(button=>button.addEventListener('click',()=>{selectedHorizon=button.dataset.horizon;startActualResearch(button.dataset.candidate,30);}));
}
function renderPriceEvidence(series=[]){
 const rows=series.filter(r=>/^\d{8}$/.test(r.date||'')&&Number.isFinite(r.close)&&r.close>0).sort((a,b)=>a.date.localeCompare(b.date));
 if(rows.length<2||new Set(rows.map(r=>r.date)).size!==rows.length)return '<section class="projection-panel"><h3>가격 위험 분석</h3><p>비교할 실제 종가가 부족합니다. 예측 수익률은 산출하지 않습니다.</p></section>';
 const first=rows[0],last=rows.at(-1),change=(last.close/first.close-1)*100;
 const moves=rows.slice(1).map((r,i)=>(r.close/rows[i].close-1)*100),mean=moves.reduce((a,b)=>a+b,0)/moves.length;
 const deviation=moves.length>1?Math.sqrt(moves.reduce((a,b)=>a+(b-mean)**2,0)/(moves.length-1)):null;
 let peak=first.close,drawdown=0;rows.forEach(r=>{peak=Math.max(peak,r.close);drawdown=Math.min(drawdown,(r.close/peak-1)*100);});
 const validRange=r=>Number.isFinite(r.low)&&Number.isFinite(r.high)&&r.low>0&&r.low<=r.close&&r.high>=r.close;
 const prices=rows.flatMap(r=>validRange(r)?[r.low,r.high,r.close]:[r.close]),low=Math.min(...prices),high=Math.max(...prices),pad=Math.max((high-low)*.15,last.close*.005),lo=low-pad,hi=high+pad;
 const x=i=>78+i*560/(rows.length-1),y=p=>218-(p-lo)/(hi-lo)*172;
 const maxVolume=Math.max(1,...rows.map(r=>Number.isFinite(r.volume)?r.volume:0));
 const date=d=>esc(d.slice(4,6)+'.'+d.slice(6,8));
 const grid=Array.from({length:5},(_,i)=>{const p=lo+(hi-lo)*i/4;return '<path d="M78 '+y(p)+'H638" stroke="#c7d1c8" stroke-width=".6"/><text x="68" y="'+(y(p)+4)+'" text-anchor="end" fill="#43584a" font-size="11">'+Math.round(p).toLocaleString()+'</text>';}).join('');
 const line=rows.map((r,i)=>x(i)+','+y(r.close)).join(' ');
 const bars=rows.map((r,i)=>{const up=i? r.close>=rows[i-1].close:r.close>=first.close,color=up?'#a64a3d':'#316a91',v=Number.isFinite(r.volume)?r.volume:null;
 const range=validRange(r)?'<line x1="'+x(i)+'" x2="'+x(i)+'" y1="'+y(r.high)+'" y2="'+y(r.low)+'" stroke="'+color+'" stroke-width="2"/><path d="M'+(x(i)-5)+' '+y(r.high)+'h10M'+(x(i)-5)+' '+y(r.low)+'h10" stroke="'+color+'"/>':'';
 return '<g class="price-observation" tabindex="0" role="img" aria-label="'+date(r.date)+' 종가 '+r.close.toLocaleString()+'원"><title>'+date(r.date)+' · 종가 '+r.close.toLocaleString()+'원'+(validRange(r)?' · 고가 '+r.high.toLocaleString()+' / 저가 '+r.low.toLocaleString():'')+(v!==null?' · 거래량 '+v.toLocaleString()+'주':'')+'</title><rect x="'+(x(i)-18)+'" y="38" width="36" height="250" fill="transparent"/>'+range+'<circle cx="'+x(i)+'" cy="'+y(r.close)+'" r="4" fill="'+color+'" stroke="#f1f2e8" stroke-width="2"/>'+(v!==null?'<rect x="'+(x(i)-12)+'" y="'+(278-v/maxVolume*35)+'" width="24" height="'+v/maxVolume*35+'" fill="'+color+'" opacity=".5"/>':'')+'<text x="'+x(i)+'" y="304" text-anchor="middle" fill="#43584a" font-size="11">'+date(r.date)+'</text></g>';}).join('');
 const fmt=v=>v==null?'자료 없음':fmtReturn(v),volumeAvg=rows.slice(0,-1).filter(r=>Number.isFinite(r.volume)&&r.volume>=0),avg=volumeAvg.length?volumeAvg.reduce((a,r)=>a+r.volume,0)/volumeAvg.length:0;
 const ratio=avg>0&&Number.isFinite(last.volume)?(last.volume/avg).toFixed(2)+'배':'자료 없음';
 const verdict=change>0?(drawdown< -3?'상승 중에도 조정이 관측됐습니다.':'관측 구간 종가는 상승했습니다.'):'관측 구간 종가는 하락하거나 정체했습니다.';
 return '<section class="projection-panel price-evidence"><div class="evidence-heading"><div><h3>실제로 얼마나 흔들렸나</h3><p>'+receiptDate(first.date)+' — '+receiptDate(last.date)+' · 실제 '+rows.length+'거래일 · 비수정 가격</p></div><span class="evidence-status">예측 수익률 산출 보류</span></div><div class="evidence-verdict"><strong>'+verdict+'</strong><p>구간 등락 '+fmt(change)+' · 하루 최대 하락 '+fmt(Math.min(...moves))+' · 최근 거래량은 앞선 관측일 평균의 '+ratio+'. 이 관측만으로 다음 상승을 판단할 수 없습니다.</p></div><div class="evidence-legend"><span>● 실제 종가</span><span>↕ 실제 고가·저가</span><span>▥ 거래량</span><span>고가·저가와 거래량은 아래 원자료에서 확인</span></div><div class="evidence-chart-scroll"><svg viewBox="0 0 700 325" role="img" aria-label="실제 종가, 일중 고저 범위와 거래량. 미래 예측 없음">'+grid+'<path d="M78 '+y(first.close)+'H638" stroke="#758979" stroke-dasharray="3 5"/><polygon points="78,218 '+line+' 638,218" fill="#296a4b" opacity=".07"/><polyline points="'+line+'" fill="none" stroke="#245941" stroke-width="2.5" stroke-linejoin="round"/>'+bars+'<text x="12" y="266" font-size="11" fill="#43584a">거래량</text></svg></div><div class="evidence-metrics"><div><small>관측 구간 등락</small><strong>'+fmt(change)+'</strong></div><div><small>종가 기준 최대 낙폭</small><strong>'+fmt(drawdown)+'</strong></div><div><small>일간 등락 표준편차</small><strong>'+(deviation===null?'자료 부족':deviation.toFixed(2)+'%p')+'</strong></div><div><small>최근 거래량 / 이전 평균</small><strong>'+ratio+'</strong></div></div><details class="brief-raw"><summary>일별 원자료와 계산 근거</summary><div class="evidence-table-scroll"><table><thead><tr><th>일자</th><th>종가</th><th>등락</th><th>고가</th><th>저가</th><th>거래량</th></tr></thead><tbody>'+rows.map((r,i)=>'<tr><th>'+receiptDate(r.date)+'</th><td>'+r.close.toLocaleString()+'</td><td>'+(i?fmt(moves[i-1]):'—')+'</td><td>'+(validRange(r)?r.high.toLocaleString():'—')+'</td><td>'+(validRange(r)?r.low.toLocaleString():'—')+'</td><td>'+(Number.isFinite(r.volume)?r.volume.toLocaleString():'—')+'</td></tr>').join('')+'</tbody></table></div><p>구간 등락 = 마지막 종가 ÷ 첫 종가 − 1. 최대 낙폭 = 관측 종가의 이전 최고 종가 대비 최저 하락률. 일간 표준편차는 종가 간 단순 수익률의 표본 표준편차이며 연율화하지 않았습니다. 점 사이 선은 관측 종가 연결선이며 일중 경로가 아닙니다.</p></details><div class="evidence-next"><strong>예측하려면 무엇이 더 필요한가</strong><p>현재 최대 5거래일로는 단기·장기 수익률을 검증할 수 없습니다. 장기간의 수정주가와 기업행동, 시장·업종, 수급을 결합한 뒤 시간순 과거 검증에서 단순 기준 대비 오차와 비용 차감 성과를 공개해야 합니다. 검증 전에는 목표가·상승 확률을 제시하지 않습니다.</p></div>'+renderConditionalFuture(rows)+'</section>';
}
function conditionalPath(rows,targetPercent){
 if(rows.length<2||!Number.isFinite(targetPercent)||Math.abs(targetPercent)>30)return null;
 const last=rows.at(-1).close,previous=rows.at(-2).close;
 if(!Number.isFinite(last)||!Number.isFinite(previous)||last<=0||previous<=0)return null;
 const impulse=Math.log(last/previous),end=Math.log1p(targetPercent/100);
 return Array.from({length:6},(_,i)=>{const t=i/5;return {step:i,price:last*Math.exp(end*t+impulse*2*t*(1-t))};});
}
function futurePlot(rows,target){
 const path=conditionalPath(rows,target);if(!path)return '';
 const history=rows.slice(-5),n=history.length-1,total=n+5;
 const values=[...history.map(r=>r.close),...path.map(r=>r.price)],lo=Math.min(...values)*.975,hi=Math.max(...values)*1.025;
 const x=i=>65+i*585/total,y=p=>245-(p-lo)/(hi-lo)*180,boundary=x(n);
 const line=history.map((r,i)=>x(i)+','+y(r.close)).join(' '),future=path.map(r=>x(n+r.step)+','+y(r.price)).join(' ');
 const ticks=Array.from({length:4},(_,i)=>{const p=lo+(hi-lo)*i/3;return '<path d="M65 '+y(p)+'H650" stroke="#b9c8be" stroke-width=".7"/><text x="56" y="'+(y(p)+4)+'" text-anchor="end" font-size="11">'+(p/10000).toFixed(1)+'만</text>';}).join('');
 return '<svg viewBox="0 0 700 300" role="img" aria-label="실제 종가 이후 5거래일의 사용자 조건 시뮬레이션. 검증된 예측이 아닙니다."><rect x="'+boundary+'" y="32" width="'+(660-boundary)+'" height="225" fill="#dce6ed" opacity=".7"/>'+ticks+'<text x="65" y="22" font-size="12">실제 종가</text><text x="'+(boundary+15)+'" y="22" font-size="12">이후 · 선택한 가정</text><path d="M'+boundary+' 30V258" stroke="#6c8191" stroke-dasharray="4 5"/><polyline points="'+line+'" fill="none" stroke="#245941" stroke-width="2.5"/><polyline class="future-path" points="'+future+'" fill="none" stroke="#376b94" stroke-width="2.5" stroke-dasharray="6 4"/>'+history.map((r,i)=>'<circle cx="'+x(i)+'" cy="'+y(r.close)+'" r="3" fill="#245941"/>').join('')+path.slice(1).map(r=>'<g><circle cx="'+x(n+r.step)+'" cy="'+y(r.price)+'" r="3" fill="#376b94"/><title>가정 D+'+r.step+' · '+Math.round(r.price).toLocaleString()+'원</title></g>').join('')+'<text x="65" y="282" font-size="11">'+esc(receiptDate(history[0].date))+'</text><text x="'+boundary+'" y="282" text-anchor="middle" font-size="11">마지막 종가</text><text x="650" y="282" text-anchor="end" font-size="11">D+5</text></svg>';
}
function renderConditionalFuture(rows){
 const changes=rows.slice(1).map((r,i)=>Math.abs((r.close/rows[i].close-1)*100));
 const move=changes.reduce((a,b)=>a+b,0)/changes.length;
 const preset=Math.min(30,Math.round(move*4)/2);
 return '<section class="conditional-future" data-future-rows="'+esc(JSON.stringify(rows.map(r=>({date:r.date,close:r.close}))))+'"><h3>그다음 흐름을 가정해 보면</h3><p>실제 종가 뒤에 이어지는 <b>5거래일 조건 시뮬레이션</b>입니다. 원하는 조건을 선택하거나 5일 후 등락을 직접 바꿔 보세요.</p><div class="future-presets" role="group" aria-label="이후 가격 조건"><button type="button" data-future-target="'+preset+'" aria-pressed="false">반등 가정</button><button type="button" data-future-target="0" aria-pressed="true">횡보 가정</button><button type="button" data-future-target="'+(-preset)+'" aria-pressed="false">조정 가정</button></div><label class="future-slider-label">5일 후 등락 가정 <output class="future-target">0.0%</output><input class="future-slider" aria-label="5일 후 등락 가정" type="range" min="-30" max="30" step="0.5" value="0"></label><div class="future-chart">'+futurePlot(rows,0)+'</div><div class="future-readout" aria-live="polite"><strong>가정 종가 '+Math.round(rows.at(-1).close).toLocaleString()+'원</strong><span>마지막 실제 종가 대비 0.0%</span></div><p class="future-explanation">횡보 가정: 최근 방향의 영향이 점차 완화되고 5일 뒤 마지막 종가로 돌아온다는 조건입니다.</p><details class="brief-raw"><summary>이 경로의 가정과 한계</summary><p>출발점은 마지막 실제 종가입니다. 중간 경로는 마지막 하루의 로그수익률 영향이 사라지며 선택한 종점에 도달하도록 보간한 연결선입니다. 굴곡은 미래 사건을 예측한 결과가 아닙니다. 반등·조정 버튼의 초기 폭은 관측 일간 절대 등락 평균의 2배(최대 30%)를 참고한 조작값입니다. 슬라이더 ±30%는 조작 범위이며 거래소 가격제한폭을 뜻하지 않습니다. 확률·목표가·추천 수익률은 제공하지 않으며 뉴스·수급·재무를 미래 경로에 반영하지 않았습니다. D+1~5는 상대 거래일이며 휴장일 달력을 추정하지 않습니다.</p></details></section>';
}

function scenarioChart(s,series=[]){return renderPriceEvidence(series);}
function updateFuture(panel,target,label){
 const rows=JSON.parse(panel.dataset.futureRows),path=conditionalPath(rows,target);if(!path)return;
 panel.querySelector('.future-chart').innerHTML=futurePlot(rows,target);
 panel.querySelector('.future-target').textContent=fmtReturn(target);
 panel.querySelector('.future-readout').innerHTML='<strong>가정 종가 '+Math.round(path.at(-1).price).toLocaleString()+'원</strong><span>마지막 실제 종가 대비 '+fmtReturn(target)+'</span>';
 panel.querySelector('.future-explanation').textContent=label==='횡보 가정'?'횡보 가정: 최근 방향의 영향이 점차 완화되고 5일 뒤 마지막 종가로 돌아온다는 조건입니다.':label+' · 5일 후 '+fmtReturn(target)+'에 도달한다고 사용자가 정한 조건입니다. 그 가능성이나 발생 시점을 예측한 값은 아닙니다.';
}
 document.addEventListener('click',event=>{const button=event.target.closest('[data-future-target]');if(!button)return;const panel=button.closest('.conditional-future'),slider=panel.querySelector('.future-slider');slider.value=button.dataset.futureTarget;panel.querySelectorAll('[data-future-target]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));updateFuture(panel,Number(slider.value),button.textContent);});
 document.addEventListener('input',event=>{if(!event.target.matches('.future-slider'))return;const panel=event.target.closest('.conditional-future');panel.querySelectorAll('[data-future-target]').forEach(b=>b.setAttribute('aria-pressed','false'));updateFuture(panel,Number(event.target.value),'직접 설정');});
function renderNewsEvidence(result){
 const e=result.newsEvidence;
 if(!e)return '<h4>뉴스 근거 분석</h4><p>이전 저장 기록에는 기사 선별 결과가 없습니다. 다시 조회하면 가격 시나리오별 근거를 확인할 수 있습니다.</p>';
 if(e.status!=='available')return '<h4>뉴스 근거 분석</h4><p>뉴스 조회가 완료되지 않아 시나리오 근거를 판단하지 않았습니다.</p>';
 const n=e.support.length,r=e.risk.length,w=e.watch.length;
 const verdict=n&&r?'상승 재료와 하락 위험이 함께 검색됐습니다. 한쪽 방향으로 결론내리지 않습니다.':n?'상승을 검토할 재료가 검색됐지만, 반대 기사가 없다는 이유로 위험이 낮다고 판단하지 않습니다.':r?'하락 위험을 먼저 확인할 기사들이 검색됐습니다. 이미 가격에 반영됐는지는 별도 확인이 필요합니다.':'검색된 기사만으로 가격 방향을 뒷받침할 근거가 부족합니다.';
 const group=(key,title,meaning)=>'<section class="news-evidence-group"><h4>'+title+' <span>'+e[key].length+'건</span></h4><p>'+meaning+'</p>'+e[key].map(item=>'<article><small>'+esc(item.topic)+' · '+esc(item.sourceHost)+' · '+esc(item.publishedAt.slice(0,10))+'</small><h5><a href="'+esc(item.url)+'" target="_blank" rel="noopener noreferrer">'+esc(item.title)+' ↗</a></h5><p>'+esc(item.reason)+'</p><p><b>확인할 조건</b> '+esc(item.check)+'</p><small>'+esc(item.timing)+'</small><details><summary>기사 검색 요약</summary><p>'+esc(item.snippet)+'</p></details></article>').join('')+(e[key].length?'':'<p class="news-empty">이번 검색에서 확인할 기사를 찾지 못했습니다. 해당 재료가 없다는 뜻은 아닙니다.</p>')+'</section>';
 return '<div id="news-evidence" class="news-evidence-summary">'+(e.partial?'<p>일부 뉴스 검색이 실패한 부분 결과입니다.</p>':'')+'<h3>가격 가정을 뒷받침할 뉴스는?</h3><strong>'+verdict+'</strong><p>상승 검토 '+n+' · 위험 검토 '+r+' · 판단 보류 '+w+'건. 검색 '+e.reviewed+'건 중 기업 관련성 부족·날짜·URL 문제 '+e.excluded+'건, 유사 제목 '+e.duplicates+'건을 제외했습니다. 각 묶음은 최신 최대 3건입니다.</p><p>반등 가정은 실적·수요·주주환원 관련 자료를, 조정 가정은 실적 둔화·자금·시장 위험을 확인하는 관점입니다. 기사는 선택한 시나리오에 맞춰 숨기지 않습니다.</p></div><div class="news-evidence-columns">'+group('support','상승을 검토할 재료','반등 가정을 검토할 때 사실 여부와 지속성을 확인하세요.')+group('risk','하락 위험·반대 근거','상승 재료가 있어도 이 조건이 악화되면 가정을 재검토하세요.')+group('watch','아직 방향을 정하기 어려운 기사','시나리오를 지지한다고 분류하지 않은 자료입니다.')+'</div><p class="news-method">'+esc(e.method)+' 기사 건수는 확률·점수가 아닙니다. 기업명·실적·주가별 최신 검색 결과(각 최대 20건)에 한정되며 전체 보도나 모든 반대 근거를 포함하지 않습니다. 중복 제거도 유사 제목 기준입니다. 미래 차트의 가격은 이 기사로 계산하지 않습니다.</p>';
}
renderResearch=function(result){
 if(!result.company){renderSelection(result.selection);$('#researchResult').classList.add('hidden');selectionBoard.scrollIntoView({behavior:'smooth',block:'start'});return;}
 $('#movementLab').hidden=false;renderCompanyBrief(result);
 const newsSection=$('#researchResult').querySelector('.brief-news');if(newsSection)newsSection.innerHTML=renderNewsEvidence(result);
 const target=$('#researchResult');target.querySelector('.brief-tabs')?.remove();
 target.querySelectorAll('.brief-perspective').forEach(panel=>{panel.hidden=panel.id!==`brief-${selectedHorizon}`;});
 const lead=target.querySelector('.brief-lead');if(lead){lead.querySelector('h2').textContent=`${result.company.name} · ${selectedHorizon==='short'?'단타':'장기'} 후보 상세 분석`;lead.querySelector('p').textContent=`선택한 투자 기간의 가격·실적 근거, 관측된 가격 위험을 확인하세요. ${result.brief.overview}`;lead.insertAdjacentHTML('afterend',scenarioChart(result.scenarios?.[selectedHorizon],result.priceContext?.series||[]));}
 const futurePanel=target.querySelector('.conditional-future');if(futurePanel){const e=result.newsEvidence;futurePanel.querySelector('.future-explanation').insertAdjacentHTML('afterend','<p class="future-news-link">'+(e?.status==='available'?'기사 근거: 상승 검토 '+e.support.length+'건 · 하락 위험 '+e.risk.length+'건 · 판단 보류 '+e.watch.length+'건. 양쪽 근거를 함께 확인하세요.':'기사 근거 분석은 다시 조회하거나 뉴스 연결 상태를 확인하세요.')+' <a href="#news-evidence">시나리오 근거 기사 읽기 ↓</a><br>기사 분류는 조건 검토용이며 위 가정 가격의 계산 입력이 아닙니다.</p>');}
 const back=document.createElement('button');back.className='lookup-button';back.textContent='← 단타·장기 후보 목록으로';back.onclick=()=>{ $('#movementLab').hidden=true;selectionBoard.scrollIntoView({behavior:'smooth'});};target.prepend(back);
};
$('#heroTitle').innerHTML='단타·장기 투자 후보';
$('.hero-copy p').innerHTML='단타 후보 4개와 장기 후보 4개를 추리고,<br>선정 근거부터 기업별 가격 위험 분석까지.';
$('#analyzeButton span').textContent='단타·장기 후보 찾기';
$('.keyboard-hint').innerHTML='<kbd>↵</kbd> 리서치하고 8개 후보 선별';
$('.footer p').textContent='KRX·DART 기반 예비 후보. 실제 관측 자료를 제공하며 예측 수익률은 검증 전까지 산출하지 않습니다.';
$('.demo-badge').textContent='리서치 데스크';
$('.market-strip')?.setAttribute('hidden','');$('.lower-grid')?.setAttribute('hidden','');
document.querySelectorAll('.brief-demo').forEach(e=>e.hidden=true);
renderSelection(null);
// Investor flow is evidence, never inferred from price or volume.
const renderSelectionBeforeFlow=renderSelection;
renderSelection=function(selection){
 renderSelectionBeforeFlow(selection);
 const coverage=selection?.flowCoverage;
 for(const key of ['short','long']){
 const info=coverage?.[key],items=selection?.[key]||[];
 const button=selectionBoard.querySelector(`[data-horizon="${key}"]`);
 const group=selectionBoard.querySelectorAll('.selection-heading')[key==='short'?0:1]?.parentElement;
 if(group){const banner=document.createElement('div');banner.className='flow-banner '+(info?.mode==='flow_screened'?'flow-confirmed':'');banner.innerHTML=info?.mode==='flow_screened'?`<strong>수급 필터 적용</strong><span>${info.checked}/${info.total}개 자료 확인 · ${key==='short'?'5':'20'}거래일 외인·기관 누적 순매수 + 동반 순매수 40% 이상</span>`:'<strong>수급 미확인 · 예비 후보</strong><span>외국인·기관 데이터 연결 전입니다. 현재 순위에는 수급이 반영되지 않았습니다.</span>';group.querySelector('.selection-heading').after(banner);}
 for(const item of items){const card=selectionBoard.querySelector(`[data-candidate="${item.stockCode}"][data-horizon="${key}"]`);if(!card)continue;const status=document.createElement('div');status.className='flow-card-status '+(item.flowEvidence?.qualified?'flow-confirmed':'');status.innerHTML=`<strong>${esc(item.flowEvidence?.label||'수급 미확인')}</strong>${(item.flowEvidence?.reasons||[]).map(r=>`<small>${esc(r)}</small>`).join('')}`;card.querySelector('.candidate-return').before(status);}
 }
 if(selection){const setup=document.createElement('details');setup.className='brief-raw';setup.innerHTML='<summary>외국인·기관 수급 연결 및 선정 기준</summary><p>한국투자증권 Open API의 주식현재가 투자자 자료를 사용합니다. 프로젝트 폴더 KIS API.json에 appKey, appSecret을 저장한 뒤 서버를 재시작하면 읽습니다. 계좌번호·비밀번호는 필요하지 않습니다.</p><p>단타는 5개, 장기는 20개 거래일 누적 외국인·기관 순매수가 모두 양수이며, 두 주체가 함께 순매수한 날이 40% 이상이어야 통과합니다. 통과 후보는 동반 순매수 비율·거래량 대비 순매수 강도를 가점으로 비교합니다.</p><p>최신 종가와 수급 기준일이 다르거나 기간이 부족하면 미확인입니다. 해당 전략에서 수급을 확인한 종목이 있으면 미확인 종목으로 빈자리를 채우지 않습니다. 전부 미확인인 경우 기존 순위는 예비 후보로 표시합니다. 예상 수익률에는 수급 가점을 더하지 않습니다.</p>';selectionBoard.append(setup);}
};
function investorFlowHTML(flow){
 const f=n=>n==null?'자료 없음':`${n>0?'+':''}${Math.round(n).toLocaleString()}주`;
 if(flow?.status!=='available')return `<section class="flow-detail"><h3>외국인·기관 수급 미확인</h3><p>${esc(flow?.message||'수급 기준일 불일치 또는 자료 미연결')}</p><p>가격·거래량으로 매수 주체를 추정하지 않습니다.</p></section>`;
 return `<section class="flow-detail"><h3>외국인·기관 순매수</h3><p class="source-meta">수급 기준 ${receiptDate(flow.asOf)}</p><div class="flow-windows">${['short','long'].map(key=>{const w=flow[key];return `<article><h4>${key==='short'?'최근 5거래일':'최근 20거래일'}</h4>${w.status==='available'?`<p>외국인 <strong>${f(w.foreign)}</strong><br>기관 <strong>${f(w.institution)}</strong></p><p>동반 순매수 ${w.bothDays}/${w.observations}일${w.intensity!=null?` · 거래량 대비 ${w.intensity.toFixed(2)}%`:''}</p><strong>${w.qualified?'수급 조건 충족':'수급 조건 미충족'}</strong>`:`<p>기간 자료 부족 · ${w.observations}/${w.required}개</p>`}</article>`;}).join('')}</div><p>연속 순매수: 외국인 ${flow.foreignStreak}일 · 기관 ${flow.institutionStreak}일</p><details class="brief-raw"><summary>일별 순매수 원자료 · 수량 기준</summary><div class="flow-table-wrap"><table><thead><tr><th>일자</th><th>외국인</th><th>기관</th></tr></thead><tbody>${flow.rows.map(r=>`<tr><td>${receiptDate(r.date)}</td><td>${f(r.foreign)}</td><td>${f(r.institution)}</td></tr>`).join('')}</tbody></table></div></details><small>${esc(flow.source)} · ${esc(flow.limitations)}</small></section>`;
}
const renderResearchBeforeFlow=renderResearch;
renderResearch=function(result){renderResearchBeforeFlow(result);if(result.company){const target=$('#researchResult');const graph=target.querySelector('.projection-panel');if(graph)graph.insertAdjacentHTML('beforebegin',investorFlowHTML(result.investorFlow));else target.insertAdjacentHTML('beforeend',investorFlowHTML(result.investorFlow));}};
renderSelection(null);
