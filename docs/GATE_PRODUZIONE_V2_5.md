# TachoLog V2.5 — Evidenze e controllo giornaliero (staging)

## Non dichiarare 10/10 prima del collaudo
La webapp pubblica in \`/azienda/\` resta una DEMO e non riceve DDD reali. La nuova logica è **solo backend-ready**, non applicata ad autisti: NON afferma infrazioni accertate o conformità. È una base tecnica con test automatici di regressione.

## Gate DDD obbligatorio prima del conteggio
\`auditDddEvidence\` richiede carta conducente, hash SHA-256 originale, firma verificata, catena ERCA verificata, decoder completo e versionato, identità carta↔autista, copertura e attestazione server. L'attestazione non può essere decisa dal frontend: deve essere costruita nel backend dopo i controlli. Questi campi sono un **contratto interno**, non un verificatore crittografico. Nessun DDD viene accettato come autentico solo perché il suo nome termina in .DDD.

## Periodi giornalieri di guida
\`previewDailyDriving\` verifica limiti numerici art. 6(1) Reg. CE 561/2006: >10 ore e più di due giorni di guida >9 ore a settimana. **Non inventa i confini del giorno legale:** riceve periodi tra riposi che un futuro motore, collaudato, dovrà definire. Richiede fonte attendibile, riposi verificati, sequenza completa e settimane complete; altrimenti restituisce \`non-valutabile\`. Non gestisce art. 12, multipresenza, deroghe e paesi: segnalazioni preliminari da revisionare.

## Decoder esterno: valutazione documentata
- \`way-platform/tachograph-go\`: MIT, possibile base per un servizio Go. Alla data del 4 novembre 2026 ci sono **segnalazioni aperte sulla verifica della firma di alcuni file Gen2**, perciò NON va dichiarata l'autenticità solo perché la libreria completa il parsing. https://github.com/way-platform/tachograph-go/issues
- \`traconiq/tachoparser\`: pubblicizza Gen1, Gen2 e Gen2v2, chiavi ERCA e firma. Licenza **AGPL-3.0**: richiede verifica legale sugli obblighi relativi al codice di un servizio usato in rete e test di interoperabilità. https://github.com/traconiq/tachoparser
- I certificati ERCA/G2 sono gestiti da JRC. Serve un processo di aggiornamento, verifica/revoca e casi di firma alterata.

## Gate di rilascio obbligatori
- [ ] Backend Auth/tenant/driver e storage privato con audit e autorizzazioni
- [ ] DDD reali di tutte le generazioni autorizzati, verificati con secondo software di controllo, hash e metadati
- [ ] Decoder e firme collaudati; gestione data quality fail-closed
- [ ] Motore normativo completo (artt. 6, 7, 8, 12 Reg. 561/2006, 2002/15/CE, trasposizioni nazionali e deroghe)
- [ ] Test DST, confini settimana e periodi di riposo multi-settimana
- [ ] Gravità UE solo con mappatura ufficiale e revisione umana
- [ ] Report e workflow difendibili, diritti privacy del lavoratore
- [ ] Test reali iPhone/Android e test hardware con interruzioni alimentazione
