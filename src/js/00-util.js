"use strict";
/* ============ utilidades ============ */
const APP_VERSION='1.1.0-R6',SCHEMA=3;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>{try{return crypto.randomUUID().replace(/-/g,'').slice(0,20)}catch(e){return Date.now().toString(36)+Math.random().toString(36).slice(2,12)}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fin=(v,d=0)=>{v=+v;return Number.isFinite(v)?v:d};
const V={sub:(a,b)=>[a[0]-b[0],a[1]-b[1]],add:(a,b)=>[a[0]+b[0],a[1]+b[1]],mul:(a,k)=>[a[0]*k,a[1]*k],len:a=>Math.hypot(a[0],a[1]),
  norm:a=>{const l=Math.hypot(a[0],a[1])||1;return[a[0]/l,a[1]/l]},mid:(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],ang:a=>Math.atan2(a[1],a[0]),
  up:ax=>{let p=[ax[1],-ax[0]];if(p[1]>0)p=[-p[0],-p[1]];return p}};
const clone=o=>structuredClone(o);

/* ---- avisos accesibles ---- */
function toast(msg,ms=3200){let t=$('.toast');if(t)t.remove();t=document.createElement('div');t.className='toast';t.setAttribute('role','status');t.setAttribute('aria-live','polite');t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),ms)}
let modalPrevFocus=null;
function openModal(html,o={}){const ov=$('#overlay');if(!ov.firstChild)modalPrevFocus=document.activeElement;
  ov.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="card ${o.wide?'wide':''}" id="mCard">${html}</div></div>`;
  const c=$('#mCard');const f=c.querySelector('[autofocus]')||c.querySelector('input,select,textarea,button');if(f)setTimeout(()=>f.focus(),30);return c}
function closeModal(){$('#overlay').innerHTML='';if(modalPrevFocus&&modalPrevFocus.isConnected)try{modalPrevFocus.focus()}catch(e){}modalPrevFocus=null}
document.addEventListener('keydown',e=>{const m=$('#overlay .modal');if(!m)return;if(e.key==='Escape'){const b=$('#overlay [data-close]');if(b)b.click();return}
  if(e.key==='Tab'){/* el foco no sale del diálogo */const f=$$('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',m).filter(x=>x.offsetParent!==null);if(!f.length)return;const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}else if(!m.contains(document.activeElement)){e.preventDefault();a.focus()}}});
function confirmBox(title,body,okLabel='Continuar',o={}){return new Promise(res=>{
  const c=openModal(`<h2 id="mTitle">${esc(title)}</h2><div class="muted">${o.html?body:esc(body)}</div><div class="row end"><button class="btn" id="cbNo" data-close type="button">${esc(o.cancel||'Cancelar')}</button><button class="btn ${o.danger?'dangerfill':'primary'}" id="cbYes" type="button">${esc(okLabel)}</button></div>`);
  c.querySelector('#cbNo').onclick=()=>{closeModal();res(false)};c.querySelector('#cbYes').onclick=()=>{closeModal();res(true)}})}
/* formulario modal genérico: fields=[{k,label,type,value,options,placeholder,help,required}] */
function formBox(title,fields,okLabel='Guardar',o={}){return new Promise(res=>{
  const fh=f=>{const id='fb_'+f.k,v=f.value??'';let inp;
    if(f.type==='select')inp=`<select class="in" id="${id}">${f.options.map(op=>{const[val,lab]=Array.isArray(op)?op:[op,op];return`<option value="${esc(val)}" ${String(val)===String(v)?'selected':''}>${esc(lab)}</option>`}).join('')}</select>`;
    else if(f.type==='textarea')inp=`<textarea class="in" id="${id}" placeholder="${esc(f.placeholder||'')}">${esc(v)}</textarea>`;
    else if(f.type==='check')return`<label class="row chk" for="${id}"><input type="checkbox" id="${id}" ${v?'checked':''}> <span>${esc(f.label)}</span></label>${f.help?`<div class="small muted">${esc(f.help)}</div>`:''}`;
    else if(f.type==='info')return`<div class="note">${esc(f.label)}</div>`;
    else inp=`<input class="in" id="${id}" type="${f.type||'text'}" value="${esc(v)}" placeholder="${esc(f.placeholder||'')}" ${f.min!=null?`min="${f.min}"`:''} ${f.step?`step="${f.step}"`:''} autocomplete="${f.type==='password'?'new-password':'off'}">`;
    return`<div class="field"><label for="${id}">${esc(f.label)}</label>${inp}${f.help?`<div class="small muted">${esc(f.help)}</div>`:''}</div>`};
  const c=openModal(`<h2 id="mTitle">${esc(title)}</h2>${o.intro?`<div class="muted">${esc(o.intro)}</div>`:''}<form id="fbForm" class="col" novalidate>${fields.map(fh).join('')}<div class="crit small hide" id="fbErr" role="alert"></div>
   <div class="row end"><button class="btn" data-close type="button" id="fbNo">Cancelar</button><button class="btn primary" type="submit">${esc(okLabel)}</button></div></form>`,o);
  c.querySelector('#fbNo').onclick=()=>{closeModal();res(null)};
  c.querySelector('#fbForm').onsubmit=e=>{e.preventDefault();const out={};for(const f of fields){if(f.type==='info')continue;const el=c.querySelector('#fb_'+f.k);out[f.k]=f.type==='check'?el.checked:f.type==='number'?fin(el.value):el.value.trim?el.value.trim():el.value;
      if(f.required&&!out[f.k]){const er=c.querySelector('#fbErr');er.textContent='Falta completar: '+f.label;er.classList.remove('hide');el.focus();return}}
    const v=o.validate&&o.validate(out);if(v){const er=c.querySelector('#fbErr');er.textContent=v;er.classList.remove('hide');return}closeModal();res(out)}})}
function progressBox(title){const c=openModal(`<h2 id="mTitle">${esc(title)}</h2><div class="muted" id="pgMsg" role="status" aria-live="polite">Preparando…</div><progress id="pgBar" max="100" value="0" style="width:100%"></progress>`);
  return{set(pct,msg){const b=$('#pgBar'),m=$('#pgMsg');if(b)b.value=pct;if(m&&msg)m.textContent=msg;return new Promise(r=>setTimeout(r,0))},close:closeModal}}

/* ---- fechas: fecha civil YYYY-MM-DD separada de instantes ISO con offset ---- */
const p2=n=>String(n).padStart(2,'0');
const civil=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
const today=()=>civil(new Date());
const dObj=c=>{const[y,m,d]=c.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(c,n)=>{const d=dObj(c);d.setDate(d.getDate()+n);return civil(d)};
const addMonths=(c,n)=>{const d=dObj(c);const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));return civil(d)};
const daysBetween=(a,b)=>Math.round((dObj(b)-dObj(a))/864e5);
function nowISO(d=new Date()){const o=-d.getTimezoneOffset(),s=o>=0?'+':'-',a=Math.abs(o);return`${civil(d)}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}${s}${p2(Math.floor(a/60))}:${p2(a%60)}`}
const deviceTZ=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){return''}};
const fmtDate=d=>{if(!d)return'';const[y,m,dd]=String(d).slice(0,10).split('-');return`${dd}/${m}/${y}`};
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const fmtLong=c=>{const d=dObj(c);return`${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`};
const fmtDT=iso=>iso?`${fmtDate(iso)}${iso.length>10?' '+iso.slice(11,16):''}`:'';
function age(b){if(!b)return'';const d=dObj(b),n=new Date();let a=n.getFullYear()-d.getFullYear();if(n<new Date(n.getFullYear(),d.getMonth(),d.getDate()))a--;return a>=0&&a<130?a:''}
const validCivil=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(dObj(s));
const validTime=s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);

function money(v){const c=S.settings.currency||'COP';try{return new Intl.NumberFormat('es-CO',{style:'currency',currency:c,maximumFractionDigits:c==='COP'?0:2}).format(v||0)}catch(e){return'$ '+Math.round(v||0).toLocaleString('es-CO')}}
const hrs=(a,b)=>{const f=n=>String(+(+n).toFixed(2)).replace('.',',');return a===b?`${f(a)} h`:`${f(a)} a ${f(b)} h`};
const fmtSize=n=>n>=1048576?(n/1048576).toFixed(1).replace('.',',')+' MB':Math.max(1,Math.round(n/1024))+' KB';
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('imagen'));i.src=src})}
function b64FromBuf(buf){const u=buf instanceof Uint8Array?buf:new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s)}
function bufFromB64(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer}
const u8FromDataURL=d=>new Uint8Array(bufFromB64(d.split(',')[1]));
const dataURLFromU8=(u,mime)=>`data:${mime};base64,${b64FromBuf(u)}`;
const blobFromDataURL=d=>new Blob([u8FromDataURL(d)],{type:d.slice(5,d.indexOf(';'))});
const enc=new TextEncoder(),dec=new TextDecoder();
async function sha256hex(buf){const h=await crypto.subtle.digest('SHA-256',buf);return[...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('')}
const slug=s=>(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();
const mkCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c};
const canvasBlob=(c,type='image/jpeg',q=.92)=>new Promise(r=>c.toBlob(r,type,q));
