/* ============ foto de ejemplo (ilustración) ============ */
function demoFace(){
  const c=document.createElement('canvas');c.width=900;c.height=1200;const x=c.getContext('2d');
  let g=x.createLinearGradient(0,0,0,1200);g.addColorStop(0,'#CFCBD6');g.addColorStop(1,'#A7A2B1');x.fillStyle=g;x.fillRect(0,0,900,1200);
  const el=(cx,cy,rx,ry,f)=>{x.fillStyle=f;x.beginPath();x.ellipse(cx,cy,rx,ry,0,0,7);x.fill()};
  el(450,1290,440,240,'#5B5567');
  g=x.createLinearGradient(0,840,0,1080);g.addColorStop(0,'#B98A72');g.addColorStop(1,'#CFA088');x.fillStyle=g;x.fillRect(352,820,196,270);
  el(450,470,288,335,'#3A2E2A');el(196,575,34,72,'#D0A086');el(704,575,34,72,'#D0A086');el(200,578,16,44,'#B98A72');el(700,578,16,44,'#B98A72');
  g=x.createRadialGradient(450,520,60,450,570,360);g.addColorStop(0,'#EBC6AE');g.addColorStop(1,'#D3A287');el(450,575,246,332,g);
  x.fillStyle='#3A2E2A';x.beginPath();x.moveTo(200,470);x.bezierCurveTo(230,220,670,220,700,470);x.bezierCurveTo(640,330,560,300,450,310);x.bezierCurveTo(340,300,260,330,200,470);x.fill();
  const st=(w,col,fn)=>{x.lineWidth=w;x.strokeStyle=col;x.lineCap='round';x.beginPath();fn();x.stroke()};
  for(const sx of[-1,1]){const X=v=>450+sx*v;
    st(15,'#4A3A33',()=>{x.moveTo(X(48),462);x.quadraticCurveTo(X(105),436,X(168),462)});
    el(X(100),492,56,16,'rgba(150,100,85,.45)');
    el(X(100),508,42,19,'#F6F1EE');el(X(100),508,18,18,'#5E4636');el(X(100),508,8,8,'#16110F');el(X(94),502,3,3,'#fff');
    st(5,'#3A2A25',()=>{x.moveTo(X(56),508);x.quadraticCurveTo(X(100),480,X(144),508)});
    st(9,'rgba(140,95,90,.35)',()=>{x.moveTo(X(60),536);x.quadraticCurveTo(X(100),560,X(142),538)});
    st(4,'rgba(120,80,70,.4)',()=>{x.moveTo(X(152),500);x.lineTo(X(172),492);x.moveTo(X(154),512);x.lineTo(X(176),514)});
    st(11,'rgba(165,115,95,.5)',()=>{x.moveTo(X(22),520);x.quadraticCurveTo(X(34),600,X(52),662)});
    el(X(26),678,10,6,'#5A3A32');
    st(9,'rgba(140,90,75,.6)',()=>{x.moveTo(X(52),668);x.quadraticCurveTo(X(66),650,X(50),632)});
    st(9,'rgba(120,72,58,.55)',()=>{x.moveTo(X(58),694);x.quadraticCurveTo(X(96),730,X(84),786)});
    st(6,'rgba(120,72,58,.4)',()=>{x.moveTo(X(72),790);x.quadraticCurveTo(X(80),820,X(74),846)});
    el(X(150),640,50,36,'rgba(225,150,140,.22)')}
  el(450,668,30,20,'rgba(255,235,220,.5)');
  st(13,'#B4625F',()=>{x.moveTo(385,772);x.quadraticCurveTo(450,756,515,772)});st(9,'#C7797A',()=>{x.moveTo(396,782);x.quadraticCurveTo(450,806,504,782)});
  st(8,'rgba(150,100,85,.35)',()=>{x.moveTo(410,866);x.quadraticCurveTo(450,880,490,866)});
  x.fillStyle='rgba(34,28,46,.75)';x.font='600 22px sans-serif';x.fillText('Ilustración de ejemplo',24,1176);
  return c.toDataURL('image/jpeg',.92)}
