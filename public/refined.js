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
    $('#connectionLine').textContent = liveStatus.dart ? (liveStatus.execution === 'local' ? 'DART PC 연결 준비 완료 · 버튼으로 공시 조회' : 'DART 클라우드 연결 확인 필요 · PC 실행 버전 사용 가능') : 'DART 서버 설정 필요';
    $('#dartLed').classList.toggle('ready', Boolean(liveStatus.dart));
    $('.demo-badge').textContent = liveStatus.dart ? 'DART READY · DEMO CARDS' : 'DEMO · SETUP REQUIRED';
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
  $('#movementCoverage').innerHTML = '<span class="coverage-pill">DART <b>조회 전</b></span><span class="coverage-pill">KRX <b>승인 대기</b></span><span class="coverage-pill">NEWS <b>미연결</b></span>';
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
  const timeout = setTimeout(() => abort.abort('timeout'), 180000);
  steps.splice(0, steps.length, ['종목과 조회 범위 확인','DART · 공식 기업 목록'], ['공시 목록 수집','DART · 페이지별 실제 조회'], ['근거 자료 정리','접수번호 · 원문 · 제목 유형'], ['자료 범위 확인','시세·뉴스 누락 상태 표시']);
  $('#analysisTitle').textContent = query ? '기업의 변화를 읽고 있습니다.' : '오늘의 공시를 한곳에 모읍니다.';
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
    $('#researchResult').scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'start'});
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

function renderResearch(result) {
  const company = result.company;
  if (company) {
    updateCompany(company.name,company.stockCode);
    $('#movementAsOf').textContent = `${kstTime(result.createdAt)} KST · 수집`;
    $('#movementCoverage').innerHTML = `<span class="coverage-pill available">DART <b>${result.count}건 확인</b></span><span class="coverage-pill">KRX <b>미연결</b></span><span class="coverage-pill">NEWS <b>미연결</b></span>`;
    $('#movementConclusion').textContent = `${result.count}건의 공시를 확인했습니다. 가격 변동 원인은 아직 판단을 보류합니다.`;
    $('#conclusionBadge').textContent = '공시 확인 · 원인 미확정';
    $('#causeRows').innerHTML = `<div class="cause-row"><span class="cause-number">01</span><div><h4>기업 공시 · 확인된 사실</h4><p>${result.count ? esc(result.events[0]?.title) : '선택한 기간에 접수된 공시가 없습니다.'}</p></div><span class="cause-state">${result.count?'확인':'없음'}</span></div><div class="cause-row"><span class="cause-number">02</span><div><h4>시장·업종 비교 · 자료 필요</h4><p>같은 기간 종목과 시장의 수익률을 아직 비교하지 못했습니다.</p></div><span class="cause-state">미연결</span></div><div class="cause-row"><span class="cause-number">03</span><div><h4>뉴스와의 시간 관계 · 자료 필요</h4><p>기사 시점과 가격 반응을 연결할 뉴스 공급원이 필요합니다.</p></div><span class="cause-state">미연결</span></div>`;
  }
  const target = $('#researchResult'); target.classList.remove('hidden');
  target.innerHTML = `<div class="research-header"><div><div class="eyebrow">ACTUAL DISCLOSURES · ${result.partial?'PARTIAL COVERAGE':'DART'}</div><h3>${esc(company?.name || '코스피 · 코스닥')} 공시 리서치</h3><p>${receiptDate(result.range.start)} – ${receiptDate(result.range.end)} · 수집 ${kstTime(result.createdAt)} KST<br>원문 링크가 있는 실제 공시 · 최신 ${result.events.length}건 표시</p></div><div class="result-count">${result.count.toLocaleString()}<small>건 수집</small></div></div><div class="result-summary">${esc(result.conclusion)}<br><span class="data-note">${result.partial?'시장별 최대 12페이지 수집으로 누락이 있습니다. ':''}공시 제목의 유형을 분류했습니다. 원문 내용·재무 수치 분석과 상승 후보 선정은 다음 연결 단계입니다.</span></div>${result.events.length ? `<div class="research-grid">${result.events.map(event => `<article class="evidence-card"><div class="evidence-top"><span class="event-kind ${esc(event.tone)}">${esc(event.kind)}</span><time class="evidence-date">${receiptDate(event.receiptDate)}</time></div><div class="evidence-company">${esc(event.name)} · ${esc(event.stockCode || '종목코드 없음')}</div><a href="${esc(event.url)}" target="_blank" rel="noopener noreferrer">${esc(event.title)} ↗</a><p class="evidence-check">${esc(event.check)}</p></article>`).join('')}</div>` : '<div class="research-empty">선택한 기간에 공시가 없습니다.<br>기간을 넓히거나 다른 기업을 조회해 보세요.</div>'}<div class="research-warnings">${result.warnings.map(w=>`· ${esc(w)}`).join('<br>')}</div><div class="result-actions"><button id="exportResearch">조회 결과 JSON 저장 ↓</button><button id="backToMovement">종목 분석으로 ↑</button></div>`;
  $('#exportResearch').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(result,null,2)], {type:'application/json'}), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `verdant-${company?.stockCode || 'market'}-${result.range.end}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('#backToMovement').addEventListener('click',()=>$('#movementLab').scrollIntoView({behavior:reduceMotion?'instant':'smooth'}));
}

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
refreshConnection();
