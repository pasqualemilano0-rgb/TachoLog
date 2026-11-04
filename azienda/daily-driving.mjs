/**
 * PRECONTROLLO DELLE GIORNATE DI GUIDA, non accertamento di infrazione.
 * Ogni periodo deve essere stato suddiviso dal parser *fra riposi legali*.
 * NON usare il giorno civile come sostituto del periodo giornaliero.
 * Per evitare falsi "OK", senza riscontri sulla fonte e sulla copertura
 * l'output resta "non-valutabile".
 */
const OFFSET_ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const WEEK=/^\d{4}-\d{2}-\d{2}$/;
const parse=s=>{
 if(typeof s!=='string'||!OFFSET_ISO.test(s))throw new Error('Timestamp con fuso richiesto');
 const n=Date.parse(s);if(!Number.isFinite(n))throw new Error('Timestamp non valido');
 return n;
};
const monday=s=>{
 if(typeof s!=='string'||!WEEK.test(s))throw new Error('Settimana non valida');
 const d=new Date(s+'T00:00:00Z');
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s||d.getUTCDay()!==1)throw new Error('La settimana deve iniziare lunedì');
 return s;
};
export function previewDailyDriving(periods,context={}){
 if(!Array.isArray(periods))throw new Error('Periodi non validi');
 if(!context||typeof context!=='object')throw new Error('Contesto mancante');
 const sorted=periods.map(p=>{
  if(!p||typeof p!=='object')throw new Error('Periodo non valido');
  const start=parse(p.start),end=parse(p.end),weekStart=monday(p.weekStart);
  if(end<=start||!Number.isSafeInteger(p.driveMinutes)||p.driveMinutes<0||p.driveMinutes>(end-start)/60000)
   throw new Error('Durata di guida non compatibile con il periodo');
  return {start,end,weekStart,driveMinutes:p.driveMinutes,
   evidenceId:typeof p.evidenceId==='string'?p.evidenceId:''};
 }).sort((a,b)=>a.start-b.start);
 for(let i=1;i<sorted.length;i++)if(sorted[i].start<sorted[i-1].end)
  throw new Error('Periodi giornalieri sovrapposti');
 const issues=[];
 const weekCounts=new Map();
 for(const p of sorted){
  if(p.driveMinutes>540){
   weekCounts.set(p.weekStart,(weekCounts.get(p.weekStart)||0)+1);
   if(p.driveMinutes>600)issues.push({
     rule:'EU-561-06-D',kind:'oltre-10h',overMinutes:p.driveMinutes-600,
     weekStart:p.weekStart,periodStart:new Date(p.start).toISOString(),evidenceId:p.evidenceId
   });
  }
 }
 for(const [weekStart,n] of weekCounts)if(n>2)
   issues.push({rule:'EU-561-06-EXT',kind:'terza-estensione-o-successiva',
     extensionsObserved:n,overCount:n-2,weekStart});
 const weeks=[...new Set(sorted.map(p=>p.weekStart))];
 const covered=Array.isArray(context.completeWeeks)&&
   weeks.every(w=>context.completeWeeks.includes(w))&&
   context.completeWeeks.every(w=>WEEK.test(w)&&new Date(w+'T00:00:00Z').getUTCDay()===1);
 const trusted=context.evidenceTrusted===true &&
   context.restBoundariesValidated===true &&
   context.periodSequenceComplete===true &&covered;
 const reason=!trusted?
   'Fonte, riposi o settimane non completamente attestati: impossibile concludere sulla conformità.' :
   'Solo limiti numerici 9/10h e due estensioni; deroghe e circostanze richiedono sempre revisione.';
 return {status:!trusted?'non-valutabile':issues.length?'possibile-anomalia':'nessuna-soglia-superata',
   trustedInput:trusted,issues,periodsExamined:sorted.length,
   extensionsByWeek:Object.fromEntries(weekCounts),reason};
}
