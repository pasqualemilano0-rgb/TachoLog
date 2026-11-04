import test from 'node:test';
import assert from 'node:assert/strict';
import {previewContinuousDriving,previewWeeklyAndWork} from '../azienda/eu-evaluator.mjs';
const week={start:'2026-10-19T00:00:00Z',end:'2026-10-26T00:00:00Z'};
const one=[
 {type:'drive',start:'2026-10-19T00:00:00Z',end:'2026-10-19T04:00:00Z'},
 {type:'rest',start:'2026-10-19T04:00:00Z',end:'2026-10-26T00:00:00Z'}
];
const full={verifiedSource:true,qualifiedStartingRest:true,timelineComplete:true,workFromAllEmployers:true};
test('guida continuativa non verificata produce non-valutabile',()=>{
 const r=previewContinuousDriving([{type:'drive',start:'2026-10-19T00:00:00Z',end:'2026-10-19T04:00:00Z'}]);
 assert.equal(r.status,'non-valutabile');assert.equal(r.trustedInput,false);
});
test('anche una guida di 4h31 senza firma o riposo è non-valutabile',()=>{
 const r=previewContinuousDriving([{type:'drive',start:'2026-10-19T00:00:00Z',end:'2026-10-19T04:31:00Z'}]);
 assert.equal(r.status,'non-valutabile');assert.equal(r.issues.length,1);
});
test('con origine e riposo verificati il precontrollo diventa disponibile',()=>{
 const r=previewContinuousDriving([{type:'drive',start:'2026-10-19T00:00:00Z',end:'2026-10-19T04:31:00Z'}],full);
 assert.equal(r.status,'possibile-anomalia');
});
test('finestre complete senza attestazione non danno esito rassicurante',()=>{
 const r=previewWeeklyAndWork(one,[week]);
 assert.ok(r.every(x=>x.status==='non-valutabile'));
});
test('la conformità all orario di lavoro esige anche la copertura di altri datori',()=>{
 const r=previewWeeklyAndWork(one,[week],{...full,workFromAllEmployers:false});
 assert.equal(r[0].status,'nessuna-soglia-superata');
 assert.equal(r[2].status,'non-valutabile');
});
test('un buco temporale invalida l esito anche con flag di copertura',()=>{
 const broken=[{...one[0]},{...one[1],start:'2026-10-19T05:00:00Z'}];
 const r=previewWeeklyAndWork(broken,[week],full);
 assert.ok(r.every(x=>x.status==='non-valutabile'));
});
