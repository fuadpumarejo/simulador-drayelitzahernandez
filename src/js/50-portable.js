/* ============ paquetes portátiles .yhcase / .yhbackup: contenedor cifrado, versionado y verificable ============
   Estructura del archivo:  "YHPK1\n" | u32 longitud de cabecera | cabecera JSON (sin datos identificables) | bloques cifrados
   Cada bloque: u32 longitud | AES-256-GCM(bloque de 1 MiB del ZIP interno). IV = nonce(8) + contador(4). AAD = SHA-256(cabecera) + índice + marca de último.
   Clave: PBKDF2-HMAC-SHA-256 con sal aleatoria. La contraseña nunca se guarda ni se registra. Documentado en docs/FORMATO-YHCASE.md */
const Portable=(()=>{
  const MAGIC=enc.encode('YHPK1\n'),CHUNK=1<<20,ITER=310000,MIN_PASS=8;
  const u32=n=>{const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n,true);return b};
  const rand=n=>crypto.getRandomValues(new Uint8Array(n));
  const ok=()=>!!(window.isSecureContext!==false&&window.crypto&&crypto.subtle&&window.fflate);
  class PErr extends Error{constructor(code,msg){super(msg);this.code=code}}
  const MSG={formato:'El archivo no es un paquete de esta herramienta o está dañado. No se importó nada.',truncado:'El archivo está incompleto (la transferencia se cortó). Vuelve a copiarlo desde el otro equipo. No se importó nada.',
    clave:'No se pudo abrir: la contraseña no coincide o el archivo fue alterado. No se importó nada; puedes reintentar.',version:'Este archivo fue creado con una versión más nueva de la herramienta. Actualiza la herramienta en este equipo para abrirlo.',
    integridad:'El contenido del paquete no supera la verificación de integridad. No se importó nada.',cripto:'Este navegador no permite cifrar de forma segura (se necesita HTTPS y un navegador actualizado). Por seguridad no se exportan datos sin protección.'};
  async function deriveKey(pass,salt,iter){const km=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:iter},km,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
  const ivOf=(nonce,i)=>{const iv=new Uint8Array(12);iv.set(nonce);new DataView(iv.buffer).setUint32(8,i,false);return iv};
  const aadOf=(hh,i,last)=>{const a=new Uint8Array(37);a.set(hh);new DataView(a.buffer).setUint32(32,i,true);a[36]=last?1:0;return a};
  async function seal(format,payload,pass,onp){
    if(!ok())throw new PErr('cripto',MSG.cripto);
    const salt=rand(16),nonce=rand(8);
    const header={magic:'yh-portable',format,container:1,app:APP_VERSION,createdAt:nowISO(),kdf:{name:'PBKDF2',hash:'SHA-256',iterations:ITER,salt:b64FromBuf(salt)},cipher:{name:'AES-GCM',bits:256,nonce:b64FromBuf(nonce),chunk:CHUNK},size:payload.length};
    const hb=enc.encode(JSON.stringify(header)),hh=new Uint8Array(await crypto.subtle.digest('SHA-256',hb)),key=await deriveKey(pass,salt,ITER);
    const parts=[MAGIC,u32(hb.length),hb],n=Math.max(1,Math.ceil(payload.length/CHUNK));
    for(let i=0;i<n;i++){const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:ivOf(nonce,i),additionalData:aadOf(hh,i,i===n-1)},key,payload.subarray(i*CHUNK,Math.min(payload.length,(i+1)*CHUNK)));
      parts.push(u32(ct.byteLength),new Uint8Array(ct));if(onp)await onp(i+1,n)}
    return new Blob(parts,{type:'application/octet-stream'})}
  function parseHeader(buf){const u=new Uint8Array(buf);if(u.length<MAGIC.length+4)throw new PErr('formato',MSG.formato);for(let i=0;i<MAGIC.length;i++)if(u[i]!==MAGIC[i])throw new PErr('formato',MSG.formato);
    const dv=new DataView(u.buffer,u.byteOffset,u.byteLength),hl=dv.getUint32(MAGIC.length,true),h0=MAGIC.length+4;if(hl>65536||h0+hl>u.length)throw new PErr(hl>65536?'formato':'truncado',hl>65536?MSG.formato:MSG.truncado);
    let header;const hb=u.subarray(h0,h0+hl);try{header=JSON.parse(dec.decode(hb))}catch(e){throw new PErr('formato',MSG.formato)}
    if(header.magic!=='yh-portable'||!header.kdf||!header.cipher)throw new PErr('formato',MSG.formato);
    if(header.container!==1||header.kdf.name!=='PBKDF2'||header.cipher.name!=='AES-GCM')throw new PErr('version',MSG.version);
    /* recorrer la estructura de bloques antes de descifrar para detectar truncamiento */
    const chunks=[];let o=h0+hl;const n=Math.max(1,Math.ceil(fin(header.size)/fin(header.cipher.chunk,CHUNK)));
    for(let i=0;i<n;i++){if(o+4>u.length)throw new PErr('truncado',MSG.truncado);const l=dv.getUint32(o,true);o+=4;if(l<16||o+l>u.length)throw new PErr('truncado',MSG.truncado);chunks.push(u.subarray(o,o+l));o+=l}
    if(o!==u.length)throw new PErr('formato',MSG.formato);
    return{header,hb,chunks}}
  async function unseal(buf,pass,onp){
    if(!ok())throw new PErr('cripto',MSG.cripto);
    const{header,hb,chunks}=parseHeader(buf),hh=new Uint8Array(await crypto.subtle.digest('SHA-256',hb));
    const key=await deriveKey(pass,new Uint8Array(bufFromB64(header.kdf.salt)),clamp(fin(header.kdf.iterations),1e4,5e6)),nonce=new Uint8Array(bufFromB64(header.cipher.nonce));
    const out=new Uint8Array(fin(header.size));let o=0;
    for(let i=0;i<chunks.length;i++){let pt;try{pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:ivOf(nonce,i),additionalData:aadOf(hh,i,i===chunks.length-1)},key,chunks[i]))}catch(e){throw new PErr('clave',MSG.clave)}
      if(o+pt.length>out.length)throw new PErr('integridad',MSG.integridad);out.set(pt,o);o+=pt.length;if(onp)await onp(i+1,chunks.length)}
    if(o!==out.length)throw new PErr('integridad',MSG.integridad);
    return{header,payload:out}}

  /* ---- empaquetado reversible de registros: binarios y Float32Array salen a archivos con tipo y longitud explícitos ---- */
  const BIN_KEYS=['orig','after','maskS','maskL','thumb'];
  function packPhoto(ph,files){const base='photos/'+ph.id+'/';
    const one=(o,pre)=>{const r={};for(const k in o){const v=o[k];
        if(BIN_KEYS.includes(k)&&typeof v==='string'&&v.startsWith('data:')){const mime=v.slice(5,v.indexOf(';')),path=base+pre+k+(mime==='image/png'?'.png':'.jpg');files[path]=u8FromDataURL(v);r[k]={$bin:path,mime}}
        else if(k==='brush'&&v&&v.length!==undefined&&typeof v!=='string'){const f=v instanceof Float32Array?v:new Float32Array(v),path=base+pre+'brush.f32';files[path]=new Uint8Array(f.buffer.slice(f.byteOffset,f.byteOffset+f.byteLength));r[k]={$f32:path,length:f.length}}
        else if(k==='scenarios'&&Array.isArray(v))r[k]=v.map(s=>one(s,'scn-'+s.id+'-'));
        else r[k]=v}return r};
    return one(ph,'')}
  function unpackPhoto(meta,files){
    const one=o=>{const r={};for(const k in o){const v=o[k];
        if(v&&typeof v==='object'&&v.$bin){const u=files[v.$bin];if(!u||!/^image\/(jpeg|png)$/.test(v.mime))throw new PErr('integridad',MSG.integridad);r[k]=dataURLFromU8(u,v.mime)}
        else if(v&&typeof v==='object'&&v.$f32){const u=files[v.$f32];if(!u||u.byteLength!==v.length*4)throw new PErr('integridad',MSG.integridad);r[k]=new Float32Array(u.buffer.slice(u.byteOffset,u.byteOffset+u.byteLength))}
        else if(k==='scenarios'&&Array.isArray(v))r[k]=v.map(one);
        else r[k]=v}return r};
    return one(meta)}
  const J=o=>enc.encode(JSON.stringify(o));
  async function finish(format,files,extra){
    const list=[];for(const path of Object.keys(files).sort())list.push({path,size:files[path].length,sha256:await sha256hex(files[path])});
    const caseHash=await sha256hex(enc.encode(list.map(f=>f.path+':'+f.sha256).join('\n')));
    const manifest={format,schemaVersion:SCHEMA,appVersion:APP_VERSION,createdAt:nowISO(),...extra,counts:{...(extra.counts||{}),files:list.length},files:list,caseHash};
    const z={};for(const p in files)z[p]=[files[p],{level:/\.(jpg|png|f32|bin)$/.test(p)?0:6}];z['manifest.json']=[J(manifest),{level:6}];
    return{zip:fflate.zipSync(z),manifest}}
  async function buildCase(p,photos,docs,opt={}){const files={};
    files['data/patient.json']=J(p);
    for(const ph of photos)files['photos/'+ph.id+'.json']=J(packPhoto(ph,files));
    for(const d of docs){const{data,...meta}=d;files['docs/'+d.id+'.json']=J(meta);files['docs/'+d.id+'.bin']=new Uint8Array(data)}
    return finish('yhcase',files,{scope:opt.scope||'completo',variant:docs.length?'ampliado':'visual',recordIds:{patient:p.id,photos:photos.map(x=>x.id),docs:docs.map(x=>x.id)},counts:{photos:photos.length,docs:docs.length},
      summary:{updatedAt:p.updatedAt||0,procedures:[...new Set((p.opps||[]).flatMap(o=>(o.plan||[]).filter(i=>!i.extra).map(i=>i.name)))].slice(0,12),visits:(p.visits||[]).length,appts:(p.appts||[]).length}})}
  async function buildBackup(settings,kv,patients,photos,docs){const files={};
    files['data/settings.json']=J(settings);files['data/kv.json']=J(kv);
    for(const p of patients)files['patients/'+p.id+'.json']=J(p);
    for(const ph of photos)files['photos/'+ph.id+'.json']=J(packPhoto(ph,files));
    for(const d of docs){const{data,...meta}=d;files['docs/'+d.id+'.json']=J(meta);files['docs/'+d.id+'.bin']=new Uint8Array(data)}
    return finish('yhbackup',files,{recordIds:{patients:patients.map(p=>p.id)},counts:{patients:patients.length,photos:photos.length,docs:docs.length}})}
  /* validación completa ANTES de escribir en la base */
  async function openPayload(payload,onp){
    let z;try{z=fflate.unzipSync(payload)}catch(e){throw new PErr('integridad',MSG.integridad)}
    let m;try{m=JSON.parse(dec.decode(z['manifest.json']))}catch(e){throw new PErr('integridad',MSG.integridad)}
    if(!m||!['yhcase','yhbackup'].includes(m.format)||!Array.isArray(m.files))throw new PErr('integridad',MSG.integridad);
    if(fin(m.schemaVersion)>SCHEMA)throw new PErr('version',MSG.version);
    const names=Object.keys(z).filter(n=>n!=='manifest.json');if(names.length!==m.files.length)throw new PErr('integridad',MSG.integridad);
    let i=0;for(const f of m.files){const u=z[f.path];if(!u||u.length!==f.size||await sha256hex(u)!==f.sha256)throw new PErr('integridad',MSG.integridad);if(onp&&++i%8===0)await onp(i,m.files.length)}
    const rd=p=>{try{return JSON.parse(dec.decode(z[p]))}catch(e){throw new PErr('integridad',MSG.integridad)}};
    const photos=names.filter(n=>/^photos\/[^/]+\.json$/.test(n)).map(n=>unpackPhoto(rd(n),z));
    const docs=names.filter(n=>/^docs\/[^/]+\.json$/.test(n)).map(n=>{const meta=rd(n);checkIds(meta);const bin=z['docs/'+meta.id+'.bin'];if(!bin||!isStr(meta.id)||!IDV.test(meta.id)||!['application/pdf','image/jpeg','image/png'].includes(meta.mime))throw new PErr('integridad',MSG.integridad);return{...meta,data:bin.buffer.slice(bin.byteOffset,bin.byteOffset+bin.byteLength)}});
    const out={manifest:m,photos,docs};
    if(m.format==='yhcase'){out.patient=rd('data/patient.json');checkPatient(out.patient);
      for(const ph of photos){checkPhoto(ph);if(ph.patientId!==out.patient.id)throw new PErr('integridad',MSG.integridad)}
      for(const d of docs)if(d.patientId!==out.patient.id)throw new PErr('integridad',MSG.integridad)}
    else{out.settings=rd('data/settings.json');out.kv=rd('data/kv.json');checkIds(out.kv);checkIds(out.settings);out.patients=names.filter(n=>/^patients\//.test(n)).map(rd);out.patients.forEach(checkPatient);const ids=new Set(out.patients.map(p=>p.id));
      for(const ph of photos){checkPhoto(ph);if(!ids.has(ph.patientId))throw new PErr('integridad',MSG.integridad)}}
    return out}
  const isStr=v=>typeof v==='string',IDK=/^(id|uid|scn|supersedes|[a-zA-Z]*Id)$/,IDV=/^[\w-]{1,64}$/,IMG=/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/;
  /* los identificadores llegan a atributos HTML: se exige formato estricto en todo el árbol antes de aceptar un paquete */
  function checkIds(o,d=0){if(d>12)throw new PErr('integridad',MSG.integridad);if(Array.isArray(o)){for(const x of o)checkIds(x,d+1);return}if(!o||typeof o!=='object'||ArrayBuffer.isView(o)||o instanceof ArrayBuffer)return;
    for(const k in o){const v=o[k];if(IDK.test(k)&&v!=null&&v!==''&&!(isStr(v)&&IDV.test(v)))throw new PErr('integridad',MSG.integridad);if(v&&typeof v==='object')checkIds(v,d+1)}}
  const imgOrNull=v=>isStr(v)&&IMG.test(v)?v:null;
  function checkPatient(p){if(!p||!isStr(p.id)||!IDV.test(p.id))throw new PErr('integridad',MSG.integridad);checkIds(p);
    for(const k of['name','doc','phone','email','notes'])if(p[k]!=null&&!isStr(p[k]))p[k]=String(p[k]);
    for(const k of['visits','appts','episodes','opps','tasks','log'])if(p[k]!=null&&!Array.isArray(p[k]))throw new PErr('integridad',MSG.integridad);
    for(const a of p.appts||[]){if(!validCivil(a.date)||!validTime(a.time)||!APPT_STL[a.status])throw new PErr('integridad',MSG.integridad)}
    for(const v of p.visits||[])if(!validCivil(v.date))throw new PErr('integridad',MSG.integridad);
    p.thumb=imgOrNull(p.thumb)}
  function checkPhoto(ph){if(!ph||!isStr(ph.id)||!IDV.test(ph.id)||!isStr(ph.orig)||!IMG.test(ph.orig))throw new PErr('integridad',MSG.integridad);checkIds(ph);
    for(const o of[ph,...(Array.isArray(ph.scenarios)?ph.scenarios:[])])for(const k of['after','maskS','maskL','thumb'])if(o[k]!=null)o[k]=imgOrNull(o[k]);if(ph.scenarios!=null&&!Array.isArray(ph.scenarios))ph.scenarios=[];if(ph.privacy!=null&&!Array.isArray(ph.privacy))ph.privacy=[];
    ph.w=fin(ph.w);ph.h=fin(ph.h);if(ph.w<=0||ph.h<=0)throw new PErr('integridad',MSG.integridad);
    if(ph.brush&&!(ph.brush instanceof Float32Array))throw new PErr('integridad',MSG.integridad);
    for(const m of ph.privacy||[])for(const k of['x','y','w','h'])if(!Number.isFinite(m[k]))throw new PErr('integridad',MSG.integridad);
    for(const mk in ph.mods||{}){const st=ph.mods[mk];if(!st||typeof st.a!=='object'||typeof st.s!=='object')throw new PErr('integridad',MSG.integridad)}}
  /* respaldo JSON anterior (v:1, sin cifrar): conversión controlada */
  function parseLegacy(text){let d;try{d=JSON.parse(text)}catch(e){throw new PErr('formato',MSG.formato)}
    if(!d||d.app!=='yh-simulador'||!Array.isArray(d.patients))throw new PErr('formato',MSG.formato);
    const photos=(d.photos||[]).map(ph=>{const c={...ph};if(isStr(c.brush)){try{c.brush=new Float32Array(bufFromB64(c.brush))}catch(e){c.brush=null}}return c});
    d.patients.forEach(checkPatient);photos.forEach(checkPhoto);const ids=new Set(d.patients.map(p=>p.id));
    return{manifest:{format:'legacy-json',createdAt:d.at?nowISO(new Date(d.at)):'',counts:{patients:d.patients.length,photos:photos.length,docs:0}},patients:d.patients,photos:photos.filter(ph=>ids.has(ph.patientId)),docs:[],settings:d.settings||null,kv:{}}}
  const isPortable=buf=>{const u=new Uint8Array(buf,0,Math.min(6,buf.byteLength));return u.length===6&&MAGIC.every((b,i)=>u[i]===b)};
  return{ok,seal,unseal,parseHeader,buildCase,buildBackup,openPayload,parseLegacy,isPortable,PErr,MSG,MIN_PASS,ITER}})();
