import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeKrx, fetchKrxDay, loadKrxPriceContext } from '../lib/krx-market.mjs';
test('KRX numeric fields preserve zero and missing values',()=>{
  const r=normalizeKrx({TDD_CLSPRC:'70,000',FLUC_RT:'-2.10',ACC_TRDVOL:'0',ACC_TRDVAL:'-'});
  assert.equal(r.close,70000);assert.equal(r.changePercent,-2.1);assert.equal(r.volume,0);assert.equal(r.turnover,null);
});
test('Header credentials and unauthorized response remain server-only',async()=>{
  let count=0;
  const r=await loadKrxPriceContext({key:'test-secret',stockCode:'005930',now:new Date('2026-10-26T00:00:00Z'),fetcher:async(url,init)=>{
    count++;assert.equal(init.headers.AUTH_KEY,'test-secret');assert.ok(!url.includes('test-secret'));
    return Response.json({respCode:'401',respMsg:'test-secret'},{status:401});
  }});
  assert.equal(r.status,'unauthorized');assert.equal(count,1);assert.ok(!JSON.stringify(r).includes('test-secret'));
});
test('Collect five actual daily closes in chronological order, skip weekends',async()=>{
  const requested=[];
  const r=await loadKrxPriceContext({key:'test-key',stockCode:'005930',now:new Date('2026-10-26T00:00:00Z'),fetcher:async(url)=>{
    const date=new URL(url).searchParams.get('basDd');requested.push(date);
    return Response.json({OutBlock_1:[{BAS_DD:date,ISU_CD:'005930',ISU_NM:'테스트',MKT_NM:'KOSPI',TDD_CLSPRC:'70000',FLUC_RT:'0',ACC_TRDVOL:'10'}]});
  }});
  assert.deepEqual(requested,['20261023','20261022','20261021','20261020','20261019']);
  assert.equal(r.latest.date,'20261023');assert.equal(r.series[0].date,'20261019');assert.equal(r.intraday,false);
});
test('Invalid payload and network failures are distinguished from empty days',async()=>{
  await assert.rejects(fetchKrxDay({key:'key',date:'20261023',fetcher:async()=>Response.json({})}),e=>e.code==='format');
  const r=await loadKrxPriceContext({key:'key',stockCode:'005930',fetcher:async()=>{throw Error('contains-key')}});
  assert.equal(r.status,'network');assert.ok(!r.message.includes('contains-key'));
});
