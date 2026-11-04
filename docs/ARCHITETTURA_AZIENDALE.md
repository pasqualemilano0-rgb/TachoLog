# TachoLog Aziendale — Architettura proposta V2.0

Stato: **prototipo UI**, non servizio di produzione. Ultimo aggiornamento: 2026-11-04.

## Obiettivo

Una piattaforma multi-azienda per lo scarico **della carta conducente** tramite TachoLog Reader (ESP32-S3 + USB CCID), conservazione dei file originali `.DDD`, analisi futura, monitoraggio dei periodi di guida/riposo e accesso differenziato fra azienda e autista.

La memoria tachigrafo del veicolo **non** viene letta dal normale lettore carta: richiede un flusso e interfacce separati e autorizzazioni previste dalla normativa.

La PWA personale V1 (`/`) resta **invariata**: registrazioni manuali, archiviazione DDD (senza decodifica), backup cifrati, dati sul dispositivo. La nuova UI (`/azienda/`) è un'anteprima totalmente **statica** con dati fittizi, senza autenticazione, upload, cloud o Reader collegato. Il cambio di vista **non** implementa controllo d'accesso.

## Navigazione

| Amministratore | Autista |
| --- | --- |
| Panoramica flotta | La mia giornata |
| Autisti | Attività |
| Scarichi DDD | I miei DDD |
| Reader ESP32 | Guida e riposi (non calcolati in V2 demo) |
| Veicoli | Profilo |
| Scadenze | |
| Impostazioni | |

L'accesso personale richiederà un vero account. Non utilizzare la scelta di ruolo lato browser come barriera di sicurezza.

## Identità e autorizzazioni

- **Organizzazione**: tenant che gestisce flotta e incarichi; tutte le risorse aziendali sono associate a `organization_id`.
- **Utente**: identità di autenticazione indipendente dall'anagrafica del conducente; credenziali gestite da sistema Auth, mai salvate in chiaro nel nostro database.
- **Membership**: utente, azienda, ruolo (`owner`, `admin`, `driver`), stato, scadenza/revoca.
- **Driver**: anagrafica ridotta, eventuale legame `auth_user_id`, account eventualmente ancora da attivare.
- L'azienda autorizzata può vedere solo le risorse del proprio tenant; il driver può vedere soltanto le risorse personali a cui è associato.
- **Controlli nel backend** e, se disponibile, Row Level Security sul DB. Non fidarsi mai di `organization_id`, `driver_id` o `role` passati dal client. Derivarli dalla sessione autenticata e dalla membership attiva.
- Account amministratori con MFA, limiti di tentativi, logout/revoca sessioni, cookie HttpOnly Secure SameSite e protezione CSRF dove applicabile.

## Entità minime

```text
organizations(id, name, created_at)
users(id, auth_subject, created_at)
organization_memberships(id, organization_id, user_id, role, active, created_at)
drivers(id, organization_id, auth_user_id?, display_name, status, created_at)
vehicles(id, organization_id, fleet_code, metadata, active)
assignments(id, organization_id, driver_id, vehicle_id, valid_from, valid_to?)
driver_cards(id, organization_id, driver_id, card_fingerprint, generation?, valid_from?, valid_to?)
readers(id, organization_id, device_public_key, label, status, activated_at?, revoked_at?)
reader_sessions(id, organization_id, reader_id, started_at, completed_at?, result)
ddd_uploads(id, organization_id, driver_id?, reader_id?, type, sha256, storage_key, size,
            acquisition_time, received_at, validation_status, signature_status,
            decoder_version?, error_code?, submitted_by)
activities(id, organization_id, driver_id, source, source_ddd_id?, start_utc, end_utc,
           type, quality_state, entered_by?, created_at)
review_items(id, organization_id, driver_id, source_ddd_id?, reason, status, reviewer_id?)
audit_events(id, organization_id, actor_type, actor_id, action, object_type, object_id,
             timestamp, ip_metadata?, result)
```

**Vincoli chiave:** `organization_id` immutabile per le risorse sensibili; chiavi esterne che impediscano riferimenti cross-tenant; `DDD` non sovrascritto; deduplicazione tramite `(organization_id, sha256, document_type)` senza confondere letture diverse; `activities` DDD e manuali separati; correzioni come eventi e non riscritture dei dati firmati.

I file veri vanno in **storage privato**, non nel DB in chiaro né su GitHub/GitHub Pages. L'URL per scaricare un DDD deve essere di durata limitata e generato dopo verifica dei permessi. Cifratura at-rest, trasporto TLS, backup verificabili e politica di conservazione conforme agli obblighi applicabili.

## Flusso Reader → azienda → autista

1. L'amministratore autorizzato registra l'ESP32 tramite **provisioning una tantum**. Il dispositivo genera una coppia di chiavi e riceve credenziali revocabili; non includere segreti permanenti nel firmware pubblico.
2. L'autista inserisce la carta a veicolo fermo. Il lettore CCID e lo stack tachigrafico eseguono lo scarico rispettando generazione, struttura e firme.
3. L'ESP32 salva temporaneamente un blob con hash SHA-256 e metadati minimi; interruzioni dell'accendisigari non devono produrre un file marcato come completo.
4. Se Internet è disponibile, il Reader carica il file con credenziali dispositivo e canale HTTPS; altrimenti resta in coda cifrata locale, con quota massima e cancellazione controllata. Il Wi-Fi locale può offrire trasferimento all'iPhone per la modalità assistita.
5. Il backend riceve il file **in quarantena** e applica limite dimensione, controllo duplicati, integrità hash, verifica della firma, validazione tipo/generazione e associazione alla carta/autista. Nessuno stato «verificato» senza verifica reale.
6. Il file originale immutabile viene archiviato; dati decodificati separati e identificati con versione decoder, UTC e fonte.
7. L'amministratore vede gli scarichi dell'azienda; l'autista solo i propri. Ogni accesso e download sensibile è tracciato nell'audit log.

## Contratto API proposto (non implementato)

```text
POST /v1/reader/enroll                  account admin, token monouso
POST /v1/reader/uploads                 autenticazione device + rate limit
PUT  /v1/reader/uploads/:id/blob        upload autorizzato e verificato
POST /v1/reader/uploads/:id/complete    conferma con hash, esito e idempotenza
GET  /v1/me/overview                    dati del conducente autenticato
GET  /v1/me/activities                  filtri server-side sulla propria identità
GET  /v1/me/ddd                         solo metadati DDD personali
GET  /v1/me/ddd/:id/download             URL firmato e a breve scadenza
GET  /v1/admin/drivers                   membri autorizzati del tenant
GET  /v1/admin/ddd                       DDD del tenant autorizzato
GET  /v1/admin/readers                   reader del tenant
POST /v1/admin/readers/:id/revoke        revoca certificato/token dispositivo
GET  /v1/admin/audit                     lettura eventi riservata e paginata
```

Il backend può essere implementato con PostgreSQL/RLS + servizio Auth + object storage privato, oppure con uno stack equivalente. La scelta va completata prima di implementare credenziali e upload; l'anteprima non ha dipendenze da un provider specifico.

## Checklist sicurezza prima del reale utilizzo

- [ ] Auth robusta; MFA amministratori; recupero account; rotazione/revoca sessioni
- [ ] Isolamento cross-tenant e driver-id testato end-to-end con test negativi
- [ ] Device enrollment sicuro, gestione chiavi e revoca, prevenzione replay
- [ ] DDD in storage privato con hash, firme, quarantena e scansioni input
- [ ] Audit append-only e monitoraggio tentativi/anomalie
- [ ] Cifratura dati sensibili e minimizzazione; GDPR, informativa, conservazione, ruoli del trattamento
- [ ] Strategie di backup/ripristino e prove di perdita di rete/alimentazione
- [ ] Decoder tachigrafico Gen1/Gen2/Gen2v2 verificato su campioni autorizzati
- [ ] Motore normativo e avvisi validati prima di mostrare “conforme”
- [ ] Collaudo iPhone/Android, offline e ripresa upload

## Fasi operative

- **V2.0 ora**: UI aziendale e autista, dati fittizi, navigazione e test; V1 personale intatta.
- **V2.1**: autenticazione, tenant, autorizzazioni e storage privato su staging. Non migrare dati locali senza consenso esplicito.
- **V2.2**: registrazione dispositivi, flusso upload e verifica DDD, audit.
- **V2.3**: decoder delle carte e separazione attività firmate/manuali, riconciliazione.
- **V2.4**: analytics guida/riposo, scadenze normative controllate e produzione.

La demo NON è un archivio legale né un servizio conforme da usare in azienda; gli stati e le date sono inventati.
