import test from 'node:test';
import assert from 'node:assert/strict';
import {barChart,dailyChart} from '../azienda/charts.mjs';
import {HOURS_DEMO,HOUR_LIMITS,summarizeFleetHours} from '../azienda/hours.mjs';
import {DEMO} from '../azienda/model.mjs';
const rows=summarizeFleetHours(HOURS_DEMO,DEMO.drivers,'org-demo').rows;
test('grafico settimanale SVG e soglia corretta',()=>{
 const html=barChart(rows,DEMO.drivers,{key:'weeklyMinutes',limit:HOUR_LIMITS.weekly,label:'Settimanale'});
 assert.match(html,/<svg/);assert.match(html,/Riferimento 56h/);assert.match(html,/58h 10m/);assert.match(html,/is-over/);
});
test('il valore mancante non viene trasformato in zero o verde',()=>{
 const html=barChart(rows,DEMO.drivers,{key:'fortnightMinutes',limit:HOUR_LIMITS.fortnight,label:'Due settimane'});
 assert.match(html,/>N\/D</);assert.match(html,/Riferimento 90h/);assert.match(html,/94h 40m/);
});
test('grafico giornaliero solo se dati coerenti con somma settimanale',()=>{
 for(const report of HOURS_DEMO.slice(0,3)){
  assert.equal(report.demoDailyMinutes.reduce((a,b)=>a+b,0),report.weeklyMinutes);
  assert.match(dailyChart(report),/<polyline/);
 }
 assert.match(dailyChart(HOURS_DEMO[3]),/non disponibile/);
 assert.match(dailyChart({...HOURS_DEMO[0],weeklyMinutes:1}),/non disponibile/);
});
test('i titoli personalizzati vengono sottoposti ad escape',()=>{
 const output=barChart(rows,[{...DEMO.drivers[0],label:'<script>alert("x")</script>'},...DEMO.drivers.slice(1)],{key:'weeklyMinutes',limit:HOUR_LIMITS.weekly,label:'<img src=x>'});
 assert.doesNotMatch(output,/<script>|<img/);
 assert.match(output,/&lt;img/);
});
test('la legenda non dichiara nessuna conformità o infrazione accertata',()=>{
 const html=barChart(rows,DEMO.drivers,{key:'weeklyMinutes',limit:HOUR_LIMITS.weekly,label:'Esempio'});
 assert.match(html,/non rappresenta l.accertamento/);
 assert.doesNotMatch(html,/\bCONFORME\b/);
});
