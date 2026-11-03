const NAME = 'tacholog-local-v1';
export function openDb() {
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(NAME,1);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if (!db.objectStoreNames.contains('activities')) db.createObjectStore('activities',{keyPath:'id'});
      if (!db.objectStoreNames.contains('ddd')) db.createObjectStore('ddd',{keyPath:'hash'});
    };
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
export async function getAll(store) {
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readonly'); const r=tx.objectStore(store).getAll();
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error); tx.oncomplete=()=>db.close();
  });
}
export async function put(store, record) {
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite'); tx.objectStore(store).put(record);
    tx.oncomplete=()=>{db.close();resolve();}; tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
export async function remove(store,key) {
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite'); tx.objectStore(store).delete(key);
    tx.oncomplete=()=>{db.close();resolve();}; tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
export async function replaceAll(activities, files) {
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(['activities','ddd'],'readwrite');
    tx.objectStore('activities').clear(); tx.objectStore('ddd').clear();
    for (const a of activities) tx.objectStore('activities').put(a);
    for (const f of files) tx.objectStore('ddd').put(f);
    tx.oncomplete=()=>{db.close();resolve();}; tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
