/* ============ acciones y arranque de los módulos 1.2: calendarios, prospección, carpeta compartida, estética y redes ============ */
const leadBy=e=>S.leads.find(l=>l.id===e.dataset.id),treatBy=(p,e)=>(p.treatments||[]).find(t=>t.id===e.dataset.id),postBy=e=>S.posts.find(x=>x.id===e.dataset.id);
Object.assign(acts,{installApp:async()=>{if(!installEvt)return;installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;render()},modeToggle:()=>{S.settings.consult=!S.settings.consult;saveSettings();toast(S.settings.consult?'Vista de consulta: se oculta lo administrativo.':'Vista de trabajo completa.');render()},
  more:e=>{S.more=e.dataset.m;if(S.view!=='mas')return go('mas');render();window.scrollTo(0,0)},
  prTab:e=>{ui.prTab=e.dataset.t;render()},
  leadWa:e=>{const l=leadBy(e);messageBox({name:l.name,phone:l.phone,blocked:l.permission==='no'},l.interest,()=>{(l.touches=l.touches||[]).push({at:nowISO(),what:'Mensaje enviado manualmente',res:'msg'});if(l.status==='nuevo')l.status='contactado';saveKV('leads');render()})},
  leadTouch:e=>leadTouch(leadBy(e)),leadBook:e=>leadBook(leadBy(e)),
  campNew:async()=>{const r=await formBox('Nueva campaña',[{k:'name',label:'Nombre de la campaña',required:true,placeholder:'p. ej. Reel rinoplastia noviembre'},{k:'source',label:'Dónde se publica',type:'select',options:SOURCES.filter(Boolean)},{k:'service',label:'Procedimiento o servicio',placeholder:'p. ej. rinoplastia'},{k:'code',label:'Referencia corta (aparece en el mensaje)',placeholder:'IG-NOV'}],'Crear');if(!r)return;
    S.campaigns.push({id:uid(),name:r.name,source:r.source,service:r.service,code:(r.code||slug(r.name).slice(0,10)).toUpperCase().replace(/[^A-Z0-9-]/g,'')||'REF',createdAt:today()});saveKV('campaigns');render()},
  campCopy:async e=>{const inp=e.closest('.card').querySelector('input');try{await navigator.clipboard.writeText(inp.value);toast('Enlace copiado.')}catch(x){inp.select();toast('Selecciona y copia el enlace.')}},
  campDel:e=>{S.campaigns=S.campaigns.filter(c=>c.id!==e.dataset.id);saveKV('campaigns');render()},
  tplMsgAdd:()=>{S.settings.templates.push({id:uid(),name:'Nueva plantilla',text:'Hola {nombre}, '});saveSettings();render()},tplMsgDel:e=>{S.settings.templates.splice(+e.dataset.i,1);saveSettings();render()},
  icsAll,icsImport:()=>$('#fileIcs').click(),
  syncNow:()=>syncNow(),syncSetup,syncOff:async()=>{Sync.dir=null;clearInterval(Sync.timer);await Store.del('kv','syncDir');await Store.del('kv','syncPass');toast('Carpeta desconectada. Los archivos que ya están en ella no se borran.');render()},
  persistAsk:async()=>{const ok=await Store.persist();toast(ok?'El navegador protegerá estos datos de la limpieza automática.':'El navegador no lo concedió. Instalar la aplicación y usarla con frecuencia ayuda; mantén respaldos.',6000);render()},
  treatNew:()=>treatForm(patient()),treatEdit:e=>treatForm(patient(),treatBy(patient(),e)),
  treatState:e=>{const p=patient(),t=treatBy(p,e);t.status=t.status==='activo'?'terminado':'activo';savePatient(p);renderPatient()},
  sessNew:e=>{const p=patient(),t=treatBy(p,e);sessionForm(p,t,treatAppt(p,t)&&treatAppt(p,t).date<=today()?treatAppt(p,t):null)},
  sessBook:async e=>{const p=P(e),t=treatBy(p,e),nx=nextSuggested(t),a=await apptForm(p,null,{type:'sesion',treatId:t.id,date:nx&&nx>=today()?nx:today(),dur:fin(svcOf(t).dur,30),note:`${t.name} · sesión ${t.sessions.length+1}`});if(a){toast('Sesión agendada.');render()}},
  sessDel:async e=>{const p=patient(),t=treatBy(p,e);if(!await confirmBox('Quitar sesión','Se quitará este registro de sesión. Las siguientes se renumeran.','Quitar',{danger:true}))return;t.sessions=t.sessions.filter(s=>s.id!==e.dataset.s).sort((a,b)=>a.date.localeCompare(b.date));t.sessions.forEach((s,i)=>s.n=i+1);savePatient(p);renderPatient()},
  treatRemind:e=>{const p=P(e);treatRemind(p,treatBy(p,e))},
  treatToOpp:()=>{ui.oppId=null;S.tab='propuestas';acts.oppNew()},
  svcAdd:()=>{S.settings.services.push({id:uid(),name:'Nuevo servicio',kind:'otro',sessions:1,intervalDays:30,dur:30,zones:[]});saveSettings();render()},svcDel:e=>{S.settings.services.splice(+e.dataset.i,1);saveSettings();render()},
  postNew:()=>postForm(),postEdit:e=>postForm(postBy(e)),postIdeas,postCheck:e=>postCheck(postBy(e)),postCase:e=>postCase(postBy(e)),
  postDone:e=>{const x=postBy(e);x.status='publicado';x.publishedAt=today();saveKV('posts');render()},postDel:e=>{S.posts=S.posts.filter(x=>x.id!==e.dataset.id);saveKV('posts');render()},
  postCopy:async e=>{const x=postBy(e),t=(x.caption||'')+(x.tags?'\n\n'+x.tags:'');if(!t.trim()){toast('Esta publicación aún no tiene texto.');return}try{await navigator.clipboard.writeText(t);toast('Texto copiado.')}catch(err){toast('No se pudo copiar; abre «Editar» y copia desde allí.')}}
});
document.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.mt){const x=S.settings.templates[+t.closest('[data-mi]').dataset.mi];if(x){x[t.dataset.mt]=t.value;saveSettings()}return}
  if(t.dataset.sv&&t.tagName!=='SELECT'){const s=S.settings.services[+t.closest('[data-si]').dataset.si];if(!s)return;const k=t.dataset.sv;s[k]=k==='zones'?t.value.split(',').map(z=>z.trim()).filter(Boolean):k==='name'?t.value:Math.max(0,fin(t.value));saveSettings()}});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='fileIcs'){const f=t.files[0];t.value='';if(f)icsImport(f);return}
  if(t.id==='st_wa'){render();return}
  if(t.dataset.sv==='kind'){S.settings.services[+t.closest('[data-si]').dataset.si].kind=t.value;saveSettings()}});
function afterRender(){if(S.view!=='hoy')return;const R=dueReminders(7),host=app;
  if(R.length){const d=document.createElement('div');d.className='sec adm';d.innerHTML=`<h2>Recordatorios de tratamientos · ${R.length}</h2><div class="list">${R.map(reminderRow).join('')}</div><div class="small muted">Personas que cumplen su intervalo en los próximos 7 días y no tienen cita. El mensaje se abre en WhatsApp para que lo revises y lo envíes; solo a quienes autorizan contacto.</div>`;host.appendChild(d)}
  if(Sync.dir)Sync.perm(false).then(ok=>{if(ok||S.view!=='hoy'||$('#syncBn'))return;const b=document.createElement('div');b.id='syncBn';b.className='banner warn';b.innerHTML=`<span class="grow"><b>Carpeta compartida en pausa.</b> El navegador pide confirmar el permiso en cada sesión.</span>${BTN('syncNow','Reanudar y sincronizar','sm primary')}`;host.insertBefore(b,host.children[1]||null)})}
async function extInit(){let ch=false;if(!S.settings.templates){S.settings.templates=clone(DEFAULT_TEMPLATES);ch=true}if(!S.settings.services){S.settings.services=clone(DEFAULT_SERVICES);ch=true}if(ch&&Store.persistent())await Store.put('kv',S.settings,'settings');
  S.cal.layers.contenido=false;await Sync.init();Sync.run(true);
  try{let top=false;try{top=window.top===window.self}catch(e){}if(top&&'serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}}
