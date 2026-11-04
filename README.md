> **V2.4 — Normativa UE:** nuova sezione amministratore con catalogo delle verifiche UE e quattro precontrolli su timeline normalizzate. Nessun DDD reale decodificato, nessuna infrazione accertata. Dettagli in `docs/NORMATIVA_UE.md`.

> **V2.2 Design System:** disponibile l’interfaccia aziendale professionale in `azienda/professional.css` e la specifica `docs/DESIGN_SYSTEM_V2_2.md`. L’area `/azienda/` resta una **demo senza autenticazione e con soli dati inventati**. Il TachoLog personale è invariato.

# TachoLog — Versione personale + anteprima aziendale

**Nuovo:** apri [`/azienda/`](./azienda/) per l'anteprima V2.0 con dashboard aziendale, vista autista, sezioni autisti, scarichi, Reader, veicoli e scadenze. Mostra **solo dati inventati**: il selettore dei ruoli non è un login, e non ci sono ancora server, importazione DDD reale o Reader collegati. Consulta [Architettura aziendale](./docs/ARCHITETTURA_AZIENDALE.md).

La versione originale alla radice `/` resta invariata e conserva localmente i dati personali senza cloud. Nessun dato o DDD vero deve essere inserito nell'anteprima V2.0.

---

# TachoLog — MVP locale 1.0 alpha

Webapp PWA in italiano, senza dipendenze JavaScript esterne né tracciamento. Progetto **indipendente** da LTS Registro Viaggi.

## Funzionalità già presenti
- Registrazione manuale delle quattro attività: guida, altri lavori, disponibilità, pausa/riposo.
- Intervalli oltre mezzanotte, controllo di sovrapposizione, avvio/termine attività in tempo reale.
- Riepiloghi per **giorno civile**, settimana lunedì–domenica, settimana corrente + precedente.
- Archivio originale di file `.DDD` in IndexedDB, con hash SHA-256 e controllo duplicati; esportazione originale.
- CSV delle attività manuali (con protezione formula injection).
- Backup completo (attività + DDD) con AES-256-GCM e password PBKDF2-SHA256, ripristino verificato, eliminazione locale.
- PWA: service worker e funzionamento offline dopo prima apertura da HTTPS/localhost.

## Limitazioni importanti
1. **I file .DDD vengono conservati, NON decodificati** in questa alpha. Non sono verificate firme, certificati o generazioni. Nessun dato .DDD alimenta il riepilogo.
2. Gli aggregati sono semplici totalizzatori per calendario, NON il motore normativo del Reg. CE 561/2006. Non determinano infrazioni, pause residue, deroghe o riposi legali.
3. Non è un tachigrafo, né una lettura in diretta della carta; non sostituisce dispositivo, documenti e verifiche ufficiali.
4. Nessun cloud e nessun login: i dati risiedono nel browser locale. La cancellazione dei dati del browser può eliminarli. Fare backup cifrati.
5. L'orario locale è soggetto a fusi e DST: la precisione normativa richiede una successiva implementazione specializzata.

## Avvio

```bash
cd TachoLog_V1
python3 -m http.server 4173
```

Apri `http://localhost:4173` su PC, oppure pubblica i file su HTTPS (per Android). Da un telefono non basta aprire `index.html` da file locale: occorre un server HTTPS. Per installare come PWA, usare Chrome > Aggiungi a schermata Home (se supportato).

## Test

```bash
npm test
```

## Roadmap per l'importatore DDD verificato
- Analizzare librerie sotto licenza permissiva, ad esempio [way-platform/tachograph-go](https://github.com/way-platform/tachograph-go) (MIT) oppure [flespi-software/TachoBox](https://github.com/flespi-software/TachoBox) (MIT), revisionare dipendenze e sicurezza.
- In un modulo isolato decoder: distinguere carta conducente e VU, Gen1 / Gen2 / Gen2v2, estrarre le attività da EF, identificare buffer circolari, fusi/UTC; validare firme e certificati.
- Usare file di prova anonimi reali con consenso, di più generazioni, test di malformazione e corruzione.
- Gestire conflitti fra intervalli manuali e importati senza sovrascrivere i dati originali. Mostrare fonte, grado di verifica e anomalie.
- Solo dopo il collaudo, integrare il motore di conformità completo (Reg. CE 561/2006, Reg. UE 165/2014, deroghe pertinenti) e alert legali.
- Infine aggiungere autenticazione, cifratura lato client e cloud privato opzionale con sincronizzazione e risoluzione conflitti.

## Sicurezza/privacy
Codice senza CDN, nessuna chiamata a servizi esterni, IndexedDB locale, backup cifrato esportabile. Il contenuto non è cifrato a riposo nel browser: usare blocco schermo e non condividere il dispositivo. Per un deploy di produzione è necessario configurare HTTPS, CSP, controlli e aggiornamenti.

## Pubblicazione su GitHub Pages

1. Crea un repository GitHub **dedicato** a `TachoLog` (non mescolarlo con progetti di autisti o booking).
2. Pubblica i file presenti in questa cartella nella radice del repository, preservando le sottocartelle `src/`, `icons/`, `test/`, `.github/`. Non caricare file reali `.DDD`, backup o CSV.
3. Nelle impostazioni GitHub `Settings > Pages`, scegli `Deploy from a branch`, branch `main`, cartella `/(root)` e salva. In GitHub Free la pubblicazione Pages è disponibile sui repository pubblici. Anche se il codice è pubblico, **non vengono pubblicati i dati personali registrati nel browser**; restano memorizzati localmente sul dispositivo.
4. Apri l'indirizzo effettivo mostrato da GitHub Pages e prova registrazione manuale, backup e offline da Android. Il sito pubblicato su Pages è accessibile pubblicamente e **non** offre autenticazione.

**Privacy:** i dati locali di IndexedDB non sono cifrati a riposo. Per dati personali usare un dispositivo con blocco schermo e backup cifrati. Evita l'inserimento di dati sensibili su un telefono condiviso. Non considerare gli aggiornamenti della webapp come un backup.

**Stato del collaudo:** i test Node verificano solo funzioni di base e cifratura. I test Android, l'importazione analitica dei DDD, la verifica delle firme e la validazione normativa sono passaggi ancora aperti.


## Modulo controllo ore V2.1 (demo)
La schermata `azienda/#admin/hours` visualizza una classifica delle anomalie numeriche, il confronto 56h/90h, i dati mancanti e il dettaglio delle segnalazioni con fonti DEMO. Nessuna infrazione è accertata, nessun DDD reale è letto, nessuna pubblicazione di dati personali. Non usarla per decisioni disciplinari. Verifiche: `npm test`.


## V2.3 — Grafici dei tempi di guida (demo)

La dashboard aziendale mostra un **grafico a barre delle ore settimanali per autista**. La sezione `Controllo ore` include confronti settimanali e bisettimanali con soglie numeriche indicative, più un **grafico di andamento giornaliero** nel dettaglio conducente. I dati mancanti sono mostrati come N/D, non come zero e non come conformità. I 7 valori giornalieri sono totalmente inventati e hanno la stessa somma del totale settimanale demo. Nessun DDD viene decodificato e nessuna infrazione è accertata automaticamente. L'app personale / resta invariata.
