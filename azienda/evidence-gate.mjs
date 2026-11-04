/**
 * Audit del percorso DDD prima di qualsiasi analisi normativa.
 *
 * Non prende decisioni legali. I valori "verified" devono provenire da
 * un backend autenticato con parser e verificatore PKI, MAI dall'iPhone,
 * dal Reader o da un campo modificabile nella pagina pubblica.
 */
const SHA256=/^[a-f0-9]{64}$/i;
export const INPUT_EVIDENCE_REQUIREMENTS=Object.freeze([
 {key:'source',expected:'driver-card',label:'Origine: carta conducente'},
 {key:'signatureStatus',expected:'verified',label:'Firme tachigrafiche verificate'},
 {key:'certificateChainStatus',expected:'verified',label:'Catena certificati ERCA verificata'},
 {key:'parserStatus',expected:'complete',label:'Decodifica completa e senza errori'},
 {key:'activityCoverage',expected:'complete',label:'Copertura temporale completa'},
 {key:'cardDriverMatch',expected:true,label:'Carta associata al conducente autorizzato'}
]);
export function auditDddEvidence(metadata){
 if(!metadata||typeof metadata!=='object'||Array.isArray(metadata))return {
  eligible:false,status:'non-valutabile',checks:INPUT_EVIDENCE_REQUIREMENTS.map(x=>({...x,ok:false})),issues:['Metadata mancanti'],attribution:'nessuna'
 };
 const checks=INPUT_EVIDENCE_REQUIREMENTS.map(x=>({...x,ok:metadata[x.key]===x.expected}));
 const issues=checks.filter(x=>!x.ok).map(x=>x.label);
 const hashOk=typeof metadata.originalSha256==='string'&&SHA256.test(metadata.originalSha256);
 const decoderOk=typeof metadata.decoderVersion==='string'&&metadata.decoderVersion.trim().length>0;
 const validatorOk=typeof metadata.signatureVerifierVersion==='string'&&metadata.signatureVerifierVersion.trim().length>0;
 const serverOk=metadata.attestedBy==='trusted-server';
 if(!hashOk)issues.push('Impronta SHA-256 originale assente o non valida');
 if(!decoderOk)issues.push('Versione del decoder mancante');
 if(!validatorOk)issues.push('Versione della verifica crittografica mancante');
 if(!serverOk)issues.push('Attestazione backend attendibile mancante');
 const eligible=issues.length===0;
 return {eligible,status:eligible?'pronto-per-precontrolli':'non-valutabile',checks,
   issues,attribution:eligible?'backend-attestato':'nessuna'};
}
