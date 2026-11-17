/* ============ estado de la aplicación, navegación por tareas, Hoy, Pacientes y ficha ============ */
const S={settings:clone(DEFAULT_SETTINGS),patients:[],leads:[],blocks:[],library:[],last:null,view:'hoy',pid:null,tab:'resumen',q:'',filter:'',more:'menu',
  cal:{mode:window.innerWidth<900?'lista':'semana',date:today(),layers:Object.fromEntries(LAYERS.map(l=>[l[0],true]))}};
const ui={photos:[],docs:[],photoId:null,editing:false,mod:'',placing:null,tool:'mover',size:8,power:50,cmp:'after',split:50,loaded:false,ptab:'sim',allMods:false,mask:null,curtain:false,view:{z:1,tx:0,ty:0},
  sel:new Set(),gal:{visit:'',type:''},cap:null,wiz:null};
let DL=null;
const app=$('#app');
const patient=()=>S.patients.find(p=>p.id===S.pid);
const curPhoto=()=>ui.photos.find(p=>p.id===ui.photoId);
const savePatient=p=>{p.updatedAt=Date.now();Saver.schedule('patient:'+p.id,()=>Store.put('patients',p))};
const saveSettings=()=>Saver.schedule('kv:settings',()=>Store.put('kv',S.settings,'settings'));
const saveKV=name=>Saver.schedule('kv:'+name,()=>Store.put('kv',S[name],name));
const savePhotoRec=ph=>{ph.updatedAt=Date.now();Saver.schedule('photo:'+ph.id,()=>Store.put('photos',ph),300)};
function brand(){$('#brandName').textContent=S.settings.tool;$('#brandSub').textContent=[S.settings.doctor,S.settings.clinic].filter(Boolean).join(' · ');const ini=(S.settings.doctor||'').replace(/^(dra?\.?|doctora?)\s+/i,'').split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase();$('.mono').textContent=ini||'YH';document.title=S.settings.tool}
const F=(label,id,html,help)=>`<div class="field"><label for="${id}">${label}</label>${html}${help?`<div class="small muted">${help}</div>`:''}</div>`;
const I=(id,m,v,a='')=>`<input class="in" id="${id}" data-m="${m}" value="${esc(v??'')}" autocomplete="off" ${a}>`;
const TA=(id,m,v,a='')=>`<textarea class="in" id="${id}" data-m="${m}" ${a}>${esc(v??'')}</textarea>`;
const SEL=(id,m,opts,v,a='')=>`<select class="in" id="${id}" ${m?`data-m="${m}"`:''} ${a}>${opts.map(o=>{const[k,l]=Array.isArray(o)?o:[o,o];return`<option value="${esc(k)}" ${String(k)===String(v??'')?'selected':''}>${esc(l||'—')}</option>`}).join('')}</select>`;
const BTN=(act,label,cls='',a='')=>`<button class="btn ${cls}" type="button" data-act="${act}" ${a}>${label}</button>`;
const empty=t=>`<div class="card muted">${t}</div>`;

/* ---- navegación ---- */
const NAV=[['hoy','Hoy'],['pacientes','Pacientes'],['agenda','Agenda'],['mas','Más']];
function navHTML(){return NAV.map(([k,l])=>`<button type="button" data-act="nav" data-v="${k}" aria-current="${(S.view===k||(k==='pacientes'&&['patient','nueva','captura'].includes(S.view)))?'page':'false'}">${l}</button>`).join('')}
async function go(view,o={}){await Sim.leave();Object.assign(S,{view},o);if((view==='patient'||view==='captura')&&S.pid){S.last={pid:S.pid,tab:S.tab,at:nowISO()};saveKV('last')}render();window.scrollTo(0,0)}
function render(){
  $('#navTop').innerHTML=navHTML();$('#navBot').innerHTML=navHTML();Saver.chip();document.body.classList.toggle('editing',S.view==='patient'&&ui.editing&&S.tab==='fotos');
  if(S.view==='patient'&&!patient())S.view='pacientes';
  ({hoy:renderHoy,pacientes:renderList,patient:renderPatient,agenda:renderAgenda,mas:renderMore,nueva:renderWizard,captura:renderCapture}[S.view]||renderHoy)()}

/* ---- Hoy: citas reales del día, capturas en preparación y pendientes pactados ---- */
function renderHoy(){
  const td=today(),items=agendaItems(),hoy=items.filter(x=>x.date===td&&(x.kind==='appt'||x.kind==='block')&&!['cancelled','no_show'].includes(x.status));
  const caps=S.patients.map(p=>[p,openVisit(p)]).filter(x=>x[1]);
  const tasks=S.patients.flatMap(p=>p.tasks.filter(t=>t.status==='pendiente').map(t=>({p,t})));
  const grp={venc:tasks.filter(x=>x.t.due&&x.t.due<td),hoy:tasks.filter(x=>x.t.due===td),prox:tasks.filter(x=>x.t.due>td&&x.t.due<=addDays(td,7)),sin:tasks.filter(x=>!x.t.due)};
  const exp=S.patients.flatMap(p=>p.opps.flatMap(o=>o.quotes.filter(q=>['emitida','entregada'].includes(q.state)&&q.expiresAt&&q.expiresAt>=td&&q.expiresAt<=addDays(td,7)).map(q=>({p,o,q}))));
  const rev=S.patients.filter(legacyReview),leads=S.leads.filter(l=>l.status==='nuevo');
  const lastP=S.last&&S.patients.find(p=>p.id===S.last.pid);
  const taskRow=({p,t})=>`<div class="item"><span class="when ${t.due&&t.due<td?'crit':''}">${t.due?fmtDate(t.due):'Sin fecha'}</span><span class="grow"><b>${esc(p.name||'Sin nombre')}</b> · ${esc(TASK_KIND[t.kind])}${t.note?' · '+esc(t.note):''}${t.review?' <span class="badge pend">Heredada, por revisar</span>':''}</span>${BTN('taskDone','Registrar resultado','sm',`data-pid="${p.id}" data-id="${t.id}"`)}${BTN('openPatient','Abrir','sm ghost',`data-id="${p.id}" data-t="propuestas"`)}</div>`;
  const tg=(k,l)=>grp[k].length?`<div class="lbl">${l} · ${grp[k].length}</div><div class="list">${grp[k].map(taskRow).join('')}</div>`:'';
  app.innerHTML=`<div class="row spread"><div><h1>Hoy</h1><div class="muted">${esc(fmtLong(td))} de ${dObj(td).getFullYear()}</div></div>
    <div class="row">${BTN('newVal','Nueva valoración','primary')}${BTN('newLead','Registrar interés')}${BTN('importAny','Importar caso')}</div></div>
  ${storageBanner()}
  ${lastP?(()=>{const n=nextAction(lastP);return`<div class="card nextcard ${n.cls}"><div class="grow"><span class="lbl">Continuar donde quedó</span><div><b>${esc(lastP.name||'Sin nombre')}</b> · ${esc(n.txt)}</div></div>${n.act?BTN(n.act,esc(n.btn),'primary',`data-pid="${lastP.id}" data-arg="${esc(n.arg||'')}"`):''}${BTN('openPatient','Abrir ficha','',`data-id="${lastP.id}"`)}</div>`})():''}
  <div class="sec"><h2>Citas de hoy</h2>${hoy.length?`<div class="list">${hoy.map(apptRow).join('')}</div>`:empty('No hay citas registradas para hoy.')}</div>
  ${caps.length?`<div class="sec"><h2>Fotografías en preparación</h2><div class="list">${caps.map(([p,v])=>{const g=capProgress(v);return`<div class="item"><span class="grow"><b>${esc(p.name||'Sin nombre')}</b> · ${g.done} de ${g.total} vistas · ${esc(CAPL[v.cap])}</span>${BTN('resumeCapture','Continuar captura','primary sm',`data-pid="${p.id}" data-arg="${v.id}"`)}</div>`}).join('')}</div></div>`:''}
  <div class="sec"><h2>Pendientes acordados</h2>${tasks.length?tg('venc','Vencidas')+tg('hoy','Hoy')+tg('prox','Próximos 7 días')+tg('sin','Sin fecha'):empty('No hay tareas de seguimiento pendientes. Solo aparecen las que se acordaron con cada paciente.')}
    <div class="small muted">Estos recordatorios solo se ven al abrir la herramienta. No se envían mensajes ni notificaciones automáticas.</div></div>
  ${exp.length?`<div class="sec"><h2>Propuestas cuya vigencia termina pronto</h2><div class="list">${exp.map(({p,o,q})=>`<div class="item"><span class="when">${fmtDate(q.expiresAt)}</span><span class="grow"><b>${esc(p.name)}</b> · ${esc(oppName(o))} · versión ${q.version}</span>${BTN('openPatient','Abrir','sm',`data-id="${p.id}" data-t="propuestas"`)}</div>`).join('')}</div><div class="small muted">La vigencia es comercial; no es una fecha límite médica.</div></div>`:''}
  ${leads.length?`<div class="sec"><h2>Intereses nuevos sin ficha</h2><div class="list">${leads.map(leadRow).join('')}</div></div>`:''}
  ${rev.length?`<div class="sec"><h2>Datos heredados por revisar</h2><div class="note">Estas fichas vienen de la versión anterior. Su etapa y su próximo contacto se conservaron sin interpretarlos: confirma qué significan hoy.</div><div class="list">${rev.map(p=>`<div class="item"><span class="grow"><b>${esc(p.name||'Sin nombre')}</b> · estado anterior: «${esc(p.legacy?.status||'—')}»</span>${BTN('openPatient','Revisar','sm primary',`data-id="${p.id}" data-t="propuestas"`)}</div>`).join('')}</div></div>`:''}`;
  refreshStorageInfo()}
function apptRow(x){const a=x.ref,blk=x.kind==='block';return`<div class="item ${x.tent?'tent':''}"><span class="when">${esc(x.time||'')}</span><span class="grow"><b>${esc(blk?x.title:x.who)}</b>${blk?'':' · '+esc(x.title)} <span class="chip ${a.status==='checked_in'?'ok':''}">${esc(APPT_STL[a.status]||'')}</span>${a.mode&&!blk?` <span class="small muted">${esc(a.mode)}</span>`:''}</span>
  ${blk?BTN('blockDel','Quitar','sm ghost',`data-id="${a.id}"`):`${a.status==='scheduled'||a.status==='confirmed'||a.status==='tentative'?BTN('apptSet','Llegó','sm primary',`data-pid="${x.pid}" data-id="${a.id}" data-s="checked_in"`):''}${a.status==='checked_in'?BTN('apptAttend','Registrar atención','sm primary',`data-pid="${x.pid}" data-id="${a.id}"`):''}${BTN('apptOpen','Detalle','sm',`data-pid="${x.pid}" data-id="${a.id}"`)}${BTN('openPatient','Ficha','sm ghost',`data-id="${x.pid}"`)}`}</div>`}
function storageBanner(){return!Store.persistent()?`<div class="banner crit" role="alert"><b>Modo temporal.</b><span class="grow">Este navegador no permite guardar datos (modo privado o almacenamiento bloqueado). Todo se perderá al cerrar la pestaña. No registres pacientes reales aquí; si ya lo hiciste, exporta el caso protegido antes de cerrar.</span></div>`:`<div id="stInfo"></div>`}
async function refreshStorageInfo(){const el=$('#stInfo');if(!el)return;const e=await Store.estimate();if(e&&e.quota&&e.usage/e.quota>.8)el.innerHTML=`<div class="banner warn" role="status"><b>Poco espacio libre.</b><span class="grow">El navegador usa ${fmtSize(e.usage)} de ${fmtSize(e.quota)}. Exporta un respaldo protegido y elimina casos que ya no necesites en este equipo.</span>${BTN('nav','Respaldos','sm','data-v="mas" data-more="respaldo"')}</div>`}

/* ---- Pacientes ---- */
const P_FILTERS=[['','Todas'],['captura','Fotos por completar'],['lista','Listas para valoración'],['abierta','Con propuesta abierta'],['programada','Cirugía programada']];
function pMatch(p,f){if(!f)return true;if(f==='captura')return!!openVisit(p);if(f==='lista')return p.visits.some(v=>v.cap==='lista');if(f==='abierta')return p.opps.some(o=>STAGE_OPEN.includes(o.stage));if(f==='programada')return p.opps.some(o=>o.stage==='programada');return true}
function filtered(){const q=S.q.trim().toLowerCase();return S.patients.filter(p=>(!q||[p.name,p.doc,p.phone,caseCode(p),...p.opps.map(oppName),...p.visits.map(v=>fmtDate(v.date))].join(' ').toLowerCase().includes(q))&&pMatch(p,S.filter)).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))}
function listHTML(){return filtered().map(pItem).join('')||empty('No hay pacientes con ese criterio. Empieza con «Nueva valoración».')}
function renderList(){
  app.innerHTML=`<div class="row spread"><h1>Pacientes</h1><div class="row">${BTN('importAny','Importar caso')}${BTN('newVal','Nueva valoración','primary')}</div></div>
  ${F('Buscar por nombre, documento, teléfono, procedimiento o fecha de visita','q',`<input class="in" id="q" type="search" value="${esc(S.q)}" autocomplete="off">`)}
  <div class="mods" role="group" aria-label="Filtrar">${P_FILTERS.map(([k,l])=>`<button class="modbtn" type="button" data-act="filter" data-s="${k}" aria-pressed="${S.filter===k}">${l} <span class="num muted">${S.patients.filter(p=>pMatch(p,k)).length}</span></button>`).join('')}</div>
  <div class="plist" id="plist">${listHTML()}</div>`}
const attState=p=>{const v=lastVisit(p);return v?CAPL[v.cap]:'Sin visitas registradas'};
function oppChips(p){return p.opps.map(o=>`<span class="pill ${STAGE_CLS[o.stage]||''}">${esc(STAGE[o.stage]||o.stage)}</span>`).join(' ')}
function pItem(p){const lv=lastVisit(p),n=nextAction(p);
  return`<button class="pitem" data-act="openPatient" data-id="${esc(p.id)}" type="button">${p.thumb?`<img class="thumb" src="${p.thumb}" alt="">`:`<span class="thumb">${esc((p.name||'?')[0].toUpperCase())}</span>`}
   <span class="grow"><span class="name">${esc(p.name||'Sin nombre')}</span>${p.demo?' <span class="chip">Ejemplo ficticio</span>':''}<span class="meta"><span class="chip">${esc(attState(p))}</span>${lv?`<span class="small muted">Última visita ${fmtDate(lv.date)}</span>`:''}</span></span>
   <span class="right">${oppChips(p)}<span class="small ${n.cls==='crit'?'crit':'muted'}">${esc(n.txt)}</span></span></button>`}

/* ---- ficha de la paciente ---- */
const PTABS=[['resumen','Resumen'],['fotos','Fotos y simulaciones'],['visitas','Visitas y evolución'],['propuestas','Propuestas y decisiones'],['docs','Documentos']];
function renderPatient(){
  const p=patient(),lv=lastVisit(p),n=nextAction(p);document.body.classList.toggle('editing',!!(ui.editing&&S.tab==='fotos'&&ui.photoId));
  if(ui.editing&&S.tab==='fotos'&&ui.photoId){app.innerHTML=`<div id="tab"></div>`;return renderFotos(p)} /* en valoración la fotografía es la protagonista */
  app.innerHTML=`<div class="row"><button class="btn ghost sm" data-act="nav" data-v="pacientes" type="button">← Pacientes</button></div>
  <div class="row spread"><div><h1 id="pName">${esc(p.name||'Paciente sin nombre')}</h1><div class="row small muted" style="margin-top:4px"><span class="chip" title="Identificador sin datos personales, usado en nombres de archivo">${caseCode(p)}</span>${lv?`<span>Última visita ${fmtDate(lv.date)}</span>`:''}<span>Atención: <b>${esc(attState(p))}</b></span>${p.opps.length?`<span>Oportunidad:</span> ${oppChips(p)}`:''}</div></div></div>
  ${ui.editing?'':`<div class="card nextcard ${n.cls}"><div class="grow"><span class="lbl">Próxima acción acordada</span><div>${esc(n.txt)}</div></div>${n.act?BTN(n.act,esc(n.btn),'primary',`data-pid="${p.id}" data-arg="${esc(n.arg||'')}"`):''}</div>`}
  <div class="tabs" role="tablist">${PTABS.map(([k,l])=>`<button role="tab" type="button" data-act="ptab" data-arg="${k}" aria-selected="${S.tab===k}">${l}</button>`).join('')}</div>
  <div id="tab"></div>`;
  ({resumen:renderResumen,fotos:renderFotos,visitas:renderVisitas,propuestas:renderPropuestas,docs:renderDocs}[S.tab]||renderResumen)(p)}
function renderResumen(p){
  const hasPh=!!p.thumb||p.visits.some(v=>v.slots.some(s=>s.photoId));
  $('#tab').innerHTML=`<div class="sec">
  <div class="cta3">
    <button class="choice" type="button" data-act="addPhotos"><b>Preparar fotografías</b><span>Tomar, importar o combinar; se organizan por región y vista.</span></button>
    <button class="choice" type="button" data-act="ptab" data-arg="fotos"><b>${hasPh?'Continuar valoración':'Fotos y simulaciones'}</b><span>Revisar fotografías, simular y comparar alternativas.</span></button>
    <button class="choice" type="button" data-act="ptab" data-arg="${p.opps.length?'propuestas':'visitas'}"><b>${p.opps.length?'Revisar propuesta':'Ver visitas y evolución'}</b><span>${p.opps.length?'Decisión, próximos pasos y versiones de la propuesta.':'Citas, atenciones realizadas y línea de tiempo.'}</span></button>
  </div>
  <details class="card" ${p.name?'':'open'}><summary>Datos de la paciente</summary><div class="grid2">
    ${F('Nombre completo','f_name',I('f_name','p:name',p.name,'data-re="pname"'))}${F('Documento','f_doc',I('f_doc','p:doc',p.doc))}
    ${F('Fecha de nacimiento'+(age(p.birth)!==''?` · ${age(p.birth)} años`:''),'f_birth',I('f_birth','p:birth',p.birth,'type="date"'))}${F('Teléfono','f_phone',I('f_phone','p:phone',p.phone,'type="tel"'))}${F('Correo','f_email',I('f_email','p:email',p.email,'type="email"'))}</div>
    ${F('Motivo de consulta (en palabras de la paciente)','f_notes',TA('f_notes','p:notes',p.notes))}</details>
  <details class="card"><summary>Autorizaciones registradas</summary><div class="note">Registra aquí lo que la paciente firmó según el protocolo de la clínica. Cada autorización es independiente: censurar una imagen no reemplaza la autorización, y esta herramienta no genera consentimientos.</div>
    <div class="col" style="margin-top:10px">${CONSENTS.map(([k,l])=>{const c=p.consents[k];return`<div class="row"><label class="chk grow" for="cs_${k}"><input type="checkbox" id="cs_${k}" data-m="cs:${k}:ok" data-re="consent" ${c.ok?'checked':''}> <span>${l}${c.revokedAt?` <span class="badge pend">Retirada el ${fmtDate(c.revokedAt)}</span>`:''}</span></label><input class="in" style="width:auto" type="date" aria-label="Fecha de la autorización: ${l}" data-m="cs:${k}:date" value="${esc(c.date)}"></div>`}).join('')}</div></details>
  <details class="card"><summary>Preferencia de contacto</summary><div class="grid2">${F('Canal preferido','pc_ch',SEL('pc_ch','pc:channel',CHANNELS,p.contact.channel,'data-re="contact"'))}
    ${F('¿Autoriza que la clínica la contacte para seguimiento?','pc_al',SEL('pc_al','pc:allowed',[['sin_registro','Sin registro'],['si','Sí, autoriza'],['no','No desea ser contactada']],p.contact.allowed,'data-re="contact"'))}</div>
    ${!canContact(p)?'<div class="note">No se crearán tareas de contacto ni borradores de mensajes para esta paciente mientras esta preferencia esté vigente.</div>':''}</details>
  <details class="card"><summary>Notas clínicas reservadas</summary><div class="small muted">No se incluyen en propuestas, mensajes ni en el tablero comercial.</div>${TA('f_cn','p:clinicalNotes',p.clinicalNotes,'aria-label="Notas clínicas reservadas" style="margin-top:8px"')}</details>
  <div class="card col"><h2>Pasar este caso a otro equipo</h2><div class="muted">Caso guardado en este equipo. Para usarlo en otro, exporta el archivo protegido y ábrelo allá con «Importar caso». No hay sincronización automática.</div>
    <div class="row">${BTN('exportCase','Exportar caso editable (.yhcase)','primary')}${BTN('delPatient','Eliminar paciente de este equipo','danger')}</div></div></div>`}

/* ---- intereses iniciales (sin ficha clínica) ---- */
function leadRow(l){return`<div class="item"><span class="when">${fmtDate(l.createdAt)}</span><span class="grow"><b>${esc(l.name||'Sin nombre')}</b> · ${esc(l.interest||'Interés sin especificar')}${l.source?' · '+esc(l.source):''}${l.status!=='nuevo'?` <span class="chip">${l.status==='convertido'?'Convertido en ficha':'Cerrado'}</span>`:''}</span>
  ${l.status==='nuevo'?BTN('leadConvert','Crear ficha y valoración','sm primary',`data-id="${l.id}"`)+BTN('leadClose','Cerrar','sm ghost',`data-id="${l.id}"`):l.patientId?BTN('openPatient','Abrir ficha','sm',`data-id="${l.patientId}"`):''}</div>`}
async function newLead(){const r=await formBox('Registrar interés inicial',[{k:'name',label:'Nombre',required:true},{k:'phone',label:'Teléfono (opcional)',type:'tel'},{k:'interest',label:'Servicio que le interesa'},{k:'source',label:'Cómo llegó',type:'select',options:SOURCES.map(s=>[s,s||'Sin registrar'])},
    {k:'channel',label:'Canal de contacto preferido',type:'select',options:CHANNELS},{k:'perm',label:'Autoriza que la clínica la contacte',type:'check'}],'Registrar',{intro:'Solo datos mínimos. No registres aquí información de salud. Esto no crea una consulta ni una ficha clínica.'});
  if(!r)return;S.leads.push({id:uid(),createdAt:today(),name:r.name,phone:r.phone,interest:r.interest,source:r.source,channel:r.channel,permission:r.perm?'si':'sin_registro',status:'nuevo',patientId:null});saveKV('leads');toast('Interés registrado.');render()}
function leadToPatient(l){const dup=S.patients.find(p=>p.name&&l.name&&p.name.trim().toLowerCase()===l.name.trim().toLowerCase());return dup}
