import test from 'node:test';
import assert from 'node:assert/strict';
import {EU_RULES,coverageSummary} from '../azienda/eu-rules.mjs';
import {previewContinuousDriving as rawContinuous,previewWeeklyAndWork as rawWeekly,normalizeTachoTimeline} from '../azienda/eu-evaluator.mjs';
const EVIDENCE={verifiedSource:true,qualifiedStartingRest:true,timelineComplete:true,workFromAllEmployers:true};
const previewContinuousDriving=events=>rawContinuous(events,EVIDENCE);
const previewWeeklyAndWork=(events,weeks)=>rawWeekly(events,weeks,EVIDENCE);
const iso=(start,minutes)=>new Date(Date.parse(start)+minutes*60000).toISOString();
function chain(start,sections){
 let point=start;
 return sections.map(([type,minutes])=>{const next=iso(point,minutes),entry={type,start:point,end:next};point=next;return entry;});
}
test('inventario normativo: identificatori unici, articolo e copertura onesta',()=>{
 const s=coverageSummary();assert.ok(s.total>=20);assert.ok(s.blocked>s.preview);
 assert.equal(new Set(EU_RULES.map(x=>x.id)).size,EU_RULES.length);
 assert.ok(EU_RULES.every(x=>x.law&&x.article&&x.requirement));
 assert.ok(EU_RULES.some(x=>x.id==='EU-581-CARD' && x.title.includes('28 giorni')));
});
test('4h30 esatte non costituiscono superamento numerico',()=>{
 const events=chain('2026-10-20T06:00:00Z',[['drive',270],['break',45],['drive',270]]);
 assert.equal(previewContinuousDriving(events).status,'nessuna-soglia-superata');
});
test('4h31 genera una segnalazione preliminare',()=>{
 const r=previewContinuousDriving(chain('2026-10-20T06:00:00Z',[['drive',271]]));
 assert.equal(r.status,'possibile-anomalia');assert.equal(r.issues[0].extraMinutes,1);
});
test('pausa 15 + 30 azzera il conteggio anche con guida interposta',()=>{
 const r=previewContinuousDriving(chain('2026-10-20T06:00:00Z',[['drive',240],['break',15],['drive',30],['break',30],['drive',260]]));
 assert.equal(r.status,'nessuna-soglia-superata');
});
test('pause da 30 + 15 non vanno scambiate per pausa 15 + 30',()=>{
 const r=previewContinuousDriving(chain('2026-10-20T06:00:00Z',[['drive',260],['break',30],['drive',10],['break',15],['drive',10]]));
 assert.equal(r.status,'possibile-anomalia');
});
test('altri lavori e disponibilità non azzerano guida',()=>{
 const r=previewContinuousDriving(chain('2026-10-20T06:00:00Z',[['drive',260],['work',90],['available',20],['drive',11]]));
 assert.equal(r.status,'possibile-anomalia');
});
test('timeline con buchi non viene dichiarata regolare',()=>{
 const records=[{type:'drive',start:'2026-10-20T06:00:00Z',end:'2026-10-20T07:00:00Z'},{type:'drive',start:'2026-10-20T09:00:00Z',end:'2026-10-20T10:00:00Z'}];
 assert.equal(previewContinuousDriving(records).status,'non-valutabile');
});
test('intervalli sovrapposti, privi di fuso e frazionari sono rifiutati',()=>{
 assert.throws(()=>normalizeTachoTimeline([{type:'drive',start:'2026-10-20T06:00:00',end:'2026-10-20T07:00:00Z'}]));
 assert.throws(()=>normalizeTachoTimeline([{type:'drive',start:'2026-10-20T06:00:00Z',end:'2026-10-20T06:00:01Z'}]));
 assert.throws(()=>normalizeTachoTimeline([{type:'drive',start:'2026-10-20T06:00:00Z',end:'2026-10-20T07:00:00Z'},{type:'work',start:'2026-10-20T06:30:00Z',end:'2026-10-20T07:30:00Z'}]));
});
const week0='2026-10-19T00:00:00Z',week1='2026-10-26T00:00:00Z',week2='2026-11-02T00:00:00Z';
const windows=[{start:week0,end:week1},{start:week1,end:week2}];
function bothWeeks(a,b){return chain(week0,[['drive',a],['rest',10080-a],['drive',b],['rest',10080-b]]);}
test('soglie 56 e 90: uguale al limite non è superamento',()=>{
 const r=previewWeeklyAndWork(bothWeeks(3360,2040),windows);
 assert.equal(r[0].status,'nessuna-soglia-superata');
 assert.equal(r[1].status,'nessuna-soglia-superata');
});
test('superamenti settimanale e bisettimanale numerici',()=>{
 const r=previewWeeklyAndWork(bothWeeks(3480,3480),windows);
 assert.equal(r[0].status,'possibile-anomalia');assert.equal(r[1].status,'possibile-anomalia');
});
test('limite lavoro 60h: guida e altri lavori, non disponibilità',()=>{
 const events=chain(week0,[['drive',3600],['work',1],['available',200],['rest',10080-3801]]);
 const r=previewWeeklyAndWork(events,[windows[0]]);
 assert.equal(r[2].status,'possibile-anomalia');assert.equal(r[2].issues[0].extraMinutes,1);
});
test('settimana incompleta non produce finto esito negativo',()=>{
 const events=chain(week0,[['drive',60]]);
 const r=previewWeeklyAndWork(events,windows);
 assert.ok(r.every(x=>x.status==='non-valutabile'));
});
test('finestre non consecutive rifiutate',()=>{
 assert.throws(()=>previewWeeklyAndWork([], [windows[0],{start:week1,end:week2.replace('02T','03T')}].reverse()));
});
