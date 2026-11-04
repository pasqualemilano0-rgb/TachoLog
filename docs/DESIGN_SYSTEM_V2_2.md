# TachoLog Business · Design System V2.2

Stato: **restyling UI demo**, non autorizza l’uso con dati reali, non modifica la PWA personale.

## Linea visuale
- Sidebar navy `#101b2d`, contenuto grigio chiarissimo `#f4f6fa`, card bianche.
- Blu azione `#315fdf`, ambra per attenzione, rosso per anomalie numeriche; mai verde a suggerire conformità normativa non verificata.
- Font system stack con Inter se disponibile localmente, senza risorse remote; offline preservato.
- Densità desktop adatta alle tabelle gestionali, layout responsivo con barre di navigazione mobile.
- Priorità: dashboard operativa → controllo ore → dettaglio autista → DDD e Reader.

## Privacy e significato degli stati
Tutti i nomi e le ore appartengono alla demo. I colori e i badge indicano soltanto triage di soglie esemplificative. Non costituiscono rilevazione, prova o accertamento di infrazione. Nessuna autenticazione/backend implementata.

## Accessibilità e validazione
- Contrasto testuale e focus visibile, pulsanti semanticamente raggiungibili tramite tastiera.
- Preferenza reduced motion rispettata.
- Testare navigazione, filtri, larghezze 375px / 1440px, screenshot e console browser.
- `professional.css` è un layer separato da `styles.css`: rollback semplice senza toccare dati o logica.
