/* ============ modelo de dominio: una paciente, un expediente, varias visitas y decisiones ============ */
const REGIONS=[['rostro','Rostro general'],['nariz','Nariz'],['parpados','Párpados y cejas'],['orejas','Orejas'],['cuello','Cuello y mentón'],['mamas','Mamas'],['abdomen','Abdomen y cintura'],['gluteos','Glúteos'],['brazos','Brazos'],['muslos','Muslos'],['otra','Otra']];
const REGION=Object.fromEntries(REGIONS);
const VIEWS={frontal:'Frontal',obl_der:'Oblicua derecha',obl_izq:'Oblicua izquierda',lat_der:'Lateral derecha',lat_izq:'Lateral izquierda',posterior:'Posterior',obl_post_der:'Oblicua posterior derecha',obl_post_izq:'Oblicua posterior izquierda',basal:'Basal',detalle:'Acercamiento',lateral:'Lateral (lado sin confirmar)',oblicua:'Oblicua (lado sin confirmar)',otra:'Otra'};
const VIEW_ORDER=Object.keys(VIEWS);
const FRAMES={cara:'Cara y cuello',nariz:'Nariz, acercamiento',ojos:'Ojos, acercamiento',torso_sup:'Tórax',torso:'Tronco',cadera:'Cadera y glúteos',brazos:'Brazos',piernas:'Piernas',libre:'Encuadre libre'};
const FRAME_ORDER=Object.keys(FRAMES);
const FRAME_FIELD={cara:'Desde el vértice de la cabeza hasta la base del cuello.',nariz:'Nariz completa, desde las cejas hasta el labio superior.',ojos:'Ambos ojos y cejas, de sien a sien.',torso_sup:'Desde las clavículas hasta el ombligo, brazos a los lados.',torso:'Desde debajo del pecho hasta la mitad del muslo.',cadera:'Desde la cintura hasta la mitad del muslo.',brazos:'Brazos separados del cuerpo, del hombro al codo o completos.',piernas:'Desde la cadera hasta los tobillos.',libre:'Encuadre definido por la profesional.'};
const VIEW_GUIDE={frontal:'Paciente de frente a la cámara, postura natural y mirada al frente.',obl_der:'Girar unos 45° de modo que se vea el lado derecho de la paciente.',obl_izq:'Girar unos 45° de modo que se vea el lado izquierdo de la paciente.',lat_der:'Perfil completo mostrando el lado derecho de la paciente.',lat_izq:'Perfil completo mostrando el lado izquierdo de la paciente.',posterior:'Paciente de espaldas a la cámara.',obl_post_der:'De espaldas, girar unos 45° mostrando el lado derecho.',obl_post_izq:'De espaldas, girar unos 45° mostrando el lado izquierdo.',basal:'Cabeza inclinada hacia atrás; cámara desde abajo mostrando la base de la nariz.',detalle:'Acercamiento a la zona de interés, con la cámara paralela a la piel.',lateral:'Perfil completo.',oblicua:'Giro de unos 45°.',otra:'Vista definida por la profesional.'};
const PREP='Fondo liso y sin objetos, luz uniforme sin sombras duras, cámara a la altura de la zona y siempre a la misma distancia. Cabello recogido y sin accesorios que tapen la zona.';
const T=(frame,view,req=true)=>({frame,view,req});
const five=(f)=>['frontal','obl_der','obl_izq','lat_der','lat_izq'].map(v=>T(f,v));
/* Plantillas iniciales editables. Son una ayuda de captura sujeta a validación de la profesional, no un protocolo universal. */
const DEFAULT_CAPTURE_TPL={rostro:five('cara'),nariz:[...five('cara'),T('nariz','basal',false)],parpados:[T('cara','frontal'),T('cara','obl_der'),T('cara','obl_izq'),T('ojos','detalle',false)],
  orejas:[T('cara','frontal'),T('cara','lat_der'),T('cara','lat_izq'),T('cara','posterior',false)],cuello:[T('cara','frontal'),T('cara','lat_der'),T('cara','lat_izq'),T('cara','obl_der',false),T('cara','obl_izq',false)],
  mamas:five('torso_sup'),abdomen:[...five('torso'),T('torso','posterior',false)],gluteos:['posterior','obl_post_der','obl_post_izq','lat_der','lat_izq'].map(v=>T('cadera',v)),
  brazos:[T('brazos','frontal'),T('brazos','posterior')],muslos:[T('piernas','frontal'),T('piernas','posterior'),T('piernas','lat_der',false),T('piernas','lat_izq',false)],otra:[T('libre','otra',false)]};
/* módulos de simulación sugeridos según encuadre y vista (divulgación progresiva) */
const MOD_FOR={cara:{frontal:['rinoFrontal','parpados','lifting','facial','labios','otoplastia'],lat:['rinoPerfil','perfilFacial'],obl:['lifting','facial']},nariz:{'*':['rinoFrontal']},ojos:{'*':['parpados']},
  torso_sup:{'*':['mamas']},torso:{frontal:['contorno'],lat:['perfil'],obl:['contorno']},cadera:{posterior:['gluteos'],lat:['perfil'],obl:['gluteos']},brazos:{'*':['brazoI','brazoD']},piernas:{'*':['muslos']}};
function suggestedMods(ph){const f=MOD_FOR[ph.frame];if(!f)return[];const v=ph.view||'';const k=v==='frontal'||v==='posterior'?v:/^lat/.test(v)?'lat':/^obl/.test(v)?'obl':'';return(f[k]||f['*']||[]).filter(m=>MODULES[m])}
const LEGACY_LABEL={'Rostro de frente':['cara','frontal'],'Rostro de perfil':['cara','lateral'],'Rostro tres cuartos':['cara','oblicua'],'Mamas de frente':['torso_sup','frontal'],'Mamas de perfil':['torso_sup','lateral'],'Cuerpo de frente':['torso','frontal'],'Cuerpo de perfil':['torso','lateral'],'Espalda y glúteos':['cadera','posterior'],'Brazos':['brazos','otra'],'Piernas':['piernas','otra'],'Otra':['libre','otra']};
const PHASES=[['consulta','Consulta'],['preoperatoria','Preoperatoria'],['posoperatoria','Posoperatoria real'],['otra','Otra']];
const PHASE=Object.fromEntries(PHASES);
const CAP=[['pendiente','Pendiente de captura'],['en_captura','En captura'],['lista','Lista para valoración'],['en_valoracion','En valoración'],['propuesta','Propuesta preparada'],['seguimiento','Seguimiento']];
const CAPL=Object.fromEntries(CAP);
const VISIT_TYPES=[['valoracion','Valoración'],['control','Control'],['fotos','Sesión de fotos'],['procedimiento','Procedimiento'],['otra','Otra atención']];
const VISIT_TYPE=Object.fromEntries(VISIT_TYPES);
const APPT_TYPES=[['valoracion','Valoración'],['fotos','Captura de fotos'],['preop','Preoperatorio'],['procedimiento','Procedimiento'],['control','Control'],['seguimiento','Seguimiento administrativo']];
const APPT_TYPE=Object.fromEntries(APPT_TYPES);
const APPT_ST=[['tentative','Tentativa'],['scheduled','Programada'],['confirmed','Confirmada'],['checked_in','Llegó'],['completed','Finalizada'],['cancelled','Cancelada'],['no_show','No asistió']];
const APPT_STL=Object.fromEntries(APPT_ST);
const APPT_OPEN=['tentative','scheduled','confirmed','checked_in'];
const STAGES=[['nuevo','Nuevo interés'],['val_agendada','Valoración agendada'],['val_realizada','Valoración realizada'],['prop_prep','Propuesta en preparación'],['prop_entregada','Propuesta entregada'],['consideracion','En consideración'],['interes_prog','Interés en programar'],['programada','Cirugía programada'],['realizada','Cerrada · realizada'],['pospuesta','Pospuesta / no continúa'],['no_indicada','No indicada clínicamente'],['revisar','Dato heredado por revisar']];
const STAGE=Object.fromEntries(STAGES);
const STAGE_OPEN=['nuevo','val_agendada','val_realizada','prop_prep','prop_entregada','consideracion','interes_prog','revisar'];
const STAGE_CLS={programada:'s-prog',realizada:'s-real',pospuesta:'s-desc',no_indicada:'s-desc',revisar:'s-rev'};
const QSTATES=[['borrador','Borrador'],['emitida','Emitida'],['entregada','Entregada'],['aceptada','Aceptada comercialmente'],['rechazada','Rechazada'],['caducada','Caducada'],['sustituida','Sustituida']];
const QSTATE=Object.fromEntries(QSTATES);
const NEXT_STEPS=[['','Sin definir'],['enviar_info','Enviar información'],['entregar_propuesta','Entregar propuesta'],['resolver_dudas','Resolver dudas'],['segunda_consulta','Segunda consulta'],['paciente_contacta','La paciente se comunicará cuando lo desee'],['no_contactar','No contactar']];
const NEXT_STEP=Object.fromEntries(NEXT_STEPS);
const NO_FOLLOW=['paciente_contacta','no_contactar'];
const SOURCES=['','Recomendación','Instagram','Web','Publicidad','WhatsApp','Otra','Desconocida'];
const CHANNELS=[['','Sin preferencia registrada'],['llamada','Llamada'],['whatsapp','WhatsApp'],['correo','Correo'],['ninguno','Ninguno']];
const TASK_KINDS=[['contacto','Contactar'],['enviar_info','Enviar información'],['propuesta','Revisar o entregar propuesta'],['agendar','Agendar cita'],['otro','Otra tarea']];
const TASK_KIND=Object.fromEntries(TASK_KINDS);
const DOC_CATS=['Autorización de fotografía','Consentimiento quirúrgico','Valoración','Estudios y exámenes','Indicaciones preoperatorias','Indicaciones posoperatorias','Propuestas','Recibos y comprobantes','Correspondencia','Otros'];
const DEFAULT_CONTROLS=[{label:'Control a 7 días',days:7},{label:'Control a 1 mes',months:1},{label:'Control a 3 meses',months:3},{label:'Control a 6 meses',months:6},{label:'Control a 12 meses',months:12}];
const CONSENTS=[['data','Tratamiento de datos personales y sensibles'],['photo','Toma y archivo de fotografías clínicas'],['consult','Uso educativo de sus imágenes dentro de la consulta'],['public','Difusión pública (redes, web, impresos)']];

Object.assign(DEFAULT_SETTINGS,{tool:'Simulador SKIND',tz:'America/Bogota',schema:SCHEMA,captureTpl:DEFAULT_CAPTURE_TPL,controls:DEFAULT_CONTROLS,maxDocMB:15,apptDur:30,
  legal:'Las imágenes de simulación son ilustrativas y se generan por software a partir de una fotografía; el resultado real puede variar. No constituyen una predicción clínica, una promesa ni una garantía del resultado, que depende de la anatomía, la cicatrización y la evolución de cada paciente. Esta propuesta no es un consentimiento quirúrgico. Los valores y tiempos son estimados y pueden ajustarse tras la valoración médica.'});

/* ---- fábricas ---- */
const emptyConsents=()=>Object.fromEntries(CONSENTS.map(([k])=>[k,{ok:false,date:'',note:''}]));
function newPatient(o={}){const t=Date.now();return{id:uid(),schema:SCHEMA,name:'',doc:'',birth:'',phone:'',email:'',notes:'',clinicalNotes:'',consents:emptyConsents(),contact:{channel:'',allowed:'sin_registro',at:'',hist:[]},
  visits:[],appts:[],episodes:[],opps:[],tasks:[],log:[],createdAt:t,updatedAt:t,...o}}
function newVisit(o={}){return{id:uid(),type:'valoracion',date:today(),dateSrc:'registro',phase:'consulta',cap:'pendiente',regions:[],slots:[],notes:'',apptId:null,episodeId:null,createdAt:nowISO(),...o}}
function newAppt(o={}){return{id:uid(),type:'valoracion',date:today(),time:'09:00',dur:S.settings.apptDur||30,tz:S.settings.tz||'America/Bogota',mode:'presencial',prof:S.settings.doctor||'',place:'',status:'scheduled',note:'',hist:[],visitId:null,episodeId:null,oppId:null,seq:0,icsAt:null,createdAt:nowISO(),...o}}
function newOpp(o={}){return{id:uid(),title:'',interests:[],stage:'val_realizada',stageHist:[],source:'',openedAt:today(),closedAt:'',window:null,tentative:'',reviewAt:'',question:'',motivation:'',nextStep:'',plan:[],discount:0,planNotes:'',quotes:[],episodeId:null,apptId:null,notes:'',closeReason:'',...o}}
function newTask(o={}){return{id:uid(),oppId:null,kind:'contacto',due:'',status:'pendiente',note:'',channel:'',owner:'',createdAt:nowISO(),doneAt:'',doneNote:'',...o}}
function setStage(p,o,st,note=''){if(o.stage===st)return;o.stageHist.push({at:nowISO(),from:o.stage,to:st,note});o.stage=st;if(!STAGE_OPEN.includes(st))o.closedAt=today();else o.closedAt='';
  if(NO_FOLLOW.includes(o.nextStep)||!STAGE_OPEN.includes(st)){/* al cerrar o pedir no seguimiento, las tareas pendientes de esa oportunidad se cancelan */for(const t of p.tasks)if(t.oppId===o.id&&t.status==='pendiente'&&!STAGE_OPEN.includes(st)){t.status='cancelada';t.doneAt=nowISO();t.doneNote='Oportunidad cerrada'}}}
const oppName=o=>o.title||o.interests.join(' + ')||(o.plan||[]).filter(i=>!i.extra).map(i=>i.name).join(' + ')||'Oportunidad sin título';
function planTotals(o){let lo=0,hi=0,sub=0,nq=0,ref=false;for(const it of o.plan||[]){if(!it.extra&&!it.ns){lo+=fin(it.minH);hi+=fin(it.maxH);nq++;if(it.ref)ref=true}sub+=fin(it.price)}const disc=sub*(clamp(fin(o.discount),0,100)/100);return{lo,hi,sub,disc,total:sub-disc,nq,ref,n:(o.plan||[]).filter(i=>!i.extra).length}}

/* ---- ventana deseada: conserva la granularidad declarada, nunca inventa día ni hora ---- */
function windowLabel(w){if(!w)return'';const mm=MESES[(w.m||1)-1];
  if(w.kind==='mes')return`${mm} de ${w.y}`;if(w.kind==='quincena')return`${w.half===2?'segunda':'primera'} quincena de ${mm} de ${w.y}`;
  if(w.kind==='rango')return`entre ${fmtDate(w.from)} y ${fmtDate(w.to)}`;if(w.kind==='fecha')return fmtDate(w.date);return w.text||''}
function windowRange(w){if(!w)return null;if(w.kind==='mes'||w.kind==='quincena'){const last=new Date(w.y,w.m,0).getDate(),a=w.kind==='quincena'&&w.half===2?16:1,b=w.kind==='quincena'&&w.half!==2?15:last;return[`${w.y}-${p2(w.m)}-${p2(a)}`,`${w.y}-${p2(w.m)}-${p2(b)}`]}
  if(w.kind==='rango')return[w.from,w.to];if(w.kind==='fecha')return[w.date,w.date];return null}

/* ---- fotografías ---- */
const photoClass=ph=>ph.phase==='posoperatoria'?'postoperative_actual':'clinical_original';
const CLASS_LABEL={clinical_original:'Original',postoperative_actual:'Resultado posoperatorio real',simulation:'Simulación ilustrativa',comparison:'Comparación'};
function photoLabel(ph){if(ph.frame&&FRAMES[ph.frame])return`${FRAMES[ph.frame]} · ${VIEWS[ph.view]||'Vista sin definir'}`;return ph.label||'Sin clasificar'}
const photoDate=ph=>ph.capturedAt?String(ph.capturedAt).slice(0,10):'';
const photoDateLabel=ph=>ph.capturedAt?fmtDate(ph.capturedAt)+(ph.capturedSrc==='exif'?' (según archivo)':''):'Sin fecha de toma confirmada';
const hasSim=ph=>!!ph.after;
function buildPlan(regions,tpl){const map=new Map();for(const r of regions)for(const t of(tpl[r]||[])){const k=t.frame+':'+t.view,e=map.get(k);if(e){e.req=e.req||t.req;if(!e.regions.includes(r))e.regions.push(r)}else map.set(k,{id:uid(),frame:t.frame,view:t.view,req:!!t.req,regions:[r],st:'pendiente',photoId:null,skip:''})}
  return[...map.values()].sort((a,b)=>FRAME_ORDER.indexOf(a.frame)-FRAME_ORDER.indexOf(b.frame)||VIEW_ORDER.indexOf(a.view)-VIEW_ORDER.indexOf(b.view))}
function mergePlan(v,regions,tpl){const have=new Map(v.slots.map(s=>[s.frame+':'+s.view,s]));for(const s of buildPlan(regions,tpl)){const e=have.get(s.frame+':'+s.view);if(e){e.req=e.req||s.req;for(const r of s.regions)if(!e.regions.includes(r))e.regions.push(r)}else v.slots.push(s)}
  v.regions=[...new Set([...v.regions,...regions])];v.slots.sort((a,b)=>FRAME_ORDER.indexOf(a.frame)-FRAME_ORDER.indexOf(b.frame)||VIEW_ORDER.indexOf(a.view)-VIEW_ORDER.indexOf(b.view))}
const slotName=s=>`${FRAMES[s.frame]||s.frame} · ${VIEWS[s.view]||s.view}`;
function capProgress(v){const req=v.slots.filter(s=>s.req),done=v.slots.filter(s=>s.st==='hecha').length;return{total:v.slots.length,done,reqTotal:req.length,reqDone:req.filter(s=>s.st==='hecha').length,skipped:v.slots.filter(s=>s.st==='omitida').length,missing:req.filter(s=>s.st==='pendiente')}}

/* ---- migración no destructiva desde el esquema anterior (v2 del simulador) ---- */
function migratePatient(p){
  if((p.schema||0)>=SCHEMA)return false;
  const base=newPatient();for(const k of['consents','contact','visits','appts','episodes','opps','tasks','log','clinicalNotes'])if(p[k]===undefined)p[k]=base[k];
  /* se preserva el valor antiguo tal cual; nada se convierte en hecho clínico ni en venta */
  p.legacy={status:p.status||'',date:p.date||'',nextDate:p.nextDate||'',nextNote:p.nextNote||'',migratedAt:nowISO()};
  for(const j of p.journey||[])p.log.push({id:j.id||uid(),date:validCivil(j.date)?j.date:'',type:j.type||'Nota',note:j.note||'',src:'legado'});
  const hasPlan=(p.plan||[]).length>0;
  if(hasPlan||(p.status&&p.status!=='Valoración')||p.date){
    const o=newOpp({stage:'revisar',legacyStatus:p.status||'',openedAt:civil(new Date(p.createdAt||Date.now())),plan:p.plan||[],discount:fin(p.discount),planNotes:p.planNotes||'',review:true});
    if(validCivil(p.date))o.tentative=p.date; /* fecha estimada heredada: se conserva como tentativa, nunca como cirugía confirmada ni realizada */
    p.opps.push(o)}
  if(validCivil(p.nextDate)||p.nextNote)p.tasks.push(newTask({oppId:p.opps[0]?p.opps[0].id:null,kind:'contacto',due:validCivil(p.nextDate)?p.nextDate:'',note:p.nextNote||'',review:true}));
  p.schema=SCHEMA;return true}
function migratePhoto(ph){
  if(ph.schema>=SCHEMA)return false;
  const m=LEGACY_LABEL[ph.label];
  if(ph.frame===undefined){ph.frame=m?m[0]:null;ph.view=m?m[1]:null;ph.cls=false /* propuesta derivada de la etiqueta antigua: requiere confirmación */}
  if(ph.regions===undefined)ph.regions=[];if(ph.visitId===undefined)ph.visitId=null;if(ph.slotId===undefined)ph.slotId=null;
  if(ph.capturedAt===undefined){ph.capturedAt='';ph.capturedSrc='unknown'} /* createdAt era la fecha técnica de carga, no la de toma */
  if(ph.importedAt===undefined)ph.importedAt=nowISO(new Date(ph.createdAt||Date.now()));
  if(ph.method===undefined)ph.method='legacy';if(ph.phase===undefined)ph.phase='';
  if(ph.privacy===undefined)ph.privacy=[];if(ph.scenarios===undefined)ph.scenarios=[];if(ph.scn===undefined)ph.scn=null;
  ph.schema=SCHEMA;return true}
const legacyReview=p=>(p.opps||[]).some(o=>o.review)||(p.tasks||[]).some(t=>t.review);

/* ---- proyecciones: una sola fuente de fechas para calendario, ficha y PDF ---- */
function apptLayer(a){return a.type==='procedimiento'?'cirugia':a.type==='control'?'control':a.type==='seguimiento'?'seguimiento':'cita'}
const LAYERS=[['cita','Citas'],['cirugia','Cirugías programadas'],['control','Controles'],['seguimiento','Seguimientos'],['tentativo','Hitos tentativos']];
function agendaItems(){const out=[];
  for(const p of S.patients){
    for(const a of p.appts||[])out.push({kind:'appt',layer:apptLayer(a),date:a.date,time:a.time,dur:a.dur,status:a.status,title:APPT_TYPE[a.type]||'Cita',who:p.name||'Sin nombre',pid:p.id,id:a.id,ref:a,tent:a.status==='tentative',closed:!APPT_OPEN.includes(a.status)});
    for(const t of p.tasks||[])if(t.status==='pendiente'&&t.due)out.push({kind:'task',layer:'seguimiento',date:t.due,time:'',title:TASK_KIND[t.kind]||'Tarea',who:p.name||'Sin nombre',pid:p.id,id:t.id,ref:t});
    for(const o of p.opps||[]){if(!STAGE_OPEN.includes(o.stage)&&o.stage!=='programada')continue;if(o.apptId)continue;
      if(o.tentative)out.push({kind:'tent',layer:'tentativo',date:o.tentative,time:'',title:'Fecha tentativa (sin reserva)',who:p.name||'Sin nombre',pid:p.id,id:o.id,ref:o,tent:true});
      else{const r=windowRange(o.window);if(r)out.push({kind:'window',layer:'tentativo',date:r[0],to:r[1],time:'',title:'Ventana deseada (sin reserva): '+windowLabel(o.window),who:p.name||'Sin nombre',pid:p.id,id:o.id,ref:o,tent:true})}}}
  for(const b of S.blocks||[])out.push({kind:'block',layer:'cita',date:b.date,time:b.time,dur:b.dur,status:'scheduled',title:b.title||'Bloqueo administrativo',who:'',pid:null,id:b.id,ref:b});
  return out.sort((a,b)=>(a.date+(a.time||'00:00')).localeCompare(b.date+(b.time||'00:00')))}
function overlaps(a,pid){if(!a.time||!APPT_OPEN.includes(a.status))return[];const s=m=>{const[h,mi]=m.split(':').map(Number);return h*60+mi},a0=s(a.time),a1=a0+fin(a.dur,30);
  return agendaItems().filter(x=>(x.kind==='appt'||x.kind==='block')&&x.id!==a.id&&x.date===a.date&&x.time&&!x.closed&&!x.tent&&(x.kind==='block'||(x.ref.prof||'')===(a.prof||''))&&s(x.time)<a1&&s(x.time)+fin(x.dur,30)>a0)}
function nextAppt(p){return(p.appts||[]).filter(a=>APPT_OPEN.includes(a.status)&&a.date>=today()).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]||null}
const lastVisit=p=>(p.visits||[]).slice().sort((a,b)=>b.date.localeCompare(a.date))[0]||null;
const openVisit=p=>(p.visits||[]).filter(v=>['pendiente','en_captura'].includes(v.cap)&&v.slots.length).sort((a,b)=>b.date.localeCompare(a.date))[0]||null;
const canContact=p=>p.contact.allowed!=='no'&&p.contact.channel!=='ninguno';
/* próxima acción acordada: lo real primero, sin convertir «sin contacto solicitado» en alarma */
function nextAction(p){const cv=openVisit(p);if(cv){const g=capProgress(cv);return{txt:`Completar fotografías: ${g.done} de ${g.total} vistas`,act:'resumeCapture',arg:cv.id,cls:'warn',btn:'Continuar captura'}}
  const a=nextAppt(p);const t=(p.tasks||[]).filter(t=>t.status==='pendiente').sort((x,y)=>(x.due||'9999').localeCompare(y.due||'9999'))[0];
  if(a&&(!t||!t.due||a.date<=t.due))return{txt:`${APPT_TYPE[a.type]} ${APPT_STL[a.status].toLowerCase()}: ${fmtDate(a.date)} ${a.time}`,act:'ptab',arg:'visitas',cls:a.date===today()?'warn':'',btn:'Ver agenda de la paciente'};
  if(t)return{txt:`${TASK_KIND[t.kind]}${t.due?': '+fmtDate(t.due):' (sin fecha)'}${t.note?' · '+t.note:''}`,act:'ptab',arg:'propuestas',cls:t.due&&t.due<today()?'crit':t.due===today()?'warn':'',btn:'Ver seguimiento'};
  const lv=(p.visits||[]).find(v=>v.cap==='lista');if(lv)return{txt:'Fotografías listas para valoración',act:'ptab',arg:'fotos',cls:'ok',btn:'Continuar valoración'};
  if((p.opps||[]).some(o=>NO_FOLLOW.includes(o.nextStep)))return{txt:'Sin seguimiento solicitado por la paciente',act:null,cls:''};
  return{txt:'Sin próxima acción',act:null,cls:''}}
function timeline(p,photos=[],docs=[]){const ev=[];const add=(date,cls,title,note='',planned=false)=>{if(date)ev.push({date:String(date).slice(0,10),cls,title,note,planned})};
  for(const v of p.visits||[])add(v.date,'clinico',`${VISIT_TYPE[v.type]||'Atención'} realizada`,[v.dateSrc==='retro'?'Registrada retrospectivamente':'',v.notes].filter(Boolean).join(' · '));
  for(const a of p.appts||[]){const future=APPT_OPEN.includes(a.status);add(a.date,'agenda',`Cita de ${(APPT_TYPE[a.type]||'').toLowerCase()} · ${APPT_STL[a.status]}`,`${a.time} · ${a.mode}`,future&&a.date>=today());
    for(const h of a.hist||[])add(h.at,'agenda','Cita reprogramada',`De ${fmtDate(h.fromDate)} ${h.fromTime} a ${fmtDate(h.toDate)} ${h.toTime}${h.reason?' · '+h.reason:''}`)}
  for(const e of p.episodes||[]){if(e.performedAt)add(e.performedAt,'clinico','Procedimiento realizado: '+e.name,e.notes||'');}
  for(const o of p.opps||[]){for(const h of o.stageHist||[])add(h.at,'comercial',`Oportunidad «${oppName(o)}»: ${STAGE[h.to]||h.to}`,h.note||'');
    for(const q of o.quotes||[]){add(q.issuedAt,'comercial',`Propuesta versión ${q.version} emitida`);add(q.deliveredAt,'comercial',`Propuesta versión ${q.version} marcada como entregada`,q.deliveredVia||'')}}
  for(const t of p.tasks||[])if(t.status==='realizada')add(t.doneAt,'comercial','Seguimiento realizado: '+(TASK_KIND[t.kind]||''),t.doneNote||t.note||'');
  const byDay={};for(const ph of photos){const d=photoDate(ph);if(d)byDay[d+'|'+(ph.phase==='posoperatoria'?'pos':'pre')]=(byDay[d+'|'+(ph.phase==='posoperatoria'?'pos':'pre')]||0)+1}
  for(const k in byDay){const[d,t]=k.split('|');add(d,'clinico',`${byDay[k]} fotografía(s) ${t==='pos'?'posoperatorias reales':'tomadas'}`)}
  for(const d of docs)add(d.documentDate||d.uploadedAt,'admin','Documento: '+d.displayName,d.category);
  for(const j of p.log||[])add(j.date,j.src==='legado'?'legado':'admin',j.type,j.note);
  return ev.sort((a,b)=>b.date.localeCompare(a.date))}
const TL_CLS={clinico:'Hecho clínico',agenda:'Agenda',comercial:'Comercial',admin:'Administrativo',legado:'Registro anterior'};
