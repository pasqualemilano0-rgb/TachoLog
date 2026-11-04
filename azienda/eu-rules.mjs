/**
 * Catalogo delle principali verifiche UE sul tachigrafo e sull'orario di lavoro.
 * Le voci sono un inventario di copertura, NON un certificato di conformità.
 * I precontrolli numerici funzionano solo con una timeline attendibile e completa.
 */
export const EU_SOURCES = Object.freeze({
  driving:'https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:02006R0561-20241231',
  work:'https://eur-lex.europa.eu/eli/dir/2002/15/oj',
  tachograph:'https://eur-lex.europa.eu/eli/reg/2014/165/oj',
  download:'https://eur-lex.europa.eu/eli/reg/2010/581/oj/ita',
  severity:'https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:02006L0022-20240620'
});
const item=(id,category,title,law,article,stage,requirement)=>Object.freeze({id,category,title,law,article,stage,requirement});
export const EU_RULES=Object.freeze([
  item('EU-561-06-D','Guida','Guida giornaliera: 9 ore, estensione a 10','CE 561/2006','art. 6(1)','blocked','Periodi effettivi fra riposi, eccezioni e calendario delle estensioni'),
  item('EU-561-06-EXT','Guida','Massimo due estensioni a 10 ore per settimana','CE 561/2006','art. 6(1)','blocked','Giornate legali identificate, settimana e riposi completi'),
  item('EU-561-06-W','Guida','Guida settimanale: massimo 56 ore','CE 561/2006','art. 6(2)','preview','Settimana lun–dom completa e timestamp con fuso'),
  item('EU-561-06-2W','Guida','Due settimane consecutive: massimo 90 ore','CE 561/2006','art. 6(3)','preview','Entrambe le settimane complete e consecutive'),
  item('EU-561-07','Pause','4h30 di guida, pausa 45 minuti o 15 + 30','CE 561/2006','art. 7','preview','Sequenza continua delle attività; qualificazione corretta delle pause'),
  item('EU-561-08-D','Riposi','Riposo giornaliero regolare 11 ore o ridotto 9 ore','CE 561/2006','art. 8(2)','blocked','Finestre mobili di 24 ore fra riposi'),
  item('EU-561-08-SPLIT','Riposi','Riposo giornaliero frazionato 3 + 9 ore','CE 561/2006','art. 8(2)','blocked','Ordine e confini legali dei riposi'),
  item('EU-561-08-RED','Riposi','Massimo tre riposi giornalieri ridotti','CE 561/2006','art. 8(4)','blocked','Conteggio fra due riposi settimanali'),
  item('EU-561-08-W','Riposi','Riposo settimanale regolare di 45 ore','CE 561/2006','art. 8(6)','blocked','Storia multi-settimana dei riposi'),
  item('EU-561-08-WRED','Riposi','Riposo ridotto di almeno 24 ore e recuperi','CE 561/2006','art. 8(6)–(7)','blocked','Compensazioni, calendario e luogo di fruizione'),
  item('EU-561-08-6X24','Riposi','Riposo settimanale entro sei periodi di 24 ore','CE 561/2006','art. 8(6)','blocked','Confini riposi settimanali completi'),
  item('EU-561-08-MULTI','Eccezioni','Multipresenza e finestra di 30 ore','CE 561/2006','art. 8(5)','blocked','Equipaggio, cambi ruolo e dati di co-conducenza'),
  item('EU-561-08-INT','Eccezioni','Due riposi settimanali ridotti in trasporto internazionale','CE 561/2006','art. 8(6)','blocked','Paesi, 4 settimane, compensazioni e sede aziendale'),
  item('EU-561-12','Eccezioni','Superamenti eccezionali motivati e documentati','CE 561/2006','art. 12','blocked','Motivazioni, luogo di arrivo e prove verificabili'),
  item('EU-2002-15-W60','Lavoro','Orario di lavoro: massimo 60 ore settimanali','Direttiva 2002/15/CE','art. 4','preview','Guida + altri lavori, inclusi altri datori di lavoro'),
  item('EU-2002-15-AVG48','Lavoro','Media 48 ore su periodo di riferimento','Direttiva 2002/15/CE','art. 4','blocked','Periodo di riferimento, lavoro per altri datori e deroghe nazionali'),
  item('EU-2002-15-BREAK','Lavoro','Pause lavorative: 6h continue, 30/45 minuti','Direttiva 2002/15/CE','art. 5','blocked','Distinzione di lavoro, disponibilità, pause e turni'),
  item('EU-2002-15-NIGHT','Lavoro','Lavoro notturno e limite di 10 ore','Direttiva 2002/15/CE','art. 7','blocked','Definizione nazionale della notte e deroghe'),
  item('EU-581-CARD','Scarichi','Scarico dati carta conducente entro 28 giorni','UE 581/2010','art. 1(3)(b)','blocked','Date effettive degli scarichi, attività e integrità'),
  item('EU-581-VU','Scarichi','Scarico memoria veicolo entro 90 giorni','UE 581/2010','art. 1(3)(a)','blocked','Date VU, identità veicolo e copertura dei dati'),
  item('EU-165-ACT','Tachigrafo','Uso corretto della carta, eventi e attività mancanti','UE 165/2014','artt. 32–34','blocked','Decoder certificati, eventi e revisioni documentate'),
  item('EU-165-SIGN','Tachigrafo','Integrità e autenticità dei dati tachigrafici','UE 165/2014','art. 33 e allegati tecnici','blocked','Firme/certificati originali, hash e decoder validato'),
  item('EU-2006-22-SEV','Infrazioni','Gravità ufficiale delle infrazioni e revisione','Direttiva 2006/22/CE','allegato III','blocked','Regole effettive, dati completi e applicazione normativa contestualizzata')
]);
export const RULE_STAGE=Object.freeze({
  preview:{label:'Precontrollo disponibile',tone:'pending'},
  blocked:{label:'Richiede dati e motore normativo',tone:'neutral'}
});
export function coverageSummary(rules=EU_RULES){
 const count=stage=>rules.filter(r=>r.stage===stage).length;
 const groups=[...new Set(rules.map(r=>r.category))];
 return {total:rules.length,preview:count('preview'),blocked:count('blocked'),groups};
}
