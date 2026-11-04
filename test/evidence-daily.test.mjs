import test from 'node:test';
import assert from 'node:assert/strict';
import {auditDddEvidence} from '../azienda/evidence-gate.mjs';
import {previewDailyDriving} from '../azienda/daily-driving.mjs';
const w='2026-11-02';
const e=(i,driveMinutes,weekStart=w)=>({
 start:new Date(Date.parse('2026-11-02T07:00:00Z')+i*86400000).toISOString(),
 end:new Date(Date.parse('2026-11-02T07:00:00Z')+i*86400000+12*3600000).toISOString(),
 driveMinutes,weekStart,evidenceId:'test-'+i
});
const validContext={evidenceTrusted:true,restBoundariesValidated:true,
 periodSequenceComplete:true,completeWeeks:[w]};
test('un DDD privo di verifiche non alimenta automaticamente il motore',()=>{
 const r=auditDddEvidence({});
 assert.equal(r.eligible,false);
 assert.equal(r.status,'non-valutabile');
 assert.ok(r.issues.length>=7);
});
test('file verificato con tutte le attestazioni può alimentare precontrolli',()=>{
 const evidence={source:'driver-card',signatureStatus:'verified',certificateChainStatus:'verified',
 parserStatus:'complete',activityCoverage:'complete',cardDriverMatch:true,
 originalSha256:'a'.repeat(64),decoderVersion:'test-parser-1',signatureVerifierVersion:'test-verifier-1',
 attestedBy:'trusted-server'};
 assert.equal(auditDddEvidence(evidence).eligible,true);
 assert.equal(auditDddEvidence({...evidence,signatureStatus:'failed'}).eligible,false);
 assert.equal(auditDddEvidence({...evidence,cardDriverMatch:false}).eligible,false);
 assert.equal(auditDddEvidence({...evidence,attestedBy:'mobile-browser'}).eligible,false);
});
test('due estensioni da 9h a 10h sono possibili, non segnalate come superamento',()=>{
 const r=previewDailyDriving([e(0,570),e(1,600),e(2,540)],validContext);
 assert.equal(r.status,'nessuna-soglia-superata');
 assert.equal(r.extensionsByWeek[w],2);
});
test('terza estensione settimanale produce una segnalazione',()=>{
 const r=previewDailyDriving([e(0,570),e(1,570),e(2,541)],validContext);
 assert.equal(r.status,'possibile-anomalia');
 assert.ok(r.issues.some(x=>x.rule==='EU-561-06-EXT'&&x.overCount===1));
});
test('oltre 10h produce segnalazione distinta',()=>{
 const r=previewDailyDriving([e(0,601)],validContext);
 assert.equal(r.status,'possibile-anomalia');
 assert.equal(r.issues[0].rule,'EU-561-06-D');
 assert.equal(r.issues[0].overMinutes,1);
});
test('senza riposi, fonte o copertura completa nessun falso esito di regolarità',()=>{
 for(const patch of [{evidenceTrusted:false},{restBoundariesValidated:false},
   {periodSequenceComplete:false},{completeWeeks:[]}]){
  const r=previewDailyDriving([e(0,540)],{...validContext,...patch});
  assert.equal(r.status,'non-valutabile');
  assert.equal(r.trustedInput,false);
 }
});
test('dati assenti non consentono affermazioni sulla conformità',()=>{
 assert.equal(previewDailyDriving([],validContext).status,'non-valutabile');
});
test('settimana non lunedì, sovrapposizioni e guide maggiori della durata rifiutate',()=>{
 assert.throws(()=>previewDailyDriving([e(0,540,'2026-11-03')],validContext),/lunedì/);
 assert.throws(()=>previewDailyDriving([e(0,780)],validContext),/Durata/);
 assert.throws(()=>previewDailyDriving([e(0,540),e(0,550)],validContext),/sovrapposti/);
});
test('risultati sempre preliminari, mai infrazioni accertate',()=>{
 const r=previewDailyDriving([e(0,601)],validContext);
 assert.equal(r.status,'possibile-anomalia');
 assert.ok(!('confirmedInfringement' in r));
});
