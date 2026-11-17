/* ============ almacenamiento local (IndexedDB) con escrituras atómicas y cola de guardado ============ */
const Store=(()=>{
  let db=null;const NAMES=['kv','patients','photos','docs','recovery'];const mem=Object.fromEntries(NAMES.map(n=>[n,new Map()]));
  function open(){return new Promise(res=>{let done=false;const end=v=>{if(!done){done=true;res(v)}};
    try{const r=indexedDB.open('yh-simulador',2);
      r.onupgradeneeded=()=>{const d=r.result;/* v1: kv, patients, photos. v2 agrega docs y recovery sin tocar lo existente */
        if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv');
        if(!d.objectStoreNames.contains('patients'))d.createObjectStore('patients',{keyPath:'id'});
        if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'}).createIndex('pid','patientId');
        if(!d.objectStoreNames.contains('docs'))d.createObjectStore('docs',{keyPath:'id'}).createIndex('pid','patientId');
        if(!d.objectStoreNames.contains('recovery'))d.createObjectStore('recovery',{keyPath:'id'})};
      r.onsuccess=()=>{db=r.result;db.onversionchange=()=>{db.close();db=null};end(true)};r.onerror=()=>end(false);r.onblocked=()=>end(false)}catch(e){end(false)}
    setTimeout(()=>end(!!db),4000)})}
  function run(store,mode,fn){return new Promise((res,rej)=>{try{const t=db.transaction(store,mode);const rq=fn(t.objectStore(store));t.oncomplete=()=>res(rq?rq.result:undefined);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('abort'))}catch(e){rej(e)}})}
  /* ops=[{op:'put'|'del'|'clear',store,value,key}] en UNA transacción: o se aplica todo o nada */
  function atomic(ops){
    if(!db){for(const o of ops){if(o.op==='put')mem[o.store].set(o.key!==undefined?o.key:o.value.id,o.value);else if(o.op==='del')mem[o.store].delete(o.key);else mem[o.store].clear()}return Promise.resolve()}
    return new Promise((res,rej)=>{let t;try{t=db.transaction([...new Set(ops.map(o=>o.store))],'readwrite')}catch(e){return rej(e)}
      t.oncomplete=()=>res();t.onerror=()=>rej(t.error||new Error('tx'));t.onabort=()=>rej(t.error||new Error('Transacción cancelada'));
      try{ops.forEach((o,i)=>{if(api.testFailAt!=null&&i===api.testFailAt){t.abort();return}const s=t.objectStore(o.store);
        if(o.op==='put')o.key!==undefined?s.put(o.value,o.key):s.put(o.value);else if(o.op==='del')s.delete(o.key);else s.clear()})}catch(e){try{t.abort()}catch(_){}rej(e)}})}
  const api={open,atomic,testFailAt:null,persistent:()=>!!db,
    get:(s,k)=>db?run(s,'readonly',o=>o.get(k)):Promise.resolve(mem[s].get(k)),
    put:(s,v,k)=>db?run(s,'readwrite',o=>k!==undefined?o.put(v,k):o.put(v)):Promise.resolve(void mem[s].set(k!==undefined?k:v.id,v)),
    del:(s,k)=>db?run(s,'readwrite',o=>o.delete(k)):Promise.resolve(void mem[s].delete(k)),
    all:s=>db?run(s,'readonly',o=>o.getAll()):Promise.resolve([...mem[s].values()]),
    keys:s=>db?run(s,'readonly',o=>o.getAllKeys()):Promise.resolve([...mem[s].keys()]),
    byPid:(s,pid)=>db?run(s,'readonly',o=>o.index('pid').getAll(pid)):Promise.resolve([...mem[s].values()].filter(p=>p.patientId===pid)),
    photosOf:pid=>api.byPid('photos',pid),docsOf:pid=>api.byPid('docs',pid),
    async estimate(){try{if(navigator.storage&&navigator.storage.estimate){const e=await navigator.storage.estimate();return{usage:e.usage||0,quota:e.quota||0}}}catch(e){}return null},
    async persist(){try{if(navigator.storage&&navigator.storage.persist)return await navigator.storage.persist()}catch(e){}return false}};
  return api})();

const isQuota=e=>!!e&&(e.name==='QuotaExceededError'||/quota/i.test(e.message||''));
/* Cola de guardado: un temporizador por entidad (paciente, foto, ajustes). No declara «Guardado» hasta que IndexedDB confirma. */
const Saver=(()=>{
  const timers=new Map(),jobs=new Map();let saving=0,err=null,lastOk=0;
  function chip(){const c=$('#saveChip');if(!c)return;let cls='chip',txt;
    if(!Store.persistent()){cls='chip crit';txt='Modo temporal: nada se guarda'}
    else if(err){cls='chip crit';txt=isQuota(err)?'Sin espacio: cambios sin guardar':'Error al guardar · Reintentar'}
    else if(saving){txt='Guardando…'}
    else if(jobs.size){cls='chip warn';txt='Cambios sin guardar'}
    else{cls='chip ok';txt='Guardado en este dispositivo'}
    if(c.textContent!==txt){c.className=cls;c.textContent=txt}}
  function schedule(key,fn,ms=450){jobs.set(key,fn);clearTimeout(timers.get(key));timers.set(key,setTimeout(()=>run(key),ms));chip()}
  async function run(key){clearTimeout(timers.get(key));timers.delete(key);const fn=jobs.get(key);if(!fn)return true;jobs.delete(key);saving++;chip();
    try{await fn();err=null;lastOk=Date.now();return true}
    catch(e){console.error('guardar',key,e&&e.name);err=e||new Error('error');if(!jobs.has(key))jobs.set(key,fn);
      toast(isQuota(e)?'No se pudo guardar por falta de espacio; tus cambios siguen abiertos. Exporta un respaldo protegido antes de cerrar.':'No se pudo guardar en este dispositivo. Los cambios siguen abiertos; toca el indicador para reintentar.',6000);return false}
    finally{saving--;chip()}}
  async function flushPrefix(pre){for(const k of[...jobs.keys()])if(k.startsWith(pre))await run(k)}
  async function flush(){let ok=true;for(const k of[...jobs.keys()])ok=await run(k)&&ok;return ok}
  return{schedule,run,flush,flushPrefix,chip,dirty:()=>jobs.size>0||saving>0,error:()=>err,has:k=>jobs.has(k),lastOk:()=>lastOk}})();
window.addEventListener('beforeunload',e=>{if(Saver.dirty()){Saver.flush();e.preventDefault();e.returnValue=''}});
window.addEventListener('pagehide',()=>{Saver.flush()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)Saver.flush()});
