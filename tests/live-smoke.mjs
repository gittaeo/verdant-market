import { readFileSync, writeFileSync } from 'node:fs';
import { runResearch } from '../lib/market-research.mjs';
const key = readFileSync(new URL('../../DART API.txt', import.meta.url), 'utf8').trim();
if (!/^[a-zA-Z0-9]{40}$/.test(key)) throw Error('Invalid key file format');
writeFileSync(new URL('../.dev.vars', import.meta.url), `DART_API_KEY="${key}"\n`);
for (const query of ['005930', '000660']) {
  try {
    const result = await runResearch({ key, query, days:30 });
    console.log(JSON.stringify({ company:result.company?.name, code:result.company?.stockCode, count:result.count, events:result.events.length, partial:result.partial, firstDate:result.events[0]?.receiptDate, prices:result.coverage.prices }));
  } catch (error) { console.log(JSON.stringify({ code:error.code || 'internal', message:error.code ? error.message : 'Failed' })); process.exitCode=1; }
}
