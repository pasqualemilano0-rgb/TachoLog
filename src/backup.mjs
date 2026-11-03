const enc = new TextEncoder();
const dec = new TextDecoder();
function b64(bytes) {
  let out=''; for (let i=0;i<bytes.length;i+=8192) out+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(out);
}
function unb64(value) { const raw=atob(value); return Uint8Array.from(raw,c=>c.charCodeAt(0)); }
async function key(password, salt) {
  const k=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function encryptBackup(records, files, password) {
  if (password.length<12) throw new Error('Usa una password di almeno 12 caratteri per il backup');
  const rawFiles=[];
  for (const f of files) rawFiles.push({name:f.name,hash:f.hash,size:f.size,importedAt:f.importedAt,content:b64(new Uint8Array(await f.blob.arrayBuffer()))});
  const payload=enc.encode(JSON.stringify({schema:1,activities:records,files:rawFiles}));
  const salt=crypto.getRandomValues(new Uint8Array(16)), iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(password,salt),payload));
  return JSON.stringify({format:'tacholog-backup',version:1,kdf:'PBKDF2-SHA256-250000',cipher:'AES-256-GCM',salt:b64(salt),iv:b64(iv),data:b64(cipher)});
}
export async function decryptBackup(json, password) {
  const env=JSON.parse(json);
  if (env?.format!=='tacholog-backup'||env.version!==1||typeof env.data!=='string') throw new Error('Questo file non è un backup TachoLog valido');
  let bytes;
  try { bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(env.iv)},await key(password,unb64(env.salt)),unb64(env.data)); }
  catch { throw new Error('Password errata o backup danneggiato'); }
  const payload=JSON.parse(dec.decode(bytes));
  if (payload?.schema!==1||!Array.isArray(payload.activities)||!Array.isArray(payload.files)) throw new Error('Struttura backup non valida');
  if (payload.activities.length>100000||payload.files.length>500) throw new Error('Backup troppo grande');
  const files=payload.files.map(x=>({name:x.name,hash:x.hash,size:x.size,importedAt:x.importedAt,blob:new Blob([unb64(x.content)],{type:'application/octet-stream'})}));
  return {activities:payload.activities,files};
}
