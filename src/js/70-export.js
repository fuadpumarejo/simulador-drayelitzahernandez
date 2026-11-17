/* ============ exportaciones: descargas, ZIP, PDF, Excel, .ics y paquetes cifrados ============ */
async function getDL(){if(DL)return DL;try{if(window.claude&&window.claude.use)DL=await window.claude.use('downloads')}catch(e){}return DL}
async function saveFile(name,blob){
  if(!DL&&window.claude&&window.claude.use){toast('Preparando el archivo…',9000);await getDL()}
  if(DL){try{await DL.save({filename:name,data:blob});toast('Archivo listo: '+name);return true}catch(e){toast(e&&e.code==='declined'?'Descarga cancelada.':'No se pudo guardar el archivo'+(e&&e.code?' ('+e.code+')':'')+'.');return false}}
  let top=false;try{top=window.top===window.self}catch(e){}
  if(!top){toast('La descarga no está disponible en esta vista. Abre la herramienta en su propia pestaña e inténtalo de nuevo.',5000);return false}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),8000);toast('Archivo generado: '+name);return true}
const errBox=(title,msg)=>confirmBox(title,msg,'Entendido',{cancel:'Cerrar'});

/* ---- descarga individual: tres destinos con reglas distintas ---- */
async function downloadPhotoFlow(ph){const p=patient();await Sim.leave();const nm=Privacy.active(ph).length;
  const r=await formBox('Descargar imagen',[{k:'kind',label:'Qué descargar',type:'select',options:[['original',ph.phase==='posoperatoria'?'Fotografía posoperatoria real':'Fotografía original'],...(ph.after?[['sim','Simulación ilustrativa'],['compare','Comparación antes / simulación']]:[])],value:ph.after?'compare':'original'},
    {k:'dest',label:'Destino',type:'select',options:[['paciente','Entregar a la paciente (censura aplanada, sin metadatos)'],['interno','Uso interno de la clínica (sin censura)']],value:'paciente'},
    {k:'i',type:'info',label:`Es una imagen aplanada (JPG): no conserva puntos ni deslizadores. Para seguir editando en otro equipo usa «Exportar caso editable».${nm?` Esta foto tiene ${nm} zona(s) censurada(s)${Privacy.opaque(ph)?'':'; alguna usa pixelado, difuminado u opacidad parcial, que no garantizan ocultar'}.`:''} Para publicar en redes se requiere además la autorización de difusión pública.`}],'Descargar');
  if(!r)return;const interno=r.dest==='interno';
  if(interno&&!await confirmBox('Imagen clínica sin censura','Vas a descargar una imagen identificable y sin censura. Guárdala solo en un lugar seguro de la clínica; no es apta para compartir ni publicar.','Descargar sin censura',{danger:true}))return;
  try{const c=await renderPhoto(ph,r.kind,{censor:!interno,label:true});await saveFile(exportName(p,ph,{original:ph.phase==='posoperatoria'?'posoperatorio-real':'original',sim:'simulacion-ilustrativa',compare:'comparacion'}[r.kind]+(interno?'_interno':nm?'_censurada':'')),await canvasBlob(c))}catch(e){toast(e.message||'No se pudo generar la imagen.')}}
async function zipPhotosFlow(p,photos,title){await Sim.leave();if(!photos.length){toast('No hay fotografías para descargar.');return}
  const r=await formBox(title,[{k:'orig',label:'Fotografías originales',type:'check',value:true},{k:'sim',label:'Simulaciones ilustrativas',type:'check',value:true},{k:'cmp',label:'Comparaciones antes / simulación',type:'check',value:false},
    {k:'dest',label:'Destino',type:'select',options:[['paciente','Entregar o compartir (censura aplanada, sin metadatos)'],['interno','Archivo interno de la clínica (sin censura)']],value:'paciente'}],'Generar ZIP',{intro:`${photos.length} fotografía(s). Los nombres de archivo no incluyen el nombre ni el documento de la paciente.`});
  if(!r)return;const interno=r.dest==='interno';
  if(interno&&!await confirmBox('ZIP con originales sin censura','El archivo tendrá imágenes clínicas identificables. Es un archivo administrativo de la clínica: no está listo para compartir ni publicar.','Generar sin censura',{danger:true}))return;
  const pg=progressBox('Generando ZIP'),files={},man=[],used=new Set();let i=0;
  try{for(const ph of photos){await pg.set(++i/photos.length*90,`Imagen ${i} de ${photos.length}`);const v=p.visits.find(x=>x.id===ph.visitId);
      const add=async(kind,tag)=>{const c=await renderPhoto(ph,kind,{censor:!interno,label:true});let n=exportName(p,ph,tag),k=2;while(used.has(n))n=exportName(p,ph,tag+'-'+k++);used.add(n);files[n]=[new Uint8Array(await(await canvasBlob(c)).arrayBuffer()),{level:0}];
        man.push({archivo:n,tipo:{original:CLASS_LABEL[photoClass(ph)],sim:CLASS_LABEL.simulation,compare:CLASS_LABEL.comparison}[kind],vista:photoLabel(ph),fechaDeToma:photoDate(ph)||'sin confirmar',visita:v?v.date:'',censuraAplicada:!interno&&Privacy.active(ph).length>0})};
      if(r.orig)await add('original',ph.phase==='posoperatoria'?'posoperatorio-real':'original');if(ph.after&&r.sim)await add('sim','simulacion-ilustrativa');if(ph.after&&r.cmp)await add('compare','comparacion')}
    if(!man.length){pg.close();toast('Con esas opciones no hay imágenes que incluir.');return}
    files['manifiesto.json']=[enc.encode(JSON.stringify({caso:caseCode(p),generado:nowISO(),destino:interno?'archivo interno (sin censura)':'entrega (censura aplanada)',listoParaPublicar:false,nota:'Imágenes aplanadas: no conservan puntos ni deslizadores. Las simulaciones son ilustrativas; no representan un resultado garantizado.',archivos:man},null,1)),{level:6}];
    await pg.set(96,'Comprimiendo…');const blob=new Blob([fflate.zipSync(files)],{type:'application/zip'});pg.close();await saveFile(`${caseCode(p)}_${today()}_fotos${interno?'_interno':''}.zip`,blob)}
  catch(e){pg.close();console.error(e);errBox('No se pudo generar el ZIP',isQuota(e)||/memory|allocation/i.test(e.message||'')?'El dispositivo se quedó sin memoria. Selecciona menos fotografías e inténtalo de nuevo.':'Ocurrió un error al componer las imágenes. No se modificó ningún dato.')}}
async function compareFlow(a,b){[a,b]=[a,b].sort((x,y)=>(photoDate(x)||'9999').localeCompare(photoDate(y)||'9999'));const warn=[];
  if(a.frame!==b.frame||a.view!==b.view)warn.push('Las dos fotos no tienen la misma vista o encuadre: la comparación puede ser engañosa.');if(!photoDate(a)||!photoDate(b))warn.push('Alguna foto no tiene fecha de toma confirmada.');if(a.cls===false||b.cls===false)warn.push('Alguna foto está sin clasificar.');
  const c=await renderEvolution(a,b),url=c.toDataURL('image/jpeg',.9),p=patient(),d=photoDate(a)&&photoDate(b)?daysBetween(photoDate(a),photoDate(b)):null;
  const m=openModal(`<h2 id="mTitle">Comparación de evolución</h2>${warn.map(w=>`<div class="banner warn small">${esc(w)}</div>`).join('')}<img src="${url}" alt="Comparación de dos fotografías reales" style="width:100%;border-radius:10px">
   <div class="small muted">${d!=null?`Intervalo entre tomas: ${d} día(s). Referencia temporal, no una recomendación clínica. `:''}Solo se comparan fotografías reales; las simulaciones no se mezclan aquí. Se muestra con la censura aplicada.</div>
   <div class="row end"><button class="btn" data-close id="cmNo" type="button">Cerrar</button><button class="btn primary" id="cmDl" type="button">Descargar comparación</button></div>`,{wide:true});
  m.querySelector('#cmNo').onclick=closeModal;m.querySelector('#cmDl').onclick=async()=>{await saveFile(exportName(p,b,'evolucion'),await canvasBlob(c))}}

/* ---- PDF de propuesta: fiel a la versión emitida; lo previsto nunca aparece como realizado ---- */
function pdfDates(p,o,photos,opt){const L=[],lv=p.visits.filter(v=>v.type==='valoracion').sort((a,b)=>b.date.localeCompare(a.date))[0];
  if(lv)L.push(['Fecha de valoración (realizada)',fmtDate(lv.date)]);
  const cap=[...new Set(photos.map(photoDate).filter(Boolean))].sort();if(cap.length&&(!lv||cap.some(d=>d!==lv.date)))L.push(['Fotografías tomadas',cap.map(fmtDate).join(', ')]);
  const ep=p.episodes.find(e=>e.id===o.episodeId&&e.performedAt);const sa=p.appts.find(a=>a.id===o.apptId&&APPT_OPEN.includes(a.status));
  if(ep)L.push(['Procedimiento realizado',fmtDate(ep.performedAt)]);
  else if(sa)L.push([`Cirugía ${sa.status==='confirmed'?'confirmada':'programada'} (aún no realizada)`,`${fmtDate(sa.date)} ${sa.time}`]);
  else if(opt.window&&o.tentative)L.push(['Fecha tentativa conversada (sin reserva)',fmtDate(o.tentative)]);
  else if(opt.window&&o.window)L.push(['Fecha deseada por la paciente (sin reserva)',windowLabel(o.window)]);
  else L.push(['Fecha del procedimiento','por definir']);
  const na=nextAppt(p);if(opt.next&&na&&(!sa||na.id!==sa.id))L.push([`Próxima cita (${APPT_STL[na.status].toLowerCase()})`,`${fmtDate(na.date)} ${na.time} · ${APPT_TYPE[na.type]}`]);
  return L}
async function proposalPDF(p,o,q,opt={}){
  const J=window.jspdf&&window.jspdf.jsPDF;if(!J)throw new Error('El generador de PDF no está disponible.');
  const photos=(await Store.photosOf(p.id)).filter(x=>x.after&&x.inPdf!==false&&(opt.photos?opt.photos.includes(x.id):true)).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
  const st=S.settings,snap=q?q.snap:{plan:o.plan,discount:o.discount,planNotes:o.planNotes},t=planTotals(snap),doc=new J({unit:'mm',format:'a4'}),PW=210,PH=297,M=16,CW=PW-2*M;let y=M;
  const Tx=s=>String(s??'').replace(/[  ]/g,' ').replace(/[–—]/g,'-').replace(/[«»]/g,'"').replace(/[“”]/g,'"');
  const AC=[90,53,176],INK=[34,28,46],MU=[107,99,122];
  const need=h=>{if(y+h>PH-20){doc.addPage();y=M}};
  const txt=(s,x,yy,o2={})=>{doc.setFont('helvetica',o2.b?'bold':'normal');doc.setFontSize(o2.sz||10);doc.setTextColor(...(o2.c||INK));doc.text(Tx(s),x,yy,{align:o2.al||'left'})};
  const para=(s,sz=10,c=INK,w=CW)=>{const L=doc.splitTextToSize(Tx(s),w);for(const line of L){need(sz*.45);doc.setFont('helvetica','normal');doc.setFontSize(sz);doc.setTextColor(...c);doc.text(line,M,y);y+=sz*.45}};
  txt(st.clinic||st.tool,M,y+5,{sz:18,c:AC});txt(st.doctor||'',M,y+11,{sz:10,c:MU});
  txt('Propuesta de procedimientos',PW-M,y+5,{sz:11,b:1,al:'right'});txt(q?`Versión ${q.version} · emitida el ${fmtDate(q.issuedAt)}`:'BORRADOR · no emitida',PW-M,y+11,{sz:9,c:MU,al:'right'});
  y+=16;doc.setDrawColor(...AC);doc.setLineWidth(.6);doc.setLineDashPattern([1.5,1.2],0);doc.line(M,y,PW-M,y);doc.setLineDashPattern([],0);y+=8;
  txt('PACIENTE',M,y,{sz:8,c:MU,b:1});y+=5;txt(p.name||'Sin nombre',M,y+1,{sz:14});y+=7;
  const info=[opt.dest==='interno'&&p.doc&&'Documento: '+p.doc,age(p.birth)!==''&&'Edad: '+age(p.birth)+' años',opt.dest==='interno'&&p.phone&&'Tel.: '+p.phone,opt.dest==='interno'&&caseCode(p)].filter(Boolean).join('   ·   ');if(info){txt(info,M,y,{sz:9,c:MU});y+=5}
  y+=1;for(const[k,v]of(q?q.snap.dates:pdfDates(p,o,photos,opt))){txt(k+': ',M,y,{sz:9.5,c:MU});txt(v,M+doc.getTextWidth(Tx(k+': '))+1,y,{sz:9.5});y+=5}y+=4;
  if(photos.length){txt('IMÁGENES',M,y,{sz:8,c:MU,b:1});y+=4.5;txt('Las simulaciones son ilustrativas; el resultado real puede variar. No son una predicción clínica.',M,y,{sz:8.5,c:AC});y+=3;
    for(const ph of photos){let w=(CW-6)/2,h=w*ph.h/ph.w;if(h>96){h=96;w=h*ph.w/ph.h}need(h+16);const x1=M+((CW-6)/2-w)/2,x2=M+(CW-6)/2+6+((CW-6)/2-w)/2;
      txt(photoLabel(ph),M,y+4,{sz:10,b:1});y+=7;const A=(await renderPhoto(ph,'original')).toDataURL('image/jpeg',.86),B=Privacy.flatten(await loadImg(ph.after),Privacy.active(ph)).toDataURL('image/jpeg',.86);
      doc.addImage(A,'JPEG',x1,y,w,h,undefined,'FAST');doc.addImage(B,'JPEG',x2,y,w,h,undefined,'FAST');y+=h+4;
      txt('Antes'+(photoDate(ph)?' · '+fmtDate(photoDate(ph)):''),x1+w/2,y,{sz:9,c:MU,al:'center'});txt('Simulación ilustrativa',x2+w/2,y,{sz:9,c:AC,b:1,al:'center'});y+=8}}
  need(30);txt('PROCEDIMIENTOS CONSIDERADOS',M,y,{sz:8,c:MU,b:1});y+=5;
  doc.setFillColor(236,230,248);doc.rect(M,y-4,CW,7,'F');txt('Concepto',M+2,y+.8,{sz:9,b:1});txt('Tiempo quirúrgico estimado',128,y+.8,{sz:9,b:1,al:'center'});txt('Valor',PW-M-2,y+.8,{sz:9,b:1,al:'right'});y+=8;
  for(const it of snap.plan||[]){const noteL=it.note?doc.splitTextToSize(Tx(it.note),CW-70):[];need(8+noteL.length*4);txt(it.name,M+2,y,{sz:10});txt(it.extra?'':it.ns?'En consultorio':hrs(fin(it.minH),fin(it.maxH)),128,y,{sz:10,al:'center'});txt(fin(it.price)?money(fin(it.price)):'Por definir',PW-M-2,y,{sz:10,al:'right'});y+=4.5;
    if(noteL.length){doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(...MU);doc.text(noteL,M+2,y);y+=noteL.length*4}doc.setDrawColor(221,216,230);doc.setLineWidth(.2);doc.line(M,y,PW-M,y);y+=5.5}
  if(!(snap.plan||[]).length){txt('Sin procedimientos registrados.',M+2,y,{sz:10,c:MU});y+=7}
  need(34);txt('Tiempo quirúrgico total estimado',M+2,y,{sz:10});txt(t.nq?hrs(t.lo,t.hi):'-',PW-M-2,y,{sz:10,b:1,al:'right'});y+=6;
  if(t.disc){txt('Subtotal',M+2,y,{sz:10});txt(money(t.sub),PW-M-2,y,{sz:10,al:'right'});y+=6;txt(`Descuento (${fin(snap.discount)}%)`,M+2,y,{sz:10});txt('- '+money(t.disc),PW-M-2,y,{sz:10,al:'right'});y+=6}
  doc.setFillColor(...AC);doc.rect(M,y-4.5,CW,9,'F');txt('Total estimado',M+2,y+1.2,{sz:11,b:1,c:[255,255,255]});txt(t.sub?money(t.total):'Por definir',PW-M-2,y+1.2,{sz:11,b:1,c:[255,255,255],al:'right'});y+=12;
  para(q&&q.expiresAt?`Vigencia comercial de esta propuesta: hasta el ${fmtDate(q.expiresAt)}. La vigencia no es una fecha límite médica.`:`Vigencia comercial: ${fin(st.validity,30)} días desde la emisión.`,9,MU);y+=3;
  const steps=q?q.snap.next:(opt.next?nextStepsText(p,o):'');if(steps){need(14);txt('PRÓXIMOS PASOS CONVERSADOS',M,y,{sz:8,c:MU,b:1});y+=5;para(steps);y+=3}
  if(snap.planNotes){need(12);txt('OBSERVACIONES',M,y,{sz:8,c:MU,b:1});y+=5;para(snap.planNotes);y+=3}
  need(20);para(st.legal||'',8,MU);y+=2;para('Este documento es una propuesta informativa. No es un consentimiento quirúrgico, no confirma una fecha de cirugía y no garantiza un resultado.',8,MU);
  const n=doc.getNumberOfPages(),gen=q?q.issuedAt:nowISO();for(let i=1;i<=n;i++){doc.setPage(i);txt([st.clinic,st.city,st.contact].filter(Boolean).join('  ·  '),M,PH-9,{sz:8,c:MU});txt(`${q?'Versión '+q.version:'Borrador'} · generado ${fmtDT(gen)} · página ${i} de ${n}`,PW-M,PH-9,{sz:8,c:MU,al:'right'})}
  return doc.output('blob')}
function nextStepsText(p,o){const L=[];if(o.nextStep)L.push(NEXT_STEP[o.nextStep]+'.');if(o.reviewAt)L.push(`Se acordó retomar la conversación el ${fmtDate(o.reviewAt)}.`);return L.join(' ')}

/* ---- Excel ---- */
function xlsReady(){if(!window.XLSX){toast('El generador de Excel no está disponible.');return false}return true}
async function exportXLS(p,o){if(!xlsReady())return;const st=S.settings,X=window.XLSX,t=planTotals(o),plan=o.plan||[];
  const rows=[[st.clinic||st.tool],[st.doctor||''],[],['Paciente',p.name],['Documento',p.doc||''],['Teléfono',p.phone||''],['Etapa de la oportunidad',STAGE[o.stage]],['Fecha tentativa (sin reserva)',o.tentative?fmtDate(o.tentative):windowLabel(o.window)||'Por definir'],['Generado',fmtDate(today())],[],['Concepto','Tipo','Horas mín.','Horas máx.','Valor ('+st.currency+')','Nota']];
  const r0=rows.length+1;for(const it of plan)rows.push([it.name,it.extra?'Adicional':it.ns?'No quirúrgico':'Procedimiento',it.extra||it.ns?'':fin(it.minH),it.extra||it.ns?'':fin(it.maxH),fin(it.price),it.note||'']);
  const r1=rows.length,has=plan.length>0;rows.push([]);rows.push(['Tiempo quirúrgico total (h)','',has?{t:'n',v:t.lo,f:`SUM(C${r0}:C${r1})`}:0,has?{t:'n',v:t.hi,f:`SUM(D${r0}:D${r1})`}:0]);
  const rs=rows.length+1;rows.push(['Subtotal','','','',has?{t:'n',v:t.sub,f:`SUM(E${r0}:E${r1})`}:0]);rows.push(['Descuento (%)','','','',fin(o.discount)]);rows.push(['Total estimado','','','',{t:'n',v:t.total,f:`E${rs}*(1-E${rs+1}/100)`}]);
  const ws=X.utils.aoa_to_sheet(rows);ws['!cols']=[{wch:34},{wch:16},{wch:11},{wch:11},{wch:18},{wch:44}];const wb=X.utils.book_new();X.utils.book_append_sheet(wb,ws,'Propuesta');
  await saveFile(`${caseCode(p)}_plan_${today()}.xlsx`,new Blob([X.write(wb,{type:'array',bookType:'xlsx'})]))}
async function exportAllXLS(){if(!xlsReady())return;const X=window.XLSX,wb=X.utils.book_new();
  const a=[['Paciente','Código','Documento','Teléfono','Última visita','Estado de atención','Oportunidades','Valor propuestas abiertas','Valor cirugías programadas','Próxima acción','Contacto autorizado']];
  for(const p of S.patients){const lv=lastVisit(p);a.push([p.name,caseCode(p),p.doc||'',p.phone||'',lv?fmtDate(lv.date):'',attState(p),p.opps.map(o=>`${oppName(o)}: ${STAGE[o.stage]}`).join(' | '),p.opps.filter(o=>STAGE_OPEN.includes(o.stage)).reduce((s,o)=>s+planTotals(o).total,0),p.opps.filter(o=>o.stage==='programada').reduce((s,o)=>s+planTotals(o).total,0),nextAction(p).txt,{si:'Sí',no:'No',sin_registro:'Sin registro'}[p.contact.allowed]])}
  const b=[['Paciente','Oportunidad','Etapa','Concepto','Tipo','Horas mín.','Horas máx.','Valor']];for(const p of S.patients)for(const o of p.opps)for(const it of o.plan||[])b.push([p.name,oppName(o),STAGE[o.stage],it.name,it.extra?'Adicional':it.ns?'No quirúrgico':'Procedimiento',it.extra||it.ns?'':fin(it.minH),it.extra||it.ns?'':fin(it.maxH),fin(it.price)]);
  const c=[['Fecha','Hora','Paciente','Tipo','Estado','Modalidad']];for(const x of agendaItems())if(x.kind==='appt')c.push([fmtDate(x.date),x.time,x.who,x.title,APPT_STL[x.status],x.ref.mode]);
  const d=[['Paciente','Vence','Tarea','Estado','Nota','Resultado']];for(const p of S.patients)for(const t of p.tasks)d.push([p.name,t.due?fmtDate(t.due):'',TASK_KIND[t.kind],t.status,t.note,t.doneNote||'']);
  for(const[n,r,w]of[['Pacientes',a,[28,10,14,14,12,22,44,18,18,40,12]],['Procedimientos',b,[28,28,22,32,14,10,10,14]],['Agenda',c,[12,8,28,18,14,12]],['Seguimiento',d,[28,12,22,12,40,40]]]){const ws=X.utils.aoa_to_sheet(r);ws['!cols']=w.map(wch=>({wch}));X.utils.book_append_sheet(wb,ws,n)}
  await saveFile(`base-skind_${today()}.xlsx`,new Blob([X.write(wb,{type:'array',bookType:'xlsx'})]))}



/* ---- contraseña de paquetes ---- */
const passFields=()=>[{k:'pass',label:'Contraseña del archivo (mínimo 8 caracteres)',type:'password',required:true},{k:'pass2',label:'Repite la contraseña',type:'password',required:true},{k:'i',type:'info',label:'La contraseña no se guarda en el archivo ni en la herramienta. Sin ella no se puede abrir. Comunícala por un medio distinto al del archivo.'}];
const passCheck=r=>r.pass.length<Portable.MIN_PASS?'La contraseña debe tener al menos 8 caracteres.':r.pass!==r.pass2?'Las dos contraseñas no coinciden.':'';
const estSize=(photos,docs)=>photos.reduce((s,ph)=>s+((ph.orig||'').length+(ph.after||'').length+(ph.scenarios||[]).reduce((a,x)=>a+(x.after||'').length,0))*.75+(ph.brush?ph.brush.byteLength:0),0)+docs.reduce((s,d)=>s+(d.size||0),0);
async function exportCaseFlow(p){
  if(!Portable.ok())return errBox('No se puede exportar con protección',Portable.MSG.cripto);
  await Sim.leave();if(!await Saver.flush())return errBox('Hay cambios sin guardar','No se pudo guardar el último cambio en este equipo. Resuelve el error de guardado antes de exportar para no transferir una versión incompleta.');
  const photos=await Store.photosOf(p.id),docs=await Store.docsOf(p.id);
  const r=await formBox('Exportar caso editable',[{k:'scope',label:'Alcance',type:'select',options:[['all',`Caso completo (${photos.length} fotos)`],...p.visits.map(v=>[v.id,`Solo ${VISIT_TYPE[v.type].toLowerCase()} del ${fmtDate(v.date)} (${photos.filter(x=>x.visitId===v.id).length} fotos)`])],value:'all'},
    ...docs.map(d=>({k:'d_'+d.id,label:`Incluir documento: ${d.displayName} (${fmtSize(d.size)})`,type:'check',value:false})),...passFields()],'Exportar archivo protegido',{wide:true,validate:passCheck,intro:`Archivo único y cifrado para continuar la misma valoración en otro equipo: fotos, puntos, deslizadores, pincel, alternativas, censuras, citas y propuestas. Tamaño aproximado sin documentos: ${fmtSize(estSize(photos,[]))}. ${docs.length?'Los documentos adjuntos solo viajan si los marcas.':''}`});
  if(!r)return;const selP=r.scope==='all'?photos:photos.filter(x=>x.visitId===r.scope),selD=docs.filter(d=>r['d_'+d.id]);
  const pg=progressBox('Exportando caso protegido');
  try{await pg.set(10,'Empaquetando fotografías y estados editables…');const{zip,manifest}=await Portable.buildCase(p,selP,selD,{scope:r.scope==='all'?'completo':'visita'});
    const blob=await Portable.seal('yhcase',zip,r.pass,(i,n)=>pg.set(30+i/n*65,'Cifrando…'));pg.close();
    if(await saveFile(`${caseCode(p)}_${today()}.yhcase`,blob)){p.lastExport={at:nowISO(),hash:manifest.caseHash,photos:selP.length};savePatient(p)}}
  catch(e){pg.close();console.error(e&&e.code);errBox('No se pudo exportar',e.code?e.message:'Ocurrió un error al preparar el archivo (posible falta de memoria). El caso sigue intacto en este equipo.')}}
async function exportBackupFlow(){
  if(!Portable.ok())return errBox('No se puede exportar con protección',Portable.MSG.cripto);
  await Sim.leave();await Saver.flush();const photos=await Store.all('photos'),docs=await Store.all('docs'),sz=estSize(photos,docs);
  const r=await formBox('Exportar respaldo completo',passFields(),'Exportar respaldo protegido',{validate:passCheck,intro:`Incluye ${S.patients.length} paciente(s), ${photos.length} foto(s), ${docs.length} documento(s) y los ajustes. Tamaño aproximado: ${fmtSize(sz)}. Sirve para recuperar o migrar la base, no para compartir una valoración.${sz>3e8?' Es un respaldo grande: en iPhone o iPad puede fallar por memoria; hazlo desde el computador.':''}`});
  if(!r)return;const pg=progressBox('Exportando respaldo protegido');
  try{await pg.set(10,'Empaquetando…');const{zip}=await Portable.buildBackup(S.settings,{leads:S.leads,blocks:S.blocks,library:S.library,campaigns:S.campaigns,posts:S.posts},S.patients,photos,docs);
    const blob=await Portable.seal('yhbackup',zip,r.pass,(i,n)=>pg.set(30+i/n*65,'Cifrando…'));pg.close();if(await saveFile(`respaldo-skind_${today()}.yhbackup`,blob)){S.settings.lastBackup=nowISO();saveSettings()}}
  catch(e){pg.close();errBox('No se pudo exportar el respaldo',e.code?e.message:'Ocurrió un error (posible falta de memoria). La base sigue intacta. Prueba desde el computador o exporta casos por separado.')}}

/* ---- importación segura: validar todo → vista previa → escritura atómica ---- */
async function importFlow(file){
  await Sim.leave();await Saver.flush();let buf;try{buf=await file.arrayBuffer()}catch(e){return errBox('No se pudo leer el archivo','El archivo no se pudo abrir desde este dispositivo. No se importó nada.')}
  let pkg;
  if(Portable.isPortable(buf)){
    try{Portable.parseHeader(buf)}catch(e){return errBox('Archivo no válido',e.message)}
    for(;;){const r=await formBox('Abrir archivo protegido',[{k:'pass',label:'Contraseña del archivo',type:'password',required:true}],'Abrir',{intro:`${file.name} · ${fmtSize(file.size)}`});if(!r)return;
      const pg=progressBox('Verificando el archivo');
      try{const{payload}=await Portable.unseal(buf,r.pass,(i,n)=>pg.set(i/n*60,'Descifrando…'));await pg.set(65,'Verificando integridad…');pkg=await Portable.openPayload(payload,(i,n)=>pg.set(65+i/n*30,'Verificando integridad…'));pg.close();break}
      catch(e){pg.close();if(e.code==='clave'){if(!await confirmBox('No se pudo abrir',e.message,'Reintentar'))return;continue}return errBox('No se importó nada',e.code?e.message:Portable.MSG.integridad)}}}
  else{try{pkg=Portable.parseLegacy(dec.decode(buf))}catch(e){return errBox('Archivo no válido',e.code?e.message:Portable.MSG.formato)}}
  const size=buf.byteLength,est=await Store.estimate();
  if(est&&est.quota&&est.quota-est.usage<size*1.6)return errBox('No hay espacio suficiente',`Este equipo tiene libres ${fmtSize(Math.max(0,est.quota-est.usage))} y el archivo necesita cerca de ${fmtSize(size*1.6)}. Libera espacio o exporta y elimina casos antiguos. No se importó nada.`);
  if(pkg.manifest.format==='yhcase')return importCase(pkg,size);return importBase(pkg,size)}
function fixDangling(p,ids){for(const v of p.visits||[])for(const s of v.slots||[])if(s.photoId&&!ids.has(s.photoId)){s.photoId=null;s.st='pendiente'}
  for(const o of p.opps||[])for(const q of o.quotes||[])if(q.pdfDocId&&!ids.has(q.pdfDocId))q.pdfMissing=true}
async function importCase(pkg,size){
  const m=pkg.manifest,p=pkg.patient;migratePatient(p);pkg.photos.forEach(migratePhoto);
  const ex=S.patients.find(x=>x.id===p.id),localPh=ex?await Store.photosOf(ex.id):[],localDocs=ex?await Store.docsOf(ex.id):[],same=ex&&ex.rev&&ex.rev.hash===m.caseHash;
  const choice=await new Promise(res=>{const c=openModal(`<h2 id="mTitle">Importar caso editable</h2>
    <dl class="kv"><dt>Paciente</dt><dd><b>${esc(p.name||'Sin nombre')}</b> (${caseCode(p)})</dd><dt>Contenido</dt><dd>${pkg.photos.length} foto(s), ${pkg.docs.length} documento(s)${m.scope==='visita'?' · solo una visita':''}</dd><dt>Última modificación</dt><dd>${m.summary&&m.summary.updatedAt?fmtDT(nowISO(new Date(m.summary.updatedAt))):'—'}</dd><dt>Procedimientos</dt><dd>${esc((m.summary&&m.summary.procedures||[]).join(', ')||'—')}</dd><dt>Tamaño</dt><dd>${fmtSize(size)}</dd><dt>Exportado</dt><dd>${fmtDT(m.createdAt)}</dd></dl>
    ${ex?`<div class="banner warn"><div><b>${same?'Este mismo archivo ya se importó en este equipo.':'Este caso ya existe en este equipo.'}</b><br>Aquí: ${localPh.length} foto(s), modificado ${fmtDT(nowISO(new Date(ex.updatedAt||0)))}. En el archivo: ${pkg.photos.length} foto(s), modificado ${m.summary&&m.summary.updatedAt?fmtDT(nowISO(new Date(m.summary.updatedAt))):'—'}.</div></div>
      <div class="col"><button class="btn primary" id="icRep" type="button">Reemplazar este caso con el del archivo</button><div class="small muted">Antes se guarda una copia de recuperación del caso actual. ${m.scope==='visita'?'Las fotos de otras visitas que ya están aquí se conservan.':''}</div>
      <button class="btn" id="icBoth" type="button">Conservar ambas versiones</button><div class="small muted">El caso del archivo se agrega como una ficha aparte.</div><button class="btn" id="icNo" data-close type="button">Cancelar</button></div>`
     :`<div class="note">Se agregará a este equipo. Los demás pacientes no cambian.</div><div class="row end"><button class="btn" id="icNo" data-close type="button">Cancelar</button><button class="btn primary" id="icNew" type="button">Importar caso</button></div>`}`,{wide:true});
    c.querySelector('#icNo').onclick=()=>{closeModal();res(null)};const b=(id,v)=>{const e=c.querySelector(id);if(e)e.onclick=()=>{closeModal();res(v)}};b('#icRep','replace');b('#icBoth','both');b('#icNew','new')});
  if(!choice)return;const ops=[];let photos=pkg.photos,docs=pkg.docs;
  if(choice==='both'){const map=new Map(),nid=old=>{if(!map.has(old))map.set(old,uid());return map.get(old)};p.id=nid(p.id);p.name=(p.name||'Sin nombre')+' (copia importada)';
    photos=photos.map(ph=>({...ph,id:nid(ph.id),patientId:p.id}));docs=docs.map(d=>({...d,id:nid(d.id),patientId:p.id}));
    for(const v of p.visits)for(const s of v.slots)if(s.photoId)s.photoId=map.get(s.photoId)||null;for(const o of p.opps)for(const q of o.quotes||[])if(q.pdfDocId)q.pdfDocId=map.get(q.pdfDocId)||q.pdfDocId}
  if(choice==='replace'){ops.push({op:'put',store:'recovery',value:{id:'case:'+ex.id,at:nowISO(),name:ex.name,patient:clone(ex),photos:localPh,docs:localDocs}});
    if(m.scope!=='visita'){const keep=new Set(photos.map(x=>x.id));for(const ph of localPh)if(!keep.has(ph.id))ops.push({op:'del',store:'photos',key:ph.id})}
}
  const ids=new Set([...photos.map(x=>x.id),...docs.map(x=>x.id),...(choice==='replace'?[...localPh.map(x=>x.id),...localDocs.map(x=>x.id)]:[])]);fixDangling(p,ids);
  p.rev={hash:m.caseHash,importedAt:nowISO(),from:m.createdAt};p.updatedAt=p.updatedAt||Date.now();
  ops.push({op:'put',store:'patients',value:p});for(const ph of photos)ops.push({op:'put',store:'photos',value:ph});for(const d of docs)ops.push({op:'put',store:'docs',value:d});
  try{await Store.atomic(ops)}catch(e){console.error(e&&e.name);return errBox('No se importó nada',isQuota(e)?'No hay espacio suficiente en este equipo. La base quedó exactamente como estaba; libera espacio y vuelve a intentarlo.':'La escritura falló y se canceló completa. La base quedó exactamente como estaba; puedes reintentar.')}
  const i=S.patients.findIndex(x=>x.id===p.id);if(i>=0)S.patients[i]=p;else S.patients.push(p);S.pid=p.id;ui.editing=false;ui.photoId=null;ui.sel.clear();
  toast(choice==='replace'?'Caso reemplazado. Hay una copia de recuperación en Más > Respaldos.':'Caso importado. Los demás pacientes no cambiaron.',5000);await go('patient',{tab:pkg.photos.length?'fotos':'resumen'})}
async function importBase(pkg,size){
  const legacy=pkg.manifest.format==='legacy-json';pkg.patients.forEach(migratePatient);pkg.photos.forEach(migratePhoto);
  const have=new Set(S.patients.map(p=>p.id)),nu=pkg.patients.filter(p=>!have.has(p.id)),dupN=pkg.patients.length-nu.length;
  const choice=await new Promise(res=>{const c=openModal(`<h2 id="mTitle">${legacy?'Respaldo de la versión anterior':'Respaldo completo'}</h2>
    ${legacy?'<div class="banner warn">Es un respaldo JSON de la versión anterior, sin cifrado. Se convertirá al formato actual; sus etapas y fechas se conservan como «datos heredados por revisar», sin interpretarlas.</div>':''}
    <dl class="kv"><dt>Contenido</dt><dd>${pkg.patients.length} paciente(s), ${pkg.photos.length} foto(s), ${pkg.docs.length} documento(s)</dd><dt>Creado</dt><dd>${fmtDT(pkg.manifest.createdAt)||'—'}</dd><dt>En este equipo</dt><dd>${S.patients.length} paciente(s); ${dupN} del archivo ya existen aquí</dd><dt>Tamaño</dt><dd>${fmtSize(size)}</dd></dl>
    <div class="col"><button class="btn primary" id="ibAdd" type="button" ${nu.length?'':'disabled'}>Agregar los ${nu.length} paciente(s) que no están en este equipo</button><div class="small muted">No modifica ni borra nada de lo que ya hay aquí.</div>
    <button class="btn danger" id="ibAll" type="button">Restaurar sustituyendo toda la base…</button><button class="btn" id="ibNo" data-close type="button">Cancelar</button></div>`,{wide:true});
    c.querySelector('#ibNo').onclick=()=>{closeModal();res(null)};c.querySelector('#ibAdd').onclick=()=>{closeModal();res('add')};c.querySelector('#ibAll').onclick=()=>{closeModal();res('all')}});
  if(!choice)return;const ops=[];
  if(choice==='all'){
    const r=await formBox('Sustituir toda la base',[{k:'ok',type:'check',label:`Entiendo que se eliminarán los ${S.patients.length} paciente(s) que hay ahora en este equipo y se reemplazarán por los del archivo.`},{k:'bk',type:'check',label:'Ya exporté un respaldo de la base actual, o no lo necesito.'}],'Sustituir la base',{intro:'Recomendado: cancela, exporta primero un respaldo completo de la base actual (Más > Respaldos) y vuelve a importar.',validate:x=>x.ok&&x.bk?'':'Marca las dos casillas para continuar.'});
    if(!r)return;for(const s of['patients','photos','docs'])ops.push({op:'clear',store:s});
    for(const p of pkg.patients)ops.push({op:'put',store:'patients',value:p});for(const ph of pkg.photos)ops.push({op:'put',store:'photos',value:ph});for(const d of pkg.docs)ops.push({op:'put',store:'docs',value:d});
    if(pkg.settings){ops.push({op:'put',store:'kv',value:{...clone(DEFAULT_SETTINGS),...pkg.settings,schema:SCHEMA},key:'settings'})}for(const k of['leads','blocks','library','campaigns','posts'])if(pkg.kv&&Array.isArray(pkg.kv[k]))ops.push({op:'put',store:'kv',value:pkg.kv[k],key:k})}
  else{const ids=new Set(nu.map(p=>p.id));for(const p of nu)ops.push({op:'put',store:'patients',value:p});for(const ph of pkg.photos)if(ids.has(ph.patientId))ops.push({op:'put',store:'photos',value:ph});for(const d of pkg.docs)if(ids.has(d.patientId))ops.push({op:'put',store:'docs',value:d})}
  const pg=progressBox('Restaurando');await pg.set(40,'Escribiendo en una sola operación…');
  try{await Store.atomic(ops)}catch(e){pg.close();console.error(e&&e.name);return errBox('No se restauró nada',isQuota(e)?'No hay espacio suficiente. La base quedó exactamente como estaba.':'La restauración falló y se canceló completa. La base quedó exactamente como estaba; puedes reintentar.')}
  pg.close();await loadAll();toast(choice==='all'?'Base restaurada desde el respaldo.':`${nu.length} paciente(s) agregados. Lo que ya había no cambió.`,5000);await go('pacientes')}
async function undoReplace(id){const r=await Store.get('recovery',id);if(!r)return;if(!await confirmBox('Recuperar versión anterior',`Se restaurará el caso de «${r.name||'Sin nombre'}» tal como estaba el ${fmtDT(r.at)}, reemplazando la versión importada.`,'Recuperar'))return;
  const cur=await Store.photosOf(r.patient.id),keep=new Set(r.photos.map(x=>x.id)),ops=[{op:'put',store:'patients',value:r.patient},...r.photos.map(v=>({op:'put',store:'photos',value:v})),...r.docs.map(v=>({op:'put',store:'docs',value:v})),...cur.filter(x=>!keep.has(x.id)).map(x=>({op:'del',store:'photos',key:x.id})),{op:'del',store:'recovery',key:id}];
  try{await Store.atomic(ops)}catch(e){return errBox('No se pudo recuperar','La base quedó como estaba.')}await loadAll();toast('Versión anterior recuperada.');render()}
