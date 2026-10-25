import test from 'node:test';
import assert from 'node:assert/strict';
import { runResearch, dateRange, classifyTitle } from '../lib/market-research.mjs';
const key = 'x'.repeat(40);
test('Korean date changes before UTC date', () => {
  assert.deepEqual(dateRange(7, new Date('2026-10-24T16:00:00Z')), { start: '20261019', end: '20261025' });
});
test('Fetch every page in each market, retain corrections, deduplicate receipts', async () => {
  const calls = [];
  const fetcher = async rawUrl => {
    const url = new URL(rawUrl);
    const market = url.searchParams.get('corp_cls'), page = Number(url.searchParams.get('page_no'));
    calls.push([market, page]);
    return Response.json({ status: '000', total_page: 2, list: [{ corp_name: '테스트', report_nm: page === 2 ? '[기재정정]사업보고서' : '사업보고서', rcept_no: market + page, rcept_dt: '20261023', corp_cls: market }] });
  };
  const r = await runResearch({ key, fetcher });
  assert.equal(r.count, 4); assert.deepEqual(calls, [['Y',1],['Y',2],['K',1],['K',2]]);
  assert.equal(r.candidates.length, 0); assert.equal(r.coverage.prices, 'not_connected');
  assert.ok(r.events.some(e => e.kind === '정정 공시'));
  assert.ok(!JSON.stringify(r).includes(key));
});
test('Empty results are a valid completed lookup, not fabricated candidates', async () => {
  const r = await runResearch({ key, fetcher: async () => Response.json({ status: '013' }) });
  assert.equal(r.count, 0); assert.deepEqual(r.candidates, []);
});
test('DART errors never include upstream messages or key-bearing URLs', async () => {
  await assert.rejects(runResearch({ key, fetcher: async () => Response.json({ status:'010', message:key }) }), e => e.code === 'dart_010' && !e.message.includes(key));
  await assert.rejects(runResearch({ key, fetcher: async () => { throw Error('https://example.com?key=' + key); } }), e => e.code === 'network' && !e.message.includes(key));
});
test('Page cap is explicitly reported as partial coverage', async () => {
  const r = await runResearch({ key, fetcher: async rawUrl => { const url = new URL(rawUrl); return Response.json({ status:'000', total_page:13, list:[{ rcept_no: url.searchParams.get('corp_cls') + url.searchParams.get('page_no'), report_nm:'공시' }] }); } });
  assert.equal(r.partial, true); assert.equal(r.count,24);
});
test('Dilution is a question to check, not an asserted cause of decline', () => {
  assert.equal(classifyTitle('유상증자결정').kind, '자금 조달');
  assert.match(classifyTitle('유상증자결정').check, /확인/);
});
