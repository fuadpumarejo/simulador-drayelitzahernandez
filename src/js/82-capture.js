/* ============ flujo real de consulta: nueva valoración, plan de captura guiada, bandeja por clasificar ============ */
const isTouch=()=>matchMedia('(pointer:coarse)').matches;
const canWebcam=()=>{try{return window.top===window.self&&!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)}catch(e){return false}};
function renderWizard(){
  const w=ui.wiz;if(!w){S.view='hoy';return render()}
  const p=w.pid?S.patients.find(x=>x.id===w.pid):null;
  if(w.step===1){
    app.innerHTML=`<div class="wiz"><div class="row"><button class="btn ghost sm" data-act="nav" data-v="hoy" type="button">← Cancelar</button></div>
    <div class="stepper"><b>Paso 1 de 2</b> · Registro mínimo</div><h1>Nueva valoración</h1>
    <div class="card col">${F('Nombre de la paciente','w_name',`<input class="in" id="w_name" value="${esc(w.name||'')}" autocomplete="off" autofocus>`)}
      ${F('Teléfono (opcional)','w_phone',`<input class="in" id="w_phone" type="tel" value="${esc(w.phone||'')}" autocomplete="off">`)}
      ${F('Motivo de consulta, en sus palabras (opcional)','w_notes',`<textarea class="in" id="w_notes">${esc(w.notes||'')}</textarea>`,'Es preliminar. Los procedimientos los define la doctora después de valorar.')}</div>
    <div class="card col"><h2>Autorizaciones</h2><div class="small muted">Marca lo que la paciente ya firmó según el protocolo de la clínica.</div>
      <label class="chk" for="w_cd"><input type="checkbox" id="w_cd" ${w.cData?'checked':''}> <span>Tratamiento de datos personales y sensibles</span></label>
      <label class="chk" for="w_cp"><input type="checkbox" id="w_cp" ${w.cPhoto?'checked':''}> <span>Toma y archivo de fotografías clínicas</span></label></div>
    <div class="crit hide" id="w_err" role="alert"></div>
    <button class="btn primary big" data-act="wizNext" type="button">Continuar a fotografías</button>
    <button class="btn block" data-act="wizNoPhotos" type="button">Crear la ficha sin fotografías por ahora</button></div>`;return}
  const today_=today(),vopts=p?[['new','Nueva visita'],...p.visits.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(v=>[v.id,`${VISIT_TYPE[v.type]} del ${fmtDate(v.date)}`])]:null;
  app.innerHTML=`<div class="wiz"><div class="row"><button class="btn ghost sm" data-act="${p&&!w.created?'openPatient':'wizBack'}" ${p?`data-id="${p.id}"`:''} type="button">← ${p&&!w.created?'Volver a la ficha':'Atrás'}</button></div>
  <div class="stepper"><b>${p&&!w.created?'Añadir fotografías':'Paso 2 de 2'}</b> · ${esc((p&&p.name)||w.name||'')}</div><h1>¿Qué regiones se van a fotografiar?</h1>
  ${vopts?`<div class="card col"><div class="grid2">${F('Estas fotos pertenecen a','w_visit',SEL('w_visit','',vopts,w.visitId||'new'))}
     <div id="w_newv" class="grid2 ${w.visitId&&w.visitId!=='new'?'hide':''}" style="grid-column:1/-1">${F('Tipo de atención','w_vtype',SEL('w_vtype','',VISIT_TYPES,w.vtype||'control'))}${F('Fecha en que se toman','w_vdate',`<input class="in" type="date" id="w_vdate" value="${esc(w.vdate||today_)}" max="${today_}">`)}${F('Etapa','w_phase',SEL('w_phase','',PHASES,w.phase||'consulta'),'«Posoperatoria real» identifica resultados reales, nunca simulaciones.')}</div></div></div>`:''}
  <div class="card col"><div class="small muted">Marca una o varias. Sirven para armar la lista de vistas; no definen ningún procedimiento.</div>
    <div class="mods" role="group" aria-label="Regiones">${REGIONS.map(([k,l])=>`<button class="modbtn" type="button" data-act="wizRegion" data-r="${k}" aria-pressed="${w.regions.includes(k)}">${l}</button>`).join('')}</div>
    <div class="small muted" id="w_plan">${planHint(w.regions)}</div></div>
  <h2>¿Cómo se obtienen las fotos?</h2>
  <div class="cta3">
    <button class="choice" type="button" data-act="wizStart" data-way="guiada"><b>Tomar fotografías</b><span>Captura guiada paso a paso (recomendada).</span></button>
    <button class="choice" type="button" data-act="wizStart" data-way="importar"><b>Importar fotografías existentes</b><span>Varias a la vez; luego se clasifican.</span></button>
    <button class="choice" type="button" data-act="wizStart" data-way="combinar"><b>Combinar ambas</b><span>Importar las que hay y tomar las que falten.</span></button>
  </div>
  <button class="btn block" data-act="wizStart" data-way="libre" type="button">Captura libre, sin lista de vistas (se clasifica después)</button></div>`}
function planHint(regs){if(!regs.length)return'Sin regiones marcadas no se genera lista de vistas: las fotos quedarán «Por clasificar».';const pl=buildPlan(regs,S.settings.captureTpl);return`Plan: ${pl.length} vistas (${pl.filter(s=>s.req).length} obligatorias). Las vistas que sirven a dos regiones se toman una sola vez.`}
async function wizCreatePatient(withPhotos){const w=ui.wiz;w.name=$('#w_name').value.trim();w.phone=$('#w_phone').value.trim();w.notes=$('#w_notes').value.trim();w.cData=$('#w_cd').checked;w.cPhoto=$('#w_cp').checked;
  const err=m=>{const e=$('#w_err');e.textContent=m;e.classList.remove('hide')};
  if(!w.name){err('Escribe el nombre de la paciente.');$('#w_name').focus();return false}
  if(withPhotos&&!w.cPhoto){err('Para tomar o importar fotografías, registra primero la autorización de fotografías clínicas. Si aún no la firmó, crea la ficha sin fotografías.');return false}
  const dup=S.patients.find(p=>p.name&&p.name.trim().toLowerCase()===w.name.toLowerCase());
  if(dup&&!w.dupOk){if(await confirmBox('Ya existe una ficha con ese nombre',`Hay una paciente llamada «${dup.name}». ¿Quieres abrir esa ficha en lugar de crear otra?`,'Abrir la ficha existente',{cancel:'Crear una nueva'})){ui.wiz=null;S.pid=dup.id;await go('patient',{tab:'resumen'});return false}w.dupOk=true}
  const p=newPatient({name:w.name,phone:w.phone,notes:w.notes});const d=today();if(w.cData)p.consents.data={ok:true,date:d,note:''};if(w.cPhoto)p.consents.photo={ok:true,date:d,note:''};
  if(w.lead){const l=S.leads.find(x=>x.id===w.lead);if(l){l.status='convertido';l.patientId=p.id;saveKV('leads');p.gender=l.gender||'';p.country=l.country||'';if(l.email)p.email=l.email;p.contact.channel=l.channel||'';p.contact.allowed=l.permission||'sin_registro';p.opps.push(newOpp({stage:'nuevo',interests:l.interest?[l.interest]:[],source:l.source||'',campaign:l.campaign||'',inquiryId:l.id,openedAt:l.createdAt}))}}
  S.patients.push(p);S.pid=p.id;savePatient(p);Store.persist();w.pid=p.id;w.created=true;return true}
async function wizStart(way){const w=ui.wiz,p=S.patients.find(x=>x.id===w.pid);if(!p)return;
  if(!p.consents.photo.ok){toast('Registra primero la autorización de fotografías clínicas en el Resumen de la ficha.',5000);return}
  let v;const vs=$('#w_visit')?$('#w_visit').value:'new';
  if(vs!=='new')v=p.visits.find(x=>x.id===vs);
  if(!v){const d=$('#w_vdate')?$('#w_vdate').value:today();v=newVisit({type:w.created?'valoracion':($('#w_vtype')?$('#w_vtype').value:'valoracion'),date:validCivil(d)?d:today(),dateSrc:d&&d!==today()?'retro':'registro',phase:$('#w_phase')?$('#w_phase').value:'consulta'});p.visits.push(v)}
  mergePlan(v,w.regions,S.settings.captureTpl);if(['pendiente','lista'].includes(v.cap))v.cap='en_captura';savePatient(p);
  ui.cap={visitId:v.id,mode:way==='guiada'&&v.slots.length?'guiada':'tablero',way,idx:0,pending:null};ui.wiz=null;await go('captura')}

const capVisit=()=>{const p=patient();return p&&ui.cap?p.visits.find(v=>v.id===ui.cap.visitId):null};
function topView(view){const d={frontal:[0,1],lat_der:[1,0],lat_izq:[-1,0],obl_der:[.7,.7],obl_izq:[-.7,.7],posterior:[0,-1],obl_post_der:[.7,-.7],obl_post_izq:[-.7,-.7],lateral:[1,0],oblicua:[.7,.7]}[view]||[0,1],a=Math.atan2(d[1],d[0])*180/Math.PI-90;
  return`<g transform="translate(75,62) rotate(${a})"><ellipse rx="34" ry="13" fill="#D9CCF5"/><circle r="15" fill="#6A3FCF"/><path d="M-5 13 L0 24 L5 13Z" fill="#6A3FCF"/><text y="-22" text-anchor="middle" font-size="9" fill="#6F6782" transform="rotate(${-a})"></text></g>
   <text x="14" y="18" font-size="9" fill="#6F6782">Vista desde arriba</text><path d="M75 100v20" stroke="#6F6782" stroke-dasharray="3 3"/><rect x="60" y="122" width="30" height="20" rx="4" fill="#241B36"/><circle cx="75" cy="132" r="6" fill="#fff"/><text x="75" y="156" text-anchor="middle" font-size="10" fill="#241B36">Cámara</text>`}
function frameFig(frame){const box={cara:[58,160,34,36],nariz:[66,166,18,14],ojos:[60,164,30,10],torso_sup:[52,196,46,34],torso:[52,216,46,46],cadera:[52,226,46,40],brazos:[40,196,70,40],piernas:[54,246,42,44],libre:[46,160,58,130]}[frame]||[46,160,58,130];
  return`<g fill="none" stroke="#6F6782" stroke-width="1.6"><circle cx="75" cy="176" r="10"/><path d="M60 196h30l6 34-6 4v26l-4 30h-8l-3-28-3 28h-8l-4-30v-26l-6-4z"/></g><rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" fill="rgba(106,63,207,.14)" stroke="#6A3FCF" stroke-width="1.6" stroke-dasharray="4 3" rx="4"/>`}
const diagram=(frame,view)=>`<svg viewBox="0 0 150 300" style="height:300px" role="img" aria-label="Esquema de posición: ${esc(VIEWS[view]||'')}, encuadre ${esc(FRAMES[frame]||'')}">${topView(view)}${frameFig(frame)}</svg>`;
async function renderCapture(){
  const p=patient(),v=capVisit();if(!p||!v){ui.cap=null;S.view=p?'patient':'hoy';return render()}
  await Saver.flushPrefix('photo:');ui.photos=(await Store.photosOf(p.id)).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)||a.id.localeCompare(b.id));if(S.view!=='captura')return;
  const g=capProgress(v),c=ui.cap,byId=Object.fromEntries(ui.photos.map(x=>[x.id,x]));
  if(c.mode==='guiada'){
    let i=clamp(c.idx,0,v.slots.length-1),s=v.slots[i];
    const pend=c.pending;
    app.innerHTML=`<div class="wiz"><div class="row spread"><button class="btn ghost sm" data-act="capMode" data-m="tablero" type="button">← Ver todas las vistas</button><span class="chip">${esc(p.name)}</span></div>
    <div><div class="stepper"><b>Foto ${i+1} de ${v.slots.length}</b> · ${g.done} hechas${g.skipped?` · ${g.skipped} omitidas`:''}</div><div class="prog" aria-hidden="true"><i style="width:${v.slots.length?g.done/v.slots.length*100:0}%"></i></div></div>
    <h1>${esc(VIEWS[s.view])}</h1><div class="muted">${esc(FRAMES[s.frame])} · ${s.regions.map(r=>REGION[r]).join(', ')} ${s.req?'':'· <span class="chip">Opcional</span>'}</div>
    ${pend?`<img class="capprev" src="${pend.orig}" alt="Vista previa de la foto tomada">${pend.low?'<div class="banner warn">La foto tiene poca resolución. Si puedes, repítela más cerca o con mejor luz.</div>':''}
      <div class="row"><button class="btn big grow" data-act="capRetry" type="button">Repetir</button><button class="btn primary big grow" data-act="capAccept" type="button">Aceptar foto</button></div>`
    :s.st==='hecha'&&byId[s.photoId]?`<img class="capprev" src="${byId[s.photoId].thumb||byId[s.photoId].orig}" alt="Foto ya asignada a esta vista"><div class="row"><span class="chip ok">Vista completada</span></div>
      <div class="row">${captureButtons('Repetir esta foto')}</div>`
    :`<div class="card guide">${diagram(s.frame,s.view)}<div class="col"><div><b>Posición.</b> ${esc(VIEW_GUIDE[s.view]||'')}</div><div><b>Encuadre.</b> ${esc(FRAME_FIELD[s.frame]||'')}</div><div class="small muted">${esc(PREP)}</div>${s.st==='omitida'?`<div class="chip warn">Omitida: ${esc(s.skip||'sin motivo')}</div>`:''}</div></div>
      <div class="col">${captureButtons('Tomar foto',true)}</div>`}
    <div class="row spread"><button class="btn" data-act="capStep" data-d="-1" type="button" ${i===0?'disabled':''}>← Anterior</button>${pend||s.st==='hecha'?'':`<button class="btn ghost" data-act="capSkip" type="button">Omitir esta vista</button>`}<button class="btn" data-act="capStep" data-d="1" type="button">${i===v.slots.length-1?'Terminar →':'Siguiente →'}</button></div>
    <div class="small muted">Puedes pausar en cualquier momento: el avance queda guardado en este equipo y se retoma desde «Hoy» o desde la ficha.</div></div>`;return}
  const tray=ui.photos.filter(x=>x.visitId===v.id&&!x.slotId&&x.cls!==true),nextI=v.slots.findIndex(s=>s.st==='pendiente');
  app.innerHTML=`<div class="wiz" style="max-width:860px"><div class="row spread"><button class="btn ghost sm" data-act="openPatient" data-id="${p.id}" data-t="fotos" type="button">← Pausar y volver a la ficha</button><span class="chip">${esc(VISIT_TYPE[v.type])} del ${fmtDate(v.date)}</span></div>
  <h1>Fotografías de ${esc(p.name||'la paciente')}</h1>
  ${v.slots.length?`<div><div class="row spread"><b>${g.done} de ${g.total} vistas</b><span class="${g.missing.length?'warn-t':'ok-t'}">${g.missing.length?`Faltan ${g.missing.length} obligatorias`:'Obligatorias completas'}</span></div><div class="prog" aria-hidden="true"><i style="width:${g.total?g.done/g.total*100:0}%"></i></div></div>`:''}
  <div class="row">${nextI>=0?`<button class="btn primary big grow" data-act="capMode" data-m="guiada" type="button">${g.done?'Continuar':'Empezar'} captura guiada · foto ${nextI+1} de ${g.total}</button>`:''}
    <button class="btn big grow" data-act="capImport" type="button">Importar fotografías existentes</button><button class="btn big grow" data-act="capFree" type="button">Captura libre</button></div>
  ${tray.length?`<div class="sec"><h2>Por clasificar · ${tray.length}</h2><div class="small muted">Asigna cada foto a su vista. Nada se clasifica solo por la forma de la imagen.</div><div class="tray">${tray.map(ph=>`<div class="gcard"><img class="gimg" src="${ph.thumb||ph.orig}" alt="Foto por clasificar"><div class="gb"><span class="small muted">${esc(photoDateLabel(ph))}</span>
      ${SEL('tr_'+ph.id,'',[['','Asignar a…'],...v.slots.filter(s=>s.st!=='hecha').map(s=>[s.id,slotName(s)]),['otra','Otra vista…']],'',`data-tray="${ph.id}" aria-label="Asignar a una vista"`)}${BTN('photoDel','Descartar','sm ghost danger',`data-id="${ph.id}"`)}</div></div>`).join('')}</div></div>`:''}
  ${v.slots.length?`<div class="sec"><h2>Vistas del plan</h2><div class="list">${v.slots.map((s,i)=>{const ph=byId[s.photoId];return`<div class="slot ${s.st==='hecha'?'done':''}"><div class="sth">${ph?`<img src="${ph.thumb||ph.orig}" alt="">`:`<span class="num">${i+1}</span>`}</div>
      <div><b>${esc(slotName(s))}</b> ${s.req?'':'<span class="chip">Opcional</span>'}<div class="small muted">${s.regions.map(r=>REGION[r]).join(', ')}${s.st==='omitida'?` · <span class="warn-t">Omitida: ${esc(s.skip||'sin motivo')}</span>`:s.st==='hecha'&&ph?' · '+esc(photoDateLabel(ph)):''}</div></div>
      <div class="row sacts">${s.st==='hecha'?BTN('slotClear','Quitar','sm ghost',`data-id="${s.id}"`):''}${BTN('slotGo',s.st==='hecha'?'Repetir':'Tomar o importar','sm '+(s.st==='hecha'?'':'primary'),`data-i="${i}"`)}</div></div>`}).join('')}</div>
    <div class="row">${BTN('capAddRegion','Agregar región o vista al plan','sm')}</div></div>`:`<div class="note">Esta sesión no tiene lista de vistas. Puedes agregar regiones para generar una, o seguir con captura libre y clasificar después.</div><div class="row">${BTN('capAddRegion','Agregar regiones al plan','sm')}</div>`}
  <button class="btn primary big" data-act="capFinish" type="button">Finalizar captura</button></div>`}
function captureButtons(label,big){const cam=isTouch()||canWebcam();return`${cam?`<button class="btn primary ${big?'big':''} grow" data-act="capShoot" type="button">${label}</button>`:''}<button class="btn ${big?'big':''} ${cam?'':'primary'} grow" data-act="capPick" type="button">Elegir archivo de foto</button>`}

/* ---- creación y clasificación de fotografías ---- */
async function makePhoto(p,v,img,file,forceCam){
  const fresh=forceCam||(file&&Date.now()-file.lastModified<180000&&ui.fileFrom==='cam');
  const ph={id:uid(),schema:SCHEMA,patientId:p.id,visitId:v?v.id:null,slotId:null,frame:null,view:null,regions:[],cls:false,label:'',orig:img.orig,w:img.w,h:img.h,after:null,inPdf:true,mods:{},privacy:[],scenarios:[],scn:null,
    method:fresh?'camera':'upload',capturedAt:fresh?nowISO():(img.exif||''),capturedSrc:fresh?'camera':(img.exif?'exif':'unknown'),capturedTZ:fresh?deviceTZ():'',capturedExif:img.exif||'',importedAt:nowISO(),phase:v?v.phase:'',episodeId:v?v.episodeId:null,createdAt:Date.now()};
  ph.thumb=await safeThumb(ph);return ph}
function linkSlot(v,slot,ph){if(slot.photoId&&slot.photoId!==ph.id){const old=ui.photos.find(x=>x.id===slot.photoId);if(old){old.slotId=null;old.cls=false;savePhotoRec(old)}}
  slot.photoId=ph.id;slot.st='hecha';slot.skip='';ph.slotId=slot.id;ph.visitId=v.id;ph.frame=slot.frame;ph.view=slot.view;ph.regions=slot.regions.slice();ph.cls=true}
async function storeNewPhoto(p,ph){try{await Store.put('photos',ph)}catch(e){toast(isQuota(e)?'No hay espacio para guardar la foto. Exporta un respaldo protegido y libera espacio; la foto no se guardó.':'No se pudo guardar la foto en este equipo.',7000);throw e}
  ui.photos.push(ph);if(!p.thumb){p.thumb=ph.thumb}savePatient(p)}
/* entrada única para archivos de imagen: target = {kind:'guided'|'slot'|'tray'|'gallery',slotId} */
async function onImageFiles(files){const p=patient();if(!p||!files.length)return;const t=ui.fileTarget||{kind:'tray'},v=capVisit()||(t.visitId?p.visits.find(x=>x.id===t.visitId):null);let okN=0;const errs=[];
  for(const f of files){let img;try{img=await readImageFile(f)}catch(e){errs.push(e.message);continue}
    if(t.kind==='guided'){ui.cap.pending={...img,file:f};break}
    try{const ph=await makePhoto(p,v,img,f);if(t.kind==='slot'&&v){const s=v.slots.find(x=>x.id===t.slotId);if(s)linkSlot(v,s,ph)}await storeNewPhoto(p,ph);okN++}catch(e){errs.push('No se guardó «'+f.name+'».')}}
  if(errs.length)await confirmBox(errs.length===1?'No se pudo usar la foto':'Algunas fotos no se pudieron usar',errs.slice(0,4).join(' ')+' Lo que ya estaba guardado no cambió.','Entendido',{cancel:'Cerrar'});
  if(okN&&t.kind!=='slot')toast(okN===1?'Foto agregada a «Por clasificar».':`${okN} fotos agregadas a «Por clasificar».`);
  if(S.view==='captura')renderCapture();else if(S.view==='patient')renderPatient()}
async function capAccept(){const p=patient(),v=capVisit(),c=ui.cap;if(!c.pending)return;const s=v.slots[c.idx];const{file,...img}=c.pending;
  const ph=await makePhoto(p,v,img,file,c.pending.cam);linkSlot(v,s,ph);await storeNewPhoto(p,ph);c.pending=null;
  const nx=v.slots.findIndex((x,i)=>i>c.idx&&x.st==='pendiente'),any=v.slots.findIndex(x=>x.st==='pendiente');
  if(nx>=0)c.idx=nx;else if(any>=0)c.idx=any;else{c.mode='tablero';toast('Todas las vistas del plan están completas.')}renderCapture()}
async function classifyPhoto(ph,o={}){const p=patient();
  const r=await formBox('Clasificar fotografía',[{k:'frame',label:'Encuadre',type:'select',options:[['','Sin definir'],...Object.entries(FRAMES)],value:ph.frame||''},{k:'view',label:'Vista y lateralidad',type:'select',options:[['','Sin definir'],...Object.entries(VIEWS)],value:ph.view||''},
    {k:'visit',label:'Visita',type:'select',options:[['','Sin visita asignada'],...p.visits.map(v=>[v.id,`${VISIT_TYPE[v.type]} del ${fmtDate(v.date)}`])],value:ph.visitId||''},{k:'phase',label:'Etapa',type:'select',options:[['','Sin definir'],...PHASES],value:ph.phase||''},
    {k:'date',label:'Fecha real de la toma',type:'date',value:photoDate(ph),help:ph.capturedExif?`Fecha leída del archivo: ${fmtDT(ph.capturedExif)}. Confírmala o corrígela.`:ph.capturedAt?'':'Sin fecha de toma confirmada. Déjala vacía si no se conoce; no se asumirá la fecha de hoy.'}],'Guardar clasificación',{intro:ph.cls===false&&ph.method==='legacy'?'La propuesta viene de la etiqueta que tenía la foto en la versión anterior. Confírmala o corrígela.':''});
  if(!r)return false;ph.frame=r.frame||null;ph.view=r.view||null;ph.phase=r.phase;ph.cls=!!(r.frame&&r.view);
  if(r.date!==photoDate(ph)){ph.capturedAt=r.date;ph.capturedSrc=r.date?'manual':'unknown'}else if(r.date&&ph.capturedSrc==='exif')ph.capturedSrc='exif_ok';
  const v=p.visits.find(x=>x.id===r.visit);if(ph.slotId&&(!v||v.id!==ph.visitId)){const ov=p.visits.find(x=>x.id===ph.visitId),os=ov&&ov.slots.find(s=>s.id===ph.slotId);if(os){os.photoId=null;os.st='pendiente'}ph.slotId=null}
  ph.visitId=v?v.id:null;if(v&&!ph.slotId&&ph.cls){const s=v.slots.find(s=>s.frame===ph.frame&&s.view===ph.view&&s.st!=='hecha');if(s)linkSlot(v,s,ph)}
  if(v&&ph.episodeId==null)ph.episodeId=v.episodeId;
  savePhotoRec(ph);savePatient(p);return true}
function openWebcam(cb){const c=openModal(`<h2 id="mTitle">Cámara</h2><video id="wcVid" autoplay playsinline muted style="width:100%;border-radius:10px;background:#000"></video><div class="row end"><button class="btn" id="wcNo" data-close type="button">Cancelar</button><button class="btn primary" id="wcYes" type="button">Capturar</button></div>`,{wide:true});
  let stream=null;const stop=()=>{if(stream)stream.getTracks().forEach(t=>t.stop());closeModal()};
  navigator.mediaDevices.getUserMedia({video:{width:{ideal:1920},height:{ideal:1080}}}).then(s=>{stream=s;const v=$('#wcVid');if(v)v.srcObject=s;else s.getTracks().forEach(t=>t.stop())}).catch(()=>{stop();toast('No se pudo abrir la cámara. Revisa el permiso del navegador o usa «Elegir archivo de foto».',5000)});
  c.querySelector('#wcNo').onclick=stop;c.querySelector('#wcYes').onclick=()=>{const v=$('#wcVid');if(!v.videoWidth)return;const cv=mkCanvas(v.videoWidth,v.videoHeight);cv.getContext('2d').drawImage(v,0,0);stop();cv.toBlob(b=>b&&cb(new File([b],'camara.jpg',{type:'image/jpeg',lastModified:Date.now()})),'image/jpeg',.95)}}
function pickImages(target,from){ui.fileTarget=target;ui.fileFrom=from;
  if(from==='cam'&&!isTouch()&&canWebcam()){openWebcam(f=>onImageFiles([f]));return}
  const el=$(from==='cam'?'#fileCam':'#fileLib');el.multiple=from!=='cam'&&target.kind!=='guided'&&target.kind!=='slot';el.click()}
async function capFinish(){const p=patient(),v=capVisit(),g=capProgress(v),tray=ui.photos.filter(x=>x.visitId===v.id&&!x.slotId&&x.cls!==true).length;
  const sum=`<dl class="kv"><dt>Vistas completadas</dt><dd><b>${g.done}</b> de ${g.total}</dd><dt>Obligatorias pendientes</dt><dd>${g.missing.length?g.missing.map(slotName).map(esc).join('; '):'Ninguna'}</dd><dt>Omitidas</dt><dd>${g.skipped}</dd><dt>Por clasificar</dt><dd>${tray}</dd></dl>`;
  const c=openModal(`<h2 id="mTitle">Resumen de la captura</h2>${sum}${g.missing.length?'<div class="banner warn">Faltan vistas obligatorias. Puedes seguir capturando o dejar el caso listo con lo que hay.</div>':''}
   <div class="col"><button class="btn primary big" id="cfReady" type="button">Marcar «Lista para valoración»</button><button class="btn" id="cfBack" data-close type="button">Seguir capturando</button></div>`);
  c.querySelector('#cfBack').onclick=closeModal;
  c.querySelector('#cfReady').onclick=()=>{v.cap='lista';savePatient(p);ui.cap=null;
    const m=openModal(`<h2 id="mTitle">Caso listo para valoración</h2><div class="muted">Quedó guardado en este equipo. Si la valoración se hará en otro equipo, exporta el archivo protegido y ábrelo allá con «Importar caso». No aparece solo en el otro equipo.</div>
     <div class="col"><button class="btn primary big" id="crSend" type="button">Enviar caso al computador (.yhcase)</button><button class="btn big" id="crHere" data-close type="button">Valorar en este equipo</button></div>`);
    m.querySelector('#crHere').onclick=()=>{closeModal();go('patient',{tab:'fotos'})};m.querySelector('#crSend').onclick=async()=>{closeModal();await go('patient',{tab:'fotos'});exportCaseFlow(p)}}}
