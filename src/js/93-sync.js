/* ============ carpeta compartida: los casos se guardan cifrados en una carpeta que la nube del equipo (iCloud Drive, OneDrive, Google Drive, Dropbox) replica.
   Funciona en Chrome y Edge de escritorio. En iPhone y iPad el navegador no permite abrir carpetas: allí se usa Exportar/Importar caso sobre esa misma carpeta desde «Archivos». ============ */
const Sync={dir:null,pass:'',busy:false,last:null,timer:0,
  can:()=>typeof window.showDirectoryPicker==='function',
  async init(){try{this.dir=await Store.get('kv','syncDir')||null;this.pass=await Store.get('kv','syncPass')||''}catch(e){}if(this.dir){clearInterval(this.timer);this.timer=setInterval(()=>this.run(true),90000)}},
  async perm(ask){if(!this.dir||!this.pass)return false;try{const o={mode:'readwrite'};let s=this.dir.queryPermission?await this.dir.queryPermission(o):'granted';if(s!=='granted'&&ask&&this.dir.requestPermission)s=await this.dir.requestPermission(o);return s==='granted'}catch(e){return false}},
  async meta(){return(await Store.get('kv','syncMeta'))||{}},
  async forget(p){if(!this.dir)return;const m=await this.meta();if(m._seen)delete m._seen[caseCode(p)+'.yhcase'];m[p.id]={file:caseCode(p)+'.yhcase',deleted:true,at:Date.now()};await Store.put('kv',m,'syncMeta')},
  async apply(pkg,ex){const p=pkg.patient;migratePatient(p);pkg.photos.forEach(migratePhoto);if(!p.treatments)p.treatments=[];const ops=[];
    if(ex){const lp=await Store.photosOf(ex.id),ld=await Store.docsOf(ex.id),keep=new Set(pkg.photos.map(x=>x.id));ops.push({op:'put',store:'recovery',value:{id:'case:'+ex.id,at:nowISO(),name:ex.name,patient:clone(ex),photos:lp,docs:ld}});for(const ph of lp)if(!keep.has(ph.id))ops.push({op:'del',store:'photos',key:ph.id})}
    p.rev={hash:pkg.manifest.caseHash,importedAt:nowISO(),from:pkg.manifest.createdAt};ops.push({op:'put',store:'patients',value:p},...pkg.photos.map(v=>({op:'put',store:'photos',value:v})),...pkg.docs.map(v=>({op:'put',store:'docs',value:v})));
    await Store.atomic(ops);const i=S.patients.findIndex(x=>x.id===p.id);if(i>=0)S.patients[i]=p;else S.patients.push(p)},
  /* silent=true: no pide permisos ni muestra diálogos; solo trabaja si ya está autorizado */
  async run(silent,resolve={}){if(this.busy||(silent&&ui.editing))return null;if(!await this.perm(!silent)){if(!silent)toast(this.dir?'El navegador no dio permiso sobre la carpeta.':'Primero elige la carpeta compartida.');return null}
    this.busy=true;const res={in:0,out:0,conflicts:[],errs:[],gone:0,at:nowISO()};
    try{await Sim.leave();await Saver.flush();const meta=await this.meta(),seen=meta._seen=meta._seen||{},files={},forced=Object.keys(resolve).length>0;
      for await(const[name,h]of this.dir.entries())if(h.kind==='file'&&/\.yhcase$/i.test(name))files[name]=h;
      /* 1. de la carpeta a este equipo: gana la versión con modificación más reciente; si ambas cambiaron, se pregunta */
      for(const name in files){const f=await files[name].getFile();if(seen[name]===f.lastModified&&!forced)continue;
        let pkg;try{const{payload}=await Portable.unseal(await f.arrayBuffer(),this.pass);pkg=await Portable.openPayload(payload)}catch(e){res.errs.push(`${name}: ${e.code==='clave'?'tiene otra contraseña':'no se pudo leer'}`);continue}
        if(pkg.manifest.format!=='yhcase')continue;const p=pkg.patient,m=meta[p.id],canon=caseCode(p)+'.yhcase',ex=S.patients.find(x=>x.id===p.id),how=resolve[p.id];
        if(m&&m.deleted){seen[name]=f.lastModified;continue}
        if(ex&&how!=='remote'){if((p.updatedAt||0)<=(ex.updatedAt||0)){seen[name]=f.lastModified;continue}
          if(m&&(ex.updatedAt||0)>m.localAt){if(how==='local'){ex.updatedAt=Date.now();await Store.put('patients',ex);meta[p.id]={file:canon,fileTime:0,localAt:-1};seen[name]=f.lastModified}else res.conflicts.push({id:p.id,name:p.name||'Sin nombre'});continue}}
        await this.apply(pkg,ex);seen[name]=f.lastModified;meta[p.id]={file:canon,fileTime:f.lastModified,localAt:name===canon?(p.updatedAt||0):-1};res.in++}
      res.gone=Object.values(meta).filter(m=>m&&m.deleted&&files[m.file]).length;
      /* 2. de este equipo a la carpeta */
      for(const p of S.patients){if(p.demo||res.conflicts.some(c=>c.id===p.id))continue;const m=meta[p.id],name=caseCode(p)+'.yhcase';if(m&&!m.deleted&&(p.updatedAt||0)<=m.localAt&&files[name])continue;
        const{zip,manifest}=await Portable.buildCase(p,await Store.photosOf(p.id),await Store.docsOf(p.id),{}),blob=await Portable.seal('yhcase',zip,this.pass),h=await this.dir.getFileHandle(name,{create:true}),w=await h.createWritable();await w.write(blob);await w.close();
        const ft=(await h.getFile()).lastModified;p.rev={hash:manifest.caseHash,importedAt:nowISO()};await Store.put('patients',p);meta[p.id]={file:name,fileTime:ft,localAt:p.updatedAt||0};seen[name]=ft;res.out++}
      await Store.put('kv',meta,'syncMeta')}
    catch(e){console.error('sync',e&&e.name);res.errs.push(isQuota(e)?'No hay espacio suficiente.':'La sincronización se interrumpió; lo ya guardado no se alteró.')}
    this.busy=false;this.last=res;if(res.in&&!ui.editing)render();return res},
  async removeGone(){const m=await this.meta();for(const id in m)if(id!=='_seen'&&m[id].deleted){try{await this.dir.removeEntry(m[id].file)}catch(e){}delete m[id]}await Store.put('kv',m,'syncMeta')}};
async function syncNow(resolve){const pg=progressBox('Sincronizando con la carpeta');await pg.set(30,'Comparando casos…');const r=await Sync.run(false,resolve||{});pg.close();if(!r)return;
  const c=openModal(`<h2 id="mTitle">Carpeta compartida</h2><dl class="kv"><dt>Recibidos de la carpeta</dt><dd><b>${r.in}</b></dd><dt>Enviados a la carpeta</dt><dd><b>${r.out}</b></dd></dl>
   ${r.errs.map(e=>`<div class="banner warn small">${esc(e)}</div>`).join('')}
   ${r.conflicts.map(k=>`<div class="card col" style="padding:12px"><div><b>${esc(k.name)}</b> cambió aquí y también en otro equipo.</div><div class="row"><button class="btn sm" data-sr="remote" data-id="${k.id}" type="button">Usar la versión de la carpeta</button><button class="btn sm" data-sr="local" data-id="${k.id}" type="button">Conservar la de este equipo</button></div><div class="small muted">Si usas la de la carpeta, la de este equipo queda como copia de recuperación.</div></div>`).join('')}
   ${r.gone?`<div class="note">${r.gone} caso(s) que eliminaste aquí siguen en la carpeta. <button class="btn sm" id="syGone" type="button">Quitarlos también de la carpeta</button></div>`:''}
   <div class="row end"><button class="btn primary" data-close id="syOk" type="button">Listo</button></div>`);
  c.querySelector('#syOk').onclick=()=>{closeModal();render()};const g=c.querySelector('#syGone');if(g)g.onclick=async()=>{await Sync.removeGone();closeModal();toast('Quitados de la carpeta.')};
  c.querySelectorAll('[data-sr]').forEach(b=>b.onclick=()=>{closeModal();syncNow({[b.dataset.id]:b.dataset.sr})})}
async function syncSetup(){if(!Portable.ok())return errBox('No disponible',Portable.MSG.cripto);let dir;try{dir=await window.showDirectoryPicker({mode:'readwrite',id:'skind'})}catch(e){return}
  const r=await formBox('Contraseña de la carpeta',passFields(),'Activar',{validate:passCheck,intro:`Carpeta «${dir.name}». Usa la MISMA contraseña en todos los equipos. Los casos se guardan cifrados; la contraseña queda guardada solo en este equipo para no pedirla cada vez.`});if(!r)return;
  Sync.dir=dir;Sync.pass=r.pass;await Store.put('kv',dir,'syncDir');await Store.put('kv',r.pass,'syncPass');await Sync.init();await syncNow()}
let installEvt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;if(S.view==='mas'&&S.more==='equipos')render()});window.addEventListener('appinstalled',()=>{installEvt=null;toast('Aplicación instalada en este equipo.')});
const inFrame=()=>{try{return window.top!==window.self}catch(e){return true}},isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
async function renderDevices(back){const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;let pers=false;try{pers=await navigator.storage.persisted()}catch(e){}
  app.innerHTML=`${back}<h1>Instalar y carpeta compartida</h1>
  <div class="card col"><h2>Usarla como aplicación</h2><div class="muted">${standalone?'<b class="ok-t">Ya está instalada en este equipo.</b>':'Se instala desde el navegador, sin tienda de aplicaciones. Queda con su propio ícono, abre a pantalla completa y funciona sin conexión.'}</div>
   ${standalone?'':inFrame()?'<div class="banner warn"><div class="grow"><b>Desde esta vista previa no se puede instalar.</b> Publica la herramienta en GitHub Pages y abre esa dirección en el navegador del equipo: allí sí aparece la instalación.</div></div>':installEvt?`<div class="row">${BTN('installApp','Instalar en este equipo','primary big')}</div>`:isIOS()?'<div class="note"><b>En iPhone y iPad no existe botón de instalación:</b> Apple solo lo permite desde el menú de Safari. 1) Abre esta dirección en <b>Safari</b> (no en Chrome ni dentro de WhatsApp o Instagram). 2) Toca <b>Compartir</b> (el cuadro con la flecha hacia arriba). 3) Elige <b>«Agregar a inicio»</b>. 4) Confirma con <b>Agregar</b>.</div>':'<div class="note">Si el navegador no muestra un botón aquí, usa su menú como se indica abajo.</div>'}
   <dl class="kv"><dt><b>iPhone y iPad</b></dt><dd>En Safari: botón Compartir → «Agregar a inicio» (o «Añadir a pantalla de inicio»).</dd><dt><b>Android</b></dt><dd>En Chrome: menú ⋮ → «Instalar aplicación» o «Agregar a la pantalla principal».</dd><dt><b>Windows</b></dt><dd>En Chrome o Edge: menú ⋮ → «Instalar Simulador SKIND» (o el ícono de instalar en la barra de direcciones).</dd><dt><b>Mac</b></dt><dd>En Chrome o Edge: igual que en Windows. En Safari: Archivo → «Añadir al Dock».</dd></dl>
   <div class="small muted">Instálala siempre desde la misma dirección. En iPhone, la aplicación instalada guarda sus datos aparte de Safari: empieza a usarla ya instalada, o pasa los casos con Exportar/Importar. Almacenamiento protegido contra limpieza automática en este equipo: <b>${pers?'sí':'no confirmado'}</b>. ${pers?'':BTN('persistAsk','Solicitarlo','sm')}</div></div>
  <div class="card col"><h2>Carpeta compartida entre equipos</h2>
   ${Sync.can()?`<div class="muted">Elige una carpeta que tu nube replique (iCloud Drive, OneDrive, Google Drive o Dropbox). Cada caso se guarda allí como un archivo cifrado y esta herramienta lo mantiene al día: envía lo que cambió aquí y recibe lo que cambió en otro computador.</div>
     <div>${Sync.dir?`Carpeta: <b>${esc(Sync.dir.name)}</b>. ${Sync.last?`Última sincronización: ${fmtDT(Sync.last.at)} (recibidos ${Sync.last.in}, enviados ${Sync.last.out}).`:'Aún no se ha sincronizado en esta sesión.'}`:'Sin carpeta configurada.'}</div>
     <div class="row">${Sync.dir?BTN('syncNow','Sincronizar ahora','primary'):''}${BTN('syncSetup',Sync.dir?'Cambiar carpeta o contraseña':'Elegir carpeta','' +(Sync.dir?'':'primary'))}${Sync.dir?BTN('syncOff','Desactivar','ghost'):''}</div>
     <div class="small muted">Con la carpeta activa, se sincroniza al abrir, cada minuto y medio y al pulsar el botón. Por seguridad el navegador pide confirmar el permiso una vez por sesión. Si dos equipos cambian el mismo caso, se te pregunta cuál conservar.</div>`
   :`<div class="banner warn">Este navegador no permite conectar una carpeta (ocurre en iPhone, iPad, Safari y Firefox).</div>`}
   <div class="note"><b>En iPhone y iPad</b> el paso es manual, pero sin cables: en la ficha usa «Exportar caso editable» y guárdalo en esa misma carpeta desde «Archivos», con la misma contraseña. El computador lo recibe en la siguiente sincronización. Para traer un caso al iPhone: «Importar caso» y elígelo en esa carpeta.</div></div>
  <div class="card col"><h2>Lo que esta versión no hace</h2><div class="muted">No hay una cuenta en la nube ni sincronización en tiempo real entre el celular y el computador. Eso requiere un servidor con usuarios y contraseñas, y un acuerdo de tratamiento de datos de salud con el proveedor. La carpeta compartida es el paso intermedio que no exige nada de eso.</div></div>`}
