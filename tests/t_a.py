from common import *
import zipfile, re
with sync_playwright() as p:
    b=launch(p); ctx,pg=page(b); ready(pg)
    # ---------- A. flujo de consulta y captura ----------
    act(pg,'newVal'); pg.wait_for_selector('#w_name')
    T('T91',pg.locator('#stage').count()==0 and pg.locator('#w_name').count()==1,'Nueva valoración abre registro, no el editor')
    pg.fill('#w_name','Paciente Ficticia Uno'); act(pg,'wizNext'); pg.wait_for_timeout(150)
    blocked=pg.locator('#w_err:not(.hide)').count()==1
    pg.check('#w_cd'); pg.check('#w_cp'); act(pg,'wizNext'); pg.wait_for_timeout(200)
    for r in ['nariz','rostro']: pg.click(f'[data-act="wizRegion"][data-r="{r}"]')
    hint=pg.inner_text('#w_plan')
    T('T28b',blocked,'sin autorización de fotos no deja pasar a captura')
    pg.click('[data-act="wizStart"][data-way="guiada"]'); pg.wait_for_selector('.guide svg')
    slots=pg.evaluate("patient().visits[0].slots.map(s=>s.frame+':'+s.view+':'+s.req+':'+s.regions.join('+'))")
    T('T19',len(slots)==6 and len(set(s.rsplit(':',2)[0] for s in slots))==6 and 'cara:frontal:true:nariz+rostro' in slots,f'plan {len(slots)} vistas sin duplicados; {hint}')
    img=lambda lab,w=900,h=1200,**k:('foto.jpg','image/jpeg',mkimg(pg,w,h,lab,**k))
    ok20=pg.inner_text('.stepper').startswith('Foto 1 de 6') and pg.locator('.guide svg').count()==1
    act(pg,'capPick'); files(pg,'#fileLib',[img('FRONTAL')]); pg.wait_for_selector('.capprev')
    act(pg,'capRetry'); pg.wait_for_selector('.capprev',state='detached',timeout=8000); retry=pg.locator('.capprev').count()==0 and pg.locator('[data-act="capPick"]').count()==1
    act(pg,'capPick'); files(pg,'#fileLib',[img('FRONTAL 2')]); pg.wait_for_selector('.capprev'); act(pg,'capAccept'); pg.wait_for_function("document.querySelector('.stepper')&&document.querySelector('.stepper').innerText.includes('Foto 2 de 6')&&!document.querySelector('.capprev')",timeout=15000)
    step2=pg.inner_text('.stepper')
    act(pg,'capSkip'); pg.wait_for_selector('#fb_why'); fb(pg,{'why':'Se tomará después'}); pg.wait_for_function("patient().visits[0].slots[1].st==='omitida'",timeout=8000)
    T('T20',ok20 and retry and step2.startswith('Foto 2 de 6') and pg.evaluate("patient().visits[0].slots[1].st")=='omitida','guía, repetir, aceptar, omitir con motivo (emulación de escritorio; falta iPhone real)')
    # pausa y reanudación
    pg.click('#navTop [data-v="hoy"]'); pg.wait_for_timeout(200)
    hoy=pg.inner_text('#app'); T('T117a','Fotografías en preparación' in hoy and 'continuar donde quedó' in hoy.lower(),'Hoy muestra continuar donde quedó')
    pg.click('[data-act="resumeCapture"]'); pg.wait_for_timeout(400)
    T('T93',pg.evaluate("patient().visits[0].slots[0].st")=='hecha' and '1 de 6' in pg.inner_text('#app'),'pausa y reanuda sin pérdida')
    # importación en lote + captura libre → bandeja
    act(pg,'capImport'); files(pg,'#fileLib',[('a.jpg','image/jpeg',mkimg(pg,900,1200,'ABDOMEN VERTICAL')),('b.jpg','image/jpeg',mkimg(pg,1200,900,'OBLICUA',exif='2026:10:05 14:30:00')),('c.jpg','image/jpeg',mkimg(pg,900,1200,'LATERAL')),
        ('d.jpg','image/jpeg',mkimg(pg,900,1200,'D')),('e.jpg','image/jpeg',mkimg(pg,900,1200,'E')),('f.jpg','image/jpeg',mkimg(pg,900,1200,'F'))]); pg.wait_for_selector('.tray .gcard',timeout=15000); pg.wait_for_timeout(1200)
    tray=pg.evaluate("ui.photos.filter(x=>!x.slotId).map(x=>[x.frame,x.view,x.cls,x.capturedAt,x.capturedSrc,x.label])")
    T('T21',len(tray)==6 and all(t[2]==False for t in tray),f'6 fotos en Por clasificar')
    T('T94',all(t[0] is None and t[5]=='' for t in tray),'imagen vertical no se clasifica sola como rostro')
    T('T55',sum(1 for t in tray if t[3]=='' and t[4]=='unknown')==5,'sin EXIF: fecha de toma sin confirmar, no se asigna hoy')
    T('T56a',any(t[3]=='2026-10-05T14:30:00' and t[4]=='exif' for t in tray),'fecha EXIF leída como propuesta')
    # asignar dos desde la bandeja
    sels=pg.locator('[data-tray]'); n0=sels.count()
    opt=pg.evaluate("patient().visits[0].slots.filter(s=>s.st!=='hecha').map(s=>s.id)")
    sels.nth(0).select_option(opt[0]); pg.wait_for_timeout(400); pg.locator('[data-tray]').nth(1).select_option(opt[1]); pg.wait_for_timeout(400)
    g=pg.evaluate("capProgress(patient().visits[0])")
    T('T22',g['done']==3 and pg.locator('[data-tray]').count()==n0-2,'mezcla de capturadas e importadas en un solo plan')
    # otra vista (clasificación manual) con corrección de fecha EXIF
    idx=pg.evaluate("ui.photos.filter(x=>!x.slotId).findIndex(x=>x.capturedSrc==='exif')")
    pg.locator('[data-tray]').nth(idx).select_option('otra'); pg.wait_for_selector('#fb_frame'); fb(pg,{'frame':'torso','view':'frontal','phase':'consulta','date':'2026-10-06'})
    ph=pg.evaluate("ui.photos.find(x=>x.frame==='torso')")
    T('T23',ph and ph['cls']==True and ph['view']=='frontal','foto libre clasificada manualmente')
    T('T56',ph['capturedAt']=='2026-10-06' and ph['capturedSrc']=='manual' and ph['capturedExif']=='2026-10-05T14:30:00','corrección de fecha conserva el valor original del archivo')
    # modo guiado <-> tablero conserva progreso
    act(pg,'capMode','[data-m="guiada"]'); pg.wait_for_timeout(200); act(pg,'capMode','[data-m="tablero"]'); pg.wait_for_timeout(200)
    T('T111',pg.evaluate("capProgress(patient().visits[0]).done")==3,'cambiar entre guiada y tablero conserva progreso')
    # archivo no válido / HEIC
    act(pg,'capImport'); files(pg,'#fileLib',[('x.jpg','image/jpeg',b'<html><script>alert(1)</script></html>')]); pg.wait_for_selector('#mCard'); m1=pg.inner_text('#mCard'); pg.click('#cbYes')
    heic=b'\x00\x00\x00\x18ftypheic\x00\x00\x00\x00mif1heic'+b'\x00'*200
    act(pg,'capImport'); files(pg,'#fileLib',[('IMG_1.HEIC','image/heic',heic)]); pg.wait_for_selector('#mCard'); m2=pg.inner_text('#mCard'); pg.click('#cbYes')
    n_after=pg.evaluate("ui.photos.length")
    T('T104','no es una fotografía' in m1 and 'HEIC' in m2 and n_after==7,'errores específicos; nada alterado')
    T('T18','HEIC' in m2,'HEIC no compatible: mensaje de conversión (orientación EXIF: pendiente con fotos reales)')
    act(pg,'capFinish'); pg.wait_for_selector('#cfReady'); summ=pg.inner_text('#mCard'); pg.click('#cfReady'); pg.wait_for_selector('#crHere'); pg.click('#crHere'); pg.wait_for_timeout(600)
    T('T92',pg.evaluate("patient().visits[0].cap")=='lista' and pg.evaluate("patient().opps.length")==0,'caso listo sin forzar procedimiento')
    pg.screenshot(path=OUT+'/galeria.png',full_page=True)
    # ---------- B. simulación ----------
    first=pg.evaluate("ui.photos.find(x=>x.frame==='cara'&&x.view==='frontal').id")
    pg.click(f'.gcard [data-act="editPhoto"][data-id="{first}"]'); pg.wait_for_selector('#panel .modbtn'); pg.wait_for_timeout(800)
    sug=pg.eval_on_selector_all('#panel .modbtn','e=>e.map(x=>x.dataset.m)')
    T('T102','rinoFrontal' in sug and 'mamas' not in sug and pg.locator('[data-act="allMods"]').count()==1,'módulos sugeridos según la vista; resto tras «Ver todos»')
    place(pg,'rinoFrontal',[(450,512),(450,668),(394,670),(506,670)],{'dorso':-60,'punta':-30})
    place(pg,'labios',[(385,772),(515,772),(450,762),(450,800)],{'sup':80})
    v1=pg.evaluate("curPhoto().mods.rinoFrontal.s.dorso")
    act(pg,'undo'); u1=pg.evaluate("curPhoto().mods.labios.s.sup||0"); act(pg,'redo'); u2=pg.evaluate("curPhoto().mods.labios.s.sup")
    # pincel
    act(pg,'ptool','[data-t="pincel"]'); pg.click('.tool[data-t="inflar"]'); s=world(pg)
    pg.mouse.move(s[0]+s[2]*.3,s[1]+s[3]*.6); pg.mouse.down(); pg.mouse.move(s[0]+s[2]*.32,s[1]+s[3]*.62,steps=6); pg.wait_for_timeout(250); pg.mouse.up()
    hb=pg.evaluate("Engine.hasBrush()"); act(pg,'undo'); hb2=pg.evaluate("Engine.hasBrush()"); act(pg,'redo'); hb3=pg.evaluate("Engine.hasBrush()")
    # nudge de punto sin arrastre
    act(pg,'ptool','[data-t="sim"]'); pg.click('.modbtn[data-m="rinoFrontal"]') if pg.evaluate("ui.mod")!='rinoFrontal' else None
    a0=pg.evaluate("curPhoto().mods.rinoFrontal.a.raiz"); pg.click('details summary'); pg.click('[data-act="nudge"][data-dx="1"]'); a1=pg.evaluate("curPhoto().mods.rinoFrontal.a.raiz")
    T('T106',a1[0]>a0[0],'punto anatómico ajustable con botones, sin arrastre')
    # privacidad
    act(pg,'ptool','[data-t="priv"]'); act(pg,'maskAdd','[data-sh="ell"]'); slider(pg,'#mk_w',220); slider(pg,'#mk_h',220)
    act(pg,'maskAdd','[data-sh="rect"]'); [pg.click('[data-act="maskNudge"][data-dy="1"]') for _ in range(12)]
    masks=pg.evaluate("curPhoto().privacy.map(m=>[m.shape,m.style,m.opacity,Math.round(m.x),Math.round(m.y),Math.round(m.w)])")
    act(pg,'undo'); mU=pg.evaluate("Math.round(curPhoto().privacy[1].y)"); act(pg,'redo')
    T('T97',v1==-60 and u1==0 and u2==80 and hb and not hb2 and hb3 and mU<masks[1][4],'deshacer/rehacer en deslizador, pincel y censura')
    pg.screenshot(path=OUT+'/editor-priv.png')
    # divisor: la censura cubre ambos lados
    act(pg,'cmp','[data-c="split"]'); slider(pg,'#splitRange',20); pg.wait_for_timeout(100)
    cov=pg.evaluate("(()=>{const c=document.querySelector('#privCv'),m=curPhoto().privacy[0],d=c.getContext('2d').getImageData(Math.round(m.x),Math.round(m.y),1,1).data;return [...d]})()")
    T('T07a',cov[3]==255 and cov[0]<60,'máscara opaca sobre el lienzo, independiente del divisor')
    act(pg,'cmp','[data-c="after"]')
    # alternativas
    act(pg,'ptool','[data-t="sim"]'); act(pg,'scnSave'); pg.wait_for_timeout(600); slider(pg,'#s_dorso',40); pg.wait_for_timeout(1500)
    ids=pg.evaluate("curPhoto().scenarios.map(s=>s.id)"); pg.click(f'[data-act="scnSel"][data-id="{ids[0]}"]'); pg.wait_for_timeout(900)
    dA=pg.evaluate("curPhoto().mods.rinoFrontal.s.dorso"); pg.click(f'[data-act="scnSel"][data-id="{ids[1]}"]'); pg.wait_for_timeout(900); dB=pg.evaluate("curPhoto().mods.rinoFrontal.s.dorso")
    T('P1-escenarios',dA==-60 and dB==40,'alternativas A/B independientes')
    pg.wait_for_timeout(1600); chip=pg.inner_text('#saveChip'); T('T09a',chip=='Guardado en este dispositivo',f'chip tras confirmar IndexedDB: {chip}')
    # presentar
    act(pg,'present'); pg.wait_for_timeout(400)
    vis=pg.evaluate("[getComputedStyle(document.querySelector('.bar')).display,document.querySelector('#illus').classList.contains('hide'),!!document.querySelector('#stage.present'),getComputedStyle(document.querySelector('#privBox')).display]")
    txt=pg.evaluate("document.querySelector('#stage').innerText")
    T('T99',vis[0]=='none' and vis[1]==False and vis[2] and '$' not in txt and 'Simulación ilustrativa' in txt,'presentación sin barra, cifras ni notas; aviso ilustrativo visible')
    pg.screenshot(path=OUT+'/presentar.png'); act(pg,'curtain'); cur=pg.evaluate("!document.querySelector('#curtain').classList.contains('hide')"); act(pg,'curtain'); act(pg,'present'); pg.wait_for_timeout(300)
    T('5F.6-ocultar',cur,'botón Ocultar imagen')
    # ---------- C. descargas ----------
    act(pg,'closeEditor'); pg.wait_for_timeout(700)
    def download_kind(kind,dest='paciente'):
        pg.click(f'.gcard [data-act="dlPhoto"][data-id="{first}"]'); pg.wait_for_selector('#fb_kind'); fb(pg,{'kind':kind,'dest':dest},submit=False)
        if dest=='interno':
            pg.click('#fbForm button[type=submit]'); pg.wait_for_selector('#cbYes'); return dl(pg,lambda:pg.click('#cbYes'))
        return dl(pg,lambda:pg.click('#fbForm button[type=submit]'))
    def px(path,x,y):
        b64=base64.b64encode(open(path,'rb').read()).decode()
        return pg.evaluate("async([b,x,y])=>{const i=await loadImg('data:image/jpeg;base64,'+b);const c=mkCanvas(i.naturalWidth,i.naturalHeight);c.getContext('2d').drawImage(i,0,0);return [...c.getContext('2d').getImageData(x,y,1,1).data,i.naturalWidth,i.naturalHeight]}",[b64,x,y])
    m0=masks[0]
    fo=download_kind('original'); fs=download_kind('sim'); fc=download_kind('compare')
    po=px(fo,m0[3],m0[4]); ps=px(fs,m0[3],m0[4]); pc1=px(fc,m0[3],m0[4]); pc2=px(fc,m0[3]+pc1[4]//2+9,m0[4])
    dark=lambda q:q[0]<70 and q[1]<70 and q[2]<70
    raw=open(fo,'rb').read()
    T('T29',os.path.basename(fo).startswith('C') and 'original' in fo and 'ficticia' not in fo.lower(),os.path.basename(fo))
    T('T30','simulacion-ilustrativa' in fs and dark(ps),'simulación etiquetada y censurada')
    T('T32',dark(pc1) and dark(pc2),'comparación con censura en ambos lados')
    T('T07',dark(po) and dark(ps) and dark(pc1) and dark(pc2),'regiones opacas en original, simulación y comparación')
    T('T12',b'Exif' not in raw and b'GPS' not in raw and b'Ficticia' not in raw,'JPG recodificado sin EXIF ni metadatos del caso')
    T('T33',dark(po),'el archivo exportado es un JPG aplanado: una sola capa de píxeles, zona cubierta sin original debajo')
    fi=download_kind('original','interno'); pi=px(fi,m0[3],m0[4])
    T('T29b',not dark(pi) and '_interno' in fi,'original sin censura solo con confirmación adicional')
    # ZIP de selección
    act(pg,'selAll'); pg.wait_for_timeout(200)
    act(pg,'zipSel'); pg.wait_for_selector('#fb_orig'); fb(pg,{'cmp':True},submit=False); fz=dl(pg,lambda:pg.click('#fbForm button[type=submit]'))
    z=zipfile.ZipFile(fz); names=z.namelist(); man=json.loads(z.read('manifiesto.json'))
    T('T31',len(names)>=8 and all('ficticia' not in n.lower() and 'paciente' not in n.lower() for n in names) and man['listoParaPublicar']==False and len(man['archivos'])==len(names)-1,f'{len(names)} archivos, manifiesto, sin PII en nombres')
    T('T34',sum(1 for a in man['archivos'] if a['censuraAplicada'])>=3 and sum(1 for a in man['archivos'] if not a['censuraAplicada'])>=4,'ZIP de varias fotos: la foto censurada sale censurada en original, simulación y comparación; las demás sin máscara')
    flush(pg); print('ERRS',pg.errs[:6]); dump('a.json'); ctx.storage_state(path=OUT+'/state_a.json'); b.close()
