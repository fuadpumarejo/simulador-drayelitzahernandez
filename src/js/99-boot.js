/* ============ eventos y arranque ============ */
const P=e=>e&&e.dataset.pid?S.patients.find(p=>p.id===e.dataset.pid):patient();
const photoBy=id=>ui.photos.find(x=>x.id===id);
async function deletePhoto(ph){const p=patient();if(!await confirmBox('Eliminar fotografía','Se eliminarán de este equipo la foto, sus simulaciones y sus censuras. No se puede deshacer.','Eliminar',{danger:true}))return false;
  for(const v of p.visits)for(const s of v.slots)if(s.photoId===ph.id){s.photoId=null;s.st='pendiente'}S.library=S.library.filter(e=>!e.photoIds.includes(ph.id));saveKV('library');
  await Store.del('photos',ph.id);ui.photos=ui.photos.filter(x=>x.id!==ph.id);ui.sel.delete(ph.id);if(ui.photoId===ph.id){ui.photoId=null;ui.editing=false}p.thumb=ui.photos[0]?ui.photos[0].thumb||null:null;savePatient(p);return true}
const acts={
  nav:async e=>{if(e.dataset.more)S.more=e.dataset.more;else if(e.dataset.v==='mas')S.more='menu';ui.editing=false;if(stageEl.classList.contains('present'))setPresent(false);await go(e.dataset.v)},
  more:e=>{S.more=e.dataset.m;render();window.scrollTo(0,0)},
  newVal:()=>{ui.wiz={step:1,regions:[]};go('nueva')},newLead,
  importAny:()=>$('#fileCase').click(),
  openPatient:async e=>{ui.editing=false;ui.photoId=null;ui.sel.clear();ui.gal={visit:'',type:''};ui.wiz=null;await go('patient',{pid:e.dataset.id,tab:e.dataset.t||'resumen'})},
  ptab:async e=>{if(e.dataset.pid)S.pid=e.dataset.pid;ui.editing=false;await go('patient',{tab:e.dataset.arg})},
  resumeCapture:async e=>{if(e.dataset.pid)S.pid=e.dataset.pid;const p=patient(),v=p.visits.find(x=>x.id===e.dataset.arg);if(!v)return;if(v.cap==='pendiente'){v.cap='en_captura';savePatient(p)}ui.cap={visitId:v.id,mode:'tablero',idx:0,pending:null};await go('captura')},
  filter:e=>{S.filter=e.dataset.s;renderList()},
  delPatient:async()=>{const p=patient();if(!await confirmBox('Eliminar paciente de este equipo',`Se eliminarán la ficha, las fotos, las propuestas y los documentos de ${p.name||'esta paciente'} en este equipo. No se puede deshacer. Si necesitas conservarlo, exporta antes el caso editable.`,'Eliminar definitivamente',{danger:true}))return;
    await Saver.flush();const ops=[{op:'del',store:'patients',key:p.id},...(await Store.photosOf(p.id)).map(x=>({op:'del',store:'photos',key:x.id})),...(await Store.docsOf(p.id)).map(x=>({op:'del',store:'docs',key:x.id}))];await Store.atomic(ops);
    S.patients=S.patients.filter(x=>x.id!==p.id);S.library=S.library.filter(e=>e.patientId!==p.id);saveKV('library');if(S.last&&S.last.pid===p.id){S.last=null;saveKV('last')}if(typeof Sync!=='undefined')await Sync.forget(p);S.pid=null;go('pacientes')},
  exportCase:()=>exportCaseFlow(patient()),backup:exportBackupFlow,xlsAll:exportAllXLS,undoReplace:e=>undoReplace(e.dataset.id),recDel:async e=>{await Store.del('recovery',e.dataset.id);render()},
  leadConvert:e=>{const l=S.leads.find(x=>x.id===e.dataset.id);if(!l)return;ui.wiz={step:1,regions:[],name:l.name,phone:l.phone,lead:l.id};go('nueva')},
  leadClose:e=>{const l=S.leads.find(x=>x.id===e.dataset.id);if(l){l.status='cerrado';saveKV('leads');render()}},
  /* nueva valoración y captura */
  wizNext:async()=>{if(await wizCreatePatient(true)){ui.wiz.step=2;render()}},
  wizNoPhotos:async()=>{if(await wizCreatePatient(false)){ui.wiz=null;go('patient',{tab:'resumen'})}},
  wizBack:()=>{const w=ui.wiz;if(w.created){ui.wiz=null;return go('patient',{tab:'resumen'})}w.step=1;render()},
  wizRegion:e=>{const w=ui.wiz,r=e.dataset.r,i=w.regions.indexOf(r);i>=0?w.regions.splice(i,1):w.regions.push(r);e.setAttribute('aria-pressed',i<0);$('#w_plan').textContent=planHint(w.regions)},
  wizStart:e=>wizStart(e.dataset.way),
  addPhotos:e=>{const p=patient();if(!p.consents.photo.ok){errBox('Falta la autorización de fotografías','Antes de tomar o importar fotografías, registra la autorización de fotografías clínicas en Resumen > Autorizaciones registradas.');return}const ov=openVisit(p);ui.wiz={step:2,pid:p.id,regions:[],visitId:e.dataset.visit||(ov?ov.id:(lastVisit(p)&&lastVisit(p).date===today()?lastVisit(p).id:'new'))};go('nueva')},
  capMode:e=>{ui.cap.mode=e.dataset.m;ui.cap.pending=null;if(e.dataset.m==='guiada'){const v=capVisit(),i=v.slots.findIndex(s=>s.st==='pendiente');ui.cap.idx=i>=0?i:0}renderCapture();window.scrollTo(0,0)},
  capShoot:()=>pickImages({kind:'guided'},'cam'),capPick:()=>pickImages({kind:'guided'},'lib'),capRetry:()=>{ui.cap.pending=null;renderCapture()},capAccept,
  capStep:e=>{const v=capVisit(),c=ui.cap,d=+e.dataset.d;if(c.pending){toast('Acepta o repite la foto antes de cambiar de vista.');return}if(d>0&&c.idx>=v.slots.length-1){c.mode='tablero'}else c.idx=clamp(c.idx+d,0,v.slots.length-1);renderCapture()},
  capSkip:async()=>{const v=capVisit(),s=v.slots[ui.cap.idx];const r=await formBox('Omitir esta vista',[{k:'why',label:'Motivo',type:'select',options:['No aplica para esta paciente','La paciente prefiere no tomarla','Se tomará después','Otro']}],'Omitir',{intro:'Podrás volver a completarla más tarde.'});if(!r)return;s.st='omitida';s.skip=r.why;savePatient(patient());const nx=v.slots.findIndex((x,i)=>i>ui.cap.idx&&x.st==='pendiente');if(nx>=0)ui.cap.idx=nx;else ui.cap.mode='tablero';renderCapture()},
  capImport:()=>pickImages({kind:'tray'},'lib'),capFree:()=>pickImages({kind:'tray'},isTouch()||canWebcam()?'cam':'lib'),
  slotGo:e=>{ui.cap.mode='guiada';ui.cap.idx=+e.dataset.i;ui.cap.pending=null;renderCapture();window.scrollTo(0,0)},
  slotClear:e=>{const v=capVisit(),s=v.slots.find(x=>x.id===e.dataset.id),ph=photoBy(s.photoId);if(ph){ph.slotId=null;ph.cls=false;savePhotoRec(ph)}s.photoId=null;s.st='pendiente';savePatient(patient());renderCapture();toast('La foto volvió a «Por clasificar»; no se borró.')},
  capAddRegion:async()=>{const v=capVisit();const r=await formBox('Agregar regiones al plan',REGIONS.map(([k,l])=>({k,label:l,type:'check',value:false})),'Agregar vistas',{intro:'Se agregan las vistas que falten; las ya tomadas se conservan.'});if(!r)return;const regs=REGIONS.map(x=>x[0]).filter(k=>r[k]);if(!regs.length)return;mergePlan(v,regs,S.settings.captureTpl);savePatient(patient());renderCapture()},
  capFinish,
  photoDel:async e=>{const ph=photoBy(e.dataset.id);if(ph&&await deletePhoto(ph))render()},
  /* galería */
  editPhoto:async e=>{await Sim.leave();ui.photoId=e.dataset.id;ui.editing=true;ui.mod='';ui.ptab='sim';ui.allMods=false;renderPatient();window.scrollTo(0,0)},
  closeEditor:async()=>{await Sim.leave();if(stageEl.classList.contains('present'))setPresent(false);ui.editing=false;renderPatient()},
  dlPhoto:e=>downloadPhotoFlow(photoBy(e.dataset.id)),
  classify:async e=>{const ph=photoBy(e.dataset.id);if(ph&&await classifyPhoto(ph)){if(ui.editing)renderPanel();else renderPatient()}},
  selAll:()=>{if(ui.sel.size)ui.sel.clear();else ui.photos.forEach(x=>ui.sel.add(x.id));renderPatient()},
  zipSel:()=>zipPhotosFlow(patient(),ui.photos.filter(x=>ui.sel.has(x.id)),'Descargar selección como ZIP'),
  zipVisit:e=>zipPhotosFlow(patient(),ui.photos.filter(x=>x.visitId===e.dataset.id),'Descargar visita como ZIP'),
  compareSel:()=>{const s=ui.photos.filter(x=>ui.sel.has(x.id));if(s.length===2)compareFlow(s[0],s[1])},
  libAdd:()=>libAdd(patient(),ui.photos.filter(x=>ui.sel.has(x.id))),libOpen:e=>libOpen(S.library.find(x=>x.id===e.dataset.id)),libDel:e=>{S.library=S.library.filter(x=>x.id!==e.dataset.id);saveKV('library');render()},
  visitPhotos:e=>{ui.gal={visit:e.dataset.id,type:''};go('patient',{tab:'fotos'})},
  /* editor */
  undo:()=>{if(!Hist.undo())toast('No hay cambios por deshacer en esta foto.')},redo:()=>{if(!Hist.redo())toast('No hay cambios por rehacer.')},
  ptool:e=>{ui.ptab=e.dataset.t;ui.placing=null;if(ui.ptab!=='pincel')ui.tool='mover';renderPanel();drawPrivacy();setCmp(ui.cmp)},
  allMods:()=>{ui.allMods=!ui.allMods;renderPanel()},
  selMod:e=>{ui.mod=ui.mod===e.dataset.m?'':e.dataset.m;ui.placing=null;const ph=curPhoto();if(ui.mod&&!modPlaced(ph,ui.mod))ui.placing={mod:ui.mod,i:0};renderPanel();drawAnchors();setCmp('after')},
  place:()=>{if(ui.placing)return;const ph=curPhoto();Hist.push();modState(ph,ui.mod).a={};ui.placing={mod:ui.mod,i:0};Engine.recompute();Engine.render();renderPanel();drawAnchors();setCmp('after')},
  placeCancel:()=>{ui.placing=null;renderPanel();drawAnchors()},
  modReset:()=>{Hist.push();modState(curPhoto(),ui.mod).s={};simChanged();renderPanel()},
  nudge:e=>{const ph=curPhoto(),st=modState(ph,ui.mod),k=$('#nudgeK').value,[W,H]=Engine.size(),d=Math.min(W,H)*.004;if(!st.a[k])return;Hist.push();st.a[k]=[clamp(st.a[k][0]+e.dataset.dx*d,0,W),clamp(st.a[k][1]+e.dataset.dy*d,0,H)];ui.nudgeK=k;drawAnchors();simChanged()},
  tool:e=>{ui.tool=e.dataset.t;$$('.tool[data-t]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===ui.tool));setCmp('after')},
  brushReset:()=>{Hist.push();Engine.resetBrush();Sim.schedule()},
  cmp:e=>setCmp(e.dataset.c),present:()=>setPresent(!stageEl.classList.contains('present')),
  curtain:()=>{ui.curtain=!ui.curtain;stageEl.querySelector('#curtain').classList.toggle('hide',!ui.curtain);const b=$('#btnCurtain',stageEl);b.setAttribute('aria-pressed',ui.curtain);b.textContent=ui.curtain?'Mostrar':'Ocultar'},
  zoom:e=>{const d=+e.dataset.d;if(!d)return fitView();const r=stageEl.getBoundingClientRect();zoomAt(d>0?1.35:1/1.35,r.left+r.width/2,r.top+r.height/2)},
  scnSave:async()=>{const ph=curPhoto();await Sim.leave();Object.assign(ph,Engine.state());const L='ABCD',snap=()=>({mods:clone(ph.mods||{}),brush:ph.brush?new Float32Array(ph.brush):null,gw:ph.gw,gh:ph.gh,maskS:ph.maskS||null,maskL:ph.maskL||null,after:ph.after||null,createdAt:nowISO(),updatedAt:nowISO()});
    if(!ph.scenarios.length){const a={id:uid(),name:'A',...snap()};ph.scenarios.push(a);ph.scn=a.id}else scnStash(ph);
    const from=ph.scenarios.find(s=>s.id===ph.scn),b={id:uid(),name:L[ph.scenarios.length]||'Alt',...snap()};ph.scenarios.push(b);ph.scn=b.id;Sim.dirty=true;Sim.schedule();scnBar();toast(`Alternativa ${b.name} creada a partir de ${from.name}. ${from.name} queda intacta.`)},
  scnSel:async e=>{const ph=curPhoto();if(e.dataset.id===ph.scn)return;await Sim.leave();Object.assign(ph,Engine.state());scnStash(ph);scnLoad(ph,ph.scenarios.find(s=>s.id===e.dataset.id));await openPhoto();Sim.dirty=true;Sim.schedule()},
  scnDel:async()=>{const ph=curPhoto(),cur=ph.scenarios.find(s=>s.id===ph.scn);if(!cur||ph.scenarios.length<2)return;if(!await confirmBox('Quitar alternativa',`Se quitará la alternativa ${cur.name}. Las demás no cambian.`,'Quitar',{danger:true}))return;ph.scenarios=ph.scenarios.filter(s=>s.id!==cur.id);scnLoad(ph,ph.scenarios[0]);await openPhoto();Sim.dirty=true;Sim.schedule()},
  maskAdd:e=>{const ph=curPhoto(),[W,H]=Engine.size();Hist.push();const m=Privacy.make(W,H,e.dataset.sh);ph.privacy.push(m);ui.mask=m.id;drawPrivacy();renderPanel();Sim.schedule()},
  maskSel:e=>{ui.mask=e.dataset.id;drawPrivacy();renderPanel()},
  maskNudge:e=>{const m=curMask(),[W,H]=Engine.size();if(!m)return;Hist.push();const d=Math.min(W,H)*.01;m.x=clamp(m.x+e.dataset.dx*d,0,W);m.y=clamp(m.y+e.dataset.dy*d,0,H);drawPrivacy();Sim.schedule()},
  maskDup:()=>{const m=curMask(),ph=curPhoto();if(!m)return;Hist.push();const c={...m,id:uid(),x:m.x+m.w*.3,y:m.y+m.h*.3,at:nowISO()};ph.privacy.push(c);ui.mask=c.id;drawPrivacy();renderPanel();Sim.schedule()},
  maskToggle:()=>{const m=curMask();if(!m)return;Hist.push();m.on=m.on===false;drawPrivacy();renderPanel();Sim.schedule()},
  maskDel:()=>{const ph=curPhoto();Hist.push();ph.privacy=ph.privacy.filter(m=>m.id!==ui.mask);ui.mask=null;drawPrivacy();renderPanel();Sim.schedule()},
  /* citas, visitas, agenda */
  apptNew:async e=>{const p=e.dataset.pid?P(e):null;const a=await apptForm(p,null,S.view==='agenda'?{date:S.cal.date>=today()?S.cal.date:today()}:{});if(a){toast('Cita agendada.');render()}},
  apptOpen:e=>{const p=P(e),a=p&&p.appts.find(x=>x.id===e.dataset.id);if(a)apptOpen(p,a)},
  apptResched:e=>{const p=P(e),a=p.appts.find(x=>x.id===e.dataset.id);if(a)apptResched(p,a)},
  apptSet:e=>{const p=P(e),a=p.appts.find(x=>x.id===e.dataset.id);if(!a)return;a.status=e.dataset.s;a.statusAt=nowISO();savePatient(p);render()},
  apptAttend:e=>{const p=P(e),a=p.appts.find(x=>x.id===e.dataset.id);if(a)apptAttend(p,a)},
  visitRetro:()=>visitRetro(patient()),epPerformed:e=>{const p=patient();epPerformed(p,p.episodes.find(x=>x.id===e.dataset.id))},epControls:e=>{const p=patient();epControls(p,p.episodes.find(x=>x.id===e.dataset.id))},
  logAdd:async()=>{const p=patient();const r=await formBox('Agregar nota al historial',[{k:'date',label:'Fecha',type:'date',value:today(),required:true},{k:'type',label:'Tipo',type:'select',options:['Nota administrativa','Llamada o mensaje','Otro']},{k:'note',label:'Nota (sin datos clínicos sensibles)',type:'textarea',required:true}],'Agregar');if(!r)return;p.log.push({id:uid(),date:r.date,type:r.type,note:r.note,src:'admin'});savePatient(p);renderPatient()},
  calMode:e=>{S.cal.mode=e.dataset.m;renderAgenda()},calLayer:e=>{S.cal.layers[e.dataset.l]=!S.cal.layers[e.dataset.l];renderAgenda()},calDay:e=>{S.cal.date=e.dataset.d;S.cal.mode='dia';renderAgenda()},
  calNav:e=>{const d=+e.dataset.d,c=S.cal;c.date=!d?today():c.mode==='mes'?addMonths(c.date,d):addDays(c.date,d*(c.mode==='semana'?7:c.mode==='lista'?30:1));renderAgenda()},
  blockNew:async()=>{const r=await formBox('Bloqueo administrativo',[{k:'title',label:'Asunto (sin datos clínicos)',value:'No disponible',required:true},{k:'date',label:'Fecha',type:'date',value:S.cal.date,required:true},{k:'time',label:'Hora',type:'time',value:'12:00',required:true},{k:'dur',label:'Duración (minutos)',type:'number',value:60,min:5}],'Crear bloqueo',{validate:x=>!validCivil(x.date)||!validTime(x.time)?'Fecha u hora no válida.':''});if(!r)return;S.blocks.push({id:uid(),title:r.title,date:r.date,time:r.time,dur:clamp(fin(r.dur,60),5,1440)});saveKV('blocks');render()},
  blockDel:e=>{S.blocks=S.blocks.filter(b=>b.id!==e.dataset.id);saveKV('blocks');render()},
  /* documentos */
  docAdd:()=>{ui.docReplace=null;$('#fileDoc').click()},
  docVersion:e=>{ui.docReplace=ui.docs.find(d=>d.id===e.dataset.id);$('#fileDoc').click()},
  docDl:async e=>{const d=ui.docs.find(x=>x.id===e.dataset.id)||await Store.get('docs',e.dataset.id);if(d)saveFile(d.fileName,new Blob([d.data],{type:d.mime}))},
  docView:e=>{const d=ui.docs.find(x=>x.id===e.dataset.id);if(!d||!d.mime.startsWith('image/'))return;const u=URL.createObjectURL(new Blob([d.data],{type:d.mime}));const m=openModal(`<h2 id="mTitle">${esc(d.displayName)}</h2><img src="${u}" alt="${esc(d.displayName)}" style="width:100%;border-radius:10px"><div class="row end"><button class="btn primary" data-close id="dvNo" type="button">Cerrar</button></div>`,{wide:true});m.querySelector('#dvNo').onclick=()=>{URL.revokeObjectURL(u);closeModal()}},
  docRename:async e=>{const d=ui.docs.find(x=>x.id===e.dataset.id);const r=await formBox('Renombrar documento',[{k:'n',label:'Nombre visible',value:d.displayName,required:true}]);if(!r)return;d.displayName=r.n.slice(0,120);await Store.put('docs',d);renderPatient()},
  docToggle:async e=>{const d=ui.docs.find(x=>x.id===e.dataset.id);d.status=d.status==='vigente'?'obsoleto':'vigente';await Store.put('docs',d);renderPatient()},
  docDel:async e=>{const d=ui.docs.find(x=>x.id===e.dataset.id);if(!await confirmBox('Eliminar documento',`Se eliminará «${d.displayName}» de este equipo. Si solo quedó desactualizado, es mejor marcarlo como obsoleto.`,'Eliminar',{danger:true}))return;await Store.del('docs',d.id);renderPatient()},
  /* oportunidades y propuestas */
  oppSel:e=>{ui.oppId=e.dataset.id;renderPatient()},
  oppNew:async()=>{const p=patient();const r=await formBox('Nueva oportunidad',[{k:'int',label:'Procedimientos que desea explorar',placeholder:'Separados por coma'},{k:'stage',label:'Etapa',type:'select',options:STAGES.slice(0,7),value:p.visits.some(v=>v.type==='valoracion')?'val_realizada':'nuevo'},{k:'src',label:'Cómo llegó (según la paciente)',type:'select',options:SOURCES.map(s=>[s,s||'Sin registrar'])}],'Crear',{intro:'Registra el interés de la paciente. No asigna ningún procedimiento como recomendado ni crea citas.'});if(!r)return;
    const o=newOpp({interests:r.int.split(',').map(s=>s.trim()).filter(Boolean),stage:r.stage,source:r.src});o.stageHist.push({at:nowISO(),from:'',to:r.stage,note:'Oportunidad creada'});p.opps.push(o);ui.oppId=o.id;savePatient(p);renderPatient()},
  oppReviewed:()=>{const p=patient(),o=getOpp(ui.oppId);if(o.stage==='revisar'){toast('Elige primero la etapa comercial que corresponde hoy.');$('#op_stage').focus();return}o.review=false;savePatient(p);renderPatient()},
  oppWindow:()=>oppWindow(patient(),getOpp(ui.oppId)),oppWindowDel:()=>{const o=getOpp(ui.oppId);o.window=null;savePatient(patient());renderPatient()},oppSchedule:()=>oppSchedule(patient(),getOpp(ui.oppId)),
  addProc:e=>addProc(e.dataset.id),addProcSel:()=>addProc($('#procSel').value),
  addExtra:()=>{const o=getOpp(ui.oppId);o.plan.push({uid:uid(),extra:true,name:'Concepto adicional',minH:0,maxH:0,price:0,note:''});savePatient(patient());renderPatient()},
  delItem:e=>{const o=getOpp(ui.oppId);o.plan=o.plan.filter(i=>i.uid!==e.dataset.u);savePatient(patient());renderPatient()},
  quotePreview:()=>quoteEmit(patient(),getOpp(ui.oppId),true),quoteEmit:()=>quoteEmit(patient(),getOpp(ui.oppId),false),xls:()=>exportXLS(patient(),getOpp(ui.oppId)),
  quoteDl:async e=>{const q=getOpp(ui.oppId).quotes.find(x=>x.id===e.dataset.id),d=q&&await Store.get('docs',q.pdfDocId);if(!d)return errBox('PDF no disponible en este equipo','La copia emitida no viajó con el caso (los documentos solo se transfieren si se marcan al exportar). Pídela al equipo donde se emitió.');saveFile(d.fileName,new Blob([d.data],{type:d.mime}))},
  quoteDeliver:e=>{const o=getOpp(ui.oppId);quoteDeliver(patient(),o,o.quotes.find(x=>x.id===e.dataset.id))},
  quoteAccept:e=>{const p=patient(),o=getOpp(ui.oppId),q=o.quotes.find(x=>x.id===e.dataset.id);q.state='aceptada';q.acceptedAt=nowISO();if(STAGE_OPEN.includes(o.stage))setStage(p,o,'interes_prog','Propuesta aceptada comercialmente');savePatient(p);renderPatient();toast('Aceptación comercial registrada. No programa la cirugía ni equivale a consentimiento o pago.',6000)},
  quoteReject:e=>{const p=patient(),q=getOpp(ui.oppId).quotes.find(x=>x.id===e.dataset.id);q.state='rechazada';savePatient(p);renderPatient()},
  taskAdd:e=>taskAdd(P(e),e.dataset.opp),taskDone:e=>{const p=P(e),t=p.tasks.find(x=>x.id===e.dataset.id);if(t)taskDone(p,t)},waDraft:e=>waDraft(patient(),getOpp(e.dataset.opp)),
  /* ajustes */
  catAdd:()=>{S.settings.catalog.push({id:uid(),name:'Nuevo procedimiento',area:'Otro',minH:1,maxH:2,price:0});saveSettings();render()},
  catDel:e=>{S.settings.catalog=S.settings.catalog.filter(c=>c.id!==e.dataset.id);saveSettings();render()},
  tplAdd:()=>{const r=ui.tplR||'rostro';(S.settings.captureTpl[r]=S.settings.captureTpl[r]||[]).push({frame:'libre',view:'otra',req:false});saveSettings();render()},
  tplDel:e=>{S.settings.captureTpl[ui.tplR||'rostro'].splice(+e.dataset.i,1);saveSettings();render()},
  tplMove:e=>{const a=S.settings.captureTpl[ui.tplR||'rostro'],i=+e.dataset.i,j=i+(+e.dataset.d);if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];saveSettings();render()},
  tplReset:()=>{const r=ui.tplR||'rostro';S.settings.captureTpl[r]=clone(DEFAULT_CAPTURE_TPL[r]||[]);saveSettings();render()},
  ctlAdd:()=>{S.settings.controls.push({label:'Control',months:1});saveSettings();render()},ctlDel:e=>{S.settings.controls.splice(+e.dataset.i,1);saveSettings();render()}
};
function addProc(id){const p=patient(),o=getOpp(ui.oppId),c=S.settings.catalog.find(x=>x.id===id);if(!o||!c)return;o.plan.push({uid:uid(),procId:c.id,name:c.name,minH:c.minH,maxH:c.maxH,price:c.price||0,note:'',...(c.area==='No quirúrgico'?{ns:true}:{}),...(c.ref?{ref:true}:{})});savePatient(p);renderPatient()}
document.addEventListener('click',e=>{if(e.target.id==='saveChip'){if(Saver.error()||Saver.dirty())Saver.flush();return}const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const f=acts[b.dataset.act];if(f)Promise.resolve().then(()=>f(b)).catch(err=>{console.error(err);toast('Ocurrió un error. No se perdió lo guardado; inténtalo de nuevo.')});});
/* enlace de campos con el modelo: data-m="tipo:clave" */
function modelRef(spec){const[a,b,c]=spec.split(':'),p=patient();
  if(a==='st')return[S.settings,b,saveSettings];if(!p)return null;const sv=()=>savePatient(p);
  if(a==='p')return[p,b,sv];if(a==='pc')return[p.contact,b,sv];if(a==='cs')return[p.consents[b],c,sv];
  if(a==='o'){const o=p.opps.find(x=>x.id===b);return o?[o,c,sv]:null}if(a==='v'){const v=p.visits.find(x=>x.id===b);return v?[v,c,sv]:null}return null}
const RE={pname:()=>{const p=patient();$('#pName').textContent=p.name||'Paciente sin nombre'},brand,totals:()=>{const o=getOpp(ui.oppId);if(o)$('#totals').innerHTML=totalsHTML(o)},propuestas:()=>renderPatient(),
  consent:t=>{const p=patient(),k=t.dataset.m.split(':')[1],c=p.consents[k];if(c.ok){if(!c.date)c.date=today();c.revokedAt=''}else c.revokedAt=today();(c.hist=c.hist||[]).push({at:nowISO(),ok:c.ok});savePatient(p);renderPatient()},
  contact:()=>{const p=patient();p.contact.at=nowISO();p.contact.hist.push({at:p.contact.at,channel:p.contact.channel,allowed:p.contact.allowed});
    if(!canContact(p)){let n=0;for(const t of p.tasks)if(t.status==='pendiente'&&['contacto','enviar_info'].includes(t.kind)){t.status='cancelada';t.doneAt=nowISO();t.doneNote='La paciente retiró el permiso de contacto';n++}if(n)toast(`${n} tarea(s) de contacto se cancelaron. El historial se conserva.`)}savePatient(p);renderPatient()}};
document.addEventListener('input',e=>{const t=e.target;
  if(t.id==='q'){S.q=t.value;$('#plist').innerHTML=listHTML();return}
  if(t.id==='libQ'){ui.libQ=t.value;return}
  if(t.dataset.m&&t.type!=='checkbox'&&t.tagName!=='SELECT'){const r=modelRef(t.dataset.m);if(!r)return;r[0][r[1]]=t.dataset.num?fin(t.value):t.value;r[2]();if(t.dataset.re&&RE[t.dataset.re])RE[t.dataset.re](t);return}
  if(t.dataset.oi){const o=getOpp(ui.oppId);o.interests=t.value.split(',').map(s=>s.trim()).filter(Boolean);savePatient(patient());return}
  if(t.dataset.f){const p=patient(),o=getOpp(ui.oppId),it=o.plan.find(i=>i.uid===t.closest('tr').dataset.u);if(!it)return;it[t.dataset.f]=['minH','maxH','price'].includes(t.dataset.f)?fin(t.value):t.value;if(['minH','maxH'].includes(t.dataset.f)&&it.ref){delete it.ref;$$('.ref',t.closest('tr')).forEach(x=>x.classList.remove('ref'))}savePatient(p);RE.totals();return}
  if(t.dataset.s){const ph=curPhoto(),d=MODULES[ui.mod].sliders.find(x=>x.k===t.dataset.s),v=+t.value;if(!ui.slTx){Hist.push();ui.slTx=true}modState(ph,ui.mod).s[d.k]=v;$('#o_'+d.k).textContent=(v>0&&d.min<0?'+':'')+v;stageEl.querySelector('#anchors').style.opacity=0;simChanged();return}
  if(t.id==='bsize'){ui.size=+t.value;$('#o_bsize').textContent=ui.size;return}
  if(t.id==='bpow'){ui.power=+t.value;$('#o_bpow').textContent=ui.power;return}
  if(t.dataset.mk&&t.tagName!=='SELECT'){const m=curMask();if(!m)return;if(!ui.slTx){Hist.push();ui.slTx=true}const k=t.dataset.mk;m[k]=k==='color'?t.value:k==='opacity'?+t.value/100:+t.value;const o=$('#o_'+t.id);if(o)o.textContent=k==='opacity'?t.value+'%':k==='rot'?t.value+'°':t.value;drawPrivacy();Sim.schedule();return}
  if(t.dataset.cf&&t.tagName!=='SELECT'){const c=S.settings.catalog.find(x=>x.id===t.closest('tr').dataset.c);if(!c)return;c[t.dataset.cf]=['minH','maxH','price'].includes(t.dataset.cf)?fin(t.value):t.value;if(['minH','maxH'].includes(t.dataset.cf)&&c.ref){delete c.ref;$$('.ref',t.closest('tr')).forEach(x=>x.classList.remove('ref'))}saveSettings();return}
  if(t.dataset.ctl&&t.tagName!=='SELECT'){const c=S.settings.controls[+t.closest('[data-ci]').dataset.ci];if(t.dataset.ctl==='label')c.label=t.value;else{const u=c.days?'days':'months';c[u]=Math.max(1,fin(t.value,1))}saveSettings();return}});
document.addEventListener('change',async e=>{const t=e.target;
  if(t.id==='fileCam'||t.id==='fileLib'){const f=[...t.files];t.value='';if(f.length)onImageFiles(f);return}
  if(t.id==='fileCase'){const f=t.files[0];t.value='';if(f)importFlow(f);return}
  if(t.id==='fileDoc'){const f=[...t.files];t.value='';if(f.length)addDocs(ui.docReplace?f.slice(0,1):f,ui.docReplace);ui.docReplace=null;return}
  if(t.dataset.m&&(t.type==='checkbox'||t.tagName==='SELECT')){const r=modelRef(t.dataset.m);if(!r)return;r[0][r[1]]=t.type==='checkbox'?t.checked:(t.value===''&&/Id$/.test(r[1])?null:t.value);r[2]();if(t.dataset.re&&RE[t.dataset.re])RE[t.dataset.re](t);return}
  if(t.dataset.s){ui.slTx=false;stageEl.querySelector('#anchors').style.opacity=1;const ph=curPhoto();$$('.modbtn[data-m]').forEach(b=>b.classList.toggle('on',modActive(ph,b.dataset.m)));return}
  if(t.dataset.mk){const m=curMask();if(m&&t.tagName==='SELECT'){Hist.push();m[t.dataset.mk]=t.value;if(t.value!=='solid')m.opacity=1;drawPrivacy();Sim.schedule()}ui.slTx=false;renderPanel();return}
  if(t.id==='phPdf'){curPhoto().inPdf=t.checked;Sim.schedule();return}
  if(t.id==='nudgeK'){ui.nudgeK=t.value;return}
  if(t.dataset.oppstage)return oppStage(patient(),getOpp(ui.oppId),t.value);
  if(t.dataset.gal){ui.gal[t.dataset.gal]=t.value;renderPatient();return}
  if(t.dataset.sel){t.checked?ui.sel.add(t.dataset.sel):ui.sel.delete(t.dataset.sel);renderPatient();return}
  if(t.dataset.tlf){ui.tlf=t.value;renderPatient();return}
  if(t.dataset.mper){ui.mper=t.value;render();return}
  if(t.dataset.tplr){ui.tplR=t.value;render();return}
  if(t.id==='w_visit'){ui.wiz.visitId=t.value;$('#w_newv').classList.toggle('hide',t.value!=='new');return}
  if(t.dataset.tray){const p=patient(),v=capVisit(),ph=photoBy(t.dataset.tray);if(!ph||!t.value)return;if(t.value==='otra'){await classifyPhoto(ph)}else{const s=v.slots.find(x=>x.id===t.value);if(s){linkSlot(v,s,ph);savePhotoRec(ph);savePatient(p)}}renderCapture();return}
  if(t.dataset.tpl){const a=S.settings.captureTpl[ui.tplR||'rostro'][+t.closest('[data-ti]').dataset.ti];a[t.dataset.tpl]=t.type==='checkbox'?t.checked:t.value;saveSettings();return}
  if(t.dataset.ctl==='unit'){const c=S.settings.controls[+t.closest('[data-ci]').dataset.ci],n=c.days||c.months||1;delete c.days;delete c.months;c[t.value]=n;saveSettings();return}
  if(t.dataset.cf){const c=S.settings.catalog.find(x=>x.id===t.closest('tr').dataset.c);if(c){c[t.dataset.cf]=t.value;saveSettings();render()}return}
  if(t.dataset.doc){const d=ui.docs.find(x=>x.id===t.closest('[data-docid]').dataset.docid);if(!d)return;d[t.dataset.doc]=t.value||(t.dataset.doc==='visitId'?null:'');try{await Store.put('docs',d);Saver.chip()}catch(err){toast('No se pudo guardar el cambio del documento.')}return}});
/* soltar un archivo de caso sobre la ventana (escritorio) */
window.addEventListener('dragover',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files'))e.preventDefault()});
window.addEventListener('drop',e=>{const f=e.dataTransfer&&e.dataTransfer.files[0];if(!f)return;e.preventDefault();if(/\.(yhcase|yhbackup|json)$/i.test(f.name))importFlow(f);else toast('Para importar un caso suelta un archivo .yhcase o .yhbackup. Las fotos se agregan desde «Añadir fotografías».',5000)});

async function seedDemo(){
  const img=demoFace(),p=newPatient({id:'demo',demo:true,name:'Paciente de ejemplo (ficticia)',birth:'1986-04-12',notes:'Ficha de muestra con una ilustración, no una persona real. Puedes eliminarla desde el Resumen.'});const d=today();
  p.consents.data={ok:true,date:d,note:''};p.consents.photo={ok:true,date:d,note:''};
  const v=newVisit({type:'valoracion',date:d,cap:'lista',regions:['nariz']});v.slots=buildPlan(['nariz'],S.settings.captureTpl);p.visits.push(v);
  const ph={id:uid(),schema:SCHEMA,patientId:p.id,visitId:v.id,slotId:null,frame:'cara',view:'frontal',regions:['nariz'],cls:true,label:'',orig:img,w:900,h:1200,after:null,inPdf:true,privacy:[],scenarios:[],scn:null,method:'demo',capturedAt:d,capturedSrc:'manual',capturedExif:'',importedAt:nowISO(),phase:'consulta',episodeId:null,createdAt:Date.now(),
    mods:{rinoFrontal:{a:{raiz:[450,512],punta:[450,668],alaI:[394,670],alaD:[506,670]},s:{dorso:-45,base:-35,punta:-20}},parpados:{a:{ojoI:[350,508],ojoD:[550,508]},s:{sup:45,inf:60}}}};
  const s=v.slots.find(x=>x.frame==='cara'&&x.view==='frontal');if(s){s.photoId=ph.id;s.st='hecha';ph.slotId=s.id}ph.thumb=await safeThumb(ph);p.thumb=ph.thumb;
  const cat=id=>S.settings.catalog.find(c=>c.id===id),o=newOpp({stage:'val_realizada',interests:['Rinoplastia']});o.stageHist.push({at:nowISO(),from:'',to:'val_realizada',note:'Ejemplo'});
  for(const id of['rino','blefaro']){const c=cat(id);if(c)o.plan.push({uid:uid(),procId:c.id,name:c.name,minH:c.minH,maxH:c.maxH,price:0,note:''})}p.opps.push(o);
  await Store.atomic([{op:'put',store:'patients',value:p},{op:'put',store:'photos',value:ph}]);S.patients.push(p)}
async function loadAll(){S.patients=await Store.all('patients');for(const k of['leads','blocks','library','campaigns','posts'])S[k]=(await Store.get('kv',k))||[];for(const p of S.patients)if(!p.treatments)p.treatments=[];S.last=(await Store.get('kv','last'))||null;
  const s=await Store.get('kv','settings');if(s)S.settings={...clone(DEFAULT_SETTINGS),...s,captureTpl:s.captureTpl||clone(DEFAULT_CAPTURE_TPL),controls:s.controls||clone(DEFAULT_CONTROLS)};return!!s}
/* migración: copia previa, cambios aditivos y una sola transacción; no se repite al reiniciar */
async function migrateAll(){const olds=S.patients.filter(p=>(p.schema||0)<SCHEMA);if(!olds.length)return;
  const ops=[{op:'put',store:'kv',value:{at:nowISO(),from:'v2',patients:clone(olds)},key:'preMigration-v3'}];olds.forEach(p=>{migratePatient(p);ops.push({op:'put',store:'patients',value:p})});
  const ids=new Set(olds.map(p=>p.id));for(const ph of await Store.all('photos'))if(ids.has(ph.patientId)&&migratePhoto(ph))ops.push({op:'put',store:'photos',value:ph});
  await Store.atomic(ops)}
(async()=>{
  await Store.open();let had=false;
  try{had=await loadAll();
    if(had){if((S.settings.catalogV||1)<2){const have=new Set(S.settings.catalog.map(c=>c.id));for(const c of DEFAULT_CATALOG)if(!have.has(c.id))S.settings.catalog.push(clone(c));S.settings.catalogV=2}
      if((S.settings.schema||0)<SCHEMA){if(S.settings.tool==='Simulador de resultados')S.settings.tool='Simulador SKIND';S.settings.schema=SCHEMA;await Store.put('kv',S.settings,'settings')}}
    await migrateAll();
    if(!had){await Store.put('kv',S.settings,'settings');if(!S.patients.length)await seedDemo()}}
  catch(e){console.error('arranque',e&&e.name);toast('No se pudieron leer los datos guardados. No se modificó nada; recarga la página.',8000)}
  if(typeof extInit==='function')await extInit();
  brand();render();getDL();if(S.patients.some(p=>!p.demo))Store.persist();
  window.__ready=true;
})();
