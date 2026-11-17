from common import *
import struct
PW='ejemplo-ficticio-2026'
with sync_playwright() as p:
    b=launch(p); ctx,pg=page(b); ready(pg)
    # paquete malicioso: bien cifrado y con hashes válidos, pero con un id que intenta inyectar HTML
    r=pg.evaluate("""async(pw)=>{const p=newPatient({name:'Maliciosa <img src=x onerror=window.__xss=1>'});const mk=async(mut)=>{const q=clone(p);const ph={id:uid(),patientId:q.id,orig:demoFace(),w:900,h:1200,mods:{},privacy:[],scenarios:[]};mut(q,ph);const{zip}=await Portable.buildCase(q,[ph],[]);return new Uint8Array(await(await Portable.seal('yhcase',zip,pw)).arrayBuffer())};
      const tryOpen=async u=>{try{const{payload}=await Portable.unseal(u.buffer,pw);await Portable.openPayload(payload);return 'aceptado'}catch(e){return e.code||'error'}};
      return [await tryOpen(await mk((q,ph)=>{q.appts.push({id:'a" onmouseover="x',date:'2026-12-01',time:'09:00',status:'scheduled',hist:[]})})),await tryOpen(await mk((q,ph)=>{ph.thumb='x" onerror="window.__xss=1'})),await tryOpen(await mk((q,ph)=>{ph.id='x y'})),await tryOpen(await mk(()=>{}))]}""",PW)
    T('SEG-ids',r[0]=='integridad' and r[2]=='integridad' and r[3]=='aceptado','identificadores con caracteres no permitidos: paquete rechazado completo')
    r2=pg.evaluate("""async(pw)=>{const q=newPatient({name:'<img src=x onerror=window.__xss=1>'});const ph={id:uid(),patientId:q.id,orig:demoFace(),w:900,h:1200,mods:{},privacy:[],scenarios:[],thumb:'x" onerror="window.__xss=1'};const{zip}=await Portable.buildCase(q,[ph],[]);const{payload}=await Portable.unseal(await(await Portable.seal('yhcase',zip,pw)).arrayBuffer(),pw);const o=await Portable.openPayload(payload);return o.photos[0].thumb}""",PW)
    T('SEG-img',r2 is None,'miniatura con contenido que no es imagen base64 se descarta al importar')
    # nombre con HTML se muestra como texto
    pg.evaluate("(()=>{const p=newPatient({name:'<img src=x onerror=window.__xss=1>'});S.patients.push(p);savePatient(p)})()"); pg.click('#navTop [data-v="pacientes"]'); pg.wait_for_timeout(300); pg.click('.pitem >> nth=0'); pg.wait_for_timeout(300)
    T('SEG-xss',pg.evaluate("window.__xss")is None and '<img src=x' in pg.inner_text('#pName'),'texto de usuario escapado: no se ejecuta HTML inyectado')
    # paquete de ejemplo ficticio para el repositorio
    pg.click('#navTop [data-v="pacientes"]'); pg.click('.pitem >> text=Paciente de ejemplo'); pg.click('[data-act="ptab"][data-arg="fotos"]'); pg.wait_for_selector('.gcard'); pg.click('.gcard [data-act="editPhoto"]'); pg.wait_for_selector('#panel .modbtn'); pg.wait_for_timeout(1500); flush(pg); act(pg,'closeEditor'); pg.wait_for_timeout(300)
    pg.click('[data-act="ptab"][data-arg="resumen"]'); act(pg,'exportCase'); pg.wait_for_selector('#fb_pass'); fb(pg,{'pass':PW,'pass2':PW},submit=False); f=dl(pg,lambda:pg.click('#fbForm button[type=submit]'))
    import shutil; shutil.copy(f,os.path.join(os.path.dirname(OUT),'..','ejemplo','caso-ficticio.yhcase')); T('T120a',os.path.getsize(f)>50000,'paquete de ejemplo ficticio generado: ejemplo/caso-ficticio.yhcase')
    dump('f.json'); print('ERRS',[e for e in pg.errs if 'x:1' not in e and 'ERR_' not in e][:4]); b.close()
