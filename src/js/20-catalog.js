const C=(id,name,area,minH,maxH,ref)=>({id,name,area,minH,maxH,price:0,...(ref?{ref:true}:{})});
const AREAS=['Rostro','Mamas','Cuerpo','No quirúrgico','Otro'];
const DEFAULT_CATALOG=[
  C('rino','Rinoplastia','Rostro',3,4),C('blefaro','Blefaroplastia','Rostro',1,2),C('lifting','Lifting facial','Rostro',4,4),C('oto','Otoplastia','Rostro',1,2),
  C('cejas','Lifting de cejas','Rostro',1,2,1),C('cuello','Lifting de cuello','Rostro',2,3,1),C('mento','Mentoplastia','Rostro',1,2,1),C('bichec','Bichectomía','Rostro',.5,1,1),C('papada','Liposucción de papada','Rostro',1,1.5,1),C('lipLift','Lip lift','Rostro',1,1,1),
  C('mamoA','Mamoplastia de aumento','Mamas',2,3),C('mamoR','Mamoplastia de reducción','Mamas',2,3),C('pexia','Mastopexia (levantamiento de mamas)','Mamas',2,3,1),C('pexiaImp','Mastopexia con implantes','Mamas',3,4,1),C('gineco','Ginecomastia','Mamas',1,2,1),
  C('abdomino','Abdominoplastia','Cuerpo',2,2),C('lipo','Lipoescultura','Cuerpo',4,5),C('liposuc','Liposucción por zonas','Cuerpo',1,3,1),C('miniAbd','Miniabdominoplastia','Cuerpo',1,2,1),C('gluteos','Aumento de glúteos','Cuerpo',2,4,1),C('braquio','Braquioplastia (brazos)','Cuerpo',2,3,1),C('muslos','Lifting de muslos','Cuerpo',2,3,1),C('labio','Labioplastia','Cuerpo',1,2,1),
  C('haLabios','Ácido hialurónico en labios','No quirúrgico',0,0),C('haSurcos','Ácido hialurónico en surcos nasogenianos','No quirúrgico',0,0),C('haOjeras','Ácido hialurónico en ojeras','No quirúrgico',0,0),C('haPomulos','Ácido hialurónico en pómulos','No quirúrgico',0,0),C('haMenton','Ácido hialurónico en mentón y línea mandibular','No quirúrgico',0,0),C('rinomod','Rinomodelación','No quirúrgico',0,0),C('toxina','Toxina botulínica','No quirúrgico',0,0),C('bioest','Bioestimuladores de colágeno','No quirúrgico',0,0),C('hilos','Hilos tensores','No quirúrgico',0,0)];
const DEFAULT_SETTINGS={tool:'Simulador de resultados',doctor:'Dra. Yelitza Hernández',clinic:'SKIND Aesthetic Center',city:'Barranquilla, Colombia',contact:'',currency:'COP',validity:30,catalogV:2,
  legal:'Las imágenes de simulación son una referencia visual orientativa generada por software. No constituyen una promesa ni una garantía del resultado quirúrgico, que depende de la anatomía, la cicatrización y la evolución de cada paciente. Los valores y tiempos son estimados y pueden ajustarse tras la valoración médica.',
  catalog:DEFAULT_CATALOG};
const STATES=['Valoración','Propuesta entregada','Programada','Realizada','Descartada'];
const STATE_CLS={'Programada':'s-prog','Realizada':'s-real','Descartada':'s-desc'};
const LABELS=['Rostro de frente','Rostro de perfil','Rostro tres cuartos','Mamas de frente','Mamas de perfil','Cuerpo de frente','Cuerpo de perfil','Espalda y glúteos','Brazos','Piernas','Otra'];
const JTYPES=['Consulta de valoración','Llamada o mensaje','Entrega de propuesta','Preoperatorio','Cirugía','Control posoperatorio','Nota'];
const sl=(k,label,lo,hi,min=-100,max=100,def=0)=>({k,label,lo,hi,min,max,def});
const MODULES={
 rinoFrontal:{name:'Rinoplastia · frente',group:'Rostro',tip:'Foto de frente, cabeza recta.',
  anchors:[{k:'raiz',label:'Raíz nasal, entre los ojos'},{k:'punta',label:'Punta nasal'},{k:'alaI',label:'Ala nasal, lado izquierdo de la foto'},{k:'alaD',label:'Ala nasal, lado derecho de la foto'}],
  sliders:[sl('dorso','Ancho del dorso','Afinar','Ensanchar'),sl('base','Base alar','Estrechar','Ampliar'),sl('punta','Tamaño de la punta','Reducir','Aumentar'),sl('elev','Posición de la punta','Descender','Elevar'),sl('global','Tamaño global de la nariz','Reducir','Aumentar')],
  apply(A,s,E){const w=V.len(V.sub(A.alaD,A.alaI)),u0=V.sub(A.punta,A.raiz),L=V.len(u0),u=V.norm(u0),ang=V.ang(u),c=V.mid(A.alaI,A.alaD);
   if(s('dorso'))E.pinch(V.add(A.raiz,V.mul(u,.12*L)),V.add(A.raiz,V.mul(u,.78*L)),.5*w,-s('dorso')*.4);
   if(s('base'))for(const a of[A.alaI,A.alaD])E.shift(a,.36*w,.36*w,0,V.mul(V.norm(V.sub(c,a)),-s('base')*.14*w));
   if(s('punta'))E.scale(A.punta,.34*w,.4*w,ang,1+s('punta')*.25);
   if(s('elev'))E.shift(A.punta,.5*w,.55*w,ang,V.mul(u,-s('elev')*.08*L));
   if(s('global'))E.scale(V.add(A.raiz,V.mul(u,.6*L)),.7*L,.8*w,ang,1+s('global')*.15)}},
 rinoPerfil:{name:'Rinoplastia · perfil',group:'Rostro',tip:'Foto de perfil con fondo liso.',
  anchors:[{k:'raiz',label:'Raíz nasal (nasion)'},{k:'dorso',label:'Punto más alto del dorso o giba'},{k:'punta',label:'Punta nasal'},{k:'subnasal',label:'Unión de la columela con el labio'}],
  sliders:[sl('giba','Giba dorsal','Reducir','Aumentar'),sl('proy','Proyección de la punta','Menos','Más'),sl('rot','Rotación de la punta','Descender','Elevar'),sl('punta','Tamaño de la punta','Reducir','Aumentar'),sl('radix','Raíz nasal','Reducir','Aumentar')],
  apply(A,s,E){const u0=V.sub(A.punta,A.raiz),L=V.len(u0),u=V.norm(u0),ang=V.ang(u);let n=[u[1],-u[0]];const sn=V.sub(A.subnasal,A.raiz);if(n[0]*sn[0]+n[1]*sn[1]>0)n=V.mul(n,-1);
   if(s('giba'))E.shift(A.dorso,.36*L,.2*L,ang,V.mul(n,s('giba')*.09*L));
   if(s('proy'))E.shift(A.punta,.3*L,.3*L,0,V.mul(n,s('proy')*.1*L));
   if(s('rot'))E.shift(A.punta,.3*L,.3*L,0,V.mul(u,-s('rot')*.08*L));
   if(s('punta'))E.scale(A.punta,.24*L,.24*L,0,1+s('punta')*.25);
   if(s('radix'))E.shift(A.raiz,.25*L,.25*L,0,V.mul(n,s('radix')*.06*L))}},
 parpados:{name:'Ojos, cejas y frente',group:'Rostro',tip:'Foto de frente, ojos abiertos y mirada al lente.',
  anchors:[{k:'ojoI',label:'Pupila, lado izquierdo de la foto'},{k:'ojoD',label:'Pupila, lado derecho de la foto'}],
  sliders:[sl('sup','Párpado superior, exceso de piel','Sin cambio','Retirar',0,100),sl('inf','Párpado inferior, bolsas y ojeras','Sin cambio','Atenuar',0,100),sl('ceja','Altura de la ceja','Descender','Elevar'),sl('cola','Cola de la ceja','Descender','Elevar'),sl('patas','Líneas periorbitarias','Sin cambio','Atenuar',0,100),sl('frente','Líneas de la frente','Sin cambio','Atenuar',0,100),sl('entrecejo','Entrecejo','Sin cambio','Atenuar',0,100)],
  apply(A,s,E){const ax=V.norm(V.sub(A.ojoD,A.ojoI)),d=V.len(V.sub(A.ojoD,A.ojoI)),up=V.up(ax),ang=V.ang(ax),mm=V.mid(A.ojoI,A.ojoD);
   if(s('frente'))E.mask('S',V.add(mm,V.mul(up,.8*d)),d,.38*d,ang,s('frente')*.9);
   if(s('entrecejo')){const c=V.add(mm,V.mul(up,.3*d));E.mask('S',c,.24*d,.26*d,ang,s('entrecejo')*.9);E.mask('L',c,.24*d,.26*d,ang,s('entrecejo')*.7)}
   for(const[e,lat]of[[A.ojoI,V.mul(ax,-1)],[A.ojoD,ax]]){
    if(s('sup'))E.shift(V.add(e,V.mul(up,.2*d)),.36*d,.13*d,ang,V.mul(up,s('sup')*.05*d));
    if(s('inf')){const c=V.add(e,V.mul(up,-.2*d));E.mask('L',c,.32*d,.13*d,ang,s('inf')*.9);E.mask('S',c,.32*d,.13*d,ang,s('inf')*.6)}
    if(s('ceja'))E.shift(V.add(e,V.mul(up,.42*d)),.5*d,.18*d,ang,V.mul(up,s('ceja')*.07*d));
    if(s('cola'))E.shift(V.add(V.add(e,V.mul(up,.4*d)),V.mul(lat,.3*d)),.32*d,.2*d,ang,V.mul(V.add(V.mul(up,.9),V.mul(lat,.25)),s('cola')*.07*d));
    if(s('patas'))E.mask('S',V.add(e,V.mul(lat,.42*d)),.16*d,.24*d,ang,s('patas')*.9)}}},
 lifting:{name:'Lifting y surcos',group:'Rostro',tip:'Foto de frente, expresión relajada.',
  anchors:[{k:'sIa',label:'Inicio del surco nasogeniano junto al ala nasal, lado izquierdo'},{k:'sIb',label:'Final del surco junto a la comisura, lado izquierdo'},{k:'sDa',label:'Inicio del surco junto al ala nasal, lado derecho'},{k:'sDb',label:'Final del surco junto a la comisura, lado derecho'},{k:'menton',label:'Mentón, punto más bajo'}],
  sliders:[sl('surco','Surco nasogeniano','Sin cambio','Atenuar',0,100),sl('mario','Líneas de marioneta','Sin cambio','Atenuar',0,100),sl('mejilla','Tercio medio y mejilla','Sin cambio','Elevar',0,100),sl('mand','Línea mandibular','Sin cambio','Definir',0,100),sl('cuello','Cuello y papada','Sin cambio','Tensar',0,100)],
  apply(A,s,E){const ax=V.norm(V.sub(A.sDa,A.sIa)),up=V.up(ax),F=V.len(V.sub(A.menton,V.mid(A.sIa,A.sDa)));
   for(const[a,b,lat]of[[A.sIa,A.sIb,V.mul(ax,-1)],[A.sDa,A.sDb,ax]]){const Lf=V.len(V.sub(b,a)),dir=V.norm(V.sub(b,a)),m=V.mid(a,b);
    if(s('surco')){const e=V.add(b,V.mul(dir,.15*Lf));E.maskCap('L',a,e,.24*Lf,s('surco'));E.maskCap('S',a,e,.24*Lf,s('surco')*.7)}
    if(s('mario')){const e=V.add(V.add(b,V.mul(up,-.6*Lf)),V.mul(lat,.05*Lf));E.maskCap('L',b,e,.17*Lf,s('mario'));E.maskCap('S',b,e,.17*Lf,s('mario')*.6)}
    if(s('mejilla'))E.shift(V.add(V.add(m,V.mul(lat,.6*Lf)),V.mul(up,.1*Lf)),.62*Lf,.62*Lf,0,V.mul(V.add(V.mul(up,.8),V.mul(lat,.4)),s('mejilla')*.1*Lf));
    if(s('mand'))E.shift(V.add(V.add(b,V.mul(up,-.75*Lf)),V.mul(lat,.4*Lf)),.55*Lf,.45*Lf,0,V.mul(V.add(V.mul(up,.8),V.mul(lat,.5)),s('mand')*.1*Lf))}
   if(s('cuello'))E.shift(V.add(A.menton,V.mul(up,-.32*F)),.6*F,.26*F,V.ang(ax),V.mul(up,s('cuello')*.08*F))}},
 otoplastia:{name:'Otoplastia',group:'Rostro',tip:'Foto de frente con el cabello recogido.',
  anchors:[{k:'orI',label:'Borde externo de la oreja, lado izquierdo de la foto'},{k:'orD',label:'Borde externo de la oreja, lado derecho de la foto'}],
  sliders:[sl('proy','Proyección de las orejas','Acercar','Separar'),sl('tam','Tamaño','Reducir','Aumentar')],
  apply(A,s,E){const ax=V.norm(V.sub(A.orD,A.orI)),d=V.len(V.sub(A.orD,A.orI)),ang=V.ang(ax),c=V.mid(A.orI,A.orD);
   for(const e of[A.orI,A.orD]){const tw=V.norm(V.sub(c,e));
    if(s('proy'))E.shift(e,.11*d,.24*d,ang,V.mul(tw,-s('proy')*.04*d));
    if(s('tam'))E.scale(e,.11*d,.24*d,ang,1+s('tam')*.2)}}},
 mamas:{name:'Mamas',group:'Cuerpo',tip:'Foto de frente, brazos a los lados.',
  anchors:[{k:'mI',label:'Centro de la mama, lado izquierdo de la foto'},{k:'mD',label:'Centro de la mama, lado derecho de la foto'}],
  sliders:[sl('vol','Volumen','Reducir','Aumentar'),sl('elev','Posición','Descender','Elevar'),sl('escote','Separación','Separar','Juntar'),sl('polo','Polo superior','Menos lleno','Más lleno'),sl('zona','Tamaño del área afectada','Pequeña','Amplia',35,85,55)],
  apply(A,s,E){const ax=V.norm(V.sub(A.mD,A.mI)),d=V.len(V.sub(A.mD,A.mI)),up=V.up(ax),ang=V.ang(ax),c=V.mid(A.mI,A.mD),r=d*s('zona');
   for(const e of[A.mI,A.mD]){const tw=V.norm(V.sub(c,e));
    if(s('vol'))E.scale(e,r,r,0,1+s('vol')*.3);
    if(s('elev'))E.shift(e,1.05*r,1.05*r,0,V.mul(up,s('elev')*.25*r));
    if(s('escote'))E.shift(e,r,r,0,V.mul(tw,s('escote')*.15*r));
    if(s('polo'))E.scale(V.add(e,V.mul(up,.45*r)),.75*r,.5*r,ang,1+s('polo')*.2)}}},
 contorno:{name:'Abdomen y cintura · frente',group:'Cuerpo',tip:'Abdominoplastia, liposucción y lipoescultura. Foto de frente o de espalda.',
  anchors:[{k:'cI',label:'Cintura, punto más estrecho del lado izquierdo de la foto'},{k:'cD',label:'Cintura, punto más estrecho del lado derecho de la foto'}],
  sliders:[sl('cintura','Cintura','Reducir','Aumentar'),sl('flanco','Flancos y espalda alta','Reducir','Aumentar'),sl('cadera','Caderas','Reducir','Aumentar'),sl('inferior','Abdomen inferior, colgajo','Sin cambio','Tensar',0,100),sl('piel','Estrías y flacidez','Sin cambio','Atenuar',0,100)],
  apply(A,s,E){const ax=V.norm(V.sub(A.cD,A.cI)),Wd=V.len(V.sub(A.cD,A.cI)),up=V.up(ax),ang=V.ang(ax),c=V.mid(A.cI,A.cD);
   for(const e of[A.cI,A.cD]){const tw=V.norm(V.sub(c,e));
    if(s('cintura'))E.shift(e,.3*Wd,.55*Wd,ang,V.mul(tw,-s('cintura')*.1*Wd));
    if(s('flanco'))E.shift(V.add(e,V.mul(up,.6*Wd)),.3*Wd,.45*Wd,ang,V.mul(tw,-s('flanco')*.08*Wd));
    if(s('cadera'))E.shift(V.add(e,V.mul(up,-.75*Wd)),.3*Wd,.45*Wd,ang,V.mul(tw,-s('cadera')*.08*Wd))}
   if(s('inferior'))E.shift(V.add(c,V.mul(up,-.55*Wd)),.5*Wd,.35*Wd,ang,V.mul(up,s('inferior')*.12*Wd));
   if(s('piel'))E.mask('S',V.add(c,V.mul(up,-.3*Wd)),.5*Wd,.65*Wd,ang,s('piel')*.95)}},
 perfil:{name:'Abdomen y glúteo · perfil',group:'Cuerpo',tip:'Foto de perfil con fondo liso.',
  anchors:[{k:'ab',label:'Punto más prominente del abdomen'},{k:'esp',label:'Espalda, a la misma altura'},{k:'glu',label:'Punto más prominente del glúteo'}],
  sliders:[sl('abd','Abdomen','Aplanar','Aumentar'),sl('colgajo','Colgajo abdominal inferior','Sin cambio','Retirar',0,100),sl('glu','Glúteo','Reducir','Aumentar')],
  apply(A,s,E){const back=V.norm(V.sub(A.esp,A.ab)),T=V.len(V.sub(A.esp,A.ab)),up=V.up(back),ang=V.ang(back);
   if(s('abd'))E.shift(A.ab,.45*T,.8*T,ang,V.mul(back,-s('abd')*.18*T));
   if(s('colgajo'))E.shift(V.add(A.ab,V.mul(up,-.7*T)),.45*T,.45*T,0,V.mul(V.add(V.mul(up,.7),V.mul(back,.5)),s('colgajo')*.15*T));
   if(s('glu'))E.shift(A.glu,.4*T,.6*T,ang,V.mul(back,s('glu')*.15*T))}}
};
function brazoApply(A,s,E){const ab=V.sub(A.co,A.ax),L=V.len(ab)||1,u=V.norm(ab),t=clamp(((A.bj[0]-A.ax[0])*u[0]+(A.bj[1]-A.ax[1])*u[1])/L,0,1),cl=V.add(A.ax,V.mul(u,t*L)),dv=V.sub(cl,A.bj),h=Math.max(V.len(dv),.05*L);
  if(s('flac'))E.shift(A.bj,.5*L,1.4*h,V.ang(u),V.mul(dv,s('flac')*.5));
  if(s('piel'))E.mask('S',V.mid(cl,A.bj),.5*L,1.2*h,V.ang(u),s('piel')*.9)}
const BRAZO=lado=>({name:'Brazo · lado '+lado,group:'Cuerpo',tip:'Brazo abierto en cruz, foto de frente o de espalda.',
  anchors:[{k:'ax',label:'Axila, en el pliegue'},{k:'co',label:'Codo, cara interna'},{k:'bj',label:'Punto más colgante del borde inferior del brazo'}],
  sliders:[sl('flac','Flacidez del brazo','Sin cambio','Reducir',0,100),sl('piel','Piel del brazo','Sin cambio','Atenuar',0,100)],apply:brazoApply});
Object.assign(MODULES,{
 facial:{name:'Contorno facial · frente',group:'Rostro',tip:'Pómulos, mejillas, mentón y mandíbula. Foto de frente.',
  anchors:[{k:'pI',label:'Pómulo más prominente, lado izquierdo de la foto'},{k:'pD',label:'Pómulo más prominente, lado derecho de la foto'},{k:'aI',label:'Ángulo de la mandíbula, lado izquierdo'},{k:'aD',label:'Ángulo de la mandíbula, lado derecho'},{k:'menton',label:'Mentón, centro'}],
  sliders:[sl('pomulo','Proyección de pómulos','Reducir','Aumentar'),sl('mejilla','Mejillas (bichectomía o relleno)','Afinar','Rellenar'),sl('angulo','Ángulo mandibular','Afinar','Marcar'),sl('menton','Tamaño del mentón','Reducir','Aumentar'),sl('mentonAlt','Altura del mentón','Acortar','Alargar')],
  apply(A,s,E){const ax=V.norm(V.sub(A.pD,A.pI)),d=V.len(V.sub(A.pD,A.pI)),up=V.up(ax),ang=V.ang(ax),c=V.mid(A.pI,A.pD);
   for(const[p,a]of[[A.pI,A.aI],[A.pD,A.aD]]){const out=V.norm(V.sub(p,c));
    if(s('pomulo'))E.scale(p,.17*d,.17*d,0,1+s('pomulo')*.22);
    if(s('mejilla'))E.shift(V.mid(p,a),.16*d,.24*d,ang,V.mul(out,s('mejilla')*.045*d));
    if(s('angulo'))E.shift(a,.2*d,.2*d,0,V.mul(out,s('angulo')*.05*d))}
   if(s('menton'))E.scale(A.menton,.2*d,.2*d,0,1+s('menton')*.2);
   if(s('mentonAlt'))E.shift(A.menton,.3*d,.22*d,ang,V.mul(up,-s('mentonAlt')*.05*d))}},
 labios:{name:'Labios',group:'Rostro',tip:'Foto de frente, boca cerrada y relajada.',
  anchors:[{k:'cI',label:'Comisura, lado izquierdo de la foto'},{k:'cD',label:'Comisura, lado derecho de la foto'},{k:'sup',label:'Borde del labio superior, en el centro'},{k:'inf',label:'Borde inferior del labio inferior, en el centro'}],
  sliders:[sl('sup','Volumen del labio superior','Reducir','Aumentar'),sl('inf','Volumen del labio inferior','Reducir','Aumentar'),sl('lift','Lip lift','Sin cambio','Acortar',0,100),sl('comis','Comisuras','Descender','Elevar'),sl('barras','Líneas peribucales','Sin cambio','Atenuar',0,100)],
  apply(A,s,E){const ax=V.norm(V.sub(A.cD,A.cI)),w=V.len(V.sub(A.cD,A.cI)),up=V.up(ax),ang=V.ang(ax),c=V.mid(A.cI,A.cD),hU=Math.max(V.len(V.sub(A.sup,c)),.05*w),hL=Math.max(V.len(V.sub(A.inf,c)),.05*w);
   if(s('sup'))E.shift(A.sup,.5*w,.95*hU,ang,V.mul(up,s('sup')*.35*hU));
   if(s('inf'))E.shift(A.inf,.5*w,.95*hL,ang,V.mul(up,-s('inf')*.35*hL));
   if(s('lift'))E.shift(V.add(A.sup,V.mul(up,1.1*hU)),.5*w,1.9*hU,ang,V.mul(up,s('lift')*.3*hU));
   if(s('comis'))for(const e of[A.cI,A.cD])E.shift(e,.16*w,.16*w,0,V.mul(up,s('comis')*.04*w));
   if(s('barras'))E.mask('S',V.add(A.sup,V.mul(up,1.2*hU)),.55*w,1.3*hU,ang,s('barras')*.9)}},
 perfilFacial:{name:'Mentón y cuello · perfil',group:'Rostro',tip:'Foto de perfil, cabeza recta y fondo liso.',
  anchors:[{k:'menton',label:'Punto más prominente del mentón'},{k:'papada',label:'Punto más bajo de la papada'},{k:'cuello',label:'Ángulo entre la papada y el cuello'}],
  sliders:[sl('proy','Proyección del mentón','Reducir','Aumentar'),sl('alt','Altura del mentón','Acortar','Alargar'),sl('papada','Papada','Sin cambio','Reducir',0,100),sl('cervical','Ángulo del cuello','Sin cambio','Definir',0,100)],
  apply(A,s,E){const D=V.len(V.sub(A.menton,A.cuello))||1,fwd=[A.menton[0]>=A.cuello[0]?1:-1,0],up=[0,-1];
   if(s('proy'))E.shift(A.menton,.45*D,.45*D,0,V.mul(fwd,s('proy')*.12*D));
   if(s('alt'))E.shift(A.menton,.45*D,.45*D,0,V.mul(up,-s('alt')*.1*D));
   if(s('papada'))E.shift(A.papada,.5*D,.4*D,0,V.mul(V.add(V.mul(up,.9),V.mul(fwd,-.2)),s('papada')*.16*D));
   if(s('cervical'))E.shift(A.cuello,.4*D,.4*D,0,V.mul(V.add(V.mul(up,.7),V.mul(fwd,-.6)),s('cervical')*.1*D))}},
 gluteos:{name:'Glúteos · espalda',group:'Cuerpo',tip:'Foto de espalda, pies separados al ancho de la cadera.',
  anchors:[{k:'gI',label:'Centro del glúteo, lado izquierdo de la foto'},{k:'gD',label:'Centro del glúteo, lado derecho de la foto'}],
  sliders:[sl('vol','Volumen','Reducir','Aumentar'),sl('elev','Posición','Descender','Elevar'),sl('polo','Polo superior','Menos lleno','Más lleno'),sl('lateral','Depresión lateral de cadera','Marcar','Rellenar'),sl('zona','Tamaño del área afectada','Pequeña','Amplia',35,85,55)],
  apply(A,s,E){const ax=V.norm(V.sub(A.gD,A.gI)),d=V.len(V.sub(A.gD,A.gI)),up=V.up(ax),ang=V.ang(ax),c=V.mid(A.gI,A.gD),r=d*s('zona');
   for(const e of[A.gI,A.gD]){const lat=V.norm(V.sub(e,c));
    if(s('vol'))E.scale(e,r,r,0,1+s('vol')*.25);
    if(s('elev'))E.shift(e,1.05*r,1.05*r,0,V.mul(up,s('elev')*.2*r));
    if(s('polo'))E.scale(V.add(e,V.mul(up,.45*r)),.75*r,.5*r,ang,1+s('polo')*.2);
    if(s('lateral'))E.shift(V.add(e,V.mul(lat,.85*r)),.45*r,.8*r,ang,V.mul(lat,s('lateral')*.12*r))}}},
 muslos:{name:'Muslos',group:'Cuerpo',tip:'Foto de frente o de espalda, piernas ligeramente separadas.',
  anchors:[{k:'eI',label:'Borde externo del muslo, lado izquierdo de la foto'},{k:'iI',label:'Borde interno del muslo, lado izquierdo'},{k:'iD',label:'Borde interno del muslo, lado derecho'},{k:'eD',label:'Borde externo del muslo, lado derecho de la foto'}],
  sliders:[sl('ext','Cara externa (cartucheras)','Reducir','Aumentar'),sl('int','Cara interna','Reducir','Aumentar'),sl('piel','Celulitis y flacidez','Sin cambio','Atenuar',0,100)],
  apply(A,s,E){for(const[e,i]of[[A.eI,A.iI],[A.eD,A.iD]]){const m=V.mid(e,i),wT=V.len(V.sub(i,e))||1,ang=V.ang(V.sub(i,e));
    if(s('ext'))E.shift(e,.35*wT,1.1*wT,ang,V.mul(V.norm(V.sub(m,e)),-s('ext')*.1*wT));
    if(s('int'))E.shift(i,.35*wT,1.1*wT,ang,V.mul(V.norm(V.sub(m,i)),-s('int')*.1*wT));
    if(s('piel'))E.mask('S',m,.6*wT,1.2*wT,ang,s('piel')*.9)}}},
 brazoI:BRAZO('izquierdo de la foto'),brazoD:BRAZO('derecho de la foto')
});
function modState(photo,mk){photo.mods=photo.mods||{};if(!photo.mods[mk])photo.mods[mk]={a:{},s:{}};return photo.mods[mk]}
const modPlaced=(photo,mk)=>{const st=photo.mods&&photo.mods[mk];return!!st&&MODULES[mk].anchors.every(a=>st.a[a.k])};
const modActive=(photo,mk)=>modPlaced(photo,mk)&&MODULES[mk].sliders.some(d=>d.k!=='zona'&&(photo.mods[mk].s[d.k]??d.def)!==d.def);
