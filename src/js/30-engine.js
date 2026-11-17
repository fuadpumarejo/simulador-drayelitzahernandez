/* ============ motor de deformación (WebGL) ============ */
const Engine=(()=>{
  const cv=document.createElement('canvas');cv.id='gl';
  let gl=null,tex=[],bufPos,bufUV,bufIdx,aPos,aUV,nIdx=0;
  let W=0,H=0,gw=0,gh=0,nv=0,B=null,P=null,uv=null,photo=null,src=null,bL=null,bS=null;
  let mS,mL,pS,pL,uS,uL,ms=1,maskDirty=false,maskTouched=false,undo=[];
  const VS='attribute vec2 aPos;attribute vec2 aUV;varying vec2 vUV;void main(){vUV=aUV;gl_Position=vec4(aPos,0.,1.);}';
  const FS='precision mediump float;varying vec2 vUV;uniform sampler2D uImg,uBL,uBS,uMS,uML;void main(){vec3 o=texture2D(uImg,vUV).rgb;vec3 b=texture2D(uBL,vUV).rgb;vec3 bs=texture2D(uBS,vUV).rgb;float s=texture2D(uMS,vUV).a;float l=texture2D(uML,vUV).a;vec3 fs=b+(o-bs)*.7;vec3 c=mix(o,fs,s);c=mix(c,max(c,fs),l);gl_FragColor=vec4(c,1.);}';
  function initGL(){
    gl=cv.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:false})||cv.getContext('experimental-webgl');
    if(!gl)return false;
    const mk=(t,s)=>{const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);return sh};
    const pr=gl.createProgram();gl.attachShader(pr,mk(gl.VERTEX_SHADER,VS));gl.attachShader(pr,mk(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);gl.useProgram(pr);
    aPos=gl.getAttribLocation(pr,'aPos');aUV=gl.getAttribLocation(pr,'aUV');
    ['uImg','uBL','uBS','uMS','uML'].forEach((n,i)=>gl.uniform1i(gl.getUniformLocation(pr,n),i));
    bufPos=gl.createBuffer();bufUV=gl.createBuffer();bufIdx=gl.createBuffer();
    tex=[0,1,2,3,4].map(i=>{const t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t});
    return true}
  cv.addEventListener('webglcontextlost',e=>e.preventDefault());
  cv.addEventListener('webglcontextrestored',()=>{if(initGL()&&src){uploadStatic();maskDirty=true;render()}});
  const upTex=(i,s)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,tex[i]);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,s)};
  function mkc(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
  function scaled(s,w,h){const c=mkc(w,h),x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(s,0,0,c.width,c.height);return c}
  function blurOf(s,down,upTo){let c=s,f=1;while(f<down){c=scaled(c,c.width/2,c.height/2);f*=2}while(f>upTo){c=scaled(c,c.width*2,c.height*2);f/=2}return c}
  function uploadStatic(){
    const pos=new Float32Array(nv*2);for(let j=0;j<=gh;j++)for(let i=0;i<=gw;i++){const k=j*(gw+1)+i;pos[2*k]=i/gw*2-1;pos[2*k+1]=1-j/gh*2}
    const idx=new Uint16Array(gw*gh*6);let q=0;for(let j=0;j<gh;j++)for(let i=0;i<gw;i++){const a=j*(gw+1)+i,b=a+1,c=a+gw+1,d=c+1;idx[q++]=a;idx[q++]=c;idx[q++]=b;idx[q++]=b;idx[q++]=c;idx[q++]=d}
    nIdx=idx.length;gl.bindBuffer(gl.ARRAY_BUFFER,bufPos);gl.bufferData(gl.ARRAY_BUFFER,pos,gl.STATIC_DRAW);gl.enableVertexAttribArray(aPos);gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,bufIdx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);
    upTex(0,src);upTex(1,bL);upTex(2,bS)}
  async function load(ph){
    if(!gl&&!initGL())throw new Error('Este navegador no permite WebGL, necesario para la simulación.');
    photo=ph;const img=await loadImg(ph.orig);W=img.naturalWidth;H=img.naturalHeight;cv.width=W;cv.height=H;cv.style.width=W+'px';cv.style.height=H+'px';
    src=mkc(W,H);src.getContext('2d').drawImage(img,0,0);bL=blurOf(src,16,4);bS=blurOf(src,4,2);
    const long=180;gw=Math.max(8,Math.round(W/Math.max(W,H)*long));gh=Math.max(8,Math.round(H/Math.max(W,H)*long));nv=(gw+1)*(gh+1);
    B=new Float32Array(nv*2);P=new Float32Array(nv*2);uv=new Float32Array(nv*2);
    if(ph.brush&&ph.gw===gw&&ph.gh===gh&&ph.brush.length===nv*2)B.set(ph.brush);
    ms=Math.min(1,640/Math.max(W,H));const mw=W*ms,mh=H*ms;mS=mkc(mw,mh);mL=mkc(mw,mh);pS=mkc(mw,mh);pL=mkc(mw,mh);uS=mkc(mw,mh);uL=mkc(mw,mh);
    maskTouched=false;
    for(const[c,d]of[[mS,ph.maskS],[mL,ph.maskL]])if(d){try{const im=await loadImg(d);c.getContext('2d').drawImage(im,0,0,c.width,c.height);maskTouched=true}catch(e){}}
    undo=[];uploadStatic();recompute();render()}
  function eachIn(cx,cy,R,fn){const sx=W/gw,sy=H/gh,i0=Math.max(0,Math.floor((cx-R)/sx)),i1=Math.min(gw,Math.ceil((cx+R)/sx)),j0=Math.max(0,Math.floor((cy-R)/sy)),j1=Math.min(gh,Math.ceil((cy+R)/sy));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)fn(j*(gw+1)+i,i*sx,j*sy)}
  /* primitivas paramétricas: escriben el desplazamiento inverso en P */
  const E={
    shift(c,rx,ry,ang,v){const co=Math.cos(ang),si=Math.sin(ang);eachIn(c[0],c[1],Math.max(rx,ry),(k,x,y)=>{const dx=x-c[0],dy=y-c[1],qx=(dx*co+dy*si)/rx,qy=(-dx*si+dy*co)/ry,t=qx*qx+qy*qy;if(t>=1)return;const f=(1-t)*(1-t);P[2*k]-=v[0]*f;P[2*k+1]-=v[1]*f})},
    scale(c,rx,ry,ang,s){const co=Math.cos(ang),si=Math.sin(ang);eachIn(c[0],c[1],Math.max(rx,ry),(k,x,y)=>{const dx=x-c[0],dy=y-c[1],qx=dx*co+dy*si,qy=-dx*si+dy*co,t=(qx/rx)*(qx/rx)+(qy/ry)*(qy/ry);if(t>=1)return;const f=(1-t)*(1-t),e=1/(1+(s-1)*f)-1;P[2*k]+=dx*e;P[2*k+1]+=dy*e})},
    pinch(a,b,r,kk){const ab=V.sub(b,a),l2=ab[0]*ab[0]+ab[1]*ab[1]||1,c=V.mid(a,b),R=Math.sqrt(l2)/2+r;eachIn(c[0],c[1],R,(k,x,y)=>{let t=((x-a[0])*ab[0]+(y-a[1])*ab[1])/l2;t=clamp(t,0,1);const dx=x-(a[0]+ab[0]*t),dy=y-(a[1]+ab[1]*t),q=(dx*dx+dy*dy)/(r*r);if(q>=1)return;const f=(1-q)*(1-q);P[2*k]+=dx*kk*f;P[2*k+1]+=dy*kk*f})},
    mask(kind,c,rx,ry,ang,a){const x=(kind==='S'?pS:pL).getContext('2d');x.save();x.translate(c[0]*ms,c[1]*ms);x.rotate(ang);x.scale(rx*ms,ry*ms);const g=x.createRadialGradient(0,0,0,0,0,1);a=clamp(a,0,1);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(.55,`rgba(255,255,255,${a*.8})`);g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(0,0,1,0,7);x.fill();x.restore()},
    maskCap(kind,a,b,r,st){const L=V.len(V.sub(b,a)),n=Math.max(2,Math.ceil(L/(r*.5)));for(let i=0;i<=n;i++){const p=V.add(a,V.mul(V.sub(b,a),i/n));E.mask(kind,p,r,r,0,st*.5)}}
  };
  function recompute(){
    P.fill(0);for(const c of[pS,pL])c.getContext('2d').clearRect(0,0,c.width,c.height);
    for(const mk in(photo.mods||{})){if(!MODULES[mk]||!modPlaced(photo,mk))continue;const st=photo.mods[mk],M=MODULES[mk];
      const s=k=>{const d=M.sliders.find(d=>d.k===k);return(st.s[k]??d.def)/100};try{M.apply(st.a,s,E)}catch(e){console.error(e)}}
    maskDirty=true}
  function render(){
    if(!gl||!photo)return;
    if(maskDirty){for(const[u,m,p,i]of[[uS,mS,pS,3],[uL,mL,pL,4]]){const x=u.getContext('2d');x.clearRect(0,0,u.width,u.height);x.drawImage(m,0,0);x.drawImage(p,0,0);upTex(i,u)}maskDirty=false}
    const sx=W/gw,sy=H/gh,g1=gw+1;for(let k=0;k<nv;k++){const i=k%g1,j=(k/g1)|0;uv[2*k]=(i*sx+B[2*k]+P[2*k])/W;uv[2*k+1]=(j*sy+B[2*k+1]+P[2*k+1])/H}
    gl.viewport(0,0,W,H);gl.bindBuffer(gl.ARRAY_BUFFER,bufUV);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(aUV);gl.vertexAttribPointer(aUV,2,gl.FLOAT,false,0,0);
    gl.drawElements(gl.TRIANGLES,nIdx,gl.UNSIGNED_SHORT,0)}
  function sampleD(x,y){const fx=clamp(x/W*gw,0,gw-.001),fy=clamp(y/H*gh,0,gh-.001),i=fx|0,j=fy|0,u=fx-i,v=fy-j,g1=gw+1,a=j*g1+i,b=a+1,c=a+g1,d=c+1;
    const f=o=>((B[2*a+o]+P[2*a+o])*(1-u)+(B[2*b+o]+P[2*b+o])*u)*(1-v)+((B[2*c+o]+P[2*c+o])*(1-u)+(B[2*d+o]+P[2*d+o])*u)*v;return[f(0),f(1)]}
  const limit=()=>.22*Math.min(W,H);
  function capB(k){const m=limit(),l=Math.hypot(B[2*k],B[2*k+1]);if(l>m){B[2*k]*=m/l;B[2*k+1]*=m/l}}
  function snap(){const c1=mkc(mS.width,mS.height),c2=mkc(mL.width,mL.height);c1.getContext('2d').drawImage(mS,0,0);c2.getContext('2d').drawImage(mL,0,0);undo.push({B:new Float32Array(B),c1,c2,mt:maskTouched});if(undo.length>10)undo.shift()}
  function undoLast(){const u=undo.pop();if(!u)return false;B.set(u.B);for(const[m,c]of[[mS,u.c1],[mL,u.c2]]){const x=m.getContext('2d');x.clearRect(0,0,m.width,m.height);x.drawImage(c,0,0)}maskTouched=true;maskDirty=true;render();return true}
  function push(a,b,r,st){const dx=(b[0]-a[0])*st,dy=(b[1]-a[1])*st;eachIn(b[0],b[1],r,(k,x,y)=>{const ex=x-b[0],ey=y-b[1],t=(ex*ex+ey*ey)/(r*r);if(t>=1)return;const f=(1-t)*(1-t);B[2*k]-=dx*f;B[2*k+1]-=dy*f;capB(k)})}
  function bloat(c,r,st,sign){eachIn(c[0],c[1],r,(k,x,y)=>{const ex=x-c[0],ey=y-c[1],t=(ex*ex+ey*ey)/(r*r);if(t>=1)return;const f=(1-t)*(1-t)*st;B[2*k]-=sign*(ex+B[2*k])*f;B[2*k+1]-=sign*(ey+B[2*k+1])*f;capB(k)})}
  function dab(m,c,r,a,erase){const x=m.getContext('2d');x.save();x.globalCompositeOperation=erase?'destination-out':'source-over';const g=x.createRadialGradient(c[0]*ms,c[1]*ms,0,c[0]*ms,c[1]*ms,r*ms);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(c[0]*ms,c[1]*ms,r*ms,0,7);x.fill();x.restore();maskDirty=true;maskTouched=true}
  function paint(kind,c,r,st){const d=sampleD(c[0],c[1]);dab(kind==='S'?mS:mL,[c[0]+d[0],c[1]+d[1]],r,st)}
  function restore(c,r,st){eachIn(c[0],c[1],r,(k,x,y)=>{const ex=x-c[0],ey=y-c[1],t=(ex*ex+ey*ey)/(r*r);if(t>=1)return;const f=1-(1-t)*(1-t)*st;B[2*k]*=f;B[2*k+1]*=f});const d=sampleD(c[0],c[1]),q=[c[0]+d[0],c[1]+d[1]];dab(mS,q,r,st,true);dab(mL,q,r,st,true)}
  function resetBrush(){B.fill(0);for(const m of[mS,mL])m.getContext('2d').clearRect(0,0,m.width,m.height);maskDirty=true;maskTouched=true;render()}
  const cp=c=>{const d=mkc(c.width,c.height);d.getContext('2d').drawImage(c,0,0);return d};
  /* instantánea completa del estado de pincel y máscaras, para el historial unificado */
  function snapshot(){return{B:new Float32Array(B),c1:maskTouched?cp(mS):null,c2:maskTouched?cp(mL):null,mt:maskTouched}}
  function restoreSnap(s){B.set(s.B);for(const[m,c]of[[mS,s.c1],[mL,s.c2]]){const x=m.getContext('2d');x.clearRect(0,0,m.width,m.height);if(c)x.drawImage(c,0,0)}maskTouched=s.mt;maskDirty=true}
  return{cv,load,recompute,render,snap,undo:undoLast,snapshot,restoreSnap,push,bloat,paint,restore,resetBrush,
    size:()=>[W,H],canUndo:()=>undo.length>0,
    hasBrush:()=>{if(maskTouched)return true;for(let i=0;i<B.length;i++)if(B[i]!==0)return true;return false},
    state:()=>({brush:new Float32Array(B),gw,gh,maskS:maskTouched?mS.toDataURL('image/png'):null,maskL:maskTouched?mL.toDataURL('image/png'):null}),
    jpeg:()=>{render();return cv.toDataURL('image/jpeg',.9)},
    thumb:()=>{render();const s=140/Math.max(W,H),c=mkc(W*s,H*s);c.getContext('2d').drawImage(cv,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.8)}}
})();
