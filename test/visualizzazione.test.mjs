import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

test('i moduli grafici e la dashboard superano il controllo sintattico',()=>{
 for(const path of ['azienda/app.mjs','azienda/charts.mjs','azienda/hours.mjs']){
  assert.doesNotThrow(()=>execFileSync(process.execPath,['--check',path],{stdio:'pipe'}));
 }
});
test('la dashboard e il controllo ore contengono i grafici',()=>{
 const src=readFileSync('azienda/app.mjs','utf8');
 assert.match(src,/chartsForFleet\(reports,true\)/);
 assert.match(src,/chartsForFleet\(results\)/);
 assert.match(src,/chartForDriver\(selected\)/);
 const css=readFileSync('azienda/professional.css','utf8');
 assert.match(css,/\.chart-columns/);
 assert.match(css,/\.chart-svg/);
});
