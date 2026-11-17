/* ============ galería clínica y editor de simulación (motor WebGL conservado) ============ */
async function renderFotos(p){
  await Sim.leave();ui.photos=(await Store.photosOf(p.id)).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0)||a.id.localeCompare(b.id));
  if(S.view!=='patient'||S.tab!=='fotos'||S.pid!==p.id)return;
  if(ui.editing&&curPhoto())return renderEditor(p);ui.editing=false;
  for(const id of[...ui.sel])if(!ui.photos.find(x=>x.id===id))ui.sel.delete(id);
  const f=ui.gal,match=ph=>(!f.visit||(f.visit==='none'?!ph.visitId:ph.visitId===f.visit))&&(!f.type||(f.type==='sim'?hasSim(ph):f.type==='post'?ph.phase==='posoperatoria':f.type==='pend'?ph.cls===false:f.type==='orig'?ph.phase!=='posoperatoria':true));
  const list=ui.photos.filter(match),groups=[...p.visits.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(v=>[v,list.filter(x=>x.visitId===v.id)]),[null,list.filter(x=>!x.visitId||!p.visits.find(v=>v.id===x.visitId))]].filter(g=>g[1].length);
  const ord=(a,b)=>FRAME_ORDER.indexOf(a.frame||'libre')-FRAME_ORDER.indexOf(b.frame||'libre')||VIEW_ORDER.indexOf(a.view||'otra')-VIEW_ORDER.indexOf(b.view||'otra');
  const card=ph=>`<div class="gcard ${ui.sel.has(ph.id)?'sel':''}"><input type="checkbox" class="gsel" data-sel="${ph.id}" ${ui.sel.has(ph.id)?'checked':''} aria-label="Seleccionar ${esc(photoLabel(ph))}">
    <div class="badges"><span class="badge ${ph.phase==='posoperatoria'?'real':'orig'}">${CLASS_LABEL[photoClass(ph)]}</span>${hasSim(ph)?'<span class="badge sim">Simulación ilustrativa</span>':''}${Privacy.active(ph).length?'<span class="badge cens">Con censura</span>':''}${ph.cls===false?'<span class="badge pend">Por clasificar</span>':''}</div>
    <button class="gimg" type="button" data-act="editPhoto" data-id="${ph.id}" aria-label="Abrir ${esc(photoLabel(ph))}"><img src="${ph.thumb||ph.orig}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy"></button>
    <div class="gb"><span class="gt">${esc(photoLabel(ph))}</span><span class="small muted">${esc(photoDateLabel(ph))}${ph.phase?' · '+esc(PHASE[ph.phase]||''):''}</span>
    <div class="gactions">${BTN('editPhoto','Simular','sm primary',`data-id="${ph.id}"`)}${BTN('dlPhoto','Descargar','sm',`data-id="${ph.id}"`)}${BTN('classify',ph.cls===false?'Clasificar':'Datos','sm ghost',`data-id="${ph.id}"`)}</div></div></div>`;
  $('#tab').innerHTML=`<div class="sec">
  <div class="row spread"><div class="row">${BTN('addPhotos','Añadir fotografías','primary')}${ui.photos.length>1?BTN('selAll',ui.sel.size?'Quitar selección':'Seleccionar todas'):''}</div>
    <div class="row">${SEL('g_visit','',[['','Todas las visitas'],...p.visits.map(v=>[v.id,`${VISIT_TYPE[v.type]} ${fmtDate(v.date)}`]),['none','Sin visita asignada']],f.visit,'data-gal="visit" aria-label="Filtrar por visita" style="width:auto"')}
    ${SEL('g_type','',[['','Todos los tipos'],['orig','Originales'],['sim','Con simulación'],['post','Posoperatorias reales'],['pend','Por clasificar']],f.type,'data-gal="type" aria-label="Filtrar por tipo" style="width:auto"')}</div></div>
  ${ui.sel.size?`<div class="card row" role="status"><b>${ui.sel.size} seleccionada(s)</b><span class="grow"></span>${BTN('zipSel','Descargar selección como ZIP','primary sm')}${ui.sel.size===2?BTN('compareSel','Comparar evolución','sm'):''}${ui.sel.size<=2?BTN('libAdd','Añadir a la biblioteca de consulta','sm'):''}</div>`:''}
  ${ui.photos.length?'':`<div class="card col"><h2>Aún no hay fotografías</h2><div class="muted">Empieza con «Añadir fotografías»: puedes tomarlas con guía, importar las que ya existen o combinar ambas.</div></div>`}
  ${groups.map(([v,phs])=>`<div class="grouphead"><h2>${v?`${esc(VISIT_TYPE[v.type])} del ${fmtDate(v.date)}`:'Sin visita asignada'}</h2>${v?`<span class="chip">${esc(CAPL[v.cap])}</span>`:'<span class="small muted">Fotos anteriores o sin clasificar: asígnalas a una visita cuando se conozca.</span>'}<span class="grow"></span>
     ${v&&['pendiente','en_captura'].includes(v.cap)&&v.slots.length?BTN('resumeCapture','Continuar captura','sm primary',`data-pid="${p.id}" data-arg="${v.id}"`):''}${v?BTN('zipVisit','Descargar visita (ZIP)','sm',`data-id="${v.id}"`):''}</div>
     <div class="gal">${phs.slice().sort(ord).map(card).join('')}</div>`).join('')}
  ${ui.photos.length&&!list.length?empty('Ninguna fotografía coincide con el filtro.'):''}</div>`}

/* ---- lienzo ---- */
const stageEl=document.createElement('div');stageEl.className='stage';stageEl.id='stage';
stageEl.innerHTML=`<div class="world" id="world"><img id="imgBefore" alt="Fotografía original"><div id="glWrap" style="position:absolute;left:0;top:0;overflow:hidden"><div id="glSlot"></div></div><canvas id="privCv"></canvas><div class="splitline hide" id="splitLine"></div><div id="anchors" style="transition:opacity .15s"></div><div id="privBox"></div></div>
<div class="ring" id="ring"></div><div class="hint hide" id="hint" role="status"></div><span class="tag hide" id="tagA" style="left:10px;top:44px">Antes</span><span class="illus hide" id="illus">Simulación ilustrativa; el resultado real puede variar</span>
<div class="curtain hide" id="curtain">Imagen oculta</div>
<div class="splitrange hide" id="splitWrap"><input type="range" id="splitRange" min="0" max="100" value="50" aria-label="Posición de la división entre antes y simulación"></div>
<div class="stage-ui"><div class="seg" role="group" aria-label="Comparar"><button type="button" data-act="cmp" data-c="before">Antes</button><button type="button" data-act="cmp" data-c="split">Dividir</button><button type="button" data-act="cmp" data-c="after">Simulación</button></div>
<div class="seg"><button type="button" data-act="curtain" id="btnCurtain" aria-pressed="false" title="Ocultar la imagen en pantalla">Ocultar</button><button type="button" data-act="present" id="btnPresent" title="Mostrar a la paciente a pantalla completa">Presentar</button></div>
<div class="seg" role="group" aria-label="Zoom"><button type="button" data-act="zoom" data-d="-1" aria-label="Alejar">−</button><button type="button" data-act="zoom" data-d="0">Ajustar</button><button type="button" data-act="zoom" data-d="1" aria-label="Acercar">+</button></div></div>`;
stageEl.querySelector('#glSlot').replaceWith(Engine.cv);
const world=stageEl.querySelector('#world'),ring=stageEl.querySelector('#ring'),privCv=stageEl.querySelector('#privCv'),privBox=stageEl.querySelector('#privBox');
Engine.cv.addEventListener('webglcontextlost',()=>toast('El navegador liberó la memoria gráfica. La simulación se recupera sola; si la imagen queda en blanco, vuelve a abrir la foto. Tus ajustes guardados no se pierden.',7000));
const TOOLS=[['mover','Mover vista','<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>'],
 ['empujar','Empujar','<path d="M4 16c4-10 9-10 12-2"/><path d="M13 9l4 5-6 1"/>'],['inflar','Aumentar','<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>'],['reducir','Reducir','<circle cx="12" cy="12" r="8"/><path d="M8 12h8"/>'],
 ['suavizar','Suavizar piel','<path d="M4 9c3-3 5 3 8 0s5 3 8 0M4 15c3-3 5 3 8 0s5 3 8 0"/>'],['atenuar','Atenuar surco','<path d="M5 5c3 5 3 9 0 14"/><path d="M11 8h8M11 12h8M11 16h8" stroke-dasharray="2 3"/>'],['restaurar','Restaurar','<path d="M5 12a7 7 0 1 0 2-5"/><path d="M5 4v4h4"/>']];

/* ---- historial unificado: deslizadores, puntos, pincel y censura. Es por fotografía: abrir otra foto reinicia el historial ---- */
const Hist={u:[],r:[],
  cap(){const ph=curPhoto();return{mods:clone(ph.mods||{}),privacy:clone(ph.privacy||[]),eng:Engine.snapshot()}},
  push(){if(!ui.loaded)return;this.u.push(this.cap());if(this.u.length>14)this.u.shift();this.r=[];this.btns()},
  apply(s){const ph=curPhoto();ph.mods=s.mods;ph.privacy=s.privacy;Engine.restoreSnap(s.eng);Engine.recompute();Engine.render();ui.mask=null;drawPrivacy();renderPanel();drawAnchors();Sim.schedule();this.btns()},
  undo(){const s=this.u.pop();if(!s)return false;this.r.push(this.cap());this.apply(s);return true},
  redo(){const s=this.r.pop();if(!s)return false;this.u.push(this.cap());this.apply(s);return true},
  cancel(){const s=this.u.pop();if(s)this.apply(s)},
  reset(){this.u=[];this.r=[];this.btns()},
  btns(){const a=$('#btnUndo'),b=$('#btnRedo');if(a)a.disabled=!this.u.length;if(b)b.disabled=!this.r.length}};
function scnStash(ph){if(!ph.scn)return;const s=ph.scenarios.find(x=>x.id===ph.scn);if(s)Object.assign(s,{mods:clone(ph.mods||{}),brush:ph.brush?new Float32Array(ph.brush):null,gw:ph.gw,gh:ph.gh,maskS:ph.maskS||null,maskL:ph.maskL||null,after:ph.after||null,updatedAt:nowISO()})}
function scnLoad(ph,s){ph.mods=clone(s.mods||{});ph.brush=s.brush?new Float32Array(s.brush):null;ph.gw=s.gw;ph.gh=s.gh;ph.maskS=s.maskS||null;ph.maskL=s.maskL||null;ph.after=s.after||null;ph.scn=s.id}
const Sim={loadedId:null,dirty:false,
  schedule(){const ph=curPhoto();if(!ph)return;this.dirty=true;Saver.schedule('photo:'+ph.id,()=>Sim.commitSave(ph),1100)},
  async commitSave(ph){
    if(ui.loaded&&this.loadedId===ph.id&&this.dirty){Object.assign(ph,Engine.state());const changed=Engine.hasBrush()||Object.keys(ph.mods||{}).some(k=>MODULES[k]&&modActive(ph,k));ph.after=changed?Engine.jpeg():null;scnStash(ph);this.dirty=false;
      try{ph.thumb=await safeThumb(ph)}catch(e){}
      const p=S.patients.find(x=>x.id===ph.patientId);if(p){const first=ui.photos[0]&&ui.photos[0].id===ph.id;const v=p.visits.find(x=>x.id===ph.visitId);let ch=false;if(first&&p.thumb!==ph.thumb){p.thumb=ph.thumb;ch=true}if(v&&v.cap==='lista'&&changed){v.cap='en_valoracion';ch=true}if(ch)savePatient(p)}}
    ph.updatedAt=Date.now();await Store.put('photos',ph)},
  async leave(){await Saver.flushPrefix('photo:')}};

async function renderEditor(p){
  const ph=curPhoto();
  $('#tab').innerHTML=`<div class="sec"><div class="edbar"><button class="btn sm" data-act="closeEditor" type="button">← Galería</button><span class="grow"><b>${esc(p.name||'Sin nombre')}</b> <span class="small muted">· ${esc(photoLabel(ph))} · ${esc(photoDateLabel(ph))}</span></span>
    <div class="scn" id="scnBar"></div><button class="btn sm" id="btnUndo" data-act="undo" type="button" title="Deshacer (Ctrl+Z)">Deshacer</button><button class="btn sm" id="btnRedo" data-act="redo" type="button" title="Rehacer (Ctrl+Y)">Rehacer</button></div>
  <div class="sim"><div id="stageSlot"></div><div class="panel" id="panel"></div></div></div>`;
  $('#stageSlot').replaceWith(stageEl);await openPhoto()}
function scnBar(){const ph=curPhoto(),el=$('#scnBar');if(!ph||!el)return;
  el.innerHTML=(ph.scenarios.length?`<span class="lbl">Alternativa</span>`+ph.scenarios.map(s=>`<button class="modbtn" type="button" data-act="scnSel" data-id="${s.id}" aria-pressed="${s.id===ph.scn}">${esc(s.name)}</button>`).join(''):'')+`<button class="btn sm" data-act="scnSave" type="button" ${ph.scenarios.length>=4?'disabled':''}>Guardar alternativa</button>${ph.scenarios.length>1?`<button class="btn sm ghost danger" data-act="scnDel" type="button">Quitar esta</button>`:''}`}
async function openPhoto(){
  const ph=curPhoto();if(!ph)return;ui.loaded=false;ui.placing=null;ui.mask=null;Sim.dirty=false;
  const used=Object.keys(ph.mods||{}).filter(k=>MODULES[k]&&modPlaced(ph,k));
  if(!ui.mod||!used.includes(ui.mod))ui.mod=used[0]||'';
  try{await Engine.load(ph)}catch(e){toast(e.message&&/WebGL/.test(e.message)?'Este navegador no permite WebGL, necesario para simular. Prueba con Chrome, Edge o Safari actualizados; las fotos y el plan siguen disponibles.':'No se pudo abrir la foto.',7000);return}
  Sim.loadedId=ph.id;const[W,H]=Engine.size(),im=stageEl.querySelector('#imgBefore');im.src=ph.orig;im.style.width=W+'px';im.style.height=H+'px';world.style.width=W+'px';world.style.height=H+'px';privCv.width=W;privCv.height=H;privCv.style.width=W+'px';privCv.style.height=H+'px';
  try{await im.decode()}catch(e){}
  ui.loaded=true;Hist.reset();fitView();setCmp('after');renderPanel();drawAnchors();drawPrivacy();scnBar();if(!ph.after&&used.some(k=>modActive(ph,k)))Sim.schedule()}
/* la foto se ajusta al área libre sobre los controles, para que nunca queden encima de la imagen */
function fitView(){const r=stageEl.getBoundingClientRect(),[W,H]=Engine.size();if(!W||!r.width)return;const bar=stageEl.querySelector('.stage-ui'),h=Math.max(120,r.height-(bar?bar.offsetHeight+14:0)),z=Math.min(r.width/W,h/H);ui.view={z,tx:(r.width-W*z)/2,ty:(h-H*z)/2,fit:z};applyView()}
function applyView(){const v=ui.view;world.style.transform=`translate(${v.tx}px,${v.ty}px) scale(${v.z})`;world.style.setProperty('--inv',1/v.z)}
function zoomAt(f,cx,cy){const v=ui.view,r=stageEl.getBoundingClientRect(),z=clamp(v.z*f,(v.fit||v.z)*.6,(v.fit||v.z)*10),px=cx-r.left,py=cy-r.top,wx=(px-v.tx)/v.z,wy=(py-v.ty)/v.z;v.z=z;v.tx=px-wx*z;v.ty=py-wy*z;applyView()}
function setCmp(c){ui.cmp=c;$$('[data-act="cmp"]',stageEl).forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===c));
  const[W,H]=Engine.size(),gwp=stageEl.querySelector('#glWrap'),off=c==='split'?Math.round(ui.split/100*W):0;gwp.style.left=off+'px';gwp.style.width=(W-off)+'px';gwp.style.height=H+'px';Engine.cv.style.left=(-off)+'px';gwp.style.visibility=c==='before'?'hidden':'visible';
  const sp=c==='split';stageEl.querySelector('#splitWrap').classList.toggle('hide',!sp);const ln=stageEl.querySelector('#splitLine');ln.classList.toggle('hide',!sp);ln.style.left=ui.split+'%';
  stageEl.querySelector('#tagA').classList.toggle('hide',c==='after');stageEl.querySelector('#illus').classList.toggle('hide',c==='before');
  const pres=stageEl.classList.contains('present');stageEl.querySelector('#anchors').classList.toggle('hide',c!=='after'||ui.ptab!=='sim'||pres);privBox.classList.toggle('hide',ui.ptab!=='priv'||pres);
  stageEl.classList.toggle('pan',ui.tool==='mover'||c!=='after'||ui.ptab==='priv'||ui.ptab==='foto')}
/* censura: se dibuja sobre original y simulación a la vez, en coordenadas de imagen */
function drawPrivacy(){const ph=curPhoto();if(!ph)return;const x=privCv.getContext('2d'),[W,H]=Engine.size();x.clearRect(0,0,W,H);Privacy.draw(x,stageEl.querySelector('#imgBefore'),ph.privacy,W,H);
  privBox.innerHTML=(ph.privacy||[]).map(m=>`<div class="pmask ${m.shape==='rect'?'':'ell'} ${ui.mask===m.id?'sel':''}" data-mk="${m.id}" style="left:${m.x-m.w/2}px;top:${m.y-m.h/2}px;width:${m.w}px;height:${m.h}px;transform:rotate(${m.rot||0}deg);${m.on===false?'opacity:.35':''}">${ui.mask===m.id?'<span class="rh" data-rh="1"></span>':''}</div>`).join('')}
const curMask=()=>{const ph=curPhoto();return ph&&(ph.privacy||[]).find(m=>m.id===ui.mask)};
const SL=(id,label,v,min,max,attr,out)=>`<div class="sl"><label for="${id}">${label}</label><output id="o_${id}" class="num">${out??v}</output><input type="range" id="${id}" min="${min}" max="${max}" value="${v}" ${attr}></div>`;
const ARROWS=(act,attr='')=>`<div class="row" role="group" aria-label="Mover con botones">${[['←',-1,0],['↑',0,-1],['↓',0,1],['→',1,0]].map(([l,dx,dy])=>`<button class="btn sm" type="button" data-act="${act}" data-dx="${dx}" data-dy="${dy}" ${attr} aria-label="Mover ${l}">${l}</button>`).join('')}</div>`;
function renderPanel(){
  const ph=curPhoto(),el=$('#panel');if(!ph||!el)return;
  const tabs=`<div class="ptabs" role="tablist" aria-label="Herramientas">${[['sim','Simular'],['pincel','Pincel'],['priv','Privacidad'],['foto','Foto']].map(([k,l])=>`<button type="button" role="tab" data-act="ptool" data-t="${k}" aria-selected="${ui.ptab===k}">${l}${k==='priv'&&Privacy.active(ph).length?' ·'+Privacy.active(ph).length:''}</button>`).join('')}</div>`;
  let body='';
  if(ui.ptab==='sim'){
    const sug=suggestedMods(ph),used=Object.keys(ph.mods||{}).filter(k=>MODULES[k]&&modPlaced(ph,k)),short=sug.length&&!ui.allMods,mb=k=>`<button class="modbtn ${modActive(ph,k)?'on':''}" type="button" data-act="selMod" data-m="${k}" aria-pressed="${ui.mod===k}">${esc(MODULES[k].name)}</button>`;
    const mods=short?`<div class="lbl">Sugeridos para esta vista</div><div class="mods">${[...new Set([...sug,...used,...(ui.mod?[ui.mod]:[])])].map(mb).join('')}</div><div class="row">${BTN('allMods','Ver todos los módulos','sm ghost')}</div>`
      :['Rostro','Cuerpo'].map(g=>`<div class="lbl">${g}</div><div class="mods">${Object.entries(MODULES).filter(([,m])=>m.group===g).map(([k])=>mb(k)).join('')}</div>`).join('')+(sug.length?`<div class="row">${BTN('allMods','Ver solo los sugeridos','sm ghost')}</div>`:'');
    let mbody='';
    if(ui.mod){const M=MODULES[ui.mod],st=modState(ph,ui.mod),placed=modPlaced(ph,ui.mod),idx=ui.placing?ui.placing.i:-1;
      const steps=`<ol class="steps">${M.anchors.map((a,i)=>`<li class="${st.a[a.k]&&i!==idx?'done':''} ${i===idx?'now':''}"><b>${i+1}</b>${esc(a.label)}</li>`).join('')}</ol>`;
      if(!placed||ui.placing)mbody=`<div class="note">${esc(M.tip)} Toca en la foto cada punto en el orden indicado. Puedes acercar con dos dedos, con la rueda del ratón o con los botones + y −.</div>${steps}<div class="row"><button class="btn sm primary" data-act="place" type="button">${ui.placing?'Marcando puntos…':'Marcar puntos'}</button>${ui.placing?BTN('placeCancel','Cancelar','sm'):''}</div>`;
      else mbody=`${M.sliders.map(d=>{const v=st.s[d.k]??d.def;return`<div class="sl"><label for="s_${d.k}">${esc(d.label)}</label><output id="o_${d.k}" class="num">${v>0&&d.min<0?'+':''}${v}</output><input type="range" id="s_${d.k}" data-s="${d.k}" min="${d.min}" max="${d.max}" value="${v}"><div class="ends"><span>${esc(d.lo)}</span><span>${esc(d.hi)}</span></div></div>`}).join('')}
        <div class="row">${BTN('modReset','Restablecer','sm')}${BTN('place','Volver a marcar puntos','sm')}</div>
        <details><summary class="small">Afinar un punto sin arrastrar</summary><div class="col" style="margin-top:8px">${SEL('nudgeK','',M.anchors.map((a,i)=>[a.k,`${i+1}. ${a.label}`]),ui.nudgeK||M.anchors[0].k,'aria-label="Punto a mover"')}${ARROWS('nudge')}</div></details>`}
    body=`<div class="card col"><h3>Zona a simular</h3>${mods}${mbody?`<hr style="border:0;border-top:1px solid var(--line);width:100%;margin:2px 0">${mbody}`:`<div class="small muted">Elige una zona, marca los puntos anatómicos y ajusta con los deslizadores. Es una ilustración, no una medición.</div>`}</div>`}
  else if(ui.ptab==='pincel'){
    body=`<div class="card col"><h3>Ajuste libre con pincel</h3><div class="tools">${TOOLS.map(([k,l,svg])=>`<button class="tool" type="button" data-act="tool" data-t="${k}" aria-pressed="${ui.tool===k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg>${l}</button>`).join('')}</div>
     ${SL('bsize','Tamaño del pincel',ui.size,2,30,'')}${SL('bpow','Intensidad',ui.power,10,100,'')}
     <div class="small muted">Empujar desplaza tejido, útil para colgajos y contornos. Suavizar piel atenúa estrías y flacidez. Atenuar surco aclara pliegues y líneas de expresión.</div><div class="row">${BTN('brushReset','Borrar ajustes de pincel','sm')}</div></div>`}
  else if(ui.ptab==='priv'){const m=curMask(),L=ph.privacy||[];
    body=`<div class="card col"><h3>Censura de zonas sensibles</h3><div class="row">${BTN('maskAdd','+ Círculo','sm primary','data-sh="ell"')}${BTN('maskAdd','+ Rectángulo','sm primary','data-sh="rect"')}</div>
     ${L.length?`<div class="mods">${L.map((x,i)=>`<button class="modbtn" type="button" data-act="maskSel" data-id="${x.id}" aria-pressed="${ui.mask===x.id}">${x.shape==='rect'?'Rectángulo':'Círculo'} ${i+1}${x.on===false?' (oculta)':''}</button>`).join('')}</div>`:'<div class="small muted">Añade una figura y colócala sobre la zona. Cubre a la vez la foto original y la simulación, también al dividir y al presentar.</div>'}
     ${m?`${F('Estilo','mk_style',SEL('mk_style','',Privacy.STYLES,m.style,'data-mk="style"'))}${m.style==='solid'?`<div class="row"><label for="mk_color" class="lbl">Color</label><input type="color" id="mk_color" data-mk="color" value="${esc(m.color)}" style="width:56px;height:40px;border:1px solid var(--line);border-radius:8px;padding:2px">${SL('mk_op','Opacidad',Math.round(m.opacity*100),20,100,'data-mk="opacity" style="min-width:140px"',Math.round(m.opacity*100)+'%')}</div>${m.opacity<1?'<div class="banner warn small">Con menos de 100 % la zona no queda oculta.</div>':''}`:'<div class="banner warn small">El pixelado y el difuminado son efectos de presentación: no garantizan que la zona no pueda reconocerse. Para ocultar, usa el sólido opaco.</div>'}
       ${SL('mk_w','Ancho',Math.round(m.w),10,Math.round(Engine.size()[0]),'data-mk="w"')}${SL('mk_h','Alto',Math.round(m.h),10,Math.round(Engine.size()[1]),'data-mk="h"')}${SL('mk_rot','Rotación',Math.round(m.rot||0),-90,90,'data-mk="rot"',Math.round(m.rot||0)+'°')}
       <div class="lbl">Posición</div>${ARROWS('maskNudge')}
       <div class="row">${BTN('maskDup','Duplicar','sm')}${BTN('maskToggle',m.on===false?'Mostrar':'Ocultar capa','sm')}${BTN('maskDel','Eliminar','sm danger')}</div>`:''}
     <div class="small muted">Las máscaras son capas editables dentro del caso protegido; el original no se altera. En todo archivo que se descarga para compartir, la censura queda aplanada sobre los píxeles.</div></div>`}
  else{body=`<div class="card col"><h3>Esta fotografía</h3><dl class="kv"><dt>Tipo</dt><dd>${CLASS_LABEL[photoClass(ph)]}</dd><dt>Vista</dt><dd>${esc(photoLabel(ph))}${ph.cls===false?' <span class="badge pend">Por confirmar</span>':''}</dd><dt>Fecha de toma</dt><dd>${esc(photoDateLabel(ph))}</dd><dt>Cargada</dt><dd>${fmtDT(ph.importedAt)}</dd><dt>Origen</dt><dd>${{camera:'Tomada con la herramienta',upload:'Archivo importado',legacy:'Versión anterior',demo:'Ilustración de ejemplo'}[ph.method]||'—'}</dd><dt>Tamaño</dt><dd>${ph.w}×${ph.h} px (copia de trabajo, no el archivo de la cámara)</dd></dl>
     <div class="row">${BTN('classify','Clasificar o corregir fecha','sm',`data-id="${ph.id}"`)}</div>
     <label class="chk" for="phPdf"><input type="checkbox" id="phPdf" ${ph.inPdf!==false?'checked':''}> <span>Incluir antes y simulación en la propuesta</span></label>
     <div class="row">${BTN('dlPhoto','Descargar…','sm primary',`data-id="${ph.id}"`)}${BTN('photoDel','Eliminar foto','sm danger',`data-id="${ph.id}"`)}</div></div>`}
  el.innerHTML=tabs+body;updateHint();Hist.btns()}
function updateHint(){const h=stageEl.querySelector('#hint');stageEl.classList.toggle('placing',!!ui.placing);if(ui.placing){const M=MODULES[ui.placing.mod],a=M.anchors[ui.placing.i];h.textContent=`Punto ${ui.placing.i+1} de ${M.anchors.length}: ${a.label}`;h.classList.remove('hide')}else h.classList.add('hide')}
function drawAnchors(){const box=stageEl.querySelector('#anchors'),ph=curPhoto();if(!ph||!ui.mod){box.innerHTML='';return}const M=MODULES[ui.mod],st=modState(ph,ui.mod);
  box.innerHTML=M.anchors.map((a,i)=>st.a[a.k]?`<div class="anchor" data-k="${a.k}" style="left:${st.a[a.k][0]}px;top:${st.a[a.k][1]}px" title="${esc(a.label)}"><i>${i+1}</i></div>`:'').join('')}
function simChanged(){Engine.recompute();Engine.render();Sim.schedule()}
function placeAnchor(pt){const ph=curPhoto(),pl=ui.placing;if(!ph||!pl)return;const M=MODULES[pl.mod],st=modState(ph,pl.mod);st.a[M.anchors[pl.i].k]=pt;pl.i++;
  if(pl.i>=M.anchors.length){ui.placing=null;ui.tool='mover';simChanged();toast('Puntos marcados. Ajusta con los deslizadores.')}
  renderPanel();drawAnchors();setCmp('after')}

/* punteros sobre el lienzo */
(()=>{const ptrs=new Map();let gesture=null,pan=null,tap=null,stroke=null,raf=0,splitDrag=false,mdrag=null;
  const moveSplit=e=>{const r=world.getBoundingClientRect();ui.split=clamp((e.clientX-r.left)/r.width*100,0,100);stageEl.querySelector('#splitRange').value=ui.split;setCmp('split')};
  const toImg=e=>{const r=world.getBoundingClientRect(),[W,H]=Engine.size();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H]};
  const radius=()=>{const[W,H]=Engine.size();return ui.size/100*Math.min(W,H)};
  const brushOn=()=>ui.ptab==='pincel'&&ui.tool!=='mover'&&ui.cmp==='after'&&!ui.placing&&!stageEl.classList.contains('present');
  const showRing=e=>{if(!brushOn()){ring.style.display='none';return}const r=stageEl.getBoundingClientRect(),d=radius()*ui.view.z*2;ring.style.display='block';ring.style.width=ring.style.height=d+'px';ring.style.left=(e.clientX-r.left)+'px';ring.style.top=(e.clientY-r.top)+'px'};
  function loop(){if(!stroke)return;const pw=ui.power/100,r=radius(),c=stroke.cur,t=ui.tool;
    if(t==='inflar')Engine.bloat(c,r,.05*pw,1);else if(t==='reducir')Engine.bloat(c,r,.05*pw,-1);else if(t==='suavizar')Engine.paint('S',c,r,.14*pw);else if(t==='atenuar')Engine.paint('L',c,r,.14*pw);else if(t==='restaurar')Engine.restore(c,r,.3*pw);
    Engine.render();raf=requestAnimationFrame(loop)}
  function endStroke(cancel){if(!stroke)return;cancelAnimationFrame(raf);stroke=null;if(cancel)Hist.cancel();else Sim.schedule()}
  stageEl.addEventListener('pointerdown',e=>{if(e.target.closest('.stage-ui,.splitrange,.anchor,.pmask')||!ui.loaded)return;try{stageEl.setPointerCapture(e.pointerId)}catch(_){}ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(ptrs.size===2){endStroke(true);pan=null;tap=null;splitDrag=false;const[a,b]=[...ptrs.values()];gesture={d:Math.hypot(a.x-b.x,a.y-b.y)||1,z:ui.view.z,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,tx:ui.view.tx,ty:ui.view.ty};return}
    if(ptrs.size>2)return;
    if(ui.placing){tap={x:e.clientX,y:e.clientY};pan={x:e.clientX,y:e.clientY,tx:ui.view.tx,ty:ui.view.ty};return}
    if(ui.cmp==='split'){splitDrag=true;moveSplit(e);return}
    if(!brushOn()){pan={x:e.clientX,y:e.clientY,tx:ui.view.tx,ty:ui.view.ty};return}
    Hist.push();const p=toImg(e);stroke={cur:p,prev:p};showRing(e);if(ui.tool!=='empujar')loop()});
  stageEl.addEventListener('pointermove',e=>{if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(e.pointerType==='mouse'||stroke)showRing(e);
    if(gesture&&ptrs.size>=2){const[a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,r=stageEl.getBoundingClientRect(),v=ui.view,z=clamp(gesture.z*d/gesture.d,(v.fit||1)*.6,(v.fit||1)*10),wx=(gesture.mx-r.left-gesture.tx)/gesture.z,wy=(gesture.my-r.top-gesture.ty)/gesture.z;v.z=z;v.tx=mx-r.left-wx*z;v.ty=my-r.top-wy*z;applyView();return}
    if(splitDrag&&ptrs.size===1){moveSplit(e);return}
    if(pan){if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>8)tap=null;if(!tap){ui.view.tx=pan.tx+e.clientX-pan.x;ui.view.ty=pan.ty+e.clientY-pan.y;applyView()}return}
    if(stroke){const p=toImg(e);if(ui.tool==='empujar'){Engine.push(stroke.prev,p,radius(),.35+.65*ui.power/100);Engine.render()}stroke.prev=stroke.cur=p}});
  const up=e=>{const had=ptrs.delete(e.pointerId);splitDrag=false;if(gesture){if(ptrs.size<2){gesture=null;pan=null;tap=null}return}
    if(tap&&ui.placing&&had&&e.type==='pointerup'){if(modPlaced(curPhoto(),ui.placing.mod)===false&&ui.placing.i===0)Hist.push();placeAnchor(toImg(e))}tap=null;pan=null;endStroke(false);if(e.pointerType!=='mouse')ring.style.display='none'};
  stageEl.addEventListener('pointerup',up);stageEl.addEventListener('pointercancel',up);stageEl.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!stroke)ring.style.display='none'});
  stageEl.addEventListener('wheel',e=>{if(!ui.loaded)return;e.preventDefault();zoomAt(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY)},{passive:false});
  /* arrastre de puntos anatómicos */
  let drag=null;stageEl.addEventListener('pointerdown',e=>{const a=e.target.closest('.anchor');if(!a)return;e.stopPropagation();Hist.push();drag={el:a,k:a.dataset.k};try{a.setPointerCapture(e.pointerId)}catch(_){}},true);
  stageEl.addEventListener('pointermove',e=>{if(!drag)return;const ph=curPhoto(),p=toImg(e),[W,H]=Engine.size();p[0]=clamp(p[0],0,W);p[1]=clamp(p[1],0,H);modState(ph,ui.mod).a[drag.k]=p;drag.el.style.left=p[0]+'px';drag.el.style.top=p[1]+'px';Engine.recompute();Engine.render()},true);
  const dragEnd=()=>{if(drag){drag=null;Sim.schedule()}};stageEl.addEventListener('pointerup',dragEnd,true);stageEl.addEventListener('pointercancel',dragEnd,true);
  /* arrastre y redimensión de máscaras de privacidad */
  privBox.addEventListener('pointerdown',e=>{const el=e.target.closest('.pmask');if(!el)return;e.stopPropagation();const ph=curPhoto(),m=ph.privacy.find(x=>x.id===el.dataset.mk);if(!m)return;
    if(ui.mask!==m.id){ui.mask=m.id;drawPrivacy();renderPanel()}Hist.push();const p=toImg(e);mdrag={m,resize:!!e.target.closest('[data-rh]'),ox:p[0]-m.x,oy:p[1]-m.y};try{privBox.setPointerCapture(e.pointerId)}catch(_){}});
  privBox.addEventListener('pointermove',e=>{if(!mdrag)return;const p=toImg(e),m=mdrag.m,[W,H]=Engine.size();
    if(mdrag.resize){const a=-(m.rot||0)*Math.PI/180,dx=p[0]-m.x,dy=p[1]-m.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);m.w=clamp(Math.abs(lx)*2,10,W*2);m.h=clamp(Math.abs(ly)*2,10,H*2)}
    else{m.x=clamp(p[0]-mdrag.ox,0,W);m.y=clamp(p[1]-mdrag.oy,0,H)}drawPrivacy()});
  const mEnd=()=>{if(mdrag){mdrag=null;renderPanel();Sim.schedule()}};privBox.addEventListener('pointerup',mEnd);privBox.addEventListener('pointercancel',mEnd);
  stageEl.querySelector('#splitRange').addEventListener('input',e=>{ui.split=+e.target.value;setCmp('split')});
  new ResizeObserver(()=>{if(ui.loaded&&stageEl.isConnected&&Math.abs(ui.view.z-(ui.view.fit||0))<1e-6)fitView()}).observe(stageEl);
})();
document.addEventListener('keydown',e=>{if(!ui.editing||!ui.loaded||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)&&e.target.type!=='range')return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?Hist.redo():Hist.undo()}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();Hist.redo()}
  else if(e.key==='Escape'&&stageEl.classList.contains('present'))acts.present()});
function setPresent(on){stageEl.classList.toggle('present',on);document.body.classList.toggle('pat-mode',on);document.body.style.overflow=on?'hidden':'';$('#btnPresent',stageEl).textContent=on?'Salir':'Presentar';
  if(on){ui.placing=null;ui.tool='mover';updateHint()}else if(ui.curtain){ui.curtain=false;stageEl.querySelector('#curtain').classList.add('hide');$('#btnCurtain',stageEl).setAttribute('aria-pressed','false')}
  setCmp(on?(curPhoto()&&curPhoto().after?'split':'before'):'after');requestAnimationFrame(fitView)}
