/* ============ capas de privacidad y composición segura de imágenes ============
   Las máscaras se guardan como capas editables (coordenadas de imagen) y NUNCA se queman sobre el original del expediente.
   Toda imagen que sale de la herramienta se compone en un lienzo nuevo y se recodifica: sin EXIF, sin capas y sin el píxel original bajo las zonas opacas. */
const Privacy={
  STYLES:[['solid','Sólido opaco (recomendado)'],['pixel','Pixelado (solo presentación)'],['blur','Difuminado (solo presentación)']],
  make(W,H,shape='ell'){const s=Math.min(W,H)*.22;return{id:uid(),shape,x:W/2,y:H/2,w:s,h:shape==='ell'?s:s*.7,rot:0,style:'solid',color:'#1b1b1f',opacity:1,on:true,at:nowISO(),v:1}},
  path(ctx,m){ctx.beginPath();if(m.shape==='rect')ctx.rect(-m.w/2,-m.h/2,m.w,m.h);else ctx.ellipse(0,0,m.w/2,m.h/2,0,0,Math.PI*2)},
  draw(ctx,src,layers,W,H){for(const m of layers||[]){if(m.on===false)continue;ctx.save();ctx.translate(m.x,m.y);ctx.rotate((m.rot||0)*Math.PI/180);this.path(ctx,m);
      if(m.style==='pixel'||m.style==='blur'){ctx.clip();ctx.rotate(-(m.rot||0)*Math.PI/180);ctx.translate(-m.x,-m.y);
        const r=Math.hypot(m.w,m.h)/2,x0=clamp(Math.floor(m.x-r),0,W-1),y0=clamp(Math.floor(m.y-r),0,H-1),bw=clamp(Math.ceil(2*r),1,W-x0),bh=clamp(Math.ceil(2*r),1,H-y0);
        const cell=Math.max(14,Math.min(W,H)/26)*(m.style==='blur'?1.6:1),t=mkCanvas(Math.max(1,bw/cell),Math.max(1,bh/cell)),tx=t.getContext('2d');tx.imageSmoothingEnabled=true;tx.drawImage(src,x0,y0,bw,bh,0,0,t.width,t.height);
        ctx.imageSmoothingEnabled=m.style==='blur';ctx.imageSmoothingQuality='high';ctx.fillStyle='#777';ctx.fillRect(x0,y0,bw,bh);ctx.drawImage(t,0,0,t.width,t.height,x0,y0,bw,bh)}
      else{ctx.globalAlpha=clamp(fin(m.opacity,1),.2,1);ctx.fillStyle=/^#[0-9a-f]{6}$/i.test(m.color)?m.color:'#1b1b1f';ctx.fill()}
      ctx.restore()}},
  /* lienzo nuevo con la censura aplanada */
  flatten(img,layers){const W=img.naturalWidth||img.width,H=img.naturalHeight||img.height,c=mkCanvas(W,H),x=c.getContext('2d');x.drawImage(img,0,0,W,H);
    if(layers&&layers.length){const s=mkCanvas(W,H);s.getContext('2d').drawImage(img,0,0,W,H);this.draw(x,s,layers,W,H)}return c},
  active:ph=>(ph.privacy||[]).filter(m=>m.on!==false),
  opaque:ph=>Privacy.active(ph).every(m=>m.style==='solid'&&fin(m.opacity,1)>=1)};

const caseCode=p=>'C'+String(p.id).replace(/[^a-zA-Z0-9]/g,'').slice(-6).toUpperCase();
function stamp(c,text,o={}){const x=c.getContext('2d'),fs=Math.max(13,Math.round(c.width/34)),pad=fs*.6;x.font=`600 ${fs}px "Albert Sans",system-ui,sans-serif`;const w=Math.min(c.width-2*pad,x.measureText(text).width+2*pad),h=fs+pad*1.2;
  x.fillStyle=o.bg||'rgba(36,27,54,.86)';const X=pad,Y=o.top?pad:c.height-h-pad;x.beginPath();x.roundRect?x.roundRect(X,Y,w,h,h/2):x.rect(X,Y,w,h);x.fill();x.fillStyle='#fff';x.textBaseline='middle';x.fillText(text,X+pad,Y+h/2+1,w-2*pad)}
/* kind: 'original' | 'sim' | 'compare'. Devuelve un lienzo nuevo, con censura aplanada si censor!==false */
async function renderPhoto(ph,kind,o={}){const layers=o.censor===false?[]:Privacy.active(ph),post=ph.phase==='posoperatoria';
  const A=Privacy.flatten(await loadImg(ph.orig),layers);
  const lblA=(post?'Resultado posoperatorio real':o.before||'Antes')+(photoDate(ph)?' · '+fmtDate(photoDate(ph)):'');
  if(kind==='original'){if(o.label)stamp(A,lblA);return A}
  if(!ph.after)throw new Error('Esta fotografía no tiene simulación.');
  const B=Privacy.flatten(await loadImg(ph.after),layers);
  if(kind==='sim'){stamp(B,'Simulación ilustrativa; el resultado real puede variar');return B}
  stamp(A,lblA);stamp(B,'Simulación ilustrativa');return sideBySide(A,B,'Comparación de fotografía original y simulación ilustrativa. No representa un resultado garantizado.')}
function sideBySide(A,B,foot){const H=Math.max(A.height,B.height),g=Math.round(A.width*.02),fh=Math.round(Math.max(26,A.width/22)),c=mkCanvas(A.width+B.width+g,H+fh),x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(A,0,0);x.drawImage(B,A.width+g,0);x.fillStyle='#241B36';x.font=`500 ${Math.round(fh*.42)}px "Albert Sans",system-ui,sans-serif`;x.textBaseline='middle';x.fillText(foot,g,H+fh/2,c.width-2*g);return c}
/* evolución: dos fotografías reales de fechas distintas, nunca una simulación */
async function renderEvolution(a,b,o={}){const A=Privacy.flatten(await loadImg(a.orig),o.censor===false?[]:Privacy.active(a)),B0=Privacy.flatten(await loadImg(b.orig),o.censor===false?[]:Privacy.active(b));
  const s=A.height/B0.height,B=mkCanvas(B0.width*s,A.height);B.getContext('2d').drawImage(B0,0,0,B.width,B.height);const lab=p=>`${p.phase==='posoperatoria'?'Control real':PHASE[p.phase]||'Fotografía'} — ${photoDate(p)?fmtDate(photoDate(p)):'sin fecha confirmada'}`;
  stamp(A,lab(a));stamp(B,lab(b));return sideBySide(A,B,'Fotografías reales de la misma paciente en fechas distintas. No incluye simulaciones.')}
function exportName(p,ph,kind,ext='jpg'){const d=photoDate(ph)||'sin-fecha',v=[ph.frame?slug(FRAMES[ph.frame]||ph.frame):slug(ph.label||'foto'),ph.view?slug(VIEWS[ph.view]||ph.view):''].filter(Boolean).join('_');
  return`${caseCode(p)}_${d}_${v}_${kind}.${ext}`}
/* miniatura segura (con la censura aplicada) para listados */
async function safeThumb(ph,size=220){const img=await loadImg(ph.after||ph.orig),c0=Privacy.flatten(img,Privacy.active(ph)),s=size/Math.max(c0.width,c0.height),c=mkCanvas(c0.width*s,c0.height*s);c.getContext('2d').drawImage(c0,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.8)}

/* ---- lectura de archivos de imagen: tipo real por firma, HEIC, fecha EXIF como propuesta ---- */
function sniff(u){const h=(o,...b)=>b.every((v,i)=>u[o+i]===v);
  if(h(0,0xFF,0xD8,0xFF))return'image/jpeg';if(h(0,0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A))return'image/png';if(h(0,0x25,0x50,0x44,0x46,0x2D))return'application/pdf';
  if(h(4,0x66,0x74,0x79,0x70)){const br=String.fromCharCode(...u.subarray(8,12));if(/heic|heix|hevc|hevx|mif1|msf1|heim|heis/.test(br))return'image/heic';if(/avif/.test(br))return'image/avif'}
  if(h(0,0x52,0x49,0x46,0x46)&&h(8,0x57,0x45,0x42,0x50))return'image/webp';
  const head=dec.decode(u.subarray(0,Math.min(512,u.length))).trim().toLowerCase();if(/^(<\?xml|<svg|<!doctype|<html|<script)/.test(head))return'text/markup';
  if(h(0,0x4D,0x5A)||h(0,0x7F,0x45,0x4C,0x46))return'application/x-executable';return''}
function exifDate(u){try{if(u[0]!==0xFF||u[1]!==0xD8)return'';let o=2;const dv=new DataView(u.buffer,u.byteOffset,u.byteLength);
    while(o+4<u.length){if(u[o]!==0xFF)break;const mk=u[o+1],len=dv.getUint16(o+2);if(mk===0xE1&&dv.getUint32(o+4)===0x45786966){const t=o+10,le=dv.getUint16(t)===0x4949,g16=p=>dv.getUint16(p,le),g32=p=>dv.getUint32(p,le);
        const find=(ifd,tag)=>{const n=g16(ifd);for(let i=0;i<n;i++){const e=ifd+2+i*12;if(g16(e)===tag)return e}return 0};
        const ifd0=t+g32(t+4),ex=find(ifd0,0x8769);let e=0;if(ex)e=find(t+g32(ex+8),0x9003);if(!e)e=find(ifd0,0x0132);if(!e)return'';
        const s=dec.decode(u.subarray(t+g32(e+8),t+g32(e+8)+19)),m=/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(s);if(!m||m[1]<'1990')return'';return`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`}
      if(mk===0xDA)break;o+=2+len}}catch(e){}return''}
const MAX_SIDE=2000;
/* Devuelve {orig,w,h,exif} o lanza Error con mensaje específico. La imagen se recodifica (sin EXIF/GPS) y puede reducirse a 2000 px: no es el archivo original de la cámara. */
async function readImageFile(file){
  const head=new Uint8Array(await file.slice(0,262144).arrayBuffer()),kind=sniff(head);
  if(kind==='text/markup'||kind==='application/x-executable'||kind==='application/pdf')throw new Error(`«${file.name}» no es una fotografía. Solo se admiten imágenes JPG o PNG.`);
  let url,img;try{url=URL.createObjectURL(file);img=await loadImg(url)}catch(e){if(url)URL.revokeObjectURL(url);
    if(kind==='image/heic')throw new Error('Esta foto está en formato HEIC y este navegador no puede abrirla. En el iPhone usa «Tomar foto» desde la herramienta, o cambia Ajustes > Cámara > Formatos > «Más compatible», o conviértela a JPG.');
    throw new Error(kind?`No se pudo abrir «${file.name}»: el archivo parece dañado.`:`«${file.name}» no es un formato de imagen compatible. Usa JPG o PNG.`)}
  const s=Math.min(1,MAX_SIDE/Math.max(img.naturalWidth,img.naturalHeight)),c=mkCanvas(img.naturalWidth*s,img.naturalHeight*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
  if(Math.max(c.width,c.height)<400)throw new Error(`«${file.name}» tiene muy poca resolución (${c.width}×${c.height}). Usa una foto más grande.`);
  return{orig:c.toDataURL('image/jpeg',.92),w:c.width,h:c.height,exif:kind==='image/jpeg'?exifDate(head):'',reduced:s<1,low:Math.max(c.width,c.height)<900}}
