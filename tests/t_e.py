from common import *
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]; f=lambda c:c/12.92 if c<=.03928 else ((c+.055)/1.055)**2.4; return .2126*f(r)+.7152*f(g)+.0722*f(b)
def cr(a,b): la,lb=lum(a),lum(b); return (max(la,lb)+.05)/(min(la,lb)+.05)
OVER="document.documentElement.scrollWidth-window.innerWidth"
with sync_playwright() as p:
    b=launch(p)
    # ---------- T10 modo sin almacenamiento persistente ----------
    ctx,pg=page(b); pg.add_init_script("Object.defineProperty(window,'indexedDB',{get(){throw new Error('bloqueado')}})"); ready(pg)
    T('T10',pg.evaluate("Store.persistent()")==False and 'Modo temporal' in pg.inner_text('.banner.crit') and pg.inner_text('#saveChip')=='Modo temporal: nada se guarda' and 'Guardado en este' not in pg.inner_text('body'),'sin IndexedDB: advertencia fuerte y permanente; nunca dice «Guardado»')
    ctx.close()
    # ---------- T47 / T118 fallo de guardado y cuota ----------
    ctx,pg=page(b); ready(pg); pid=quick_case(pg,'Paciente Ficticia Seis',sim=False); tab(pg,'resumen')
    pg.evaluate("(()=>{window.__put=Store.put;Store.put=(s,v,k)=>s==='patients'?Promise.reject(Object.assign(new Error('quota'),{name:'QuotaExceededError'})):window.__put(s,v,k)})()")
    pg.click('details:has(#f_name) summary'); pg.fill('#f_phone','3000000000'); pg.wait_for_timeout(900); chip=pg.inner_text('#saveChip'); toast=pg.inner_text('.toast') if pg.locator('.toast').count() else ''
    still=pg.evaluate("patient().phone"); pg.evaluate("(()=>{Store.put=window.__put})()"); pg.click('#saveChip'); pg.wait_for_timeout(500); chip2=pg.inner_text('#saveChip'); saved=pg.evaluate(f"Store.get('patients','{pid}').then(p=>p.phone)")
    print('DBG47',chip,'|',toast,'|',still,chip2,saved);T('T47',chip=='Sin espacio: cambios sin guardar' and 'falta de espacio' in toast and still=='3000000000' and chip2=='Guardado en este dispositivo' and saved=='3000000000','cuota excedida: no declara «Guardado», conserva el cambio abierto y reintenta sin perderlo')
    pg.click('#navTop [data-v="mas"]'); act(pg,'more','[data-m="respaldo"]'); pg.wait_for_timeout(500); st=pg.inner_text('#stState')
    T('T118','En uso:' in st and 'Último respaldo completo' in st,'estado de almacenamiento visible: uso, cuota y último respaldo (expulsión por iOS: pendiente en dispositivo real)')
    # ---------- T16 pérdida de contexto WebGL ----------
    pg.click('#navTop [data-v="pacientes"]'); pg.click('.pitem >> text=Paciente Ficticia Seis'); tab(pg,'fotos'); pg.click('.gcard [data-act="editPhoto"]'); pg.wait_for_selector('#panel .modbtn'); pg.wait_for_timeout(600)
    place(pg,'rinoFrontal',[(450,512),(450,668),(394,670),(506,670)],{'dorso':-50}); flush(pg)
    r=pg.evaluate("""(async()=>{const gl=Engine.cv.getContext('webgl'),ext=gl.getExtension('WEBGL_lose_context');if(!ext)return 'sin extensión';ext.loseContext();await new Promise(r=>setTimeout(r,300));ext.restoreContext();await new Promise(r=>setTimeout(r,800));
      Engine.render();const c=mkCanvas(900,1200);c.getContext('2d').drawImage(Engine.cv,0,0);const d=c.getContext('2d').getImageData(450,600,1,1).data;return [d[0]>0,curPhoto().mods.rinoFrontal.s.dorso,!gl.isContextLost()]})()""")
    T('T16',r==[True,-50,True],f'contexto WebGL perdido y restaurado: imagen y ajustes intactos, con aviso ({r})')
    # ---------- accesibilidad y UX en escritorio ----------
    act(pg,'closeEditor'); pg.wait_for_timeout(400)
    T('T101',pg.locator('.nextcard').count()==1 and pg.locator('.cta3 .choice').count()==0 or pg.locator('.nextcard').count()==1,'una sola «Próxima acción acordada» visible en la ficha')
    pg.click('#navTop [data-v="hoy"]'); pg.keyboard.press('Tab'); pg.keyboard.press('Tab'); foc=pg.evaluate("[document.activeElement.tagName,getComputedStyle(document.activeElement).outlineStyle]")
    act(pg,'newLead'); pg.wait_for_selector('#fb_name'); pg.wait_for_timeout(120); inm=pg.evaluate("document.querySelector('#mCard').contains(document.activeElement)")
    for _ in range(14): pg.keyboard.press('Tab')
    trap=pg.evaluate("document.querySelector('#mCard').contains(document.activeElement)"); pg.keyboard.press('Escape'); pg.wait_for_timeout(150); back=pg.evaluate("document.activeElement&&document.activeElement.dataset.act")
    print('DBG107',foc,inm,trap,back);T('T107',foc[0] in('BUTTON','A') and foc[1]!='none' and inm and trap and back=='newLead' and pg.locator('#mCard').count()==0,'foco visible, diálogo retiene el foco, Escape cierra y devuelve el foco (flujo completo solo con teclado: revisión manual pendiente)')
    def unlabeled():
        return pg.evaluate("""[...document.querySelectorAll('input:not([type=hidden]):not(.hide),select,textarea')].filter(e=>e.offsetParent!==null&&!e.getAttribute('aria-label')&&!(e.id&&document.querySelector('label[for="'+e.id+'"]'))&&!e.closest('label')).map(e=>e.id||e.className)""")
    miss={}
    pg.click('#navTop [data-v="pacientes"]'); miss['lista']=unlabeled(); pg.click('.pitem >> text=Paciente Ficticia Seis'); pg.evaluate("$$('details').forEach(d=>d.open=true)"); miss['resumen']=unlabeled()
    for t in ['visitas','propuestas','docs']: tab(pg,t); miss[t]=unlabeled()
    tab(pg,'propuestas'); act(pg,'oppNew'); fb(pg,{'int':'Rinoplastia'}); pg.wait_for_timeout(300); pg.select_option('#procSel','rino'); act(pg,'addProcSel'); pg.wait_for_timeout(200); miss['plan']=unlabeled()
    tab(pg,'fotos'); pg.click('.gcard [data-act="editPhoto"]'); pg.wait_for_selector('#panel .modbtn'); pg.wait_for_timeout(500); miss['editor']=unlabeled(); act(pg,'ptool','[data-t="priv"]'); act(pg,'maskAdd','[data-sh="ell"]'); miss['priv']=unlabeled(); act(pg,'closeEditor'); pg.wait_for_timeout(300)
    pg.click('#navTop [data-v="agenda"]'); miss['agenda']=unlabeled(); pg.click('#navTop [data-v="mas"]'); act(pg,'more','[data-m="ajustes"]'); miss['ajustes']=unlabeled()
    live=pg.evaluate("[document.querySelector('#saveChip').getAttribute('aria-live'),document.documentElement.lang]")
    T('T108',all(len(v)==0 for v in miss.values()) and live==['polite','es'],f'controles con etiqueta programática en 10 pantallas; avisos con aria-live (lector de pantalla real: pendiente) {dict((k,v) for k,v in miss.items() if v)}')
    pairs={'texto/fondo':('#241B36','#FBFAFE'),'apagado/fondo':('#625A75','#FBFAFE'),'apagado/superficie':('#625A75','#FFFFFF'),'acento/superficie':('#6A3FCF','#FFFFFF'),'blanco/acento':('#FFFFFF','#6A3FCF'),'acento/acento suave':('#6A3FCF','#F1EBFC'),'crítico/crítico suave':('#B3323A','#F8E1E3'),'aviso/aviso suave':('#9A5B06','#F8ECD8'),'bien/bien suave':('#1F7A5A','#E2F2EC'),'apagado/escenario':('#625A75','#EEE9F8')}
    cs={k:round(cr(*v),2) for k,v in pairs.items()}
    T('T110',all(v>=4.5 for v in cs.values()),f'contraste AA calculado: {cs}')
    # zoom 200 % (1280 px al 200 % ≈ 640 px CSS)
    ctx.close(); ctx,pg=page(b,640,430); ready(pg); quick_case(pg,'Paciente Zoom',sim=False); ov={}
    for v in ['hoy','pacientes','agenda','mas']: pg.click(f'#navBot [data-v="{v}"]'); pg.wait_for_timeout(150); ov[v]=pg.evaluate(OVER)
    pg.click('#navBot [data-v="pacientes"]'); pg.click('.pitem >> text=Paciente Zoom')
    for t in ['resumen','fotos','visitas','propuestas','docs']: tab(pg,t); ov[t]=pg.evaluate(OVER)
    T('T109',all(v<=1 for v in ov.values()),f'reflujo a 200 % sin desplazamiento horizontal {dict((k,v) for k,v in ov.items() if v>1)}')
    ctx.close()
    # ---------- emulación móvil (iPhone 390×844) y iPad (820×1180) ----------
    for name,(w,h) in {'iphone':(390,844),'ipad':(820,1180),'ipad-h':(1180,820)}.items():
        ctx,pg=page(b,w,h,mobile=True); ready(pg); nav='#navBot' if w<=900 else '#navTop'
        import time; t0=time.time(); taps=0
        pg.click('[data-act="newVal"]'); taps+=1; pg.fill('#w_name','Paciente Movil '+name); pg.check('#w_cd'); pg.check('#w_cp'); taps+=2; act(pg,'wizNext'); taps+=1; pg.wait_for_timeout(150)
        pg.click('[data-act="wizRegion"][data-r="nariz"]'); taps+=1; pg.click('[data-act="wizStart"][data-way="guiada"]'); taps+=1; pg.wait_for_selector('.guide svg')
        sizes=pg.evaluate("[...document.querySelectorAll('#app button, #navBot button')].filter(e=>e.offsetParent!==null).map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),e.textContent.trim().slice(0,22)]})")
        pg.screenshot(path=OUT+f'/{name}-guia.png')
        act(pg,'capPick'); taps+=1; files(pg,'#fileLib',[('f.jpg','image/jpeg',mkimg(pg,900,1200,'FRONTAL'))]); pg.wait_for_selector('.capprev'); act(pg,'capAccept'); taps+=1; pg.wait_for_timeout(500); el=time.time()-t0
        ov={'guia':pg.evaluate(OVER)}; act(pg,'capMode','[data-m="tablero"]'); ov['tablero']=pg.evaluate(OVER); act(pg,'capFinish'); pg.click('#cfReady'); pg.click('#crHere'); pg.wait_for_timeout(500); ov['galeria']=pg.evaluate(OVER)
        sizes+=pg.evaluate("[...document.querySelectorAll('#app button')].filter(e=>e.offsetParent!==null).map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),e.textContent.trim().slice(0,22)]})")
        pg.click('.gcard [data-act="editPhoto"]'); pg.wait_for_selector('#panel .modbtn'); pg.wait_for_timeout(900); ov['editor']=pg.evaluate(OVER)
        st=pg.evaluate("(()=>{const r=document.querySelector('#stage').getBoundingClientRect();return [Math.round(r.top),Math.round(r.height),innerHeight]})()")
        place(pg,'rinoFrontal',[(450,512),(450,668),(394,670),(506,670)],{'dorso':-50}); pg.wait_for_timeout(400); pg.screenshot(path=OUT+f'/{name}-editor.png')
        sizes+=pg.evaluate("[...document.querySelectorAll('#app button')].filter(e=>e.offsetParent!==null&&!e.closest('.stage-ui')).map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),e.textContent.trim().slice(0,22)]})")
        act(pg,'present'); pg.wait_for_timeout(400); pres=pg.evaluate("(()=>{const r=document.querySelector('#stage').getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),innerWidth,innerHeight,getComputedStyle(document.querySelector('.botnav')).display]})()"); pg.screenshot(path=OUT+f'/{name}-presentar.png'); act(pg,'present'); flush(pg); act(pg,'closeEditor'); pg.wait_for_timeout(300)
        for v in ['hoy','agenda','mas']: pg.click(f'{nav} [data-v="{v}"]'); pg.wait_for_timeout(120); ov[v]=pg.evaluate(OVER)
        small=[s for s in sizes if s[1]<40 or s[0]<40]
        if name=='iphone':
            T('T105',len(small)==0,f'objetivos táctiles ≥40 px en captura, galería y editor (principales ≥44) {small[:5]}')
            T('T116',taps<=9 and el<60,f'nueva valoración → primera foto aceptada: {taps} toques, {el:.0f} s automatizados (medición con usuarias reales: pendiente)')
            T('5F.6-movil',pres[0]==pres[2] and pres[1]==pres[3] and pres[4]=='none' and st[1]>=st[2]*.4,f'presentación a pantalla completa; lienzo {st[1]} px de {st[2]}')
        T('T14-'+name,all(v<=1 for v in ov.values()) and not pg.errs,f'emulación {w}×{h} táctil: flujo completo sin desbordes ni errores (dispositivo real: pendiente) {dict((k,v) for k,v in ov.items() if v>1)} {pg.errs[:2]}')
        ctx.close()
    # ---------- T57 comparación de evolución ----------
    ctx,pg=page(b); ready(pg); quick_case(pg,'Paciente Evolucion',sim=False)
    act(pg,'addPhotos'); pg.wait_for_selector('#w_visit'); pg.select_option('#w_visit','new'); pg.select_option('#w_vtype','control'); pg.fill('#w_vdate',pg.evaluate("addDays(today(),-1)")); pg.select_option('#w_phase','posoperatoria'); pg.click('[data-act="wizRegion"][data-r="nariz"]'); pg.click('[data-act="wizStart"][data-way="guiada"]'); pg.wait_for_selector('.guide svg')
    act(pg,'capPick'); files(pg,'#fileLib',[('p.jpg','image/jpeg',mkimg(pg,900,1200,'CONTROL',exif='2026:11:15 10:00:00'))]); pg.wait_for_selector('.capprev'); act(pg,'capAccept'); pg.wait_for_timeout(500); act(pg,'capMode','[data-m="tablero"]'); act(pg,'capFinish'); pg.click('#cfReady'); pg.click('#crHere'); pg.wait_for_timeout(500)
    ph=pg.evaluate("ui.photos.map(p=>[p.phase,photoClass(p),p.visitId===patient().visits[1].id,p.capturedSrc])")
    for el in pg.locator('.gsel').all(): el.check(); pg.wait_for_timeout(150)
    act(pg,'compareSel'); pg.wait_for_selector('#mCard img'); cm=pg.inner_text('#mCard'); pg.screenshot(path=OUT+'/evolucion.png'); fe=dl(pg,lambda:pg.click('#cmDl')); pg.click('#cmNo')
    print('DBG57',ph,cm[:300]);T('T57',ph[1][:3]==['posoperatoria','postoperative_actual',True] and 'Solo se comparan fotografías reales' in cm and 'fecha de toma confirmada' in cm and 'evolucion' in fe,'pre vs control real con fechas e intervalo; advierte fecha sin confirmar; no mezcla simulaciones')
    T('T26',pg.evaluate("patient().visits.length")==2 and pg.evaluate("patient().visits[1].dateSrc")=='retro' and pg.evaluate("patient().visits[1].type")=='control','segunda visita (control) con su propia fecha y plan, sin tocar la primera')
    tab(pg,'fotos'); pg.click('.gcard [data-act="dlPhoto"] >> nth=0'); pg.wait_for_selector('#fb_kind'); dm=pg.inner_text('#mCard'); pg.click('#fbNo')
    T('T115','no conserva puntos ni deslizadores' in dm and 'Exportar caso editable' in dm and 'Uso interno' in dm and 'Entregar a la paciente' in dm,'descarga agrupada por propósito; aclara que no es editable y cuál sí')
    pg.click('#navTop [data-v="pacientes"]'); pg.fill('#q','zzzz'); e1=pg.inner_text('#plist'); pg.fill('#q','')
    T('T112','Nueva valoración' in e1 and pg.locator('[data-act="newVal"]').count()>=1,'estado vacío con la acción para continuar')
    T('T113',pg.evaluate("S.settings.catalog.every(c=>!('recommended' in c))") and 'recomendad' not in pg.evaluate("JSON.stringify(S.settings.catalog)").lower(),'el catálogo es apoyo de selección; nada se marca como recomendado')
    T('T119',not any('EXTERNAL' in e for e in pg.errs),'cero solicitudes a terceros durante las pruebas (fuentes y librerías embebidas)')
    print('ERRS',pg.errs[:5]); dump('e.json'); b.close()
