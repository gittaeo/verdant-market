import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {priceEvidence} from '../lib/price-evidence.mjs';
const rows=[{date:'20261026',close:100,high:105,low:95,volume:100},{date:'20261027',close:120,high:125,low:99,volume:200},{date:'20261028',close:90,high:122,low:89,volume:300}];
test('Observed loss and drawdown use chronological closes, not symmetric scenario offsets',()=>{const e=priceEvidence([...rows].reverse());assert.ok(Math.abs(e.change+10)<1e-10);assert.equal(e.drawdown,-25);assert.equal(e.worstDay,-25);assert.ok(Math.abs(e.bestDay-20)<1e-10);assert.equal(e.volumeRatio,2);assert.ok(e.dailyDeviation>30);assert.equal(e.rows[0].date,'20261026');});
test('Missing ranges or volume stay missing; flat closes have zero variation',()=>{const e=priceEvidence(rows.map(r=>({date:r.date,close:100})));assert.equal(e.dailyDeviation,0);assert.equal(e.drawdown,0);assert.equal(e.meanIntradayRange,null);assert.equal(e.volumeRatio,null);});
test('Reject duplicated dates and insufficient usable closes',()=>{assert.equal(priceEvidence([rows[0],rows[0]]),null);assert.equal(priceEvidence([{date:'20261026',close:0},rows[1]]),null);assert.equal(priceEvidence([]),null);});
test('Different observed prices produce different charts; no legacy forecast values leak',()=>{
 const source=readFileSync(new URL('../public/refined.js',import.meta.url),'utf8');
 const code=source.slice(source.indexOf('function renderPriceEvidence'),source.indexOf('function scenarioChart'));
 const render=runInNewContext(code+';renderPriceEvidence',{esc:String,receiptDate:String,fmtReturn:n=>(n>=0?'+':'')+n.toFixed(1)+'%'});
 const a=render(rows),b=render(rows.map((r,i)=>({...r,close:[100,101,102][i],high:105,low:95})));
 assert.notEqual(a,b);assert.ok(a.includes('실제 고가·저가'));assert.ok(a.includes('예측 수익률 산출 보류'));assert.ok(!a.includes('보수'));assert.ok(!a.includes('낙관'));assert.ok(a.includes('-25.0%'));assert.ok(render([]).includes('부족'));
});

const forecastSource=readFileSync(new URL('../public/refined.js',import.meta.url),'utf8');
const pathCode=forecastSource.slice(forecastSource.indexOf('function conditionalPath'),forecastSource.indexOf('function futurePlot'));
const conditional=runInNewContext(pathCode+';conditionalPath');
test('Conditional future begins at the observed close and ends at the user assumption',()=>{for(const target of [-30,0,15,30]){const p=conditional(rows,target);assert.equal(p[0].price,90);assert.ok(Math.abs(p.at(-1).price-90*(1+target/100))<1e-9);assert.equal(p.length,6);assert.ok(p.every(x=>Number.isFinite(x.price)&&x.price>0));}});
test('Recent direction affects intermediate shape, never changes selected endpoint',()=>{const down=conditional(rows,10),up=conditional([{close:80},{close:90}],10);assert.ok(down[1].price<90);assert.ok(up[1].price>90);assert.equal(down.at(-1).price,up.at(-1).price);assert.equal(conditional(rows,31),null);assert.equal(conditional([],5),null);assert.equal(conditional(rows,NaN),null);});
