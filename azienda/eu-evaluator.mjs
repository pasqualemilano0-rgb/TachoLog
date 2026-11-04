/**
 * Precontrolli su attività normalizzate. Mai chiamare "infrazione accertata".
 * UTC ISO con offset esplicito; limiti settimanali richiedono finestre legali
 * lunedì-domenica preparate da un backend con fuso e ora legale verificati.
 */
export const EU_PRECHECK_LIMITS=Object.freeze({
 continuousDriving:270,
 weeklyDriving:3360,
 fortnightlyDriving:5400,
 weeklyWork:3600
});
const TYPES=new Set(['drive','work','available','rest','break']);
const ISO_TZ=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const stamp=s=>{
 if(typeof s!=='string'||!ISO_TZ.test(s))throw new Error('Timestamp ISO con fuso obbligatorio');
 const ms=Date.parse(s);if(!Number.isFinite(ms))throw new Error('Timestamp non valido');return ms;
};
export function normalizeTachoTimeline(events){
 if(!Array.isArray(events))throw new Error('Timeline non valida');
 const rows=events.map(e=>{
  if(!e||!TYPES.has(e.type))throw new Error('Tipo attività non riconosciuto');
  const start=stamp(e.start),end=stamp(e.end);
  if(end<=start)throw new Error('Intervallo non positivo');
  if((end-start)%60000!==0)throw new Error('Sono supportati intervalli al minuto');
  return {type:e.type,start,end,minutes:(end-start)/60000};
 }).sort((a,b)=>a.start-b.start);
 for(let i=1;i<rows.length;i++)if(rows[i].start<rows[i-1].end)throw new Error('Attività sovrapposte');
 return rows;
}
const unknown=(id,reason)=>({id,status:'non-valutabile',reason,issues:[],minutes:null});
const outcome=(id,minutes,limit,possible,reason)=>({
 id,status:possible?'possibile-anomalia':'nessuna-soglia-superata',
 minutes,limit,reason,
 issues:possible?[{code:id,extraMinutes:minutes-limit}]:[]
});
export function previewContinuousDriving(input){
 const id='EU-561-07';
 const rows=normalizeTachoTimeline(input);
 if(!rows.length)return unknown(id,'Nessuna attività disponibile');
 let accumulated=0,splitFirst=false,gap=false,issues=[],lastEnd=null,maxSeen=0;
 for(const r of rows){
  if(lastEnd!==null && r.start>lastEnd){accumulated=0;splitFirst=false;gap=true;}
  if(r.type==='drive'){
   const before=accumulated;accumulated+=r.minutes;maxSeen=Math.max(maxSeen,accumulated);
   if(before<=270&&accumulated>270)issues.push({code:id,extraMinutes:accumulated-270,at:new Date(r.end).toISOString()});
  }else if(r.type==='rest'||r.type==='break'){
   if(r.minutes>=45 || (splitFirst&&r.minutes>=30)){accumulated=0;splitFirst=false;}
   else if(r.minutes>=15)splitFirst=true;
  }
  // Altri lavori e disponibilità NON azzerano la guida.
  lastEnd=r.end;
 }
 return {id,status:issues.length?'possibile-anomalia':gap?'non-valutabile':'nessuna-soglia-superata',
  minutes:maxSeen,limit:270,issues,
  reason:gap?'Sono presenti vuoti nella timeline: i periodi assenti possono cambiare il risultato.':'Controllo preliminare della sequenza 4h30 / 45 o 15+30; verificare qualificazione effettiva delle pause.'};
}
const windowCoverage=(events,start,end)=>{
 let cursor=start;
 for(const event of events){
  if(event.end<=cursor)continue;
  if(event.start>cursor)return false;
  cursor=Math.min(end,event.end);
  if(cursor>=end)return true;
 }
 return false;
};
const sum=(rows,start,end,types)=>{
 let total=0;
 for(const r of rows)if(types.has(r.type))total+=Math.max(0,Math.min(end,r.end)-Math.max(start,r.start))/60000;
 return total;
};
export function previewWeeklyAndWork(input,weekWindows){
 const rows=normalizeTachoTimeline(input);
 if(!Array.isArray(weekWindows)||weekWindows.length<1||weekWindows.length>2)
  throw new Error('Indicare una o due settimane legali consecutive');
 const windows=weekWindows.map(w=>{
  if(!w||typeof w!=='object')throw new Error('Finestra illegale');
  const start=stamp(w.start),end=stamp(w.end);
  if(start>=end || end-start<6*86400000 || end-start>8*86400000)throw new Error('Finestra settimanale non plausibile');
  return {start,end};
 });
 if(windows.length===2 && windows[0].end!==windows[1].start)throw new Error('Settimane non consecutive');
 const current=windows[windows.length-1];
 const weeklyKnown=windowCoverage(rows,current.start,current.end);
 const driving=new Set(['drive']),working=new Set(['drive','work']);
 const weekDrive=weeklyKnown?sum(rows,current.start,current.end,driving):null;
 const weekWork=weeklyKnown?sum(rows,current.start,current.end,working):null;
 const weekResult=weeklyKnown?outcome('EU-561-06-W',weekDrive,3360,weekDrive>3360,'Settimana civile completa fornita dal chiamante; verificare fuso, deroghe e applicabilità.'):unknown('EU-561-06-W','Settimana incompleta o dati non disponibili');
 const workResult=weeklyKnown?outcome('EU-2002-15-W60',weekWork,3600,weekWork>3600,'Conteggia guida + altri lavori; verificare altri datori di lavoro e norme nazionali.'):unknown('EU-2002-15-W60','Settimana lavorativa incompleta o dati mancanti');
 const both=windows.length===2&&windows.every(w=>windowCoverage(rows,w.start,w.end));
 const total=both?sum(rows,windows[0].start,current.end,driving):null;
 const fortnight=both?outcome('EU-561-06-2W',total,5400,total>5400,'Due settimane consecutive; verificare gli altri fattori normativi.'):unknown('EU-561-06-2W','Sono richieste due settimane consecutive e complete');
 return [weekResult,fortnight,workResult];
}
