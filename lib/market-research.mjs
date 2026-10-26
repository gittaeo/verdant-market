import { inflateRawSync } from 'node:zlib';
import { loadKrxPriceContext } from './krx-market.mjs';
import { loadFinancials, buildResearchBrief } from './research-brief.mjs';
import { loadNews } from './news-search.mjs';

export class ResearchError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const base = 'https://opendart.fss.or.kr/api/';
const messages = {
  '010': 'DART 인증키가 올바르지 않습니다. 서버의 인증키 설정을 확인해 주세요.',
  '011': '사용할 수 없는 DART 인증키입니다.',
  '012': 'DART에 등록된 접속 IP를 확인해 주세요. 클라우드 서버에서는 별도 IP 설정이 필요할 수 있습니다.',
  '020': 'DART 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',
  '800': 'DART 시스템 점검 중입니다. 잠시 후 다시 시도해 주세요.',
};
export function dateRange(days, now = new Date()) {
  const date = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const end = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - days + 1);
  const format = d => d.toISOString().slice(0, 10).replaceAll('-', '');
  return { start: format(start), end: format(end) };
}
async function requestDart(endpoint, params, key, signal, fetcher) {
  const url = new URL(endpoint, base);
  url.searchParams.set('crtfc_key', key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  let response;
  try {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, 25000);
    try { response = await fetcher(url.toString(), { signal: controller.signal }); }
    finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  } catch {
    throw new ResearchError(signal?.aborted ? 'cancelled' : 'network', signal?.aborted ? '분석을 취소했습니다.' : 'DART 응답을 받지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.');
  }
  if (!response.ok) throw new ResearchError('upstream', 'DART 서버가 정상 응답하지 않았습니다. 잠시 후 다시 시도해 주세요.');
  return response;
}
export function unzipCorporateFile(bytes) {
  const buffer = Buffer.from(bytes);
  // Read the central directory; ZIP local headers can omit compressed sizes.
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new ResearchError('format', 'DART 기업 목록 파일을 읽을 수 없습니다.');
  let offset = buffer.readUInt32LE(end + 16);
  const entries = buffer.readUInt16LE(end + 10);
  for (let i = 0; i < entries; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10), size = buffer.readUInt32LE(offset + 20);
    const nameLen = buffer.readUInt16LE(offset + 28), extra = buffer.readUInt16LE(offset + 30), comment = buffer.readUInt16LE(offset + 32);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLen).toString();
    if (name.toLowerCase().endsWith('.xml')) {
      const local = buffer.readUInt32LE(offset + 42);
      const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
      const compressed = buffer.subarray(start, start + size);
      if (method === 8) return inflateRawSync(compressed, { maxOutputLength: 40 * 1024 * 1024 }).toString('utf8');
      if (method === 0) return compressed.toString('utf8');
    }
    offset += 46 + nameLen + extra + comment;
  }
  throw new ResearchError('format', 'DART 기업 목록 형식을 확인할 수 없습니다.');
}
let companiesCache = null;
async function resolveCompany(query, key, signal, fetcher) {
  if (!companiesCache || Date.now() - companiesCache.at > 86400000) {
    const response = await requestDart('corpCode.xml', {}, key, signal, fetcher);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 12 * 1024 * 1024) throw new ResearchError('format', '기업 목록 파일의 크기가 예상 범위를 벗어났습니다.');
    let xml;
    try { xml = unzipCorporateFile(bytes); }
    catch (error) { if (error instanceof ResearchError) throw error; throw new ResearchError('format', '기업 목록 압축파일을 읽지 못했습니다.'); }
    const companies = [];
    const field = (block, tag) => block.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]?.trim() || '';
    for (const match of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
      const stockCode = field(match[1], 'stock_code');
      if (/^\d{6}$/.test(stockCode)) companies.push({ stockCode, corpCode: field(match[1], 'corp_code'), name: field(match[1], 'corp_name').replaceAll('&amp;', '&') });
    }
    companiesCache = { at: Date.now(), companies };
  }
  const normalized = query.trim().toLowerCase().replaceAll(' ', '');
  const company = companiesCache.companies.find(c => c.stockCode === normalized || c.name.toLowerCase().replaceAll(' ', '') === normalized);
  if (!company) throw new ResearchError('not_found', '정확한 상장 기업명 또는 6자리 종목코드를 입력해 주세요. 예: 삼성전자 / 005930');
  return company;
}
function normalize(item, collectedAt) {
  return { corpCode: item.corp_code, stockCode: item.stock_code, name: item.corp_name, title: item.report_nm,
    receiptDate: item.rcept_dt, receiptNo: item.rcept_no, market: item.corp_cls,
    url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${encodeURIComponent(item.rcept_no)}`, collectedAt };
}
export function classifyTitle(title) {
  if (/정정/.test(title)) return { kind: '정정 공시', tone: 'amber', check: '이전 공시에서 바뀐 내용과 영향 범위를 원문에서 확인하세요.' };
  if (/유상증자|전환사채|신주인수권/.test(title)) return { kind: '자금 조달', tone: 'amber', check: '발행 조건, 자금 사용 목적, 기존 주주의 지분 희석 가능성을 확인하세요.' };
  if (/자기주식|자사주/.test(title)) return { kind: '주주환원·자사주', tone: 'green', check: '취득·처분·소각 중 무엇인지, 규모와 일정이 확정됐는지 확인하세요.' };
  if (/공급계약|수주/.test(title)) return { kind: '계약·수주', tone: 'green', check: '계약 규모, 기간과 매출 대비 비중을 확인하세요. 제목만으로 이익 증가를 확정할 수 없습니다.' };
  if (/실적|사업보고서|반기보고서|분기보고서/.test(title)) return { kind: '실적·정기보고', tone: 'blue', check: '매출·이익·현금흐름과 전년 동기 변화를 비교하세요.' };
  return { kind: '기업 공시', tone: 'neutral', check: '공시의 원문과 적용 시점, 주가에 영향을 줄 수 있는 규모를 확인하세요.' };
}
export async function runResearch({ query = '', days = 7, key, krxKey, newsClientId, newsClientSecret, signal, onProgress = () => {}, fetcher = fetch, now = new Date() }) {
  if (!key || !/^[a-zA-Z0-9]{40}$/.test(key)) throw new ResearchError('configuration', 'DART 서버 연결 설정이 필요합니다.');
  if (![7, 30, 90].includes(days)) throw new ResearchError('validation', '조회 기간은 7일, 30일, 90일 중 선택해 주세요.');
  const range = dateRange(days, now), collectedAt = now.toISOString();
  onProgress({ stage: 'company', message: query ? 'DART 기업 목록에서 종목을 확인하고 있습니다.' : '최근 공시 조회 범위를 확인했습니다.' });
  const company = query ? await resolveCompany(query, key, signal, fetcher) : null;
  onProgress({ stage: 'disclosures', message: company ? `${company.name} 공시를 조회하고 있습니다.` : '코스피·코스닥 공시를 조회하고 있습니다.' });
  const rows = [], maxPages = 12; let partial = false;
  for (const market of company ? [''] : ['Y', 'K']) {
    let page = 1, total = 1;
    do {
      if (signal?.aborted) throw new ResearchError('cancelled', '분석을 취소했습니다.');
      const params = { bgn_de: range.start, end_de: range.end, page_no: page, page_count: 100, sort: 'date', sort_mth: 'desc', last_reprt_at: 'N' };
      if (company) params.corp_code = company.corpCode; else params.corp_cls = market;
      const response = await requestDart('list.json', params, key, signal, fetcher);
      let data;
      try { data = await response.json(); } catch { throw new ResearchError('format', 'DART 공시 응답 형식이 올바르지 않습니다.'); }
      if (data.status === '013') break;
      if (data.status !== '000') throw new ResearchError('dart_' + String(data.status).replace(/[^0-9]/g, ''), messages[data.status] || 'DART 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      if (!Array.isArray(data.list)) throw new ResearchError('format', 'DART 공시 목록을 확인할 수 없습니다.');
      rows.push(...data.list.map(item => normalize(item, collectedAt)));
      total = Number(data.total_page) || 1;
      onProgress({ stage: 'disclosures', message: `${company?.name || (market === 'Y' ? '코스피' : '코스닥')} · ${page}/${total}페이지 · ${rows.length}건 확인` });
      page++;
      if (page > maxPages && page <= total) partial = true;
    } while (page <= total && page <= maxPages);
  }
  onProgress({ stage: 'evidence', message: '접수번호·원문 링크를 연결하고 공시 유형을 분류합니다.' });
  const disclosures = [...new Map(rows.map(r => [r.receiptNo, r])).values()].sort((a,b) => b.receiptNo.localeCompare(a.receiptNo));
  const events = disclosures.slice(0, 20).map(item => ({ ...item, ...classifyTitle(item.title) }));
  onProgress({ stage: 'coverage', message: company && krxKey ? 'KRX 일별 종가·거래량을 확인합니다.' : '시세·뉴스 연결 범위를 점검합니다.' });
  const priceContext = company ? await loadKrxPriceContext({key:krxKey,stockCode:company.stockCode,now,signal}) : {status:krxKey?'company_required':'not_connected',series:[],message:'종목별 리서치에서 KRX를 조회합니다.'};
  onProgress({stage:'coverage',message:'실적·재무를 비교하고 단타·장기 관점의 판단을 정리합니다.'});
  const financials=await loadFinancials({company,now,key,request:(endpoint,params)=>requestDart(endpoint,params,key,signal,fetcher)});
  const news=await loadNews({query:company?.name,clientId:newsClientId,clientSecret:newsClientSecret,signal,now});
  if(signal?.aborted)throw new ResearchError('cancelled','분석을 취소했습니다.');
  const result={ id: crypto.randomUUID(), dataMode: 'actual', createdAt: collectedAt, range, company, count: disclosures.length,
    partial, disclosures, events, candidates: [], priceContext,financials,news,
    coverage: { dart: 'available', prices: priceContext.status, financials:financials.status,news:news.status, intraday: 'not_connected' },
    conclusion: priceContext.latest ? '공시와 KRX 일별 종가·거래량을 확인했습니다. 뉴스와 업종 비교가 없어 가격 변동 원인은 확정하지 않습니다.' : '공시는 확인했습니다. 가격 자료의 연결 상태를 확인해 주세요. 가격 변동 원인은 아직 판단할 수 없습니다.',
    warnings: [ ...(partial ? ['요청량 제한으로 시장별 최대 12페이지까지 수집한 부분 결과입니다.'] : []), ...(krxKey&&company&&priceContext.status!=='available'?[priceContext.message]:[]), '공시 접수일자는 정확한 공개 시각이 아닙니다.', '공시 제목 기반 분류이며 원문 내용이나 가격 영향은 아직 검증하지 않았습니다.' ] };
  result.brief=buildResearchBrief({company,disclosures,priceContext,financials,news});
  return result;
}
