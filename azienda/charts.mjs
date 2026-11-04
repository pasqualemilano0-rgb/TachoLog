/* Grafici SVG locali, senza CDN né raccolta dati. Solo dati dimostrativi. */
function safeXml(v){return String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function timeLabel(min){return `${Math.floor(min/60)}h ${String(min%60).padStart(2,'0')}m`;}
function barChart(rows, drivers, options){
  const key=options?.key,limit=options?.limit,label=String(options?.label??'Grafico');
  const allowedKeys=['weeklyMinutes','fortnightMinutes'];
  if(!allowedKeys.includes(key) || !Number.isFinite(limit) || limit<=0 || !Array.isArray(rows)||!Array.isArray(drivers))throw new Error('Parametri grafico non validi');
  const data=rows.map(r=>{
    const d=drivers.find(x=>x.id===r.driverId);
    const value=r[key];
    return {label:d?.label?.replace('Autista ','')||'N/D',value:Number.isSafeInteger(value)&&value>=0?value:null,complete:r.complete===true};
  });
  if(!data.length)return `<div class="chart-empty">Nessun dato disponibile per il grafico.</div>`;
  const left=48,right=16,top=30,bottom=252,width=700,height=295,span=width-left-right,plotHeight=bottom-top;
  const max=Math.max(limit,...data.map(x=>x.value??0));
  const ymax=Math.ceil(Math.max(limit*1.13,max*1.12)/(10*60))*10*60;
  const y=v=>bottom-(v/ymax)*plotHeight;
  const grid=[0,0.25,0.5,0.75,1].map(fr=>{
    const gy=top+plotHeight*(1-fr),hours=Math.round(ymax*fr/60);
    return `<line x1="${left}" y1="${gy.toFixed(1)}" x2="${width-right}" y2="${gy.toFixed(1)}" class="chart-grid-line"/><text x="${left-10}" y="${(gy+4).toFixed(1)}" text-anchor="end" class="chart-tick">${hours}h</text>`;
  }).join('');
  const limitY=y(limit);
  const columns=data.map((r,i)=>{
    const x=left+span*(i+.5)/data.length,barW=Math.min(84,span/data.length*.47);
    const tooltip=`${r.label}: ${r.value===null?'dato mancante':timeLabel(r.value)}${r.value!==null && r.value>limit?' (oltre soglia numerica)':''}`;
    const body=r.value===null
      ?`<text x="${x.toFixed(1)}" y="${(bottom-14).toFixed(1)}" text-anchor="middle" class="chart-no-data">N/D</text>`
      :`<rect x="${(x-barW/2).toFixed(1)}" y="${y(r.value).toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1,bottom-y(r.value)).toFixed(1)}" rx="6" class="chart-bar ${r.value>limit?'is-over':!r.complete?'is-partial':'is-base'}"><title>${safeXml(tooltip)}</title></rect><text x="${x.toFixed(1)}" y="${Math.max(15,y(r.value)-9).toFixed(1)}" text-anchor="middle" class="chart-value">${safeXml(timeLabel(r.value))}</text>`;
    return `${body}<text x="${x.toFixed(1)}" y="271" text-anchor="middle" class="chart-x-label">${safeXml(r.label)}</text>`;
  }).join('');
  return `<div class="data-chart"><svg class="chart-svg" role="img" aria-label="${safeXml(label)}: esempio con ${data.length} autisti, soglia ${timeLabel(limit)}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><title>${safeXml(label)} (dati inventati)</title><desc>Barre in ore. I valori mancanti sono N/D; la linea tratteggiata è una soglia numerica indicativa, non una valutazione di conformità.</desc>${grid}<line x1="${left}" y1="${limitY.toFixed(1)}" x2="${width-right}" y2="${limitY.toFixed(1)}" class="chart-limit-line"/><text x="${width-right-4}" y="${Math.max(17,limitY-8).toFixed(1)}" text-anchor="end" class="chart-limit-text">Riferimento ${Math.round(limit/60)}h</text>${columns}</svg><div class="chart-legend"><span><i class="swatch base"></i> Ore disponibili</span><span><i class="swatch over"></i> Oltre soglia numerica</span><span><i class="swatch partial"></i> Copertura parziale</span><span><i class="swatch limit"></i> Soglia</span></div><p class="chart-note">Dati inventati · non rappresenta l'accertamento di infrazioni.</p></div>`;
}
function dailyChart(report){
  const days=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
  const values=report?.demoDailyMinutes;
  if(!Array.isArray(values)||values.length!==7||values.some(n=>!Number.isSafeInteger(n)||n<0)||values.reduce((a,b)=>a+b,0)!==report.weeklyMinutes){
    return `<div class="chart-empty">Andamento giornaliero non disponibile: dati assenti o non coerenti.</div>`;
  }
  const width=700,height=280,left=46,right=18,top=24,bottom=222,plotHeight=bottom-top,span=width-left-right;
  const ymax=Math.ceil(Math.max(60,Math.max(...values)*1.13)/(2*60))*2*60;
  const y=v=>bottom-v/ymax*plotHeight, x=i=>left+span*i/6;
  const grids=[0,.25,.5,.75,1].map(f=>{const yy=top+plotHeight*(1-f);return `<line x1="${left}" y1="${yy.toFixed(1)}" x2="${width-right}" y2="${yy.toFixed(1)}" class="chart-grid-line"/><text x="${left-10}" y="${(yy+4).toFixed(1)}" text-anchor="end" class="chart-tick">${Math.round(ymax*f/60)}h</text>`;}).join('');
  const points=values.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const dots=values.map((v,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="6" class="chart-dot"><title>${days[i]}: ${timeLabel(v)} (esempio)</title></circle><text x="${x(i).toFixed(1)}" y="245" text-anchor="middle" class="chart-x-label">${days[i]}</text>`).join('');
  return `<div class="data-chart"><svg class="chart-svg" role="img" aria-label="Andamento giornaliero simulato, da lunedì a domenica" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><title>Andamento della guida per giorno civile, esempio</title><desc>Curva su sette giorni civili; non rappresenta i periodi giornalieri legali di guida.</desc>${grids}<polyline points="${points}" class="chart-line"/>${dots}</svg><div class="chart-legend"><span><i class="swatch base"></i> Guida per giorno civile · esempio</span></div><p class="chart-note">Grafico puramente dimostrativo, non confrontabile da solo con il limite legale giornaliero.</p></div>`;
}
export {barChart,dailyChart};
