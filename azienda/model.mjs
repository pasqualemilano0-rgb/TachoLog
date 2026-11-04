/** View-model helpers only: NOT server-side authorization. */
export const STATUS_LABELS = Object.freeze({
  received: 'Ricevuto', quarantine: 'In verifica', processing: 'In elaborazione',
  verified: 'Verificato', rejected: 'Respinto'
});
export const STATUS_CLASS = Object.freeze({
  received: 'pending', quarantine: 'pending', processing: 'pending',
  verified: 'good', rejected: 'bad'
});
export const ROLE_NAV = Object.freeze({
  admin: [
    ['dashboard', 'Panoramica', 'layout-dashboard'], ['drivers','Autisti','users'],
    ['downloads','Scarichi DDD','file-down'], ['readers','Reader ESP32','radio-tower'],
    ['vehicles','Veicoli','truck'],['deadlines','Scadenze','calendar-days'],
    ['settings','Impostazioni','settings']
  ],
  driver: [
    ['dashboard','La mia giornata','layout-dashboard'], ['activities','Attività','clock-3'],
    ['downloads','I miei DDD','file-down'],['rest','Guida e riposi','coffee'],
    ['settings','Profilo','user-round']
  ]
});
export function visibleDrivers(drivers, session) {
  if(!session || !session.orgId || !['admin','driver'].includes(session.role)) return [];
  return drivers.filter(d => d.orgId === session.orgId && (session.role === 'admin' || d.id === session.driverId));
}
export function visibleDownloads(files, session) {
  const allowed = new Set(visibleDrivers(session?.drivers ?? [], session).map(d=>d.id));
  return files.filter(f => f.orgId === session?.orgId && allowed.has(f.driverId));
}
export function searchDrivers(drivers, term = '') {
  const q = term.trim().toLocaleLowerCase('it');
  if (!q) return drivers;
  return drivers.filter(d => [d.label,d.code].some(v=>String(v).toLocaleLowerCase('it').includes(q)));
}
export function filterDownloads(downloads, status = 'all') {
  return status === 'all' ? downloads : downloads.filter(x => x.status === status);
}
export function dueLabel(dateString, reference = new Date()) {
  if (!dateString) return {text:'Non disponibile',tone:'pending'};
  const due = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(due.getTime())) return {text:'Data non valida',tone:'bad'};
  const today = new Date(reference.getFullYear(),reference.getMonth(),reference.getDate(),12);
  const diff = Math.round((due.getTime()-today.getTime())/86400000);
  if(diff < 0) return {text:'Scaduto',tone:'bad'};
  if(diff <= 7) return {text:diff===0?'Oggi':`Entro ${diff} gg`,tone:'pending'};
  return {text:'Programmato',tone:'good'};
}
export const DEMO = Object.freeze({
  org: { id:'org-demo', label:'Azienda dimostrativa', code:'DEMO' },
  drivers: [
    {id:'drv-001',orgId:'org-demo',label:'Autista Demo 01',code:'AUT-001',vehicle:'Autocarro 01',downloadDue:'2026-11-10',active:true},
    {id:'drv-002',orgId:'org-demo',label:'Autista Demo 02',code:'AUT-002',vehicle:'Autocarro 02',downloadDue:'2026-11-20',active:true},
    {id:'drv-003',orgId:'org-demo',label:'Autista Demo 03',code:'AUT-003',vehicle:'Autocarro 03',downloadDue:'2026-11-05',active:true},
    {id:'drv-004',orgId:'org-demo',label:'Autista Demo 04',code:'AUT-004',vehicle:'Non assegnato',downloadDue:null,active:false}
  ],
  downloads: [
    {id:'ddd-001',orgId:'org-demo',driverId:'drv-001',type:'card',status:'verified',timestamp:'2026-11-02T09:30:00Z',source:'Reader Demo 01',hash:'a4f8…demo',size:'72 KB'},
    {id:'ddd-002',orgId:'org-demo',driverId:'drv-002',type:'card',status:'processing',timestamp:'2026-11-03T14:18:00Z',source:'Reader Demo 01',hash:'b19d…demo',size:'65 KB'},
    {id:'ddd-003',orgId:'org-demo',driverId:'drv-003',type:'card',status:'received',timestamp:'2026-11-04T07:40:00Z',source:'Reader Demo 02',hash:'c2a1…demo',size:'70 KB'}
  ],
  readers: [
    {id:'reader-demo-01',orgId:'org-demo',label:'Reader Demo 01',model:'ESP32-S3 · LCD',state:'Da attivare',vehicle:'Autocarro 01'},
    {id:'reader-demo-02',orgId:'org-demo',label:'Reader Demo 02',model:'ESP32-S3 · LCD',state:'Da attivare',vehicle:'Ufficio'}
  ],
  vehicles: [
    {id:'veh-001',orgId:'org-demo',name:'Autocarro 01',code:'VEI-001',due:'2026-12-05'},
    {id:'veh-002',orgId:'org-demo',name:'Autocarro 02',code:'VEI-002',due:'2026-11-18'},
    {id:'veh-003',orgId:'org-demo',name:'Autocarro 03',code:'VEI-003',due:'2026-11-26'}
  ],
  demoActivities: [
    {id:'a1',driverId:'drv-001',label:'Guida',from:'08:00',to:'10:15',duration:135,type:'drive'},
    {id:'a2',driverId:'drv-001',label:'Altri lavori',from:'10:15',to:'11:00',duration:45,type:'work'},
    {id:'a3',driverId:'drv-001',label:'Pausa',from:'11:00',to:'11:45',duration:45,type:'rest'},
    {id:'a4',driverId:'drv-001',label:'Guida',from:'11:45',to:'14:00',duration:135,type:'drive'}
  ]
});
