import test from 'node:test';
import assert from 'node:assert/strict';
import {DEMO,ROLE_NAV,STATUS_LABELS,visibleDrivers,visibleDownloads,searchDrivers,filterDownloads,dueLabel} from '../azienda/model.mjs';
const admin = {orgId:'org-demo',role:'admin',drivers:DEMO.drivers};
const driver = {orgId:'org-demo',role:'driver',driverId:'drv-001',drivers:DEMO.drivers};
test('demo non equivale ad autenticazione: vista driver limitata nel modello',()=>{
 assert.equal(visibleDrivers(DEMO.drivers,driver).length,1);
 assert.equal(visibleDownloads(DEMO.downloads,driver).length,1);
 assert.equal(visibleDrivers(DEMO.drivers,driver)[0].id,'drv-001');
});
test('assenza di sessione e ruolo sconosciuto non restituiscono dati',()=>{
 assert.deepEqual(visibleDrivers(DEMO.drivers,null),[]);
 assert.deepEqual(visibleDrivers(DEMO.drivers,{...driver,role:'guest'}),[]);
 assert.deepEqual(visibleDownloads(DEMO.downloads,{...driver,orgId:'different'}),[]);
});
test('visibilità per organizzazione sulla vista amministratore',()=>{
 assert.equal(visibleDrivers(DEMO.drivers,admin).length,4);
 assert.equal(visibleDownloads(DEMO.downloads,admin).length,3);
 const extra = {...DEMO.drivers[0],id:'hidden',orgId:'another-org'};
 assert.equal(visibleDrivers([...DEMO.drivers,extra],admin).length,4);
});
test('filtro ricerca e stato lavora su campi previsti',()=>{
 assert.equal(searchDrivers(DEMO.drivers,'aut-003').length,1);
 assert.equal(searchDrivers(DEMO.drivers,'inesistente').length,0);
 assert.equal(filterDownloads(DEMO.downloads,'verified').length,1);
 assert.equal(filterDownloads(DEMO.downloads,'all').length,3);
});
test('scadenze illustrative hanno stati prevedibili',()=>{
 const today=new Date('2026-11-04T12:00:00');
 assert.equal(dueLabel('2026-11-03',today).tone,'bad');
 assert.equal(dueLabel('2026-11-04',today).text,'Oggi');
 assert.equal(dueLabel('2026-11-06',today).tone,'pending');
 assert.equal(dueLabel('2026-11-27',today).tone,'good');
 assert.equal(dueLabel(null,today).tone,'pending');
});
test('pagine e stati previsti sono coerenti',()=>{
 assert.equal(new Set(ROLE_NAV.admin.map(x=>x[0])).size,ROLE_NAV.admin.length);
 assert.equal(new Set(ROLE_NAV.driver.map(x=>x[0])).size,ROLE_NAV.driver.length);
 assert.ok(Object.hasOwn(STATUS_LABELS,'rejected'));
});
