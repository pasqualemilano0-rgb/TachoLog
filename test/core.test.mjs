import test from 'node:test';
import assert from 'node:assert/strict';
import {validateActivity,durationByActivity,getTotals,fmtMinutes,weekStart,fromLocalInput,dayKey} from '../src/core.mjs';
const activity=(start,end,type='drive',id='x')=>({id,type,start,end,note:''});
test('convalida un periodo e converte in UTC',()=>{let x=validateActivity(activity('2026-11-03T09:00:00+01:00','2026-11-03T10:00:00+01:00'));assert.equal(x.start,'2026-11-03T08:00:00.000Z');});
test('blocca fine precedente',()=>assert.throws(()=>validateActivity(activity('2026-11-03T10:00:00Z','2026-11-03T09:00:00Z')),/fine/));
test('blocca sovrapposizioni, accetta intervalli adiacenti',()=>{
 const a=validateActivity(activity('2026-11-03T10:00:00Z','2026-11-03T11:00:00Z'));
 assert.throws(()=>validateActivity(activity('2026-11-03T10:30:00Z','2026-11-03T11:30:00Z','work','y'),[a]),/sovrapposto/);
 assert.doesNotThrow(()=>validateActivity(activity('2026-11-03T11:00:00Z','2026-11-03T12:00:00Z','rest','z'),[a]));
});
test('conta solo i minuti ricadenti nel periodo',()=>{
 const records=[activity('2026-11-03T23:00:00Z','2026-11-04T01:30:00Z')];
 assert.equal(durationByActivity(records,'2026-11-04T00:00:00Z','2026-11-05T00:00:00Z').drive,90);
});
test('distingue guida e lavoro',()=>{
 const records=[activity('2026-11-03T09:00:00Z','2026-11-03T10:00:00Z'),activity('2026-11-03T10:00:00Z','2026-11-03T12:00:00Z','work','y')];
 const t=durationByActivity(records,'2026-11-03T00:00:00Z','2026-11-04T00:00:00Z');assert.equal(t.drive,60);assert.equal(t.work,120);
});
test('settimana lunedì-domenica e bisettimanale',()=>{
 assert.equal(dayKey(weekStart('2026-11-08T12:00:00Z')),'2026-11-02');
 const records=[activity('2026-10-30T12:00:00Z','2026-10-30T13:00:00Z'),activity('2026-11-03T12:00:00Z','2026-11-03T14:00:00Z','drive','b')];
 const t=getTotals(records,'2026-11-03T12:00:00Z');assert.equal(t.week.drive,120);assert.equal(t.fortnight.drive,180);
});
test('formatta ore e minuti',()=>assert.equal(fmtMinutes(275),'4h 35m'));
test('non accetta date locali mancanti per DST',()=>{
 assert.throws(()=>fromLocalInput('2026-03-29T02:30'),/inesistente/);
});
