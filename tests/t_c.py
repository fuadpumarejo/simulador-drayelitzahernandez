from common import *
import re
from pypdf import PdfReader
PW='clave-ficticia-2026'
with sync_playwright() as p:
    b=launch(p)
    # ---------- E. migración desde la versión anterior (v2) ----------
    ctx,pg=page(b); pg.goto(U+'legacy/index.v2.html'); pg.wait_for_selector('.pitem'); pg.wait_for_timeout(500)
    pg.evaluate("""(async()=>{const p=S.patients[0];p.status='Programada';p.date='2027-01-20';p.nextDate='2026-11-20';p.nextNote='Llamar para confirmar';p.journey=[{id:'j1',date:'2026-11-01',type:'Consulta de valoración',note:'Primera consulta'}];await Store.put('patients',p);
      const q={id:'leg2',name:'Legado Sin Plan',doc:'',birth:'',phone:'',email:'',notes:'',status:'Valoración',date:'',discount:0,plan:[],createdAt:Date.now(),updatedAt:Date.now()};await Store.put('patients',q)})()""")
    pg.errs.clear(); ready(pg)
    m=pg.evaluate("""(async()=>{const p=S.patients.find(x=>x.id==='demo'),q=S.patients.find(x=>x.id==='leg2'),ph=(await Store.photosOf('demo'))[0],pre=await Store.get('kv','preMigration-v3');
      return{schema:p.schema,visits:p.visits.length,appts:p.appts.length,eps:p.episodes.length,opps:p.opps.map(o=>[o.stage,o.legacyStatus,o.tentative,o.review,o.plan.length,o.apptId]),tasks:p.tasks.map(t=>[t.due,t.note,t.review,t.status]),log:p.log.map(j=>[j.date,j.type,j.src]),legacy:p.legacy,
        q:[q.opps.length,q.tasks.length,q.visits.length],ph:[ph.frame,ph.view,ph.cls,ph.capturedAt,ph.capturedSrc,ph.label,!!ph.mods.rinoFrontal,ph.schema],pre:pre&&pre.patients.length,cat:S.settings.catalog.length}})()""")
    ok64=m['visits']==0 and m['appts']==0 and m['eps']==0 and m['opps']==[['revisar','Programada','2027-01-20',True,2,None]] and m['tasks']==[['2026-11-20','Llamar para confirmar',True,'pendiente']] and m['log']==[['2026-11-01','Consulta de valoración','legado']] and m['ph'][3]=='' and m['ph'][4]=='unknown' and m['pre']==2
    T('T64',ok64,'p.date→tentativa; p.nextDate→tarea por revisar; journey→historial; sin visitas, citas ni cirugías inventadas; copia previa guardada')
    T('T85',m['opps'][0][0]=='revisar' and m['opps'][0][5] is None,'«Programada» heredada queda por revisar, sin cita quirúrgica inventada')
    T('T27',m['ph'][0]=='cara' and m['ph'][2]==False and m['ph'][5]=='Rostro de frente' and m['q']==[0,0,0],'foto con label conserva propuesta sin confirmar; ficha sin plan no genera oportunidad')
    ready(pg); m2=pg.evaluate("[S.patients.find(x=>x.id==='demo').opps.length,S.patients.find(x=>x.id==='demo').tasks.length,S.patients.find(x=>x.id==='demo').log.length]")
    T('T64b',m2==[1,1,1],'reiniciar no duplica la migración')
    hoy=pg.inner_text('#app'); T('5E.8-bandeja','heredados por revisar' in hoy.lower(),'bandeja de datos heredados en Hoy')
    # regresión del motor con foto y módulos heredados
    pg.click('#navTop [data-v="pacientes"]'); pg.click('.pitem >> text=Paciente de ejemplo'); pg.click('[data-act="ptab"][data-arg="fotos"]'); pg.wait_for_selector('.gcard'); pg.click('.gcard [data-act="editPhoto"]'); pg.wait_for_selector('#panel .modbtn'); pg.wait_for_timeout(1500)
    eng=pg.evaluate("(()=>{const c=Engine.cv;Engine.render();const g=document.createElement('canvas');g.width=c.width;g.height=c.height;g.getContext('2d').drawImage(c,0,0);const d=g.getContext('2d').getImageData(450,600,1,1).data;return [c.width,c.height,d[0]>0,ui.mod,!!curPhoto().mods.lifting]})()")
    slider(pg,'#s_dorso',30); flush(pg); aft=pg.evaluate("[curPhoto().mods.rinoFrontal.s.dorso,!!curPhoto().after]")
    act(pg,'closeEditor'); pg.wait_for_timeout(400); pg.click('[data-act="ptab"][data-arg="propuestas"]'); pg.wait_for_selector('#planRows'); tot=pg.inner_text('#totals')
    fx=dl(pg,lambda:act(pg,'xls'))
    T('T15',eng[0]==900 and eng[2] and eng[3]=='rinoFrontal' and aft==[30,True] and '4 a 6 h' in tot and fx.endswith('.xlsx') and os.path.getsize(fx)>3000,'WebGL, módulos heredados, deslizadores, totales de tiempo y Excel funcionan tras migrar')
    pg.screenshot(path=OUT+'/propuestas-legado.png',full_page=True)
    # etapa: programada exige cita real
    pg.select_option('#op_stage','programada'); pg.wait_for_selector('#cbYes'); need=pg.inner_text('#mCard'); pg.click('#cbYes'); pg.wait_for_timeout(200)
    T('T72a','requiere una cita' in need and pg.evaluate("patient().opps[0].stage")=='revisar','no se puede marcar «programada» sin cita real')
    pg.select_option('#op_stage','realizada'); pg.wait_for_selector('#cbYes'); need2=pg.inner_text('#mCard'); pg.click('#cbYes'); pg.wait_for_timeout(200)
    T('T59a','registro clínico' in need2.lower() or 'registra primero' in need2,'no se puede cerrar como realizada sin registro del procedimiento')
    ctx.close()
    # ---------- F. agenda y fechas ----------
    ctx,pg=page(b); ready(pg)
    new_case(pg,'Paciente Ficticia Tres',('nariz',),'importar'); act(pg,'capFinish'); pg.click('#cfReady'); pg.click('#crHere'); pg.wait_for_timeout(300); pid=pg.evaluate("S.pid")
    D=lambda n:pg.evaluate(f"addDays(today(),{n})")
    pg.click('#navTop [data-v="agenda"]'); act(pg,'apptNew'); pg.wait_for_selector('#fb_pid'); fb(pg,{'pid':pid,'type':'valoracion','date':D(5),'time':'09:00','dur':'40'}); pg.wait_for_timeout(300)
    aid=pg.evaluate(f"S.patients.find(p=>p.id==='{pid}').appts[0].id")
    inCal=pg.evaluate(f"agendaItems().filter(x=>x.id==='{aid}').length"); pg.click('#navTop [data-v="pacientes"]'); pg.click('.pitem >> text=Paciente Ficticia Tres'); pg.click('[data-act="ptab"][data-arg="visitas"]'); pg.wait_for_timeout(300); vis=pg.inner_text('#tab')
    T('T49',inCal==1 and '09:00' in vis and pg.locator(f'[data-act="apptOpen"][data-id="{aid}"]').count()>=1 and pg.evaluate("patient().visits.filter(v=>v.type==='valoracion'&&v.apptId).length")==0,'cita creada en el calendario aparece en la ficha con el mismo ID; no crea visita')
    # .ics y luego reprogramar
    pg.click(f'[data-act="apptOpen"][data-id="{aid}"]'); pg.wait_for_selector('[data-ax="ics"]'); fi=dl(pg,lambda:pg.click('[data-ax="ics"]')); ics=open(fi,encoding='utf-8').read()
    d5=D(5).replace('-','')
    T('T61','Ficticia' not in ics and 'aloraci' not in ics and f'DTSTART;TZID=America/Bogota:{d5}T090000' in ics and f'DTEND;TZID=America/Bogota:{d5}T094000' in ics and 'TZOFFSETTO:-0500' in ics and f'UID:{aid}@' in ics and 'SUMMARY:Cita SKIND' in ics,'.ics con asunto neutro, UID estable y zona horaria; sin nombre ni tipo de cita')
    pg.click(f'[data-act="apptResched"][data-id="{aid}"]'); pg.wait_for_selector('#fb_date'); warn=pg.inner_text('#mCard'); fb(pg,{'date':D(7),'time':'11:00','reason':'Pide cambio'}); pg.wait_for_timeout(300)
    a=pg.evaluate("patient().appts[0]"); cal=pg.evaluate(f"agendaItems().find(x=>x.id==='{aid}').date")
    T('T50',a['date']==D(7) and a['time']=='11:00' and a['hist'][0]['fromDate']==D(5) and a['hist'][0]['reason']=='Pide cambio' and cal==D(7) and a['id']==aid,'reprogramada: mismo evento, nueva fecha en ficha y calendario, historial con fecha previa y motivo')
    T('T114',a['seq']==1 and len(a['hist'])==1,'reprogramar desde la ficha/agenda cambia el mismo evento')
    T('T62','no se actualiza solo' in warn,'aviso: el .ics exportado no se actualiza al reprogramar')
    # solapamiento
    pg.click('[data-act="apptNew"]'); pg.wait_for_selector('#fb_type'); fb(pg,{'type':'control','date':D(7),'time':'11:15'}); pg.wait_for_selector('#cbYes'); ov=pg.inner_text('#mCard'); pg.click('#cbYes'); pg.wait_for_timeout(300)
    T('T60a','se cruza' in ov and pg.evaluate("patient().appts.length")==2,'aviso de solapamiento sin bloqueo')
    # no asistió / cancelar
    a2=pg.evaluate("patient().appts[1].id"); pg.click(f'[data-act="apptOpen"][data-id="{a2}"]'); pg.click('[data-ax="no_show"]'); pg.wait_for_timeout(200)
    T('T51',pg.evaluate("patient().appts[1].status")=='no_show' and pg.evaluate("patient().visits.length")==1 and 'Control realizada' not in pg.inner_text('#tab'),'«No asistió» no genera atención ni control cumplido')
    # llegó + registrar atención
    pg.evaluate(f"(()=>{{const a=patient().appts[0];a.date=today();savePatient(patient())}})()"); pg.click('#navTop [data-v="hoy"]'); pg.wait_for_timeout(200)
    pg.click(f'[data-act="apptSet"][data-id="{aid}"]'); pg.wait_for_timeout(200); pg.click(f'[data-act="apptAttend"][data-id="{aid}"]'); pg.wait_for_selector('#fb_date'); fb(pg,{'notes':'Observación ficticia'}); pg.wait_for_timeout(400)
    v=pg.evaluate("patient().visits.find(v=>v.apptId)"); 
    T('T52',v and v['date']==pg.evaluate('today()') and v['type']=='valoracion' and pg.evaluate("patient().appts[0].status")=='completed' and pg.evaluate("patient().episodes.length")==0,'llegó + registrar atención: visita ligada a la cita, sin crear cirugía')
    # procedimiento realizado + controles; control sin cita previa
    act(pg,'visitRetro'); pg.wait_for_selector('#fb_type'); fb(pg,{'type':'control','date':D(-1),'phase':'posoperatoria'}); pg.wait_for_timeout(300)
    act(pg,'epPerformed'); pg.wait_for_selector('#fb_name'); fb(pg,{'name':'Rinoplastia','date':D(1)}); futerr=pg.inner_text('#fbErr'); fb(pg,{'date':D(-30)}); pg.wait_for_selector('#cbYes'); pg.click('#cbYes'); pg.wait_for_selector('#fb_c0'); fb(pg,{'c0':True,'c2':True}); pg.wait_for_timeout(300)
    ep=pg.evaluate("patient().episodes[0]"); ctr=pg.evaluate("patient().appts.filter(a=>a.type==='control'&&a.status==='tentative').map(a=>[a.date,a.episodeId])")
    T('T53','no puede tener fecha futura' in futerr and ep['performedAt']==D(-30) and len(ctr)==2 and ctr[0][0]==pg.evaluate(f"addDays('{D(-30)}',7)") and ctr[0][1]==ep['id'],'control retro sin cita y controles elegidos de plantilla desde la fecha real; ninguno se impone')
    act(pg,'epPerformed'); pg.wait_for_selector('#fb_name'); fb(pg,{'name':'Blefaroplastia','date':D(-5)}); pg.wait_for_selector('#cbYes'); pg.click('#cbNo'); pg.wait_for_timeout(200)
    pg.evaluate("(()=>{const p=patient();p.visits.find(v=>v.type==='control').episodeId=p.episodes[1].id;savePatient(p)})()")
    T('T54',pg.evaluate("patient().episodes.length")==2 and pg.evaluate("patient().visits.filter(v=>!v.episodeId).length")>=1 and pg.evaluate("patient().appts.filter(a=>a.episodeId===patient().episodes[0].id).length")==2,'dos episodios; cada control o visita va a su episodio o queda «sin asignar»')
    tl=pg.inner_text('.tl'); T('5D.3-linea','Procedimiento realizado: Rinoplastia' in tl and 'Cita reprogramada' in tl,'línea de tiempo con hechos clínicos y agenda diferenciados')
    # agenda: vistas y capas, ventana tentativa
    pg.evaluate("(()=>{const p=patient();const o=newOpp({interests:['Lipoescultura'],stage:'consideracion',window:{kind:'quincena',y:+today().slice(0,4),m:+today().slice(5,7),half:+today().slice(8,10)>15?2:1,recordedAt:nowISO()}});p.opps.push(o);p.tasks.push(newTask({oppId:o.id,due:today(),note:'Enviar info'}));savePatient(p)})()")
    pg.click('#navTop [data-v="agenda"]'); 
    for mo in ['mes','semana','dia','lista']: pg.click(f'[data-act="calMode"][data-m="{mo}"]'); pg.wait_for_timeout(150); pg.screenshot(path=OUT+f'/agenda-{mo}.png')
    pg.click('[data-act="calMode"][data-m="mes"]'); tent=pg.locator('.ev.tent').count(); its=pg.evaluate("agendaItems().filter(x=>x.layer==='tentativo').map(x=>[x.kind,x.tent,x.title])")
    pg.click('[data-act="calLayer"][data-l="tentativo"]'); tent2=pg.locator('.ev.tentativo').count(); pg.click('[data-act="calLayer"][data-l="tentativo"]')
    T('T60',tent>0 and tent2==0,'vistas lista/día/semana/mes y filtro por capas')
    T('T83',its and its[0][0]=='window' and its[0][1]==True and 'sin reserva' in its[0][2] and pg.evaluate("overlaps(newAppt({date:today(),time:'10:00'}),null).filter(x=>x.kind==='window').length")==0,'ventana tentativa con estilo propio; no bloquea horario')
    T('T71','quincena' in its[0][2] and pg.evaluate("patient().appts.filter(a=>a.type==='procedimiento').length")==0,'«quincena» se muestra como ventana estimada, sin cirugía programada')
    T('T65',pg.evaluate("typeof Notification==='undefined'||Notification.permission!=='granted'") and 'no envía recordatorios' in pg.inner_text('#app'),'agenda local sin notificaciones; no afirma haber enviado recordatorios')
    ctx.close()
    # zona horaria distinta
    ctx,pg=page(b,tz='Asia/Tokyo'); ready(pg); new_case(pg,'Paciente Zona',(),'libre'); act(pg,'capFinish'); pg.click('#cfReady'); pg.click('#crHere'); pg.wait_for_timeout(300)
    r=pg.evaluate("""(()=>{const p=patient();const a=newAppt({date:'2026-12-31',time:'23:30'});p.appts.push(a);const o=newOpp({tentative:'2027-03-01'});p.opps.push(o);return [a.date,a.tz,fmtDate(a.date),fmtLong('2026-12-31'),today()===civil(new Date()),agendaItems().find(x=>x.kind==='tent').date,deviceTZ(),icsFor(a).includes('DTSTART;TZID=America/Bogota:20261231T233000')]})()""")
    T('T66',r[0]=='2026-12-31' and r[1]=='America/Bogota' and r[2]=='31/12/2026' and 'jueves 31' in r[3] and r[5]=='2027-03-01' and r[6]=='Asia/Tokyo' and r[7],'equipo en Asia/Tokyo: la fecha civil y la hora local de la cita no se corren; se muestra la zona de origen')
    ctx.close(); dump('c.json'); print('done'); b.close()
