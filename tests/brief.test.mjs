import test from 'node:test';
import assert from 'node:assert/strict';
import {extractFinancials,buildResearchBrief} from '../lib/research-brief.mjs';
import {loadNews} from '../lib/news-search.mjs';
test('Interim cumulative financials compare with prior cumulative, never annual or quarter',()=>{
 const f=extractFinancials([{sj_div:'IS',account_id:'ifrs-full_Revenue',currency:'KRW',thstrm_amount:'40',thstrm_add_amount:'120',frmtrm_amount:'999',frmtrm_q_amount:'20',frmtrm_add_amount:'100'}],{code:'11012'},'CFS');
 assert.equal(f.revenue.value,120);assert.equal(f.revenue.previous,100);assert.ok(Math.abs(f.revenue.growth-20)<0.001);
});
test('Negative comparison base cannot produce misleading growth percentage',()=>{
 const f=extractFinancials([{sj_div:'IS',account_id:'dart_OperatingIncomeLoss',thstrm_amount:'10',frmtrm_amount:'-10'}],{code:'11011'},'CFS');assert.equal(f.operating.growth,null);
});
test('No prices or financials means no bullish investment label',()=>{
 const b=buildResearchBrief({company:{name:'테스트'},disclosures:[],priceContext:{series:[]},financials:{status:'empty'}});assert.equal(b.short.label,'자료 보완');assert.equal(b.long.label,'재무 확인 필요');
});
test('Volatility and financing risks take priority over positive price movement',()=>{
 const b=buildResearchBrief({company:{name:'테스트'},disclosures:[{title:'유상증자결정'}],priceContext:{series:[{close:100,volume:10},{close:120,volume:100}]}});assert.equal(b.short.label,'공시 위험 확인');
});
test('News skips malformed dates, duplicate links and future articles; strips markup',async()=>{
 const r=await loadNews({query:'테스트',clientId:'id',clientSecret:'secret',now:new Date('2026-10-26'),fetcher:async()=>Response.json({items:[{title:'<b>기사</b>',originallink:'https://example.com/a',pubDate:'2026-10-25'},{title:'중복',originallink:'https://example.com/a',pubDate:'2026-10-25'},{title:'오류',pubDate:'oops'}]})});assert.equal(r.items.length,1);assert.equal(r.items[0].title,'기사');assert.ok(!JSON.stringify(r).includes('secret'));
});
