import test from 'node:test';
import assert from 'node:assert/strict';
import {HOURS_DEMO,reviewHourReport,summarizeFleetHours,minutesLabel,HOUR_LIMITS} from '../azienda/hours.mjs';
import {DEMO,ROLE_NAV} from '../azienda/model.mjs';
const report=(weeklyMinutes,previousWeekMinutes,maxCivilDayMinutes,complete=true)=>({driverId:'x',organizationId:'o',weeklyMinutes,previousWeekMinutes,maxCivilDayMinutes,complete});
test('soglie di 56h e 90h: uguale non è superamento',()=>{
 const r=reviewHourReport(report(3360,2040,540));
 assert.equal(r.issues.some(x=>x.priority==='high'),false);
});
test('oltre 56h è segnalazione, non accertamento',()=>{
 const r=reviewHourReport(report(3361,0,520));assert.equal(r.status,'candidate');assert.ok(r.issues.some(x=>x.code==='week-over'));
});
test('oltre 90h con due settimane',()=>{
 const r=reviewHourReport(report(3000,2401,520));assert.ok(r.issues.some(x=>x.code==='fortnight-over'));
});
test('9h15 è controllo estensione, mai infrazione automatica',()=>{
 const r=reviewHourReport(report(500,500,555));assert.equal(r.status,'review');assert.ok(r.issues.some(x=>x.code==='day-extend'));
});
test('10h01 in giorno civile segnala solo possibile anomalia',()=>{
 const r=reviewHourReport(report(601,400,601));assert.equal(r.status,'candidate');
});
test('senza settimana precedente non viene inventato un limite bisettimanale',()=>{
 const r=reviewHourReport(report(2800,null,400,false));assert.equal(r.fortnightMinutes,null);assert.equal(r.status,'incomplete');assert.ok(r.issues.some(x=>x.code==='missing'));
});
test('senza alcun dato lo stato è esplicitamente assente',()=>{
 const r=reviewHourReport(report(null,null,null,false));assert.equal(r.status,'missing');assert.equal(r.issues.filter(x=>x.priority==='high').length,0);
});
test('isola per azienda anche in demo (non sostituisce autorizzazione backend)',()=>{
 const result=summarizeFleetHours([...HOURS_DEMO,{...HOURS_DEMO[0],organizationId:'other',driverId:'hidden'}],DEMO.drivers,'org-demo');
 assert.equal(result.rows.length,4);assert.equal(result.rows[0].driverId,'drv-002');assert.equal(result.summary.candidates,1);
});
test('rifiuta input invalidi e frazioni di minuto',()=>{
 assert.throws(()=>reviewHourReport(report(-1,0,0)),/non valido/);
 assert.throws(()=>reviewHourReport(report(1.2,0,0)),/non valido/);
});
test('navigazione controllo ore soltanto amministratore',()=>{
 assert.ok(ROLE_NAV.admin.some(x=>x[0]==='hours'));
 assert.ok(!ROLE_NAV.driver.some(x=>x[0]==='hours'));
 assert.equal(minutesLabel(543),'9h 03m');assert.equal(HOUR_LIMITS.weekly,3360);
});
