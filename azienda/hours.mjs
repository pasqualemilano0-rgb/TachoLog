/**
 * TachoLog - ore autisti: motore di TRIAGE dimostrativo, non accertamento infrazioni.
 * Input: totali già normalizzati da un sistema affidabile, in minuti. Non decodifica DDD.
 * Il giorno civile NON corrisponde necessariamente al periodo giornaliero legale.
 */
export const HOUR_LIMITS = Object.freeze({weekly:56*60,fortnight:90*60,dailyOrdinary:9*60,dailyAbsolute:10*60});
export const HOURS_DEMO_PERIOD=Object.freeze({previous:'19–25 ott 2026',current:'26 ott–1 nov 2026',fortnight:'19 ott–1 nov 2026'});
export const HOURS_DEMO = Object.freeze([
  {driverId:'drv-001',organizationId:'org-demo',demoDailyMinutes:[520,410,390,375,350,285,205],weeklyMinutes:2535,previousWeekMinutes:2310,maxCivilDayMinutes:520,complete:true,source:'esempio',notes:'Dati inventati: nessuna anomalia nelle soglie numeriche considerate.'},
  {driverId:'drv-002',organizationId:'org-demo',demoDailyMinutes:[635,600,520,510,470,405,350],weeklyMinutes:3490,previousWeekMinutes:2190,maxCivilDayMinutes:635,complete:true,source:'esempio',notes:'Valori volutamente fuori soglia per mostrare la coda di revisione.'},
  {driverId:'drv-003',organizationId:'org-demo',demoDailyMinutes:[570,530,490,480,465,400,330],weeklyMinutes:3265,previousWeekMinutes:null,maxCivilDayMinutes:570,complete:false,source:'esempio',notes:'Manca la settimana precedente: non si può verificare il limite bisettimanale.'},
  {driverId:'drv-004',organizationId:'org-demo',demoDailyMinutes:null,weeklyMinutes:null,previousWeekMinutes:null,maxCivilDayMinutes:null,complete:false,source:'assente',notes:'Non sono disponibili attività da analizzare.'}
]);
const valid = n => n === null || Number.isSafeInteger(n) && n >= 0;
export function minutesLabel(n){if(n===null || n===undefined)return '—';return `${Math.floor(n/60)}h ${String(n%60).padStart(2,'0')}m`;}
export function reviewHourReport(report){
  if(!report || typeof report.driverId!=='string' || !['weeklyMinutes','previousWeekMinutes','maxCivilDayMinutes'].every(k=>valid(report[k])))throw new Error('Report ore non valido');
  const issues=[];
  const add=(code,priority,label,explain)=>issues.push({code,priority,label,explain});
  const hasWeek=report.weeklyMinutes!==null;
  const hasPrev=report.previousWeekMinutes!==null;
  const hasDay=report.maxCivilDayMinutes!==null;
  const complete=report.complete===true && hasWeek && hasPrev && hasDay;
  // Ogni segnalazione è solo una verifica di soglie, mai un'infrazione accertata.
  if(hasWeek && report.weeklyMinutes>HOUR_LIMITS.weekly)
    add('week-over','high','Oltre 56h settimanali','Verificare dato, perimetro normativo, completezza ed eventuali deroghe.');
  if(hasPrev && hasWeek && report.weeklyMinutes+report.previousWeekMinutes>HOUR_LIMITS.fortnight)
    add('fortnight-over','high','Oltre 90h su due settimane','Anomalia numerica: verificare le due settimane e la fonte completa.');
  if(hasDay && report.maxCivilDayMinutes>HOUR_LIMITS.dailyAbsolute)
    add('day-over','high','Oltre 10h in un giorno civile','Il giorno civile non coincide necessariamente con il periodo giornaliero legale.');
  else if(hasDay && report.maxCivilDayMinutes>HOUR_LIMITS.dailyOrdinary)
    add('day-extend','review','Oltre 9h in un giorno civile','Controllare periodi giornalieri legali e massimo due estensioni a 10h nella settimana.');
  if(hasWeek && report.weeklyMinutes>HOUR_LIMITS.weekly*0.9 && report.weeklyMinutes<=HOUR_LIMITS.weekly)
    add('week-near','review','Vicino a 56h settimanali','Promemoria prudenziale, non è un superamento.');
  if(complete && report.weeklyMinutes+report.previousWeekMinutes>HOUR_LIMITS.fortnight*0.9 && report.weeklyMinutes+report.previousWeekMinutes<=HOUR_LIMITS.fortnight)
    add('fortnight-near','review','Vicino a 90h bisettimanali','Promemoria prudenziale, non è un superamento.');
  if(!complete)add('missing','missing','Dati incompleti','Mancano attività o una settimana: nessuna conclusione di conformità.');
  const high=issues.some(x=>x.priority==='high'), hasReview=issues.some(x=>x.priority==='review');
  const status=high?'candidate':!hasWeek?'missing':!complete?'incomplete':hasReview?'review':'no-signal';
  return {...report, complete,fortnightMinutes:hasWeek && hasPrev?report.weeklyMinutes+report.previousWeekMinutes:null,issues,status};
}
export function summarizeFleetHours(reports,drivers,organizationId){
  const allowed=new Set(drivers.filter(d=>d.orgId===organizationId).map(d=>d.id));
  const rows=reports.filter(r=>r.organizationId===organizationId && allowed.has(r.driverId)).map(reviewHourReport);
  const priority={candidate:0,review:1,incomplete:2,missing:3,'no-signal':4};
  rows.sort((a,b)=>priority[a.status]-priority[b.status] || a.driverId.localeCompare(b.driverId));
  return {
    rows,
    summary:{candidates:rows.filter(x=>x.status==='candidate').length,review:rows.filter(x=>x.status==='review').length,incomplete:rows.filter(x=>['missing','incomplete'].includes(x.status)).length,withoutSignals:rows.filter(x=>x.status==='no-signal').length}
  };
}
export const HOUR_STATUS=Object.freeze({candidate:{text:'Possibile superamento',tone:'bad'},review:{text:'Da approfondire',tone:'pending'},incomplete:{text:'Dati parziali',tone:'pending'},missing:{text:'Dati assenti',tone:'neutral'},'no-signal':{text:'Nessuna anomalia rilevata',tone:'neutral'}});
