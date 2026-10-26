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

// Preserve the supplied brand, with a clearer primary action and data labels.
$('#heroTitle').innerHTML = '시장의 소음 너머,<br><em>움직임의 이유까지.</em>';
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
    $('#dartLed').classList.toggle('ready', Boolean(liveStatus.dart));
    $('.demo-badge').textContent = liveStatus.dart ? 'DART · KRX SCREENER' : 'DEMO · SETUP REQUIRED';
  } catch {
    $('#connectionLine').textContent = '서버에 연결하지 못했습니다 · 다시 시도해 주세요';
    $('.demo-badge').textContent = 'CONNECTION CHECK';
  }
}

actions.sources = () => modal(`<div class="eyebrow">CONNECTED INTELLIGENCE</div><h2 id="modalTitle">근거의 시작을,<br>투명하게.</h2><p>데이터의 연결 상태와 실제 조회 범위를 따로 표시합니다.</p><a class="modal-link" href="https://opendart.fss.or.kr/intro/main.do" target="_blank" rel="noopener noreferrer"><div>DART · 기업 공시<small>서버에서 공식 API 호출 · 기업 매핑 · 원문 링크</small></div><span class="connection-status">${liveStatus?.dart?'서버 설정 완료':'설정 확인 필요'}</span></a><div class="modal-link"><div>KRX · 가격 · 거래량<small>인증키 승인 및 데이터별 사용 승인 확인 후 연결</small></div><span class="connection-status">승인 대기</span></div><div class="modal-link"><div>NEWS · 사건의 맥락<small>허용된 뉴스 공급원 선정 후 연결</small></div><span class="connection-status">미연결</span></div><div class="demo-note">일별 가격과 장중 실시간 시세는 별도입니다. 현재 시장 지표·후보 카드는 가상 데모이며, 공시 제목만으로 실제 가격 변동의 원인을 확정하지 않습니다.</div>`);

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
  $('#movementCoverage').innerHTML = `<span class="coverage-pill">DART <b>조회 전</b></span><span class="coverage-pill">KRX <b>${liveStatus?.krxConfigured?'조회 전':'키 미설정'}</b></span><span class="coverage-pill">NEWS <b>미연결</b></span>`;
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
  steps.splice(0, steps.length, ['종목과 조회 범위 확인','DART · 공식 기업 목록'], ['공시 목록 수집','DART · 페이지별 실제 조회'], ['근거 자료 정리','접수번호 · 원문 · 제목 유형'], ['후보 선정·시나리오 계산','KRX 유동성 · DART 실적 비교']);
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
    modal(`<div class="eyebrow">RESEARCH STATUS</div><h2 id="modalTitle">연결을 다시 확인해 주세요.</h2><div class="error-box">${esc(message)}</div>${localAlternative}<p class="data-note">실패한 요청을 완료된 분석이나 후보 추천으로 기록하지 않았습니다.</p><button class="lookup-button" id="retryResearch">다시 조회하기 ↗</button>`);
    $('#retryResearch').addEventListener('click', () => startActualResearch(query,days));
  } finally { clearTimeout(timeout); }
}

function renderPriceContext(result) {
  const context=result.priceContext, quote=context?.latest;
  const labels={unauthorized:'이용 권한 확인',network:'연결 실패',empty:'조회 자료 없음',not_connected:'미연결',partial:'부분 수집'};
  $('#movementCoverage').innerHTML=`<span class="coverage-pill available">DART <b>${result.count}건</b></span><span class="coverage-pill ${quote?'available':''}">KRX <b>${quote?receiptDate(quote.date):esc(labels[context?.status]||'미연결')}</b></span><span class="coverage-pill">NEWS <b>미연결</b></span>`;
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
  $('#causeRows').innerHTML=`<div class="cause-row"><span class="cause-number">01</span><div><h4>가격·거래량 · 확인된 사실</h4><p>KRX 기준 종가 ${format(quote.close)}원, 전일 대비 ${esc(percent)}, 거래량 ${format(quote.volume)}주입니다.</p></div><span class="cause-state">KRX</span></div><div class="cause-row"><span class="cause-number">02</span><div><h4>기업 공시 · 별도 확인</h4><p>${result.count?esc(result.events[0]?.title):'선택한 기간에 접수된 공시가 없습니다.'}</p></div><span class="cause-state">DART</span></div><div class="cause-row"><span class="cause-number">03</span><div><h4>뉴스·업종 비교 · 추가 자료 필요</h4><p>가격 변동과 공시의 동시 발생만으로 원인을 확정할 수 없습니다.</p></div><span class="cause-state">미연결</span></div>`;
}
var renderResearch;

renderHistory = function() {
  originalHistory();
  const emptyDemo = $('#historyContent .empty-history');
  if (emptyDemo) emptyDemo.innerHTML = '가상 후보 분석 기록은 아직 없습니다.';
  const section = document.createElement('section');
  section.innerHTML = `<div class="research-header"><div><div class="eyebrow">ACTUAL RESEARCH SNAPSHOTS</div><h3>실제 공시 조회 기록</h3><p>이 브라우저에 최근 5개의 표시 리포트를 저장합니다.<br>다시 조회하지 않고 당시 공시·기준 시각을 엽니다.</p></div></div>${snapshots.length ? snapshots.map((r,i)=>`<div class="actual-history-row"><div><strong>${esc(r.company?.name || '코스피 · 코스닥')} · ${r.count}건${r.partial?' · 부분 수집':''}</strong><small>${kstTime(r.createdAt)} KST · ${receiptDate(r.range.start)} – ${receiptDate(r.range.end)}</small></div><button data-actual-history="${i}">리포트 열기 ↗</button></div>`).join('') : '<p class="data-note">실제 조회 기록이 아직 없습니다. 오늘의 리서치를 시작해 보세요.</p>'}`;
  $('#historyContent').prepend(section);
  $$('[data-actual-history]').forEach(button=>button.addEventListener('click',()=>{
    const result = snapshots[Number(button.dataset.actualHistory)]; if (!result) return;
    showView('explore'); renderResearch(result); $('#researchResult').scrollIntoView({behavior:reduceMotion?'instant':'smooth'});
    showToast('저장된 시점의 리포트를 열었습니다. 최신 조회 결과가 아닙니다.');
  }));
};

$('#exampleMove').addEventListener('click', () => {
  modal(`<div class="eyebrow">FICTIONAL DEMO · MOVE EXPLAINER</div><h2 id="modalTitle">하락을 이해하는,<br>세 가지 관점.</h2><p>가상기업 ‘노바세미’의 화면 예시입니다.<br>삼성전자·SK하이닉스의 실제 하락이나 그 원인을 설명하는 자료가 아닙니다.</p><div class="movement-headline"><strong>노바세미 · 가상기업</strong><span style="color:var(--red)">예시 −6.2%</span></div><div class="movement-chart"><svg viewBox="0 0 500 170" role="img" aria-label="가상 기업의 하락 추세 예시 차트"><defs><linearGradient id="demoDownFill" x2="0" y2="1"><stop stop-color="#e3a38a" stop-opacity=".18"/><stop offset="1" stop-color="#e3a38a" stop-opacity="0"/></linearGradient></defs><path d="M0 30H500M0 80H500M0 130H500" stroke="#39452f" stroke-dasharray="3 5"/><path d="M0 28L28 25 52 45 80 40 105 65 136 48 166 75 192 68 225 99 250 91 280 114 310 100 345 130 373 115 401 133 430 127 466 147 500 140V170H0Z" fill="url(#demoDownFill)"/><path class="chart-path" d="M0 28L28 25 52 45 80 40 105 65 136 48 166 75 192 68 225 99 250 91 280 114 310 100 345 130 373 115 401 133 430 127 466 147 500 140" stroke="#e0a68d" stroke-width="2" fill="none"/></svg></div><div class="cause-row"><span class="cause-number">01</span><div><h4>시장·업종 영향 / 예시 관측</h4><p>같은 기간 가상 반도체 업종도 하락한 상황입니다. 업종 공통 요인과 기업 고유 요인을 나눠 확인합니다.</p></div><span class="cause-state">가상 관측</span></div><div class="cause-row"><span class="cause-number">02</span><div><h4>기업 이슈 / 예시 해석</h4><p>가상의 실적 전망 하향 소식이 부담이 됐을 가능성이 있습니다. 인과관계와 가격 기여도는 확정할 수 없습니다.</p></div><span class="cause-state">가능성</span></div><div class="cause-row"><span class="cause-number">03</span><div><h4>다음에 확인할 조건</h4><p>실제 실적 수치, 전망 수정 시점, 업종 대비 가격 흐름이 일치하는지 확인합니다. 하락 자체를 저가 매수 근거로 삼지 않습니다.</p></div><span class="cause-state">확인 필요</span></div><div class="demo-note">모든 수치·사건·차트는 디자인용 가상 예시입니다. 원문 자료가 없는 예시를 실제 근거로 연결하지 않습니다.</div>`);
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
actions.sources = () => modal(`<div class="eyebrow">CONNECTED INTELLIGENCE</div><h2 id="modalTitle">데이터의 기준부터,<br>투명하게.</h2><p>키 설정과 실제 조회 결과를 구분합니다.</p><div class="modal-link"><div>DART · 기업 공시<small>공식 공시 목록·기업 매핑·원문 링크</small></div><span>${liveStatus?.dart?'키 설정 완료':'설정 필요'}</span></div><a class="modal-link" href="https://openapi.krx.co.kr/contents/OPP/USES/service/OPPUSES002_S1.cmd" target="_blank" rel="noopener noreferrer"><div>KRX · 종가·거래량<small>코스피·코스닥 일별매매정보 · 최근 최대 5거래일</small></div><span>${liveStatus?.krxConfigured?'키 설정 완료':'설정 필요'}</span></a><div class="modal-link"><div>NEWS · 이슈 맥락<small>공급원 연결 예정</small></div><span>미연결</span></div><p class="data-note">KRX 데이터는 실시간 현재가가 아닌 기준일의 비수정 종가입니다. 실제 가격은 종목 리서치에서 조회하며, 상단 시장 지표와 후보 카드는 가상 데모입니다.</p>`);
refreshConnection();
// A report starts with an evidence-led conclusion; source lists are secondary.
renderResearch = function(result) {
  const c=result.company,b=result.brief,target=$('#researchResult');
  if(c){updateCompany(c.name,c.stockCode);renderPriceContext(result);}
  target.classList.remove('hidden');
  const list=items=>`<ul>${items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>`;
  const view=(key,v)=>`<section class="brief-perspective" id="brief-${key}" role="tabpanel" ${key==='long'?'hidden':''}><div class="brief-verdict"><span>${esc(v.horizon)}</span><h3>${esc(v.label)}</h3></div><h4>이렇게 판단한 이유</h4>${list(v.reasons)}<div class="brief-next"><div><h4>다음에 확인할 것</h4>${list(v.checks)}</div><div><h4>판단을 바꿀 조건</h4>${list(v.invalidation.length?v.invalidation:['추가 자료를 확보한 뒤 판단합니다.'])}</div></div>${v.evidence.map(e=>e.url?`<a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.label)} ↗</a>`:`<small>${esc(e.label)} · ${receiptDate(e.date)}</small>`).join('')}</section>`;
  target.innerHTML=`<div class="eyebrow">RESEARCH BRIEF · 실제 자료</div><h3>${esc(c?.name||'오늘의 시장 공시')} 종합 리서치</h3><p>${receiptDate(result.range.start)} – ${receiptDate(result.range.end)} · ${kstTime(result.createdAt)} 수집</p>${b?`<div class="brief-lead"><span>먼저 읽는 결론</span><h2>${esc(b.headline)}</h2><p>${esc(b.overview)}</p></div>${c?`<div class="brief-tabs" role="tablist" aria-label="기간별 분석"><button role="tab" aria-selected="true" aria-controls="brief-short" data-brief-tab="short">단타 · 1–5거래일</button><button role="tab" aria-selected="false" aria-controls="brief-long" data-brief-tab="long">장기 · 6–12개월</button></div>${view('short',b.short)}${view('long',b.long)}`:`<h4>이어서 살펴볼 기업</h4><p>공시 확인 대상이며 상승 추천 순위가 아닙니다.</p><div class="brief-candidates">${b.watchCandidates.map(e=>`<button data-brief-company="${esc(e.stockCode)}"><strong>${esc(e.name)} ↗</strong><span>${esc(e.title)}</span></button>`).join('')}</div>`}<h4 class="brief-section-title">핵심 공시 · 무엇을 봐야 하나요?</h4><div class="brief-events">${b.topEvents.map(e=>`<article><small>${esc(e.name)} · ${receiptDate(e.date)}</small><h4><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.title)} ↗</a></h4><p>${esc(e.takeaway)}</p></article>`).join('')||'<p>조회 기간에 해당 유형의 공시가 없습니다.</p>'}</div><div class="brief-gaps"><strong>분석 범위</strong><p>${esc(b.missing.join(' · '))}</p><small>${esc(b.sourceNotes.join(' '))}</small></div>`:'<p>이전 저장 기록입니다. 다시 조회하면 종합 요약을 볼 수 있습니다.</p>'}<section class="brief-news"><h4>관련 뉴스</h4>${result.news?.status==='available'?`${result.news.items.slice(0,5).map(n=>`<article><a href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">${esc(n.title)} ↗</a><p>${esc(n.snippet)}</p><small>${esc(n.publishedAt.slice(0,10))}</small></article>`).join('')||'<p>최근 검색된 기사가 없습니다.</p>'}<small>검색 요약입니다. 기사 본문 검증·주가와의 인과 분석은 수행하지 않았습니다.</small>`:`<p>${esc(result.news?.message||'뉴스 공급원 미연결')}</p><a href="https://guide.ncloud-docs.com/docs/apihub-application" target="_blank" rel="noopener noreferrer">NAVER API HUB 뉴스 신청 안내 ↗</a>`}</section><details class="brief-raw"><summary>공시 원문 목록 · ${result.count}건 중 최신 ${result.events.length}건</summary><div class="research-grid">${result.events.map(e=>`<article class="evidence-card"><small>${esc(e.name)} · ${receiptDate(e.receiptDate)}</small><h4><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">${esc(e.title)} ↗</a></h4><p>${esc(e.check)}</p></article>`).join('')}</div></details><details class="brief-raw"><summary>수집 범위와 주의사항</summary>${list(result.warnings||[])}</details><div class="result-actions"><button id="exportResearch">리포트 JSON 저장 ↓</button></div>`;
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
function candidateGroup(key,title,items){return `<section><div class="selection-heading"><div class="eyebrow">${key==='short'?'SHORT TERM · 5 TRADING DAYS':'LONG TERM · 12 MONTHS'}</div><h2>${title}<span>${items.length} / 4</span></h2></div><div class="candidate-grid">${Array.from({length:4},(_,i)=>{const c=items[i];return c?`<button class="candidate-card" data-candidate="${esc(c.stockCode)}" data-horizon="${key}"><span class="candidate-rank">0${i+1} · ${esc(c.market)}</span><h3>${esc(c.name)} <span>↗</span></h3><small>${esc(c.stockCode)} · ${Number(c.close).toLocaleString()}원</small><div class="candidate-return"><span>예상 수익성 · 기준 시나리오</span><strong>${c.scenario?fmtReturn(c.scenario.returns.base):'산출 보류'}</strong><small>${c.scenario?`${esc(c.scenario.horizon)} · 보수 ${fmtReturn(c.scenario.returns.bear)} / 낙관 ${fmtReturn(c.scenario.returns.bull)}`:'비교 자료 부족'}</small></div><ul>${c.reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><div class="candidate-open">선정 이유·상세 분석·예상 경로 보기 →</div><small>검증 전 가정 시나리오 · 수익 보장 아님</small></button>`:`<div class="candidate-card candidate-empty"><span>0${i+1}</span><h3>조건 충족 후보 없음</h3><p>자료가 충분한 종목만 채웁니다.</p></div>`;}).join('')}</div></section>`;}
function renderSelection(selection){
 $('#movementLab').hidden=true;
 selectionBoard.innerHTML=`<div class="eyebrow">VERDANT · RESEARCH SELECTION</div><h2 class="selection-title">단타 4개, 장기 4개.<br>근거를 보고 선택하세요.</h2><p>시세 기준 ${receiptDate(selection?.asOf)} · ${selection?.universe||0}개 시세 중 ${selection?.reviewed||0}개 실적 검토</p>${selection?.status==='available'?`${candidateGroup('short','단타 후보',selection.short)}${candidateGroup('long','장기 후보',selection.long)}`:`<div class="brief-gaps">${esc(selection?.message||'아직 조회하지 않았습니다. 위의 후보 찾기를 눌러 주세요.')}</div>`}<details class="brief-raw"><summary>선정 방식과 예상 수익성 계산 기준</summary><p>${esc(selection?.message||'KRX·DART 자료를 조회해 별도 전략으로 선별합니다.')}</p><p>${esc(selection?.limitations||'')}</p><p>예상 수익성은 검증 전 모델의 가정값입니다. 확률·보장 수익률이 아닙니다. 상세 그래프에서 계산식과 하락 시나리오를 함께 확인하세요.</p></details>`;
 selectionBoard.querySelectorAll('[data-candidate]').forEach(button=>button.addEventListener('click',()=>{selectedHorizon=button.dataset.horizon;startActualResearch(button.dataset.candidate,30);}));
}
function scenarioChart(s){
 if(!s)return '<div class="brief-gaps">예상 경로를 계산할 비교 자료가 충분하지 않습니다.</div>';
 const all=Object.values(s.paths).flat().map(p=>p.price),min=Math.min(...all)*.98,max=Math.max(...all)*1.02;
 const y=p=>180-(p-min)/(max-min)*150;
 return `<section class="projection-panel"><div class="eyebrow">FORWARD SCENARIOS · ${esc(s.horizon)}</div><h3>예상 가격 경로</h3><p>시작 ${Number(s.basePrice).toLocaleString()}원 · ${receiptDate(s.asOf)} 종가 기준</p><svg viewBox="0 0 680 225" role="img" aria-label="보수·기준·낙관 가격 가정 경로"><path d="M45 30H655M45 105H655M45 180H655" stroke="#405137" stroke-dasharray="4 6"/>${Object.entries(s.paths).map(([key,points])=>`<polyline points="${points.map(p=>`${45+p.step*100},${y(p.price).toFixed(1)}`).join(' ')}" fill="none" stroke="${{bear:'#eda49b',base:'#d0f792',bull:'#8bc5eb'}[key]}" stroke-width="3" stroke-dasharray="${key==='base'?'0':'6 5'}"/><text x="650" y="${y(points.at(-1).price)-7}" text-anchor="end" fill="${{bear:'#eda49b',base:'#d0f792',bull:'#8bc5eb'}[key]}" font-size="12">${{bear:'보수',base:'기준',bull:'낙관'}[key]} ${fmtReturn(s.returns[key])}</text>`).join('')}<text x="45" y="216" fill="#abbba3" font-size="12">기준일</text><text x="645" y="216" text-anchor="end" fill="#abbba3" font-size="12">${esc(s.horizon)} 후</text></svg><div class="scenario-metrics">${Object.entries(s.returns).map(([key,v])=>`<div><small>${{bear:'보수',base:'기준',bull:'낙관'}[key]}</small><strong>${fmtReturn(v)}</strong><span>${Math.round(s.basePrice*(1+v/100)).toLocaleString()}원</span></div>`).join('')}</div><details class="brief-raw"><summary>계산 가정과 해석</summary><p>${esc(s.method)}</p><p>${esc(s.limitations)}</p></details></section>`;
}
renderResearch=function(result){
 if(!result.company){renderSelection(result.selection);$('#researchResult').classList.add('hidden');selectionBoard.scrollIntoView({behavior:'smooth',block:'start'});return;}
 $('#movementLab').hidden=false;renderCompanyBrief(result);
 const target=$('#researchResult');target.querySelector('.brief-tabs')?.remove();
 target.querySelectorAll('.brief-perspective').forEach(panel=>{panel.hidden=panel.id!==`brief-${selectedHorizon}`;});
 const lead=target.querySelector('.brief-lead');if(lead){lead.querySelector('h2').textContent=`${result.company.name} · ${selectedHorizon==='short'?'단타':'장기'} 후보 상세 분석`;lead.querySelector('p').textContent=`선택한 투자 기간의 가격·실적 근거, 위험과 예상 경로를 확인하세요. ${result.brief.overview}`;lead.insertAdjacentHTML('afterend',scenarioChart(result.scenarios?.[selectedHorizon]));}
 const back=document.createElement('button');back.className='lookup-button';back.textContent='← 단타·장기 후보 목록으로';back.onclick=()=>{ $('#movementLab').hidden=true;selectionBoard.scrollIntoView({behavior:'smooth'});};target.prepend(back);
};
$('#heroTitle').innerHTML='다음 기회를 찾는,<br><em>두 가지 투자 시선.</em>';
$('.hero-copy p').innerHTML='단타 후보 4개와 장기 후보 4개를 추리고,<br>예상 수익성부터 기업별 상세 분석까지.';
$('#analyzeButton span').textContent='단타·장기 후보 찾기';
$('.keyboard-hint').innerHTML='<kbd>↵</kbd> 리서치하고 8개 후보 선별';
$('.footer p').textContent='KRX·DART 기반 조건 선별. 예상 경로는 검증 전 가정 시나리오이며 수익을 보장하지 않습니다.';
$('.demo-badge').textContent='RESEARCH SCREENER';
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
 if(flow?.status!=='available')return `<section class="flow-detail"><div class="eyebrow">INVESTOR FLOW</div><h3>외국인·기관 수급 미확인</h3><p>${esc(flow?.message||'수급 기준일 불일치 또는 자료 미연결')}</p><p>가격·거래량으로 매수 주체를 추정하지 않습니다.</p></section>`;
 return `<section class="flow-detail"><div class="eyebrow">INVESTOR FLOW · ${receiptDate(flow.asOf)}</div><h3>누가 사들이고 있나요?</h3><div class="flow-windows">${['short','long'].map(key=>{const w=flow[key];return `<article><h4>${key==='short'?'최근 5거래일':'최근 20거래일'}</h4>${w.status==='available'?`<p>외국인 <strong>${f(w.foreign)}</strong><br>기관 <strong>${f(w.institution)}</strong></p><p>동반 순매수 ${w.bothDays}/${w.observations}일${w.intensity!=null?` · 거래량 대비 ${w.intensity.toFixed(2)}%`:''}</p><strong>${w.qualified?'수급 조건 충족':'수급 조건 미충족'}</strong>`:`<p>기간 자료 부족 · ${w.observations}/${w.required}개</p>`}</article>`;}).join('')}</div><p>연속 순매수: 외국인 ${flow.foreignStreak}일 · 기관 ${flow.institutionStreak}일</p><details class="brief-raw"><summary>일별 순매수 원자료 · 수량 기준</summary><div class="flow-table-wrap"><table><thead><tr><th>일자</th><th>외국인</th><th>기관</th></tr></thead><tbody>${flow.rows.map(r=>`<tr><td>${receiptDate(r.date)}</td><td>${f(r.foreign)}</td><td>${f(r.institution)}</td></tr>`).join('')}</tbody></table></div></details><small>${esc(flow.source)} · ${esc(flow.limitations)}</small></section>`;
}
const renderResearchBeforeFlow=renderResearch;
renderResearch=function(result){renderResearchBeforeFlow(result);if(result.company){const target=$('#researchResult');const graph=target.querySelector('.projection-panel');if(graph)graph.insertAdjacentHTML('beforebegin',investorFlowHTML(result.investorFlow));else target.insertAdjacentHTML('beforeend',investorFlowHTML(result.investorFlow));}};
renderSelection(null);
