# TachoLog — Matrice normativa UE e condizioni di affidabilità

**Stato:** V2.4, inventario delle regole + precontrolli su timeline normalizzate. **NON è un analizzatore completo né un accertamento di infrazioni.** La UI aziendale usa solo dati inventati e non riceve DDD reali.

## Benchmark funzionale
Il prodotto di riferimento è **SIPLI FLEET — Tacho Analyzer**, non "SimpliFleet". Funzioni pubblicamente descritte: analisi delle infrazioni, controllo dei tempi di guida e dei riposi, orario di lavoro, tendenze di rischio, lettere di debriefing. Lo utilizziamo come benchmark di **funzionalità**, non copiamo codice o design.

https://www.siplifleet.it/tacho-analyzer/

## Fonti normative primarie
- Reg. CE 561/2006, versione consolidata 31.12.2024: https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:02006R0561-20241231
- Direttiva 2002/15/CE: https://eur-lex.europa.eu/eli/dir/2002/15/oj
- Reg. UE 165/2014: https://eur-lex.europa.eu/eli/reg/2014/165/oj
- Reg. UE 581/2010: **28 giorni carta conducente; 90 giorni VU**, non confondere con 56 giorni di documentazione a bordo: https://eur-lex.europa.eu/eli/reg/2010/581/oj/ita
- Direttiva 2006/22/CE allegato III modificato: https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:02006L0022-20240620
- Reg. UE 2016/403 e successive modifiche, gravità: https://eur-lex.europa.eu/eli/reg/2016/403/oj/eng
- Direttiva 2002/15/CE, trasposizioni nazionali e deroghe per contratti e lavoro notturno: richiedono profilo Paese.

## Cosa c'è adesso
- **Catalogo di copertura** articolato per guida, pause, riposi, lavoro, eccezioni, scarichi, tachigrafo e classificazione.
- **Precontrolli** isolati e testati sulla timeline già normalizzata (senza decoder): guida continuativa 4h30 / pausa 45 o sequenza 15+30; guida settimana 56h; guida due settimane 90h; lavoro settimanale 60h (guida + altri lavori).
- I risultati distinguono "possibile anomalia", "nessuna soglia superata" e "non valutabile". **Nessuno significa conformità certificata**. A parità di limite non viene generato un falso superamento. Gli eventi incompleti e i dati mancanti non diventano mai 0 ore.
- Settimane preparate **esplicitamente dal backend con fuso Europe/Rome e cambi di ora legale**. Il motore non suppone che ogni settimana duri sempre 168 ore in UTC. Il motore non accetta finestre non consecutive.
- I precontrolli non classificano automaticamente la gravità UE: devono prima esistere evidenze verificabili, contesto applicativo, versione della regola e revisione umana.

## Cosa impedisce l'uso operativo
1. Autenticazione server e isolamento effettivo per azienda/autista, audit, GDPR e gestione autorizzazioni. La selezione del ruolo nella demo NON è autenticazione.
2. Lettura **completa del DDD originale**, verifica delle firme digitali e certificati, tachigrafi Gen1/Gen2/Gen2v2, conservazione immutabile e hash.
3. Timeline continua multi-giorno: attività, manuali, attraversamenti, fusi, co-conducenti, eventi, fuori ambito e passaggi fra veicoli. I vuoti devono produrre "non valutabile".
4. Motore che ricostruisca periodi giornalieri **fra riposi**, pause e split, riposi ridotti/frazionati, compensazioni settimanali, due riduzioni internazionali, deroghe art. 12, multipresenza e paese/settore/periodo.
5. Orario di lavoro 48h medie nel periodo di riferimento e lavoro notturno secondo norme locali, eventuali altri datori e deroghe; non bastano i soli DDD.
6. Mappa precisa delle fattispecie e gravità (IM/IG/IMG/IPG), relativa norma attuale, modello di approvazione del revisore; nessuna "infrazione certa" prima di questo passaggio.
7. Report auditabili ed esportabili, note/giustificazioni, avviso all'autista e workflow di riscontro, non sanzioni automatiche.
8. Prove su DDD reali **autorizzati e pseudonimizzati**, casi noti con esito verificato da un esperto, test di regressione e revisione normativa periodica.

## Privacy, limiti d'uso, trasparenza
I dati del tachigrafo sono personali. Se l'azienda li usa per verificare il rispetto delle regole e monitorare conducenti, servono informativa chiara, base giuridica, gestione degli accessi e verifica delle norme sul controllo dei lavoratori, oltre a retention e minimizzazione. Evitare classifiche punitive automatizzate. Le anomalie sono segnali da verificare, non imputazioni immediate.

## Strategia d'implementazione
1. Backend privato + identità + conservazione DDD e verifica firme.
2. Decoder DDD validato e riconciliazione con registrazioni manuali.
3. Motore completo per 561/2006, con contesto multi-settimana e deroghe.
4. Motore 2002/15/CE, integrazione nazionale e documentazione di lavoro esterno.
5. Gravità ufficiale, rischi e dashboard per controlli e debrief con revisione.
6. Riesame legale e collaudo prima di attivare segnalazioni reali.


## V2.5b — Default fail-closed dei precontrolli

I quattro precontrolli originari NON emettono più `nessuna-soglia-superata` senza attestazione esplicita di provenienza DDD verificata e copertura temporale. La guida continuativa richiede anche un riposo qualificante iniziale. Il precontrollo 60h di lavoro richiede copertura delle attività presso eventuali altri datori. Un flag è un **contratto con il backend**, NON una prova crittografica e non va ricavato dal browser pubblico. I test storici usano un contesto di laboratorio esplicito; nuovi test verificano il comportamento prudente predefinito. L'interfaccia continua a utilizzare dati inventati.
