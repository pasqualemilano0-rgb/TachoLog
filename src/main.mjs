import {ACTIVITIES,validateActivity,dayKey,addDays,durationByActivity,getTotals,fmtMinutes,localDatetimeString,fromLocalInput,compareByStart,startOfDay} from './core.mjs';
import {getAll,put,remove,replaceAll} from './db.mjs';
import {encryptBackup,decryptBackup} from './backup.mjs';
const $=id=>document.getElementById(id);
const symbols={drive:'🚚',work:'🔧',available:'⏳',rest:'☕'};
let activities=[],ddd=[];
let toastTimer;
function toast(message,isError=false){const el=$('toast');el.textContent=message;el.className='toast show'+(isError?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.className='toast',4200);}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function show(id){
  for(const el of document.querySelectorAll('.page'))el.classList.toggle('active',el.id===id);
  for(const el of document.querySelectorAll('[data-go]')){
    const active=el.dataset.go===id&&el.closest('.bottom-nav');
    el.classList.toggle('selected',Boolean(active));
    if(el.closest('.bottom-nav'))active?el.setAttribute('aria-current','page'):el.removeAttribute('aria-current');
  }
  if(id==='history')renderHistory();if(id==='ddd')renderDdd();window.scrollTo({top:0,behavior:'instant'});
}
function createEl(tag,className,text){const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=text;return el;}
function timeRange(a,b){const fmt=new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});return `${fmt.format(new Date(a))} – ${fmt.format(new Date(b))}`;}
async function refresh(){activities=(await getAll('activities')).sort(compareByStart);ddd=(await getAll('ddd')).sort((a,b)=>b.importedAt.localeCompare(a.importedAt));renderSummary();renderHistory();renderDdd();renderLive();}
function renderSummary(){
  const date=new Date(`${$('summaryDate').value}T12:00:00`);
  if(Number.isNaN(date.getTime()))return;
  const total=getTotals(activities,date);
  $('todayDrive').textContent=fmtMinutes(total.day.drive);$('weekDrive').textContent=fmtMinutes(total.week.drive);$('fortnightDrive').textContent=fmtMinutes(total.fortnight.drive);
  $('todayWork').textContent=fmtMinutes(total.day.work);$('todayAvailable').textContent=fmtMinutes(total.day.available);$('todayRest').textContent=fmtMinutes(total.day.rest);
  $('dailyBar').style.width=`${Math.min(100,total.day.drive/(9*60)*100)}%`;
  $('dailyBar').classList.toggle('over',total.day.drive>540);
  $('dailyNote').textContent=total.day.drive>540?'Superate 9h nel giorno civile — verifica i dati ufficiali':'Riferimento indicativo: 9h ordinarie';
}
function renderHistory(){
  const list=$('activityList');list.replaceChildren();const day=startOfDay(new Date(`${$('historyDate').value}T12:00:00`)),end=addDays(day,1),startMs=day.getTime(),endMs=end.getTime();
  if(Number.isNaN(startMs))return;
  const records=activities.filter(x=>new Date(x.start).getTime()<endMs&&new Date(x.end).getTime()>startMs).sort(compareByStart);
  if(!records.length){list.append(createEl('div','empty','Nessuna attività in questa giornata.\nInseriscine una dalla scheda Manuale.'));return;}
  for(const item of records){
    const row=createEl('article','activity-item'),icon=createEl('div',`activity-icon ${item.type}`,symbols[item.type]);
    const desc=createEl('div','activity-desc'), title=createEl('b','',ACTIVITIES[item.type]||'Attività');
    const clippedA=new Date(Math.max(startMs,new Date(item.start).getTime()));const clippedB=new Date(Math.min(endMs,new Date(item.end).getTime()));
    const detail=createEl('small','',timeRange(clippedA,clippedB));desc.append(title,detail);
    if(item.note)desc.append(createEl('small','',item.note));
    const time=createEl('span','activity-time',fmtMinutes((clippedB-clippedA)/60000));
    const del=createEl('button','icon-btn','×');del.type='button';del.setAttribute('aria-label','Elimina attività');del.title='Elimina attività';
    del.addEventListener('click',async()=>{if(!confirm('Eliminare questa registrazione manuale?'))return;try{await remove('activities',item.id);await refresh();toast('Attività eliminata');}catch(e){toast(e.message,true);}});
    row.append(icon,desc,time,del);list.append(row);
  }
}
function renderDdd(){
  const list=$('dddList');list.replaceChildren();$('dddCount').textContent=String(ddd.length);
  if(!ddd.length){list.append(createEl('div','empty','Nessun file DDD archiviato.\nPuoi aggiungerlo con il pulsante qui sopra.'));return;}
  for(const item of ddd){
    const row=createEl('article','activity-item');const icon=createEl('div','activity-icon available','⇧');const desc=createEl('div','activity-desc');
    desc.append(createEl('b','',item.name),createEl('small','',`${(item.size/1024).toFixed(1)} KB • ${new Date(item.importedAt).toLocaleDateString('it-IT')}`));
    desc.append(createEl('small','',`SHA-256: ${item.hash.slice(0,18)}… • Non decodificato`));
    const actions=createEl('div','file-actions');const dl=createEl('button','secondary','Esporta originale');dl.type='button';dl.onclick=()=>download(item.blob,item.name);
    const del=createEl('button','icon-btn','×');del.type='button';del.title='Elimina DDD';del.setAttribute('aria-label','Elimina file DDD');
    del.onclick=async()=>{if(!confirm(`Eliminare il file ${item.name} dall'archivio locale?`))return;try{await remove('ddd',item.hash);await refresh();toast('File eliminato');}catch(e){toast(e.message,true);}};
    actions.append(dl,del);desc.append(actions);row.append(icon,desc);list.append(row);
  }
}
function activeSession(){try{return JSON.parse(localStorage.getItem('tacholog-active-v1')||'null');}catch{return null;}}
function renderLive(){const active=activeSession();$('liveState').textContent=active?`In corso: ${ACTIVITIES[active.type]} dal ${new Date(active.start).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}`:'Nessuna attività in corso';$('liveButton').textContent=active?'Termina e salva':'Avvia ora';}
async function liveToggle(){
  const current=activeSession();
  if(!current){localStorage.setItem('tacholog-active-v1',JSON.stringify({type:$('activityType').value,start:new Date().toISOString()}));renderLive();toast('Attività avviata. Potrai terminarla qui.');return;}
  try{
    const entry=validateActivity({id:crypto.randomUUID(),type:current.type,start:current.start,end:new Date().toISOString(),note:''},activities);
    await put('activities',entry);localStorage.removeItem('tacholog-active-v1');await refresh();toast('Attività terminata e salvata');
  }catch(e){toast(e.message,true);}
}
function toCSVCell(value){const txt=String(value??'');const safe=/^[\s]*[=+@\-\t\r]/.test(txt)?`'${txt}`:txt;return `"${safe.replaceAll('"','""')}"`;}
function exportCSV(){
  const rows=[['Tipo','Inizio ISO','Fine ISO','Durata minuti','Nota','Origine']];
  for(const a of activities)rows.push([ACTIVITIES[a.type],a.start,a.end,Math.round((new Date(a.end)-new Date(a.start))/60000),a.note||'','manuale']);
  const body='\ufeff'+rows.map(r=>r.map(toCSVCell).join(';')).join('\r\n');
  download(new Blob([body],{type:'text/csv;charset=utf-8'}),`TachoLog-attivita-${dayKey(new Date())}.csv`);
  toast('CSV esportato');
}
async function storeFiles(fileList){
  if(!crypto.subtle){toast('Serve HTTPS o localhost per calcolare l’impronta dei file',true);return;}
  for(const file of fileList){
    if(!/\.ddd$/i.test(file.name)){toast(`${file.name}: estensione diversa da .DDD`,true);continue;}
    if(file.size===0||file.size>15*1024*1024){toast(`${file.name}: file vuoto o superiore a 15 MB`,true);continue;}
    try{
      const bytes=await file.arrayBuffer();
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
      if(ddd.some(x=>x.hash===hash)){toast(`${file.name}: file già presente`);continue;}
      await put('ddd',{hash,name:file.name,size:file.size,importedAt:new Date().toISOString(),blob:new Blob([bytes],{type:'application/octet-stream'})});
      toast(`Archiviato: ${file.name} (non ancora decodificato)`);
      await refresh();
    }catch(e){toast(`Errore nel salvataggio DDD: ${e.message}`,true);}
  }
}
async function makeBackup(){
  const password=$('backupPassword').value;
  try{
    const encrypted=await encryptBackup(activities,ddd,password);
    download(new Blob([encrypted],{type:'application/json'}),`TachoLog-backup-cifrato-${dayKey(new Date())}.json`);
    $('backupPassword').value='';toast('Backup completo cifrato esportato');
  }catch(e){toast(e.message,true);}
}
async function restoreBackup(){
  const file=$('restoreFile').files?.[0],password=$('restorePassword').value;
  if(!file){toast('Seleziona il file del backup',true);return;}
  if(file.size>180*1024*1024){toast('Backup troppo grande',true);return;}
  try{
    const data=await decryptBackup(await file.text(),password);
    const records=[];
    for(const raw of data.activities){
      if(!raw||typeof raw.id!=='string'||typeof raw.note!=='string'||raw.note.length>600)throw new Error('Attività del backup non valida');
      const act=validateActivity({id:raw.id,type:raw.type,start:raw.start,end:raw.end,note:raw.note},[]);
      records.push(act);
    }
    records.sort(compareByStart);
    for(let i=1;i<records.length;i++)if(new Date(records[i].start)<new Date(records[i-1].end))throw new Error('Attività sovrapposte nel backup');
    if(new Set(records.map(a=>a.id)).size!==records.length)throw new Error('Attività duplicate nel backup');
    const hashes=new Set();
    for(const f of data.files){
      if(!f||typeof f.name!=='string'||!/\.ddd$/i.test(f.name)||f.blob.size>15*1024*1024||f.blob.size===0||f.blob.size!==f.size)throw new Error('DDD del backup non valido');
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await f.blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');
      if(hash!==f.hash||hashes.has(hash))throw new Error('DDD alterato o duplicato nel backup');
      hashes.add(hash);
    }
    if(!confirm(`Ripristinare ${records.length} attività e ${data.files.length} file DDD? Tutti i dati locali attuali saranno sostituiti.`))return;
    await replaceAll(records,data.files);localStorage.removeItem('tacholog-active-v1');$('restoreFile').value='';$('restorePassword').value='';await refresh();toast('Ripristino completato');
  }catch(e){toast(e.message,true);}
}
async function init(){
  $('summaryDate').value=dayKey(new Date());$('historyDate').value=dayKey(new Date());
  const now=new Date();$('startTime').value=localDatetimeString(new Date(now.getTime()-30*60000));$('endTime').value=localDatetimeString(now);
  for(const button of document.querySelectorAll('[data-go]'))button.addEventListener('click',()=>show(button.dataset.go));
  $('summaryDate').addEventListener('change',renderSummary);$('historyDate').addEventListener('change',renderHistory);
  $('activityForm').addEventListener('submit',async ev=>{
    ev.preventDefault();
    try{
      const entry=validateActivity({id:crypto.randomUUID(),type:$('activityType').value,start:fromLocalInput($('startTime').value),end:fromLocalInput($('endTime').value),note:$('notes').value.trim()},activities);
      await put('activities',entry);$('notes').value='';await refresh();toast('Attività registrata');show('history');$('historyDate').value=dayKey(new Date(entry.start));renderHistory();
    }catch(e){toast(e.message,true);}
  });
  $('liveButton').addEventListener('click',liveToggle);
  $('dddInput').addEventListener('change',async ev=>{const files=Array.from(ev.target.files||[]);await storeFiles(files);ev.target.value='';});
  $('csvButton').addEventListener('click',exportCSV);$('backupButton').addEventListener('click',makeBackup);$('restoreButton').addEventListener('click',restoreBackup);
  $('eraseButton').addEventListener('click',async()=>{
    if(!confirm('Eliminare davvero tutte le attività e i DDD locali? La cancellazione non è reversibile senza backup.'))return;
    if(!confirm('Seconda conferma: procedere con la cancellazione definitiva?'))return;
    try{await replaceAll([],[]);localStorage.removeItem('tacholog-active-v1');await refresh();toast('Tutti i dati locali eliminati');}catch(e){toast(e.message,true);}
  });
  try{await refresh();}catch(e){toast(`Archivio non disponibile: ${e.message}`,true);}
  if('serviceWorker' in navigator&&isSecureContext)navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
init();
