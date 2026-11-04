import {DEMO,ROLE_NAV,STATUS_LABELS,STATUS_CLASS,visibleDrivers,visibleDownloads,searchDrivers,filterDownloads,dueLabel} from './model.mjs';
import {HOURS_DEMO,HOURS_DEMO_PERIOD,HOUR_LIMITS,HOUR_STATUS,minutesLabel,summarizeFleetHours} from './hours.mjs';

const $ = id => document.getElementById(id);
const state = {role:'admin',page:'dashboard',search:'',status:'all',selectedDriver:null,hourFilter:'all',hourDriver:null};
const DEMO_SESSION = role => ({role, orgId:DEMO.org.id, driverId:'drv-001', drivers:DEMO.drivers});
const esc = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const icon = (name,size=19) => {
  const paths={
    'layout-dashboard':'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    'file-down':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M12 11v8m-4-4 4 4 4-4"/>',
    'radio-tower':'<circle cx="12" cy="12" r="2"/><path d="m16 16 4 4M8 16l-4 4m8-6v8M5.64 5.64a9 9 0 0 0 0 12.72m12.72-12.72a9 9 0 0 1 0 12.72M9 9a4 4 0 0 0 0 6m6-6a4 4 0 0 1 0 6"/>',
    truck:'<path d="M10 17h4V5H2v12h3"/><path d="M14 9h4l4 4v4h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>',
    'calendar-days':'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01"/>',
    settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3l-.2.1V21h-3v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1A1.7 1.7 0 0 0 7 15.7L6.9 15H5v-3h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-2 .1.1a1.7 1.7 0 0 0 1.9.3l.2-.1V5h3v.2a1.7 1.7 0 0 0 1.1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9l.1.2H21v3h-1.6z"/>',
    'clock-3':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    coffee:'<path d="M4 8h13v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V8zm13 2h2a3 3 0 0 1 0 6h-2M8 2v3m5-3v3"/>',
    'user-round':'<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
    shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    alert:'<path d="M12 3 2 21h20L12 3zm0 7v4m0 3v.01"/>',
    check:'<path d="M5 13 9 17 19 7"/>',
    archive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v13h14V8M10 12h4"/>',
    eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
  };
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]||paths.activity}</svg>`;
};
const dateFmt = v => new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(v));
const shortDate = v => new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(v));
const driverName = id => DEMO.drivers.find(d=>d.id===id)?.label||'Non associato';
const badge = (text, tone='neutral') => `<span class="status ${esc(tone)}"><span class="status-dot"></span>${esc(text)}</span>`;
const banner = () => `<div class="demo-banner" role="note">${icon('alert',18)}<span><strong>Anteprima con dati inventati.</strong> Il cambio di vista non è un login. Nessun file DDD reale viene letto, inviato o archiviato.</span></div>`;
const kicker=(top,title,description)=>`<div class="page-heading"><div><span class="eyebrow">${esc(top)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div><span class="heading-tag">V2.0 · Prototipo</span></div>`;
const panel = (heading,sub,content,extra='') => `<section class="panel"><div class="panel-head"><div><h2>${heading}</h2>${sub?`<p>${sub}</p>`:''}</div>${extra}</div>${content}</section>`;
const metric=(label,value,meta,iconName,accent='')=>`<article class="kpi ${accent}"><div class="kpi-line"><span>${esc(label)}</span><span class="kpi-icon">${icon(iconName,20)}</span></div><strong>${esc(value)}</strong><small>${esc(meta)}</small></article>`;
const tableWrap = (headers,rows,empty='Nessun elemento da mostrare') => rows.length
  ? `<div class="table-scroll"><table><thead><tr>${headers.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`
  : `<div class="empty">${icon('archive',30)}<p>${esc(empty)}</p></div>`;
function renderAdminDashboard(){
  const recent=DEMO.downloads.slice().sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
  const rows=recent.map(f=>`<tr><td><b>${esc(driverName(f.driverId))}</b><span class="table-muted">${esc(f.source)}</span></td><td>${dateFmt(f.timestamp)}</td><td>${badge(STATUS_LABELS[f.status],STATUS_CLASS[f.status])}</td><td><button type="button" class="link-btn" data-nav="downloads">Apri ${icon('arrow',15)}</button></td></tr>`);
  const check=DEMO.drivers.filter(d=>dueLabel(d.downloadDue).tone!=='good');
  return kicker('PANORAMICA AZIENDALE','Il controllo della flotta, in un solo posto.','Monitora scarichi, conducenti e dispositivi. Qui sono mostrati esclusivamente esempi.')+banner()+
  `<div class="kpi-grid">${metric('Autisti presenti',DEMO.drivers.length,'Anagrafica simulata','users')}${metric('File DDD di esempio',DEMO.downloads.length,'Nessun DDD reale','file-down')}${metric('Reader configurabili',DEMO.readers.length,'Hardware non collegato','radio-tower')}${metric('Scadenze da verificare',check.length,'Calcolo illustrativo','calendar-days','amber')}</div>`+
  `<div class="hours-entry"><div><strong>Controllo ore di guida</strong><p>Individua rapidamente dati incompleti e possibili superamenti da esaminare.</p></div><button class="secondary-btn" type="button" data-nav="hours">Apri situazione ore →</button></div>`+
  `<div class="two-columns">${panel('Ultimi scarichi','Stati simulati per progettare il flusso',tableWrap(['Autista','Data','Stato',''],rows))}`+
  `${panel('Come funzionerà','Le fasi della piattaforma',`<div class="steps"><div><span>01</span><div><b>Scarico carta</b><p>Il Reader acquisisce il DDD firmato.</p></div></div><div><span>02</span><div><b>Verifica e archiviazione</b><p>Il server controlla integrità, autorizzazioni e origine.</p></div></div><div><span>03</span><div><b>Area personale</b><p>Ogni autista vede soltanto i propri dati autorizzati.</p></div></div></div><div class="callout">${icon('lock',18)} Autenticazione e server ancora da sviluppare.</div>`)}</div>`;
}
function renderHours(){
  const results=summarizeFleetHours(HOURS_DEMO,DEMO.drivers,DEMO.org.id);
  const filters={all:'Tutti',candidate:'Possibili superamenti',review:'Da approfondire',incomplete:'Dati parziali o assenti','no-signal':'Senza anomalie numeriche'};
  const rows=results.rows.filter(x=>state.hourFilter==='all'||(state.hourFilter==='incomplete'?['incomplete','missing'].includes(x.status):x.status===state.hourFilter));
  const ddd=status=>status==='candidate'?'Da verificare':status==='incomplete'?'Parziale':status==='missing'?'Assente':'Esempio';
  const tableRows=rows.map(x=>{
    const status=HOUR_STATUS[x.status], driver=DEMO.drivers.find(d=>d.id===x.driverId);
    const cell=(value,limit)=>value===null?'<span class="table-muted">Non disponibile</span>':`<div class="hour-value"><b>${minutesLabel(value)}</b>${limit?`<div class="hour-track"><span style="width:${Math.min(100,100*value/limit)}%;${value>limit?'background:#cb4752':''}"></span></div>`:''}</div>`;
    return `<tr><td><b>${esc(driver?.label)}</b><span class="table-muted">${esc(driver?.code)} · Dati inventati</span></td><td>${cell(x.weeklyMinutes,HOUR_LIMITS.weekly)}</td><td>${cell(x.fortnightMinutes,x.complete?HOUR_LIMITS.fortnight:null)}</td><td>${cell(x.maxCivilDayMinutes,null)}</td><td>${badge(status.text,status.tone)}<span class="table-muted">${ddd(x.status)}</span></td><td><button type="button" class="link-btn" data-hour-driver="${esc(x.driverId)}">Dettaglio ${icon('arrow',15)}</button></td></tr>`;
  });
  const selected=results.rows.find(x=>x.driverId===state.hourDriver);
  const driver=selected&&DEMO.drivers.find(d=>d.id===selected.driverId);
  return kicker('SITUAZIONE AUTISTI','Controllo ore e possibili infrazioni','Confronto dei tempi di guida, anomalie da verificare e periodi non coperti dagli scarichi.')+banner()+
    `<div class="kpi-grid">${metric('Possibili superamenti',results.summary.candidates,'Richiedono verifica manuale','alert','amber')}${metric('Altre segnalazioni',results.summary.review,'Soglie vicine o estensioni','clock-3')}${metric('Dati incompleti',results.summary.incomplete,'Non classificare come regolari','archive','amber')}${metric('Senza anomalie numeriche',results.summary.withoutSignals,'Non significa conformità','shield')}</div>`+
    `<div class="hours-warning">${icon('shield',20)}<div><b>Non sono infrazioni accertate.</b><p>I valori sono inventati per la demo. Il giorno civile non equivale al periodo giornaliero legale. Pause, riposi, estensioni, deroghe e firme DDD non sono verificati. Non usare questa pagina per contestazioni o provvedimenti.</p></div></div>`+
    `<div class="filters"><label class="select-filter">Mostra <select id="hour-filter" aria-label="Filtra autisti per segnalazione">${Object.entries(filters).map(([k,v])=>`<option value="${k}" ${state.hourFilter===k?'selected':''}>${v}</option>`).join('')}</select></label><span class="filter-hint">${rows.length} autisti su ${results.rows.length}</span></div>`+
    panel('Situazione ore per autista',`Settimana ${HOURS_DEMO_PERIOD.current} · Due settimane ${HOURS_DEMO_PERIOD.fortnight}`,tableWrap(['Autista','Guida settimana / 56h','Guida due settimane / 90h','Giorno civile massimo','Esito preliminare',''],tableRows,'Nessun autista con questo filtro.'))+
    (selected?`<section class="hours-detail" id="hour-detail"><div class="hours-detail-header"><div><span class="eyebrow">DETTAGLIO DIMOSTRATIVO</span><h2>${esc(driver?.label)}</h2><p>Ultima settimana: ${minutesLabel(selected.weeklyMinutes)} · Precedente: ${minutesLabel(selected.previousWeekMinutes)}</p></div><button type="button" class="secondary-btn" id="close-hour-detail">Chiudi</button></div><div class="hour-findings">${selected.issues.length?selected.issues.map(issue=>`<article><span class="status ${issue.priority==='high'?'bad':'pending'}">${issue.priority==='high'?'Da verificare':issue.priority==='missing'?'Dati insufficienti':'Promemoria'}</span><div><b>${esc(issue.label)}</b><p>${esc(issue.explain)}</p></div></article>`).join(''):'<p>Nessuna soglia numerica di questa demo superata. Non implica conformità.</p>'}</div><p class="hour-provenance">Fonte: simulazione · ${esc(selected.notes)}. Il software non ha ancora un decoder DDD certificato o un motore di conformità completo.</p></section>`:'')+
    `<div class="hours-next">${icon('file-down',20)}<div><b>Per calcolare situazioni reali servono DDD decodificati e verificati.</b><p>Il prossimo passo è collegare un backend privato con dati completi, ricostruzione dei periodi legali, revisione umana e tracciamento delle giustificazioni.</p></div></div>`;
}
function renderDrivers(){
 const drivers=searchDrivers(visibleDrivers(DEMO.drivers,DEMO_SESSION('admin')),state.search);
 const selected=DEMO.drivers.find(x=>x.id===state.selectedDriver);
 const rows=drivers.map(d=>`<tr><td><b>${esc(d.label)}</b><span class="table-muted">${esc(d.code)}</span></td><td>${esc(d.vehicle)}</td><td>${d.downloadDue?shortDate(`${d.downloadDue}T12:00:00`):'Non disponibile'}</td><td>${badge(d.active?'Attivo':'Disattivato',d.active?'good':'neutral')}</td><td><button class="link-btn" data-driver="${esc(d.id)}" type="button">Dettagli ${icon('arrow',15)}</button></td></tr>`);
 return kicker('ANAGRAFICA','Autisti','Elenco dimostrativo. I permessi reali saranno applicati esclusivamente dal backend.')+banner()+
 `<div class="filters"><label class="search-box">${icon('search')}<input id="driver-search" type="search" autocomplete="off" placeholder="Cerca codice o autista" aria-label="Cerca autista" value="${esc(state.search)}"></label><span class="filter-hint">${drivers.length} risultati</span></div>`+
 panel('Elenco autisti','Gestione accessi e carte: implementazione successiva',tableWrap(['Autista','Veicolo','Prossimo scarico','Account',''],rows,'Nessun autista corrisponde alla ricerca.'))+
 (selected?`<section class="detail-panel"><div><span class="eyebrow">SCHEDA DIMOSTRATIVA</span><h2>${esc(selected.label)}</h2><p>Codice ${esc(selected.code)} · ${esc(selected.vehicle)}</p><p>Prossimo scarico: ${selected.downloadDue?esc(selected.downloadDue):'Da impostare'}</p><p>Nella versione operativa verranno collegati carta, azienda e account reale.</p></div><button type="button" class="secondary-btn" id="close-driver">Chiudi</button></section>`:'');
}
function renderDownloads(){
 const records=filterDownloads(visibleDownloads(DEMO.downloads,DEMO_SESSION(state.role)),state.status).sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
 const rows=records.map(f=>`<tr><td><span class="file-name">${icon('file-down',17)}<b>DDD · ${esc(f.id)}</b></span><span class="table-muted">File fittizio · ${esc(f.size)}</span></td>${state.role==='admin'?`<td>${esc(driverName(f.driverId))}</td>`:''}<td>${esc(f.source)}</td><td>${dateFmt(f.timestamp)}</td><td>${badge(STATUS_LABELS[f.status],STATUS_CLASS[f.status])}</td></tr>`);
 return kicker('ARCHIVIO',state.role==='admin'?'Scarichi tachigrafici':'I miei file DDD','Prototipo della tabella documentale. Non contiene file scaricabili né dati autentici.')+banner()+
 `<div class="filters"><label class="select-filter">Stato <select id="status-filter"><option value="all" ${state.status==='all'?'selected':''}>Tutti</option>${Object.keys(STATUS_LABELS).map(x=>`<option value="${x}" ${state.status===x?'selected':''}>${STATUS_LABELS[x]}</option>`).join('')}</select></label><span class="filter-hint">${records.length} file dimostrativi</span></div>`+
 panel('Registro scarichi','In produzione: hash SHA-256 completo, firma, origine e tracciamento accessi',tableWrap(['Documento',...(state.role==='admin'?['Autista']:[]),'Origine','Data','Stato'],rows,'Nessun file nello stato selezionato.'))+
 `<div class="callout spacious">${icon('shield',19)} Il DDD originale non dovrà mai essere alterato. Solo dopo una verifica reale, un file potrà risultare verificato.</div>`;
}
function renderReaders(){
 const cards=DEMO.readers.map(r=>`<article class="device-card"><div class="device-icon">${icon('radio-tower',28)}</div><div><h3>${esc(r.label)}</h3><p>${esc(r.model)}</p><span class="mini-label">${esc(r.vehicle)}</span></div>${badge(r.state,'pending')}</article>`).join('');
 return kicker('HARDWARE','Reader ESP32-S3','Registrazione dispositivi, associazione all’azienda e controllo della ricezione DDD.')+banner()+
 `<div class="device-grid">${cards}</div>`+panel('Flusso di collegamento','La prima implementazione non deve affidarsi a un pulsante di pairing senza autenticazione',`<div class="steps horizontal"><div><span>01</span><div><b>Registra dispositivo</b><p>Token di attivazione monouso.</p></div></div><div><span>02</span><div><b>Autorizza azienda</b><p>Identità hardware e permessi server.</p></div></div><div><span>03</span><div><b>Ricevi e verifica DDD</b><p>Upload cifrato, hash e registro eventi.</p></div></div></div><div class="callout">${icon('alert')} Nessun dispositivo è attualmente collegato a questa pagina.</div>`);
}
function renderVehicles(){
 const rows=DEMO.vehicles.map(v=>`<tr><td><b>${esc(v.name)}</b><span class="table-muted">${esc(v.code)}</span></td><td>${shortDate(`${v.due}T12:00:00`)}</td><td>${badge(dueLabel(v.due).text,dueLabel(v.due).tone)}</td></tr>`);
 return kicker('FLOTTA','Veicoli','Gestione dei veicoli e futura lettura della memoria del tachigrafo.')+banner()+panel('Veicoli di esempio','La lettura della memoria veicolo richiede un’interfaccia e autorizzazioni diverse dalla carta conducente.',tableWrap(['Veicolo','Scadenza esempio','Stato'],rows));
}
function renderDeadlines(){
 const rows=DEMO.drivers.map(d=>`<tr><td><b>${esc(d.label)}</b></td><td>${d.downloadDue?esc(d.downloadDue):'Da definire'}</td><td>${badge(dueLabel(d.downloadDue).text,dueLabel(d.downloadDue).tone)}</td></tr>`);
 return kicker('PIANIFICAZIONE','Scadenze e controlli','Promemoria per gli scarichi, separati dalla verifica normativa del tachigrafo.')+banner()+panel('Scadenze illustrative','Le date sono inventate: nessun avviso legale o aziendale viene attivato.',tableWrap(['Autista','Data prevista','Stato'],rows))+
 `<div class="callout spacious">${icon('alert')} Le scadenze reali devono essere calcolate dai dati validati e dalla configurazione normativa applicabile, non da questa demo.</div>`;
}
function renderDriverDashboard(){
 const mine=visibleDrivers(DEMO.drivers,DEMO_SESSION('driver'))[0];
 const acts=DEMO.demoActivities.filter(x=>x.driverId===mine?.id);
 const drive=acts.filter(a=>a.type==='drive').reduce((sum,a)=>sum+a.duration,0);
 const fmt=mins=>`${Math.floor(mins/60)}h ${String(mins%60).padStart(2,'0')}m`;
 const rows=acts.map(a=>`<li class="timeline-item"><span class="timeline-marker ${esc(a.type)}"></span><div><b>${esc(a.label)}</b><small>${esc(a.from)} – ${esc(a.to)}</small></div><strong>${fmt(a.duration)}</strong></li>`).join('');
 return kicker('AREA AUTISTA','La tua giornata, in modo semplice.','Anteprima di come ogni conducente vedrà le proprie attività.')+banner()+
 `<div class="welcome-card"><span class="eyebrow">BENVENUTO</span><h2>${esc(mine.label)}</h2><p>Il tuo cruscotto personale, progettato per iPhone e Android.</p><div class="welcome-icon">${icon('truck',42)}</div></div>`+
 `<div class="kpi-grid three">${metric('Guida di esempio',fmt(drive),'Non deriva da DDD reali','truck')}${metric('Pausa di esempio',fmt(45),'Non certificata','coffee')}${metric('DDD personali',visibleDownloads(DEMO.downloads,DEMO_SESSION('driver')).length,'Documenti simulati','file-down')}</div>`+
 panel('Attività di esempio','Senza alcuna verifica delle pause legali',`<ul class="timeline">${rows}</ul>`)+
 `<div class="callout spacious">${icon('alert')} I conteggi dimostrativi non indicano conformità ai regolamenti sui tempi di guida e riposo.</div>`;
}
function renderDriverActivities(){return kicker('ATTIVITÀ','Il mio registro','Attività manuali e da DDD verranno distinte per provenienza.')+banner()+panel('Timeline dimostrativa','Solo dati fittizi',`<ul class="timeline">${DEMO.demoActivities.map(a=>`<li class="timeline-item"><span class="timeline-marker ${esc(a.type)}"></span><div><b>${esc(a.label)}</b><small>${esc(a.from)} – ${esc(a.to)} · Esempio</small></div></li>`).join('')}</ul>`);}
function renderRest(){return kicker('MONITORAGGIO','Guida e riposi','Riepiloghi e avvisi saranno attivati solo dopo la validazione del motore normativo.')+banner()+`<div class="empty big">${icon('coffee',42)}<h2>Motore normativo da implementare</h2><p>Non mostriamo falsi “OK”, pause residue o semafori verdi basati su dati incompleti.</p></div>`;}
function renderSettings(){return kicker('ACCOUNT',state.role==='admin'?'Impostazioni aziendali':'Il mio profilo','Le credenziali e i permessi saranno disponibili con l’autenticazione server.')+banner()+panel('Prima la sicurezza','Funzioni essenziali per il rilascio aziendale',`<div class="security-list"><div>${icon('lock')}<span>Login con sessioni sicure e ruoli verificati sul server</span></div><div>${icon('shield')}<span>Isolamento dei dati per azienda e per autista</span></div><div>${icon('archive')}<span>Archiviazione privata e backup dei file DDD originali</span></div><div>${icon('activity')}<span>Audit log, revoca dispositivi e protezioni contro abusi</span></div></div>`)+`<div class="callout spacious">${icon('alert')} Non usare dati reali in questa anteprima pubblica.</div>`;}
function view(){
 if(state.role==='driver')return state.page==='activities'?renderDriverActivities():state.page==='downloads'?renderDownloads():state.page==='rest'?renderRest():state.page==='settings'?renderSettings():renderDriverDashboard();
 switch(state.page){case'hours':return renderHours();case'drivers':return renderDrivers();case'downloads':return renderDownloads();case'readers':return renderReaders();case'vehicles':return renderVehicles();case'deadlines':return renderDeadlines();case'settings':return renderSettings();default:return renderAdminDashboard();}
}
function navMarkup(item){const [id,label,glyph]=item;return `<button type="button" class="nav-item ${state.page===id?'active':''}" data-nav="${id}" ${state.page===id?'aria-current="page"':''}>${icon(glyph,18)}<span>${esc(label)}</span></button>`;}
function render(){
 const nav=ROLE_NAV[state.role];if(!nav.some(x=>x[0]===state.page))state.page='dashboard';
 $('role-switch').value=state.role;
 $('sidebar-nav').innerHTML=nav.map(navMarkup).join('');
 $('mobile-nav').innerHTML=nav.slice(0,5).map(navMarkup).join('');
 $('crumb-current').textContent=nav.find(x=>x[0]===state.page)?.[1]||'Panoramica';
 $('content').innerHTML=view();
 bindPage();
}
function navigate(page){if(!ROLE_NAV[state.role].some(x=>x[0]===page))return;state.page=page;state.selectedDriver=null;state.hourDriver=null;location.hash=`${state.role}/${page}`;render();window.scrollTo(0,0);}
function bindPage(){
 const hourFilter=$('hour-filter');if(hourFilter)hourFilter.addEventListener('change',()=>{state.hourFilter=hourFilter.value;state.hourDriver=null;render();});
 const closeHour=$('close-hour-detail');if(closeHour)closeHour.addEventListener('click',()=>{state.hourDriver=null;render();});
 const input=$('driver-search');if(input){input.addEventListener('input',()=>{const position=input.selectionStart;state.search=input.value;const rows=searchDrivers(visibleDrivers(DEMO.drivers,DEMO_SESSION('admin')),state.search).map(d=>`<tr><td><b>${esc(d.label)}</b><span class="table-muted">${esc(d.code)}</span></td><td>${esc(d.vehicle)}</td><td>${d.downloadDue?shortDate(`${d.downloadDue}T12:00:00`):'Non disponibile'}</td><td>${badge(d.active?'Attivo':'Disattivato',d.active?'good':'neutral')}</td><td><button class="link-btn" type="button" data-driver="${esc(d.id)}">Dettagli ${icon('arrow',15)}</button></td></tr>`);const table=$('content').querySelector('tbody');if(table)table.innerHTML=rows.join('');const count=$('content').querySelector('.filter-hint');if(count)count.textContent=`${rows.length} risultati`;input.focus();try{input.setSelectionRange(position,position)}catch{}});}
 const select=$('status-filter');if(select)select.addEventListener('change',()=>{state.status=select.value;render();});
 const close=$('close-driver');if(close)close.addEventListener('click',()=>{state.selectedDriver=null;render();});
}
function setRole(role){if(!Object.hasOwn(ROLE_NAV,role))return;state.role=role;state.page='dashboard';state.selectedDriver=null;state.search='';state.status='all';location.hash=`${role}/dashboard`;render();}
// Role selection is deliberately a demo-only presentation tool, never an access control mechanism.
$('role-switch').addEventListener('change',e=>setRole(e.target.value));
document.addEventListener('click',e=>{
 const target=e.target.closest('[data-nav], [data-driver], [data-hour-driver]');if(!target)return;
 if(target.dataset.nav){navigate(target.dataset.nav);return;}
 if(target.dataset.hourDriver && state.role==='admin' && DEMO.drivers.some(d=>d.id===target.dataset.hourDriver)){state.hourDriver=target.dataset.hourDriver;render();$('hour-detail')?.scrollIntoView({behavior:'smooth',block:'start'});return;}
 if(target.dataset.driver && state.role==='admin' && DEMO.drivers.some(d=>d.id===target.dataset.driver)){state.selectedDriver=target.dataset.driver;render();}
});
window.addEventListener('hashchange',()=>{
 const m=/^#(admin|driver)\/(dashboard|hours|drivers|activities|downloads|readers|vehicles|deadlines|rest|settings)$/.exec(location.hash);
 if(m && ROLE_NAV[m[1]].some(x=>x[0]===m[2])){state.role=m[1];state.page=m[2];render();}
});
const initial=/^#(admin|driver)\/(dashboard|hours|drivers|activities|downloads|readers|vehicles|deadlines|rest|settings)$/.exec(location.hash);
if(initial && ROLE_NAV[initial[1]].some(x=>x[0]===initial[2])){state.role=initial[1];state.page=initial[2];}
render();
