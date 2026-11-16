'use strict';
/* イセログ 歩ける拠点（町）。視点はフィールドと同じ（上＝奥）。建物に近づいて「入る」と、その施設の画面（拠点のタブ）が開く
   位置はこの端末だけのもの（ゲームの状態には入れない）。オンラインでは仲間の位置を様子(myStat)で配る */
// 町の配置：id＝施設（FAC）、tab＝入った時に開くタブ。k＝施設でない物（看板・たき火・出口）
const TOWN={W:13,H:11,sx:6.5,sy:8.6,spots:[
 {id:'lab',x:3,y:3,tab:'tech'},{id:'store',x:6.5,y:2.4,tab:'store',open:1},{id:'shop',x:10,y:3,tab:'craft'},
 {id:'house',x:3,y:7.2,tab:'people'},{id:'farm',x:10,y:7.2,tab:'people'},
 {k:'board',em:'🪧',n:'建築の看板',x:4.9,y:5.1,tab:'build',r:.35},{k:'fire',em:'🔥',n:'たき火',x:6.5,y:5.4,r:.45},
 {k:'gate',em:'🚩',n:'村の出口',x:6.5,y:10.4,tab:'go',r:0},
 {k:'home',em:'🏠',n:'自分の家',x:11.6,y:5.2,tab:'home',r:.6},{id:'forge',x:1.4,y:5.2,tab:'craft',era:1},
 {id:'works',x:1.6,y:9.6,tab:'people',era:1},{id:'clinic',x:4.1,y:9.6,tab:'build',era:1},{id:'school',x:8.9,y:9.6,tab:'tech',era:1},{id:'market',x:11.4,y:9.6,tab:'store',era:2}]};
// 今の時代で町にある物（炉は古代から）
function townSpots(){return TOWN.spots.filter(s=>(s.era||0)<=eraOf())}
// 建物の名前と絵（施設はレベルと建築中を反映）
function spotInfo(s){if(s.k)return {em:s.em,n:s.n,lb:s.n,tab:s.tab};const f=FAC[s.id],lv=facLv(s.id),b=G.world.base,bd=b.bld&&b.bld.id===s.id;
 if(!lv&&!s.open)return {em:'🚧',n:f.n,lb:f.n+'（建設予定地）'+(bd?' 🔨':''),tab:'build',un:1};
 return {em:lv?f.em:'🚧',n:f.n,lb:f.n+(lv?' Lv'+lv:'')+(bd?' 🔨建築中':''),tab:s.tab}}
const TV={v:View.create(),x:TOWN.sx,y:TOWN.sy,fl:0,bk:0,near:undefined,mp:{},st:0,
 attach(){const c=document.getElementById('tv');if(!c)return;const v=this.v;View.attach(v,c);const tile=Math.max(30,Math.min(v.w/7.5,v.h/11));v.cam.cx=v.w/2;v.cam.H=16;v.cam.tile=tile;v.cam.hz=v.h*.72-tile*16*.75;
  c.onpointerdown=e=>{auInit();const r=c.getBoundingClientRect();FV.joy={id:e.pointerId,x0:e.clientX-r.left,y0:e.clientY-r.top,dx:0,dy:0,c:'tv'};e.preventDefault()};this.near=undefined;this.draw()},
 nearSpot(){let best=null,bd=1e9;townSpots().forEach(s=>{if(!s.tab)return;const d=Math.hypot(s.x-this.x,s.y-this.y),lim=s.k?1.2:1.7;if(d<lim&&d<bd){bd=d;best=s}});return best},
 tick(dt){const d=FV.dir();if(d[0]||d[1]){const l=Math.hypot(d[0],d[1]),sp=CFG.walkSpeed||4;let nx=this.x+d[0]/l*sp*dt,ny=this.y+d[1]/l*sp*dt;
   nx=Math.max(.4,Math.min(TOWN.W-.4,nx));ny=Math.max(.6,Math.min(TOWN.H-.2,ny));
   townSpots().forEach(s=>{const r=s.r!=null?s.r:.95;if(!r)return;const ex=nx-s.x,ey=(ny-s.y)*1.4,dd=Math.hypot(ex,ey);if(dd<r){const m=dd||1;nx=s.x+ex/m*r;ny=s.y+ey/m*r/1.4}});
   this.x=nx;this.y=ny;if(d[0])this.fl=d[0]<0?1:0;this.bk=d[1]<0?1:d[1]>0?0:this.bk;this.st+=dt;if(this.st>.32){this.st=0;sfx('step')}}
  const n=this.nearSpot(),nk=n?(n.id||n.k)+spotInfo(n).tab:null;if(nk!==this.near){this.near=nk;const b=document.querySelector('[data-a="tAct"]');if(b){b.classList.toggle('dis',!n);b.innerHTML=townActH(n)}}},
 draw(){const v=this.v;if(!v.ctx||!document.getElementById('tv')||!G||G.phase!=='prep')return;const c=v.cam,k=v.ctx,now=performance.now(),FAR=22,T=TOWN;
  View.look(v,Math.max(3.5,Math.min(T.W-3.5,this.x)),Math.min(T.H+2.5,this.y+4));View.begin(v);
  const hy=View.pr(v,0,c.near-FAR).y,g=k.createLinearGradient(0,0,0,Math.max(1,hy));g.addColorStop(0,'#f6c88a');g.addColorStop(1,'#fbe9c8');k.fillStyle=g;k.fillRect(0,0,v.w,Math.max(0,hy));k.fillStyle='#4c8f45';k.fillRect(0,hy,v.w,v.h-hy);
  for(let y=Math.floor(c.near-FAR);y<=Math.floor(c.near+1.5);y++){const s=c.F/(c.F+Math.max(-c.F*.8,c.near-y)),hw=v.w/2/(c.tile*s)+1,x0=Math.floor(c.x-hw),x1=Math.ceil(c.x+hw);
   for(let x=x0;x<=x1;x++){const inT=x>=0&&x<T.W&&y>=0&&y<T.H,road=inT&&(x===6||(y===5&&x>1&&x<11)),col=!inT?(((x+y)&1)?'#468841':'#4c8f45'):road?(((x+y)&1)?'#c7ae68':'#bfa560'):(((x+y)&1)?'#74b455':'#6aa94d');
    View.poly(v,[[x,y],[x+1.02,y],[x+1.02,y+1.04],[x,y+1.04]],0,col);
    if(!inT&&(x===-1||x===T.W||y===-1)&&hsh(x,y,31)>.25)View.add(v,{x:x+.5,y:y+.6,w:1,h:1.3+hsh(x,y,7)*.5,art:'tree',tall:true})}}
  // 柵
  View.poly(v,[[-.05,-.05],[T.W+.05,-.05],[T.W+.05,T.H],[-.05,T.H]],0,null,'#7a5230',3);
  townSpots().forEach(s=>{const f=spotInfo(s),big=!s.k;if(big)View.poly(v,[[s.x-1.1,s.y-.6],[s.x+1.1,s.y-.6],[s.x+1.1,s.y+.5],[s.x-1.1,s.y+.5]],0,f.un?'#9a8a64':'#b39b62','rgba(0,0,0,.25)',1);
   View.add(v,{x:s.x,y:s.y+.3,z:s.k==='fire'?Math.sin(now/150)*.02:0,w:big?1.9:.9,h:big?1.8:.9,art:'emo',o:{em:f.em},tall:big,alpha:f.un?.75:1,
    after:(k,X,Y,S)=>{k.font='bold '+Math.max(10,S*.26)+'px sans-serif';k.textAlign='center';k.lineWidth=3;k.strokeStyle='#000';const yy=Y-(big?1.9:1)*S;k.strokeText(f.lb,X,yy);k.fillStyle=f.un?'#ddd':'#ffe9a8';k.fillText(f.lb,X,yy)}})});
  // 自分
  const p=me(),nr=this.nearSpot();View.add(v,{x:this.x,y:this.y,w:.7,h:.98,art:'unit',focus:true,o:{em:p?CH[p.ch].em:'🙂',ring:'#e8b800',back:this.bk,flip:this.fl},
   after:nr?(k,X,Y,S)=>{k.font=(S*.45)+'px '+View.EMF;k.textAlign='center';k.fillText('💬',X,Y-S*(1.1+Math.sin(now/200)*.05))}:null});
  // 拠点にいる仲間（オンライン）
  const mp={};mates().forEach(m=>{const s=m.s;if(!s||s.w!=='b'||s.x==null)return;const o=this.mp[m.pid]||{x:s.x,y:s.y};o.x+=(s.x-o.x)*.12;o.y+=(s.y-o.y)*.12;mp[m.pid]=o;
   View.add(v,{x:o.x,y:o.y,w:.7,h:.98,art:'unit',o:{em:s.em,ring:'#3a8ee8'},after:(k,X,Y,S)=>{k.font='bold '+Math.max(10,S*.28)+'px sans-serif';k.textAlign='center';k.lineWidth=3;k.strokeStyle='#000';const yy=Y-1.12*S;k.strokeText((m.h?'👑':'')+m.name,X,yy);k.fillStyle='#9fd0ff';k.fillText((m.h?'👑':'')+m.name,X,yy)}})});this.mp=mp;
  View.flush(v);
  const j=FV.joy;if(j&&j.c==='tv'){k.globalAlpha=.35;k.fillStyle='#000';k.beginPath();k.arc(j.x0,j.y0,44,0,7);k.fill();k.fillStyle='#fff';const l=Math.hypot(j.dx,j.dy)||1,m=Math.min(1,36/l);k.beginPath();k.arc(j.x0+j.dx*m,j.y0+j.dy*m,18,0,7);k.fill();k.globalAlpha=1}}
};
function townActH(s){if(!s)return '💬 近くの建物に入る';const f=spotInfo(s);return f.un?'🚧 '+f.n+'を建てる':s.k==='gate'?'🚩 冒険の準備をする':f.em+' '+f.n+'に入る'}
function townOn(){return !!(G&&scr==='game'&&G.phase==='prep'&&!ui.panel&&!ui.ov)}
function vTown(){return `<div class="cb"><canvas id="tv"></canvas><div class="cbt">${G.players.length>1?partyH():''}</div><div class="cbs"></div><div class="fctl">${btn('tAct',townActH(TV.nearSpot()),{c:'pri '+(TV.nearSpot()?'':'dis'),y:1})}${btn('tPanel','📋 一覧',{c:'sm'})}</div></div>`}
Object.assign(ACT,{
 tAct(){const s=TV.nearSpot();if(!s)return toast('建物に近づくと入れます');ui.tab=spotInfo(s).tab;ui.panel=1;FV.joy=null},
 tPanel(){ui.panel=1;FV.joy=null},tTown(){ui.panel=0}});
(function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-(TV.last||t))/1000||0);TV.last=t;if(townOn()){TV.tick(dt);TV.draw()}})(0);
