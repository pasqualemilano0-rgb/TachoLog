import {EU_RULES,EU_SOURCES,RULE_STAGE,coverageSummary} from './eu-rules.mjs';

/** Presentazione statica delle regole. Non accede a dati personali. */
export function regulationsView({group='Tutte',esc,banner,kicker,panel,metric,tableWrap,badge}){
 const s=coverageSummary();
 const cats=['Tutte',...s.groups];
 const allowed=cats.includes(group)?group:'Tutte';
 const matching=EU_RULES.filter(r=>allowed==='Tutte'||r.category===allowed);
 const rows=matching.map(r=>'<tr><td><b>'+esc(r.title)+'</b><span class="table-muted">'+esc(r.requirement)+'</span></td><td><span class="rule-id">'+esc(r.id)+'</span><span class="table-muted">'+esc(r.law)+' · '+esc(r.article)+'</span></td><td>'+badge(RULE_STAGE[r.stage].label,RULE_STAGE[r.stage].tone)+'</td></tr>');
 const options=cats.map(c=>'<option value="'+esc(c)+'" '+(allowed===c?'selected':'')+'>'+esc(c)+'</option>').join('');
 const sourceNames={driving:'Guida e riposi · 561/2006',work:'Orario di lavoro · 2002/15/CE',tachograph:'Tachigrafo · 165/2014',download:'Scarichi · 581/2010',severity:'Classificazione · 2006/22/CE'};
 const sources=Object.entries(EU_SOURCES).map(([key,url])=>'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(sourceNames[key])+'</a>').join('');
 return kicker('CENTRO NORMATIVO','Normativa europea e copertura','Regole UE per il trasporto merci. I controlli preliminari non sono accertamenti di infrazione.')+
 banner()+
 '<div class="kpi-grid">'+
 metric('Regole catalogate',s.total,'Riferimenti UE tracciabili','archive')+
 metric('Precontrolli tecnici',s.preview,'Solo verifiche preliminari','activity')+
 metric('Controlli non attivi',s.blocked,'Richiedono decoder e contesto','alert','amber')+
 metric('Aree normative',s.groups.length,'Guida, riposi, lavoro e altro','shield')+
 '</div>'+
 '<div class="regulation-alert"><b>Non è ancora un motore completo di rilevamento infrazioni.</b><p>Questa versione elenca le aree principali e implementa quattro precontrolli numerici in un modulo isolato. Prima di segnalare infrazioni reali servono DDD verificati, riposi completi, norme locali, eccezioni e revisione umana.</p></div>'+
 '<div class="filters"><label class="select-filter">Area <select id="rule-filter" aria-label="Filtra area normativa">'+options+'</select></label><span class="filter-hint">'+matching.length+' regole</span></div>'+
 panel('Copertura del motore UE','Precontrollo = codice disponibile per timeline complete, non validato su DDD reali',tableWrap(['Regola e requisiti','Riferimento','Stato'],rows))+
 '<section class="regulation-flow"><h2>Dal dato grezzo alla valutazione affidabile</h2><div class="regulation-steps"><span>DDD originale</span><span>Verifica e decodifica</span><span>Guida, pause e riposi</span><span>Deroghe e norme locali</span><span>Revisione delle anomalie</span></div></section>'+
 panel('Fonti normative ufficiali','Documenti legislativi, non materiale commerciale','<div class="rule-links">'+sources+'</div>');
}
