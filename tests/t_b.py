from common import *
import hashlib
PW='clave-ficticia-2026'
def build_case(pg,name='Paciente Ficticia Dos'):
    new_case(pg,name,('nariz',),'guiada')
    for lab in ['FRONTAL','OBL DER']:
        act(pg,'capPick'); files(pg,'#fileLib',[('f.jpg','image/jpeg',mkimg(pg,900,1200,lab))]); pg.wait_for_selector('.capprev'); act(pg,'capAccept'); pg.wait_for_timeout(500)
    act(pg,'capMode','[data-m="tablero"]'); act(pg,'capFinish'); pg.click('#cfReady'); pg.click('#crHere'); pg.wait_for_timeout(500)
    ids=pg.evaluate("ui.photos.map(x=>x.id)")
    pg.click(f'.gcard [data-act="editPhoto"][data-id="{ids[0]}"]'); pg.wait_for_selector('#panel .modbtn'); pg.wait_for_timeout(700)
    place(pg,'rinoFrontal',[(450,512),(450,668),(394,670),(506,670)],{'dorso':-55,'base':-20})
    place(pg,'labios',[(385,772),(515,772),(450,762),(450,800)],{'sup':70})
    act(pg,'ptool','[data-t="pincel"]'); pg.click('.tool[data-t="inflar"]'); s=world(pg)
    pg.mouse.move(s[0]+s[2]*.3,s[1]+s[3]*.6); pg.mouse.down(); pg.mouse.move(s[0]+s[2]*.33,s[1]+s[3]*.62,steps=5); pg.wait_for_timeout(200); pg.mouse.up()
    act(pg,'ptool','[data-t="priv"]'); act(pg,'maskAdd','[data-sh="ell"]'); act(pg,'maskAdd','[data-sh="rect"]'); pg.click('[data-act="maskNudge"][data-dx="1"]')
    act(pg,'ptool','[data-t="sim"]'); act(pg,'scnSave'); pg.wait_for_timeout(500); flush(pg)
    act(pg,'closeEditor'); pg.wait_for_timeout(500)
    pg.click(f'.gcard [data-act="editPhoto"][data-id="{ids[1]}"]'); pg.wait_for_selector('#panel .modbtn'); pg.wait_for_timeout(600)
    act(pg,'allMods'); place(pg,'facial',[(300,640),(600,640),(260,780),(640,780),(450,890)],{'pomulo':40}); flush(pg); act(pg,'closeEditor'); pg.wait_for_timeout(400)
    # nota, cita, oportunidad con ventana, tarea
    pg.evaluate("""(()=>{const p=patient();p.clinicalNotes='Nota clínica ficticia';const a=newAppt({type:'control',date:addDays(today(),9),time:'10:30',status:'confirmed'});p.appts.push(a);
      const o=newOpp({interests:['Rinoplastia'],stage:'consideracion',window:{kind:'mes',y:2027,m:2,recordedAt:nowISO()},nextStep:'resolver_dudas'});o.plan.push({uid:uid(),procId:'rino',name:'Rinoplastia',minH:3,maxH:4,price:12000000,note:''});p.opps.push(o);
      p.tasks.push(newTask({oppId:o.id,kind:'enviar_info',due:addDays(today(),3),note:'Enviar información acordada'}));savePatient(p)})()"""); flush(pg)
    return ids
def snap(pg,pid=None):
    return pg.evaluate("""async(pid)=>{const p=pid?S.patients.find(x=>x.id===pid):patient();await Sim.leave();await Saver.flush();const phs=(await Store.photosOf(p.id)).sort((a,b)=>a.createdAt-b.createdAt);
      const out={id:p.id,name:p.name,notes:p.clinicalNotes,visits:p.visits.length,slots:p.visits[0].slots.map(s=>s.st+':'+(s.photoId||'')).join(','),appts:p.appts.map(a=>[a.id,a.date,a.time,a.status,a.hist.length]),opps:p.opps.map(o=>[o.id,o.stage,windowLabel(o.window),o.plan.length,o.quotes.length]),tasks:p.tasks.map(t=>[t.id,t.status,t.due]),photos:[]};
      for(const ph of phs)out.photos.push({id:ph.id,frame:ph.frame,view:ph.view,cls:ph.cls,cap:ph.capturedAt,mods:JSON.stringify(ph.mods),priv:JSON.stringify(ph.privacy.map(m=>[m.shape,Math.round(m.x),Math.round(m.y),Math.round(m.w),m.style])),scn:ph.scenarios.map(s=>s.name).join(''),active:ph.scn,
        brush:ph.brush?await sha256hex(new Uint8Array(ph.brush.buffer.slice(ph.brush.byteOffset,ph.brush.byteOffset+ph.brush.byteLength))):'',brushN:ph.brush?ph.brush.length:0,orig:await sha256hex(u8FromDataURL(ph.orig)),after:!!ph.after,maskS:!!ph.maskS});
      return out}""",pid)
def export_case(pg,pw=PW,docs=False):
    pg.click('[data-act="ptab"][data-arg="resumen"]'); pg.wait_for_timeout(200); act(pg,'exportCase'); pg.wait_for_selector('#fb_pass'); v={'pass':pw,'pass2':pw}
    if docs:
        for el in pg.locator('#fbForm input[type=checkbox]').all(): el.check()
    fb(pg,v,submit=False); return dl(pg,lambda:pg.click('#fbForm button[type=submit]'))
def import_file(pg,path,pw=PW,choose=None):
    pg.set_input_files('#fileCase',path); 
    if pw is not None:
        pg.wait_for_selector('#fb_pass'); fb(pg,{'pass':pw}); 
    pg.wait_for_timeout(300)
    if choose: pg.wait_for_selector(choose,timeout=30000); pg.click(choose); pg.wait_for_timeout(900)
with sync_playwright() as p:
    b=launch(p); ctx,pc=page(b); ready(pc)
    ids=build_case(pc); s1=snap(pc); pid=s1['id']
    f1=export_case(pc); raw=open(f1,'rb').read()
    T('T01',raw[:6]==b'YHPK1\n' and b'Ficticia' not in raw and b'JFIF' not in raw and os.path.basename(f1).endswith('.yhcase') and 'ficticia' not in f1.lower() and len(s1['photos'])==2 and s1['photos'][0]['brushN']>0,f'{os.path.basename(f1)} {len(raw)//1024} KB cifrado, sin nombre ni JPEG legible')
    # ---- segundo equipo (emulación móvil, almacenamiento limpio) ----
    ctx2,ph=page(b,390,844,mobile=True); ready(ph)
    before=ph.evaluate("S.patients.map(p=>p.id)")
    ph.click('#navBot [data-v="hoy"]'); ph.set_input_files('#fileCase',f1); ph.wait_for_selector('#fb_pass'); fb(ph,{'pass':'incorrecta-123'}); ph.wait_for_selector('#cbYes'); wrong=ph.inner_text('#mCard'); ph.click('#cbNo')
    T('T05a','contraseña no coincide' in wrong and ph.evaluate("S.patients.length")==len(before),'contraseña errónea: mensaje claro, cero registros')
    import_file(ph,f1,PW,'#icNew'); ph.wait_for_selector('.gcard'); s2=snap(ph)
    same=lambda a,b:[(x['mods'],x['priv'],x['scn'],x['brush'],x['orig'],x['frame'],x['view'],x['cap']) for x in a['photos']]==[(x['mods'],x['priv'],x['scn'],x['brush'],x['orig'],x['frame'],x['view'],x['cap']) for x in b['photos']]
    T('T02',same(s1,s2) and set(before)<=set(ph.evaluate("S.patients.map(p=>p.id)")) and s2['notes']=='Nota clínica ficticia','importado en navegador nuevo: puntos, deslizadores, pincel, censura, alternativas y hash de originales idénticos')
    T('T24',s2['slots']==s1['slots'] and ph.evaluate("patient().visits[0].cap") in ('lista','en_valoracion'),'plan de captura y estados intactos tras el traspaso')
    T('T63',s2['appts']==s1['appts'] and s2['opps']==s1['opps'] and s2['tasks']==s1['tasks'],'citas, oportunidad (ventana «febrero de 2027») y tareas conservan IDs y fechas')
    T('T84',s2['opps'][0][2]=='febrero de 2027' and s2['tasks'][0][0]==s1['tasks'][0][0],'oportunidades, tareas y versiones viajan con el caso')
    ph.screenshot(path=OUT+'/movil-galeria.png')
    # editar en el segundo equipo: 2 deslizadores, mover un punto, pintar, deshacer, mover máscara, agregar toma
    ph.click(f'.gcard [data-act="editPhoto"][data-id="{ids[0]}"]'); ph.wait_for_selector('#panel .modbtn'); ph.wait_for_timeout(900)
    ph.screenshot(path=OUT+'/movil-editor.png')
    if ph.evaluate("ui.mod")!='rinoFrontal': ph.click('.modbtn[data-m="rinoFrontal"]')
    slider(ph,'#s_dorso',-10); slider(ph,'#s_punta',25); ph.click('details summary'); ph.click('[data-act="nudge"][data-dy="1"]'); ph.click('[data-act="nudge"][data-dy="1"]')
    act(ph,'ptool','[data-t="pincel"]'); ph.click('.tool[data-t="reducir"]'); s=world(ph); ph.mouse.move(s[0]+s[2]*.6,s[1]+s[3]*.5); ph.mouse.down(); ph.mouse.move(s[0]+s[2]*.62,s[1]+s[3]*.52,steps=4); ph.wait_for_timeout(200); ph.mouse.up()
    act(ph,'undo'); act(ph,'redo')
    act(ph,'ptool','[data-t="priv"]'); ph.click('[data-act="maskSel"] >> nth=0'); [ph.click('[data-act="maskNudge"][data-dx="-1"]') for _ in range(5)]
    flush(ph); act(ph,'closeEditor'); ph.wait_for_timeout(500)
    act(ph,'addPhotos'); ph.wait_for_selector('#w_visit'); ph.click('[data-act="wizStart"][data-way="importar"]'); ph.wait_for_timeout(400)
    act(ph,'capImport'); files(ph,'#fileLib',[('n.jpg','image/jpeg',mkimg(ph,900,1200,'TOMA NUEVA'))]); ph.wait_for_selector('.tray .gcard'); 
    ph.screenshot(path=OUT+'/movil-captura.png')
    act(ph,'capFinish'); ph.click('#cfReady'); ph.click('#crHere'); ph.wait_for_timeout(500)
    s3=snap(ph); T('T25',len(s3['photos'])==3 and ph.evaluate("ui.photos.filter(x=>x.visitId===patient().visits[0].id).length")==3,'toma añadida durante la valoración queda en la misma visita')
    T('T08',s3['photos'][0]['priv']!=s2['photos'][0]['priv'],'capa de privacidad movida en el otro equipo sigue siendo editable')
    f2=export_case(ph)
    # ---- de regreso al primer equipo ----
    others=pc.evaluate("S.patients.filter(p=>p.id!==patient().id).map(p=>[p.id,p.updatedAt])")
    pc.click('#navTop [data-v="hoy"]'); pc.set_input_files('#fileCase',f2); pc.wait_for_selector('#fb_pass'); fb(pc,{'pass':PW}); pc.wait_for_selector('#icRep'); prev=pc.inner_text('#mCard'); pc.screenshot(path=OUT+'/import-conflicto.png'); pc.click('#icRep'); pc.wait_for_timeout(1200)
    s4=snap(pc,pid); rec=pc.evaluate("Store.all('recovery').then(r=>r.map(x=>[x.id,x.photos.length]))")
    T('T03',same(s3,s4) and len(s4['photos'])==3 and pc.evaluate("S.patients.filter(p=>p.id!==S.pid).map(p=>[p.id,p.updatedAt])")==others and '"dorso":-10' in s4['photos'][0]['mods'],'revisión del 2º equipo aplicada; otras pacientes sin cambios')
    T('T98','ya existe en este equipo' in prev and '2 foto' in prev and '3 foto' in prev and rec==[['case:'+pid,2]],'vista previa con diferencias, confirmación y copia de recuperación')
    # mismo archivo dos veces
    pc.click('#navTop [data-v="hoy"]'); pc.set_input_files('#fileCase',f2); pc.wait_for_selector('#fb_pass'); fb(pc,{'pass':PW}); pc.wait_for_selector('#icRep'); dup=pc.inner_text('#mCard')
    n0=pc.evaluate("S.patients.length"); pc.click('#icBoth'); pc.wait_for_timeout(1200); n1=pc.evaluate("S.patients.length"); cp=snap(pc)
    T('T04','mismo archivo ya se importó' in dup and n1==n0+1 and cp['id']!=pid and len(cp['photos'])==3 and cp['slots'].count(':')==s4['slots'].count(':') and all(i['id'] not in [x['id'] for x in s4['photos']] for i in cp['photos']),'duplicado detectado; «conservar ambas» crea ficha aparte con IDs nuevos y vínculos íntegros')
    # corrupto y truncado
    snapshot=lambda:pc.evaluate("(async()=>[(await Store.keys('patients')).sort().join(),(await Store.keys('photos')).sort().join()])()")
    k0=snapshot(); bad=bytearray(raw); bad[len(bad)//2]^=0xFF; open(OUT+'/corrupto.yhcase','wb').write(bad); open(OUT+'/truncado.yhcase','wb').write(raw[:len(raw)//2]); open(OUT+'/basura.yhcase','wb').write(b'no soy un paquete'*50)
    msgs=[]
    for f,needpw in [('corrupto.yhcase',True),('truncado.yhcase',False),('basura.yhcase',False)]:
        pc.click('#navTop [data-v="hoy"]'); pc.set_input_files('#fileCase',OUT+'/'+f)
        if needpw: pc.wait_for_selector('#fb_pass'); fb(pc,{'pass':PW})
        pc.wait_for_selector('#cbYes'); msgs.append(pc.inner_text('#mCard')); pc.click('#cbNo'); pc.wait_for_timeout(150)
    T('T05','alterado' in msgs[0] and 'incompleto' in msgs[1] and 'no es un paquete' in msgs[2].lower() or 'No se importó nada' in msgs[2] and snapshot()==k0,'corrupto, truncado y ajeno: mensajes claros; base idéntica')
    T('T05b',snapshot()==k0,'cero registros dañados tras tres importaciones fallidas')
    # recuperar versión anterior
    pc.click('#navTop [data-v="mas"]'); act(pc,'more','[data-m="respaldo"]'); pc.wait_for_selector('[data-act="undoReplace"]'); pc.screenshot(path=OUT+'/respaldos.png'); act(pc,'undoReplace'); pc.click('#cbYes'); pc.wait_for_timeout(800)
    s5=snap(pc,pid); T('T09',len(s5['photos'])==2 and same(s1,s5),'versión previa recuperable tras reemplazo')
    # respaldo completo + restauración con falla inyectada
    pc.click('#navTop [data-v="mas"]'); act(pc,'more','[data-m="respaldo"]'); act(pc,'backup'); pc.wait_for_selector('#fb_pass'); fb(pc,{'pass':PW,'pass2':PW},submit=False); fbk=dl(pc,lambda:pc.click('#fbForm button[type=submit]'))
    k1=snapshot(); pc.evaluate("Store.testFailAt=5"); pc.set_input_files('#fileCase',fbk); pc.wait_for_selector('#fb_pass'); fb(pc,{'pass':PW}); pc.wait_for_selector('#ibAll'); pc.click('#ibAll'); pc.wait_for_selector('#fb_ok'); fb(pc,{'ok':True,'bk':True}); pc.wait_for_selector('#cbYes'); fail=pc.inner_text('#mCard'); pc.click('#cbNo'); pc.evaluate("Store.testFailAt=null")
    T('T17','No se restauró nada' in fail and snapshot()==k1,'falla inyectada a mitad de restauración: transacción cancelada, base íntegra')
    # restauración correcta en equipo limpio (agregar) 
    ctx3,p3=page(b); ready(p3); p3.set_input_files('#fileCase',fbk); p3.wait_for_selector('#fb_pass'); fb(p3,{'pass':PW}); p3.wait_for_selector('#ibAdd'); p3.click('#ibAdd'); p3.wait_for_timeout(1500)
    T('respaldo',p3.evaluate("S.patients.length")==pc.evaluate("S.patients.length") and p3.evaluate("Store.keys('photos').then(k=>k.length)")==pc.evaluate("Store.keys('photos').then(k=>k.length)"),'.yhbackup restaura en equipo limpio sin sustituir')
    # JSON legado
    leg='/home/claude/test/backup.json'
    if os.path.exists(leg):
        n0=p3.evaluate("S.patients.length"); p3.click('#navTop [data-v="hoy"]'); p3.set_input_files('#fileCase',leg); p3.wait_for_selector('#ibAdd,#cbYes'); lm=p3.inner_text('#mCard')
        if p3.locator('#ibAdd:not([disabled])').count():
            p3.click('#ibAdd'); p3.wait_for_timeout(1200)
        else: p3.click('#ibNo')
        T('T06','versión anterior' in lm and 'sin cifrado' in lm and p3.evaluate("S.patients.length")>=n0,'JSON legado: vista previa, conversión controlada, sin sustitución (agrega solo los inexistentes)')
    T('T95','Sincroniz' not in pc.inner_text('body') and 'sincronizado' not in ph.inner_text('body').lower() and pc.inner_text('#saveChip')=='Guardado en este dispositivo','no aparece «Sincronizado»; el estado dice «Guardado en este dispositivo»')
    print('ERRS',pc.errs[:5],ph.errs[:5],p3.errs[:5]); dump('b.json'); b.close()
