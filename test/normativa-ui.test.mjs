import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {ROLE_NAV} from '../azienda/model.mjs';
import {EU_RULES,coverageSummary} from '../azienda/eu-rules.mjs';
import {regulationsView} from '../azienda/regulations-view.mjs';
test('pagina normativa riservata all amministratore nella demo',()=>{
 assert.ok(ROLE_NAV.admin.some(x=>x[0]==='regulations'));
 assert.ok(!ROLE_NAV.driver.some(x=>x[0]==='regulations'));
});
test('render contiene 23 regole e chiarisce lo stato non certificato',()=>{
 const ui={esc:x=>String(x),group:'Tutte',banner:()=>'',kicker:()=>'',panel:(a,b,c)=>c,metric:()=>'',tableWrap:(headers,rows)=>rows.join(''),badge:t=>t};
 const html=regulationsView(ui);
 assert.match(html,/Non è ancora un motore completo/);
 assert.match(html,/28 giorni/);
 assert.match(html,/48 ore/);
 assert.equal((html.match(/<tr>/g)||[]).length,EU_RULES.length);
});
test('app instrada la pagina normativa e la filtra',()=>{
 const src=readFileSync('azienda/app.mjs','utf8');
 assert.match(src,/case'regulations':return renderRegulations/);
 assert.match(src,/rule-filter/);
 assert.doesNotThrow(()=>execFileSync(process.execPath,['--check','azienda/app.mjs']));
});
test('il catalogo conserva gli stati non attivi',()=>{
 const s=coverageSummary();
 assert.equal(s.total,EU_RULES.length);
 assert.equal(s.preview,4);
 assert.ok(s.blocked>0);
});
