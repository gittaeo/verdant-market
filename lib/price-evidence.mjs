// Observations only: never turn a handful of closes into an expected return.
export function priceEvidence(series = []) {
 const rows=series.filter(r=>/^\d{8}$/.test(r.date||'')&&Number.isFinite(r.close)&&r.close>0).sort((a,b)=>a.date.localeCompare(b.date));
 if(new Set(rows.map(r=>r.date)).size!==rows.length)return null;
 if(rows.length<2)return null;
 const first=rows[0],last=rows.at(-1),changes=rows.slice(1).map((r,i)=>(r.close/rows[i].close-1)*100);
 let peak=first.close,drawdown=0;for(const r of rows){peak=Math.max(peak,r.close);drawdown=Math.min(drawdown,(r.close/peak-1)*100);}
 const mean=changes.reduce((a,b)=>a+b,0)/changes.length;
 const deviation=changes.length>=2?Math.sqrt(changes.reduce((sum,x)=>sum+(x-mean)**2,0)/(changes.length-1)):null;
 const ranges=rows.filter(r=>Number.isFinite(r.low)&&Number.isFinite(r.high)&&r.low>0&&r.low<=r.close&&r.high>=r.close).map(r=>(r.high/r.low-1)*100);
 const earlier=rows.slice(0,-1).map(r=>r.volume).filter(v=>Number.isFinite(v)&&v>=0),averageVolume=earlier.length?earlier.reduce((a,b)=>a+b,0)/earlier.length:0;
 return {rows,observations:rows.length,change:(last.close/first.close-1)*100,drawdown,dailyDeviation:deviation,bestDay:Math.max(...changes),worstDay:Math.min(...changes),meanIntradayRange:ranges.length?ranges.reduce((a,b)=>a+b,0)/ranges.length:null,volumeRatio:averageVolume>0&&Number.isFinite(last.volume)?last.volume/averageVolume:null};
}
