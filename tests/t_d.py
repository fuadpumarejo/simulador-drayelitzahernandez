from common import *
from pypdf import PdfReader
import hashlib
PW='clave-ficticia-2026'
def pdftext(path): return '\n'.join(pg.extract_text() or '' for pg in PdfReader(path).pages)
with sync_playwright() as p:
    b=launch(p); ctx,pg=page(b); ready(pg)
    D=lambda n:pg.evaluate(f"addDays(today(),{n})")
    # ---------- G. interés → ficha → oportunidad ----------
    act(pg,'newLead'); pg.wait_for_selector('#fb_name'); fb(pg,{'name':'Interesada Ficticia','interest':'Rinoplastia','source':'Instagram','channel':'whatsapp','perm':True}); pg.wait_for_timeout(200)
    T('T67',pg.evaluate("S.leads.length")==1 and pg.evaluate("S.patients.filter(p=>!p.demo).length")==0 and 'Intereses nuevos' in pg.inner_text('#app'),'interés inicial sin ficha clínica, sin fotos ni visita')
    act(pg,'leadConvert'); pg.wait_for_selector('#w_name'); pre=pg.input_value('#w_name'); pg.check('#w_cd'); pg.check('#w_cp'); act(pg,'wizNoPhotos'); pg.wait_for_timeout(400)
    o=pg.evaluate("patient().opps[0]"); 
    T('T68',pre=='Interesada Ficticia' and o['stage']=='nuevo' and o['source']=='Instagram' and o['inquiryId']==pg.evaluate("S.leads[0].id") and pg.evaluate("S.leads[0].patientId")==pg.evaluate("S.pid") and pg.evaluate("patient().contact.channel")=='whatsapp','convertir conserva origen, canal y permiso, y vincula interés y paciente')
    # coincidencia por nombre al crear
    pg.click('#navTop [data-v="hoy"]'); act(pg,'newVal'); pg.fill('#w_name','interesada ficticia'); pg.check('#w_cp'); act(pg,'wizNext'); pg.wait_for_selector('#cbYes'); dupm=pg.inner_text('#mCard'); pg.click('#cbYes'); pg.wait_for_timeout(300)
    T('T68b','Ya existe una ficha' in dupm and pg.evaluate("S.patients.filter(p=>!p.demo).length")==1,'detecta coincidencia y no duplica la paciente')
    # caso con simulación
    pid=quick_case(pg,'Paciente Ficticia Cuatro'); tab(pg,'propuestas'); act(pg,'oppNew'); pg.wait_for_selector('#fb_int'); fb(pg,{'int':'Rinoplastia','stage':'val_realizada','src':'Recomendación'}); pg.wait_for_timeout(300)
    sug=pg.locator('[data-act="addProc"][data-id="rino"]').count()
    pg.select_option('#procSel','rino'); act(pg,'addProcSel'); pg.wait_for_timeout(200); pg.fill('#planRows input[data-f="price"]','12000000'); pg.dispatch_event('#planRows input[data-f="price"]','input')
    pg.fill('#op_q','Tiempo de recuperación'); pg.select_option('#op_next','resolver_dudas'); pg.wait_for_timeout(300)
    act(pg,'oppWindow'); pg.wait_for_selector('#fb_kind'); fb(pg,{'kind':'mes','m':'2','y':'2027'}); pg.wait_for_timeout(300)
    o=pg.evaluate("patient().opps[0]"); ag=pg.evaluate("agendaItems().filter(x=>x.pid===S.pid).map(x=>[x.kind,x.layer,x.date,x.to,x.tent])")
    T('T69',o['stage']=='val_realizada' and o['question']=='Tiempo de recuperación' and pg.evaluate("patient().tasks.length")==0 and pg.evaluate("patient().opps[0].quotes.length")==0,'interés registrado sin propuesta ni tarea automática')
    T('T70',o['window']=={'kind':'mes','y':2027,'m':2,'recordedAt':o['window']['recordedAt']} and pg.evaluate("windowLabel(patient().opps[0].window)")=='febrero de 2027' and ag==[['window','tentativo','2027-02-01','2027-02-28',True]] and pg.evaluate("patient().appts.length")==0,'«febrero de 2027» conserva granularidad mensual; no crea día, hora, cita ni reserva')
    T('T100',sug==1,'el plan sugiere lo simulado sin marcarlo como recomendado')
    # vista previa PDF con ventana
    act(pg,'quotePreview'); pg.wait_for_selector('#fb_win'); fb(pg,{'win':True,'next':True},submit=False); fp=dl(pg,lambda:pg.click('#fbForm button[type=submit]')); tx=pdftext(fp)
    T('T82','Fecha deseada por la paciente (sin reserva): febrero de 2027' in tx and 'BORRADOR' in tx and 'programada' not in tx.lower().replace('no confirma','') and 'Procedimiento realizado' not in tx and 'Resolver dudas' in tx,'PDF: ventana deseada como «sin reserva»; próximos pasos; nada aparece como programado o realizado')
    T('T13a','Simulación ilustrativa' in tx and 'Antes' in tx and 'no es un consentimiento' in tx.lower(),'PDF rotula «Antes» y «Simulación ilustrativa»')
    # emitir v1
    act(pg,'quoteEmit'); pg.wait_for_selector('#fb_val'); f1=dl(pg,lambda:pg.click('#fbForm button[type=submit]')); pg.wait_for_timeout(500); t1=pdftext(f1)
    q1=pg.evaluate("patient().opps[0].quotes[0]"); h1=pg.evaluate("Store.get('docs',patient().opps[0].quotes[0].pdfDocId).then(d=>[d.sha256,d.locked,d.category])")
    T('T58a',q1['state']=='emitida' and q1['deliveredAt']=='' and 'Versión 1' in t1 and pg.evaluate("patient().opps[0].stage")=='prop_prep','emitir PDF no lo marca como entregado')
    T('T77',pg.evaluate("patient().opps[0].stage")!='prop_entregada','generar PDF no marca la propuesta como entregada ni contactada')
    pg.click('[data-act="quoteDeliver"]'); pg.wait_for_selector('#fb_date'); fb(pg,{'via':'En consulta'}); pg.wait_for_timeout(300)
    T('T58b',pg.evaluate("patient().opps[0].quotes[0].state")=='entregada' and pg.evaluate("patient().opps[0].stage")=='prop_entregada','entrega registrada manualmente con fecha')
    # modificar y emitir v2
    pg.fill('#planRows input[data-f="price"]','13500000'); pg.dispatch_event('#planRows input[data-f="price"]','input'); pg.wait_for_timeout(200)
    act(pg,'quoteEmit'); pg.wait_for_selector('#fb_val'); f2=dl(pg,lambda:pg.click('#fbForm button[type=submit]')); pg.wait_for_timeout(500)
    qs=pg.evaluate("patient().opps[0].quotes.map(q=>[q.version,q.state,q.snap.totals.total,q.supersedes])"); h1b=pg.evaluate("Store.get('docs',patient().opps[0].quotes[0].pdfDocId).then(d=>d.sha256)")
    fd=dl(pg,lambda:pg.click(f'[data-act="quoteDl"][data-id="{q1["id"]}"]')); 
    T('T78',qs[0][:3]==[1,'sustituida',12000000] and qs[1][:3]==[2,'emitida',13500000] and qs[1][3]==q1['id'] and h1[0]==h1b and hashlib.sha256(open(fd,'rb').read()).hexdigest()==h1[0] and h1[1]==True,'v2 emitida; v1 y su PDF se conservan inmutables (mismo hash)')
    T('T58',('12.000.000' in pdftext(fd) or '12,000,000' in pdftext(fd)) and 'Versión 1' in pdftext(fd),'el PDF histórico de la v1 conserva sus valores')
    pg.click('[data-act="quoteDeliver"]'); pg.wait_for_selector('#fb_date'); fb(pg,{}); pg.wait_for_timeout(200); pg.click('[data-act="quoteAccept"]'); pg.wait_for_timeout(300)
    T('T79',pg.evaluate("patient().opps[0].quotes[1].state")=='aceptada' and pg.evaluate("patient().opps[0].stage")=='interes_prog' and pg.evaluate("patient().appts.length")==0 and pg.evaluate("patient().episodes.length")==0 and pg.evaluate("patient().opps[0].apptId") is None,'aceptación comercial ≠ consentimiento, cita ni cirugía')
    # tareas y WhatsApp
    pg.select_option('#op_next','enviar_info'); pg.wait_for_timeout(300)
    act(pg,'taskAdd'); pg.wait_for_selector('#fb_kind'); fb(pg,{'kind':'enviar_info','due':D(2),'note':'Enviar información de recuperación'}); pg.wait_for_timeout(300)
    act(pg,'waDraft'); pg.wait_for_selector('#waT'); wa=pg.input_value('#waT'); pg.click('#waNo'); 
    T('T81',wa.startswith('Hola') and 'Rinoplastia' not in wa and pg.evaluate("patient().tasks[0].status")=='pendiente' and pg.evaluate("patient().log.length")==0,'borrador de mensaje sin datos clínicos; no se marca enviado ni completa la tarea')
    pg.click('#navTop [data-v="hoy"]'); hoy=pg.inner_text('#app'); T('T73','Enviar información de recuperación' in hoy and 'PRÓXIMOS 7 DÍAS' in hoy.upper(),'tarea con fecha aparece en Hoy; se completa solo con resultado manual')
    pg.click('[data-act="taskDone"]'); pg.wait_for_selector('#fb_res'); fb(pg,{'res':'realizada','note':'Enviado por WhatsApp manualmente'}); pg.wait_for_timeout(200)
    T('T73b',pg.evaluate("S.patients.find(p=>p.id===S.last.pid).tasks[0].status")=='realizada','tarea completada con registro de lo ocurrido')
    # programar cirugía
    pg.click('#navTop [data-v="pacientes"]'); pg.click('.pitem >> text=Paciente Ficticia Cuatro'); tab(pg,'propuestas'); act(pg,'oppSchedule'); pg.wait_for_selector('#fb_date'); fb(pg,{'date':D(40),'time':'07:00','ok':True}); pg.wait_for_timeout(400)
    o=pg.evaluate("patient().opps[0]"); a=pg.evaluate("patient().appts[0]"); ep=pg.evaluate("patient().episodes[0]")
    T('T72',o['stage']=='programada' and a['type']=='procedimiento' and a['oppId']==o['id'] and o['window']['m']==2 and ep['performedAt']=='' and ep['plannedDate']==D(40) and pg.evaluate("agendaItems().filter(x=>x.pid===S.pid&&x.layer==='tentativo').length")==0,'ventana → cita quirúrgica real vinculada; historial conserva la ventana; aún no «realizada»')
    T('T59',pg.evaluate("patient().opps[0].stage")!='realizada' and 'aún no realizada' in pg.inner_text('#tab'),'programada no figura como realizada')
    tab(pg,'visitas'); act(pg,'epPerformed'); pg.wait_for_selector('#fb_name'); fb(pg,{'date':D(0)}); pg.wait_for_selector('#cbYes'); pg.click('#cbNo'); pg.wait_for_timeout(300)
    T('T59b',pg.evaluate("patient().opps[0].stage")=='realizada' and pg.evaluate("patient().episodes[0].performedAt")==D(0),'pasa a realizada solo tras registrar el hecho con su fecha real')
    # segunda oportunidad independiente
    tab(pg,'propuestas'); act(pg,'oppNew'); pg.wait_for_selector('#fb_int'); fb(pg,{'int':'Blefaroplastia','stage':'consideracion'}); pg.wait_for_timeout(300)
    T('T76',pg.evaluate("patient().opps.map(o=>o.stage)")==['realizada','consideracion'] and pg.evaluate("patient().opps[1].quotes.length")==0 and pg.locator('[data-act="oppSel"]').count()==2,'dos oportunidades en la misma paciente no comparten etapa ni cotización')
    # no contactar
    pg.select_option('#op_next','paciente_contacta'); pg.wait_for_timeout(300); dis=pg.locator('[data-act="waDraft"][disabled]').count(); act(pg,'taskAdd'); pg.wait_for_selector('#fb_kind'); kinds=pg.eval_on_selector_all('#fb_kind option','e=>e.map(o=>o.value)'); pg.click('#fbNo')
    pg.click('#navTop [data-v="hoy"]'); hoy2=pg.inner_text('#app')
    T('T74',dis==1 and 'contacto' not in kinds and 'Blefaroplastia' not in hoy2.split('Pendientes acordados')[1],'«la paciente se comunicará»: sin tareas de contacto, sin borrador, sin vencidos')
    # pospuesta y reactivación
    pg.click('#navTop [data-v="pacientes"]'); pg.click('.pitem >> text=Paciente Ficticia Cuatro'); tab(pg,'propuestas'); pg.click('[data-act="oppSel"] >> nth=1'); pg.wait_for_timeout(200)
    pg.select_option('#op_stage','pospuesta'); pg.wait_for_selector('#fb_why'); fb(pg,{'why':'Prefiere esperar'}); pg.wait_for_timeout(300); pg.select_option('#op_stage','consideracion'); pg.wait_for_timeout(300)
    hist=pg.evaluate("patient().opps[1].stageHist.map(h=>h.to)")
    T('T75',hist[-2:]==['pospuesta','consideracion'] and pg.evaluate("patient().opps[1].closeReason")=='Prefiere esperar' and 'perdida' not in pg.inner_text('#app').lower(),'pospuesta y reactivada conservando historial; sin etiqueta «perdida»')
    pg.select_option('#op_stage','no_indicada'); pg.wait_for_selector('#fbForm'); pg.click('#fbForm button[type=submit]'); pg.wait_for_timeout(300)
    T('T88',pg.evaluate("patient().opps[1].stage")=='no_indicada' and pg.evaluate("patient().opps[1].nextStep")=='no_contactar' and pg.evaluate("patient().tasks.filter(t=>t.status==='pendiente').length")==0,'«no indicada» cierra sin seguimiento comercial')
    # retiro de permiso de contacto
    pg.evaluate("(()=>{const p=patient();p.tasks.push(newTask({kind:'contacto',due:addDays(today(),1),note:'x'}));savePatient(p)})()"); tab(pg,'resumen'); pg.click('details:has(#pc_al) summary'); pg.select_option('#pc_al','no'); pg.wait_for_timeout(400)
    T('T90',pg.evaluate("patient().tasks.filter(t=>t.kind==='contacto').map(t=>t.status)")==['cancelada'] and pg.evaluate("canContact(patient())")==False and pg.evaluate("patient().contact.hist.length")>=1,'retirar permiso cancela tareas pendientes y bloquea borradores; historial conservado')
    # indicadores
    pg.click('#navTop [data-v="mas"]'); act(pg,'more','[data-m="indicadores"]'); ind=pg.inner_text('#app'); pg.screenshot(path=OUT+'/indicadores.png',full_page=True)
    m=pg.evaluate("metrics(addDays(today(),-90))")
    T('T86','Propuestas aceptadas / entregadas' in ind and '1 de 2 (50 %)' in ind and 'no son ingresos' in ind and 'No se registran en esta herramienta' in ind and m['emit']==2 and m['ent']==2 and m['hechas']==1,'tasas con fórmula y denominador; propuestas e ingresos no se mezclan')
    T('T87','Cuentan eventos registrados en este equipo, no pacientes únicos' in ind and m['leads']==1,'se declara que son eventos, no pacientes únicos')
    T('T89','Instagram' in ind or 'Recomendación' in ind,'fuente de captación reportada, sin tocar la timeline clínica')
    # ---------- H. documentos ----------
    pg.click('#navTop [data-v="pacientes"]'); pg.click('.pitem >> text=Paciente Ficticia Cuatro'); tab(pg,'docs'); n0=pg.evaluate("ui.docs.length")
    pdf=b'%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n'+b' '*300
    png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==')
    act(pg,'docAdd'); files(pg,'#fileDoc',[('consentimiento.pdf','application/pdf',pdf),('examen.jpg','image/jpeg',mkimg(pg,600,800,'EXAMEN')),('orden.png','image/png',png)]); pg.wait_for_timeout(900)
    n1=pg.evaluate("ui.docs.length")
    act(pg,'docAdd'); files(pg,'#fileDoc',[('malo.pdf','application/pdf',b'<html><script>alert(1)</script></html>'),('dibujo.svg','image/svg+xml',b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),('falso.jpg','image/jpeg',b'MZ\x90\x00'+b'\x00'*200)]); pg.wait_for_selector('#cbYes'); rej=pg.inner_text('#mCard'); pg.click('#cbYes'); pg.wait_for_timeout(300)
    T('T36',n1==n0+3 and pg.evaluate("ui.docs.filter(d=>d.src==='carga').every(d=>d.sha256.length===64&&d.status==='vigente')"),'PDF, JPG y PNG adjuntos con huella')
    T('T37',pg.evaluate("ui.docs.length")==n1 and 'HTML, SVG o ejecutables' in rej,'HTML renombrado, SVG y ejecutable rechazados por contenido; nada se ejecuta')
    first=pg.evaluate("ui.docs.find(d=>d.fileName==='consentimiento.pdf').id"); pg.select_option(f'#dc_{first}','Consentimiento quirúrgico'); pg.wait_for_timeout(200)
    pg.click(f'[data-act="docVersion"][data-id="{first}"]'); files(pg,'#fileDoc',[('consentimiento-v2.pdf','application/pdf',pdf+b'x')]); pg.wait_for_timeout(700)
    dv=pg.evaluate("ui.docs.filter(d=>d.category==='Consentimiento quirúrgico').map(d=>[d.version,d.status]).sort()")
    T('T38',dv==[[1,'obsoleto'],[2,'vigente']],'nueva versión conserva la anterior como obsoleta')
    fdoc=dl(pg,lambda:pg.click(f'[data-act="docDl"][data-id="{first}"]')); T('T36b',open(fdoc,'rb').read()==pdf,'descarga devuelve el archivo íntegro')
    pg.screenshot(path=OUT+'/documentos.png',full_page=True)
    # exportar caso con documentos y abrir en otro contexto
    tab(pg,'resumen'); act(pg,'exportCase'); pg.wait_for_selector('#fb_pass'); [el.check() for el in pg.locator('#fbForm input[type=checkbox]').all()]; fb(pg,{'pass':PW,'pass2':PW},submit=False); fcase=dl(pg,lambda:pg.click('#fbForm button[type=submit]'))
    ctx2,p2=page(b); ready(p2); p2.set_input_files('#fileCase',fcase); p2.wait_for_selector('#fb_pass'); fb(p2,{'pass':PW}); p2.wait_for_selector('#icNew'); p2.click('#icNew'); p2.wait_for_timeout(1200)
    r=p2.evaluate("(async()=>{const p=patient(),d=await Store.docsOf(p.id);return [d.length,p.opps[0].quotes.map(q=>q.version+q.state).join(),!!(await Store.get('docs',p.opps[0].quotes[0].pdfDocId)),p.episodes[0].performedAt,p.contact.allowed]})()")
    T('T48',r[0]==pg.evaluate("Store.docsOf(S.pid).then(d=>d.length)") and r[2],'variante ampliada: documentos y PDF emitidos viajan y se restauran completos')
    T('T84b',r[1]=='1sustituida,2aceptada' and r[4]=='no','versiones de propuesta y permiso de contacto conservados tras importar')
    ctx2.close()
    # ---------- I. biblioteca ----------
    tab(pg,'fotos'); pg.wait_for_selector('.gcard'); pg.check('.gsel'); pg.wait_for_timeout(200); act(pg,'libAdd'); pg.wait_for_selector('#cbYes'); blk=pg.inner_text('#mCard'); pg.click('#cbYes')
    T('T39','autorización de uso educativo' in blk and pg.evaluate("S.library.length")==0,'sin autorización de uso en consulta: no entra a la biblioteca')
    pg.evaluate("(()=>{const p=patient();p.consents.consult={ok:true,date:today(),note:''};savePatient(p)})()"); act(pg,'libAdd'); pg.wait_for_selector('#fb_proc'); fb(pg,{'proc':'Rinoplastia'}); pg.wait_for_timeout(300)
    pg.click('#navTop [data-v="mas"]'); act(pg,'more','[data-m="biblioteca"]'); lib=pg.inner_text('#app'); act(pg,'libOpen'); pg.wait_for_selector('#mCard img'); lm=pg.inner_text('#mCard'); pg.click('#lbNo')
    T('T40','Rinoplastia' in lib and 'Ficticia' not in lib and 'Simulación ilustrativa' in lm and pg.evaluate("S.library[0].kind")=='sim','caso aprobado visible sin nombre, rotulado como simulación ilustrativa (apartado distinto de casos reales)')
    pg.evaluate("(()=>{const p=S.patients.find(x=>x.id===S.library[0].patientId);p.consents.consult.ok=false;p.consents.consult.revokedAt=today();savePatient(p)})()"); act(pg,'more','[data-m="menu"]'); act(pg,'more','[data-m="biblioteca"]'); lib2=pg.inner_text('#app')
    T('T41','no se muestran' in lib2 and pg.locator('[data-act="libOpen"]').count()==0,'revocar la autorización bloquea el caso; no se promete borrar copias externas')
    # ---------- T11 alternancia con autoguardado ----------
    pid5=quick_case(pg,'Paciente Ficticia Cinco',sim=False); act(pg,'addPhotos'); pg.wait_for_selector('#w_visit'); pg.click('[data-act="wizStart"][data-way="importar"]'); pg.wait_for_timeout(300)
    act(pg,'capImport'); files(pg,'#fileLib',[('b.jpg','image/jpeg',mkimg(pg,900,1200,'B')),('c.jpg','image/jpeg',mkimg(pg,900,1200,'C'))]); pg.wait_for_selector('.tray .gcard'); pg.wait_for_timeout(600); act(pg,'capFinish'); pg.click('#cfReady'); pg.click('#crHere'); pg.wait_for_timeout(400)
    ids=pg.evaluate("ui.photos.map(x=>x.id)"); vals=[-70,35,-15]
    for i,(pid_,v) in enumerate(zip(ids,vals)):
        pg.click(f'.gcard [data-act="editPhoto"][data-id="{pid_}"]'); pg.wait_for_selector('#panel .ptabs'); pg.wait_for_timeout(350)
        place(pg,'rinoFrontal',[(450,512),(450,668),(394,670),(506,670)],{'dorso':v}); act(pg,'closeEditor'); pg.wait_for_selector('.gcard')   # sin esperar al autoguardado
    pg.click('#navTop [data-v="pacientes"]'); pg.click('.pitem >> text=Paciente Ficticia Cuatro'); pg.wait_for_timeout(100); pg.click('#navTop [data-v="pacientes"]'); pg.click('.pitem >> text=Paciente Ficticia Cinco'); flush(pg)
    ready(pg); got=pg.evaluate(f"Store.photosOf('{pid5}').then(a=>a.sort((x,y)=>x.createdAt-y.createdAt).map(p=>[p.mods.rinoFrontal&&p.mods.rinoFrontal.s.dorso,!!p.after]))")
    other=pg.evaluate(f"Store.photosOf('{pid}').then(a=>a[0].mods.rinoFrontal.s.dorso)")
    T('T11',[g[0] for g in got]==vals and all(g[1] for g in got) and other==-55,'tres fotos y dos pacientes alternados con autoguardado pendiente: sin pérdida ni contaminación cruzada')
    T('T96',pg.inner_text('#saveChip')=='Guardado en este dispositivo' and pg.evaluate("S.patients.length")>=4,'recarga: datos confirmados presentes')
    print('ERRS',pg.errs[:6]); dump('d.json'); b.close()
