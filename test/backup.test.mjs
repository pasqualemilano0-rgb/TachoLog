import test from 'node:test';
import assert from 'node:assert/strict';
import {encryptBackup,decryptBackup} from '../src/backup.mjs';
test('backup cifrato: conserva attività e originale DDD',async()=>{
  const records=[{id:'r1',type:'drive',start:'2026-11-03T08:00:00Z',end:'2026-11-03T09:00:00Z',note:'prova'}];
  const bytes=new Uint8Array([0,118,33,0,255]);
  const files=[{name:'test.ddd',hash:'abc',size:bytes.length,importedAt:'2026-11-03T10:00:00Z',blob:new Blob([bytes])}];
  const env=await encryptBackup(records,files,'PasswordMoltoLunga123!');
  assert.ok(!env.includes('test.ddd'));
  assert.ok(!env.includes('prova'));
  const recovered=await decryptBackup(env,'PasswordMoltoLunga123!');
  assert.deepEqual(recovered.activities,records);
  assert.deepEqual(new Uint8Array(await recovered.files[0].blob.arrayBuffer()),bytes);
  assert.equal(recovered.files[0].name,'test.ddd');
  await assert.rejects(()=>decryptBackup(env,'password-sbagliata'),/errata|danneggiato/);
});
test('backup rifiuta password corta',async()=>{
  await assert.rejects(()=>encryptBackup([],[],'123'),/12 caratteri/);
});
