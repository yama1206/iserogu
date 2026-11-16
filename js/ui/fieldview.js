'use strict';
/* イセログ フィールドの描画と歩く操作（描画は View を使う。視点は戦闘と同じ：上＝奥） */
const FT={p:['#74b455','#6aa94d'],f:['#4c8f45','#468841'],t:['#4c8f45','#468841'],h:['#c7ae68','#bfa560'],w:['#58a8e0','#4f9fd8'],r:['#8a9478','#848e72'],
 s:['#e6cf8c','#dfc683'],n:['#eef3f7','#e3ebf1'],m:['#6e7a4a','#667244'],a:['#5c4f4a','#544844'],l:['#e8541c','#f06a20']};
const FMC={p:[116,180,85],f:[62,128,60],t:[38,92,44],h:[199,174,104],w:[88,168,224],r:[128,130,128],s:[230,207,140],n:[238,243,247],m:[100,112,68],a:[92,79,74],l:[232,84,28]};
// 通れない「t」の見た目（バイオームごと）
const TREE={desert:'🌵',snow:'🌲',swamp:'🌳',volcano:'🪵'};
function bioName(x,y){return BIO[biomeAt(Math.floor(x),Math.floor(y))].n}
View.ART.emo={draw(k,w,h,o){k.font=(h*.9)+'px '+View.EMF;k.textAlign='center';k.textBaseline='alphabetic';k.fillStyle='#222';k.fillText(o.em||'?',0,-h*.06)}};
const FV={jt:0,v:View.create(),keys:{},joy:null,tile:40,top:0,last:0,trail:[],img:null,sv:-1,mp:{},seed:0,near:undefined,reg:-1,st:0,
 reset(){this.trail=[];this.joy=null;this.sv=-1;this.near=undefined;this.reg=-1},
 attach(){const c=document.getElementById('fv');if(!c)return;this.mapZ=this.mapZ||1;const v=this.v;View.attach(v,c);this.tile=Math.max(30,Math.min(v.w/7.5,v.h/11));v.cam.cx=v.w/2;v.cam.H=16;v.cam.tile=this.tile;v.cam.hz=v.h*.72-this.tile*16*.75;
  const t=document.querySelector('.cbt');this.top=t?t.getBoundingClientRect().bottom-c.getBoundingClientRect().top:0;
  c.onpointerdown=e=>{auInit();const r=c.getBoundingClientRect();this.joy={id:e.pointerId,x0:e.clientX-r.left,y0:e.clientY-r.top,dx:0,dy:0};e.preventDefault()};this.near=undefined;this.reg=-1;this.draw()},
 // 入力をまとめて8方向にする（キーボード／コントローラー／画面をなぞる）
 dir(){let dx=0,dy=0;const k=this.keys;if(k.arrowleft||k.a)dx--;if(k.arrowright||k.d)dx++;if(k.arrowup||k.w)dy--;if(k.arrowdown||k.s)dy++;
  const gs=navigator.getGamepads?navigator.getGamepads():[];for(const g of gs){if(!g||!g.connected)continue;const b=i=>g.buttons[i]&&g.buttons[i].pressed;if(b(14)||g.axes[0]<-.4)dx--;if(b(15)||g.axes[0]>.4)dx++;if(b(12)||g.axes[1]<-.4)dy--;if(b(13)||g.axes[1]>.4)dy++;break}
  const j=this.joy;if(j&&Math.hypot(j.dx,j.dy)>14){const a=Math.round(Math.atan2(j.dy,j.dx)/(Math.PI/4))*Math.PI/4;dx+=Math.round(Math.cos(a));dy+=Math.round(Math.sin(a))}
  return [Math.sign(dx),Math.sign(dy)]},
 tick(dt){if(!fieldOn()){if(!G||G.phase!=='field')this.joy=null;return}const d=this.dir(),fd=G.fd;
  if((d[0]||d[1])&&!Party.fol){act(me().id,{t:'walk',dx:d[0],dy:d[1],dt});if(!G||G.phase!=='field')return}   // 合流中はリーダーだけが歩く
  {const f=G.fd,t=this.trail,l=t[t.length-1];if(!l||Math.hypot(l[0]-f.x,l[1]-f.y)>.12){t.push([f.x,f.y]);if(t.length>40)t.shift()}
   if(f.steps!==this.st){this.st=f.steps;if(f.steps%2===0)sfx('step')}}
  if(performance.now()-this.jt>250){this.jt=performance.now();const b=document.querySelector('[data-a="fJoin"]');if(b){const m=joinTarget(),tx=m?(m.s.w==='c'?'⚔️ '+m.name+'に加勢':'🤝 '+m.name+'と合流'):'🤝 合流';b.classList.toggle('dis',!m);if(b.textContent!==tx)b.textContent=tx}}
  const n=fieldNear(),nk=n?n.key:null;if(nk!==this.near){this.near=nk;const b=document.querySelector('[data-a="fAct"]');if(b){b.classList.toggle('dis',!n);b.textContent=n?'✋ '+MAT[n.m].n+'を採集':'✋ 採集'}}
  {const b=document.querySelector('[data-a="ovCamp"]');if(b){const t=campLbl();if(b.textContent!==t)b.textContent=t}}
  const r=regLabel();if(r!==this.reg){this.reg=r;const e=document.getElementById('reg');if(e)e.textContent=r}},
 draw(){const v=this.v;if(!v.ctx||!document.getElementById('fv')||!G||G.phase!=='field'||!G.fd)return;const fd=G.fd,W=wld(),c=v.cam,k=v.ctx,now=performance.now(),FAR=26;
  View.look(v,fd.x,fd.y+4);View.begin(v);
  const hy=View.pr(v,0,c.near-FAR).y,g=k.createLinearGradient(0,0,0,Math.max(1,hy));g.addColorStop(0,'#8fd0f4');g.addColorStop(1,'#e6f4dc');k.fillStyle=g;k.fillRect(0,0,v.w,Math.max(0,hy));k.fillStyle='#62a487';k.fillRect(0,hy,v.w,v.h-hy);
  // 地面（奥から手前へ。同じ色が続く所はまとめて描く）と、立っている物
  for(let y=Math.floor(c.near-FAR);y<=Math.floor(c.near+1.5);y++){const s=c.F/(c.F+Math.max(-c.F*.8,c.near-y)),hw=v.w/2/(c.tile*s)+1,x0=Math.floor(c.x-hw),x1=Math.ceil(c.x+hw);let rs=x0,rk=null;
   for(let x=x0;x<=x1+1;x++){const key=x<=x1?ftile(x,y)+(((x>>1)+(y>>1))&1):null;if(key!==rk){if(rk)View.poly(v,[[rs,y],[x,y],[x,y+1.04],[rs,y+1.04]],0,FT[rk[0]][+rk[1]]);rs=x;rk=key}}
   for(let x=x0;x<=x1;x++){const t=ftile(x,y),r=hsh(x,y,77);
    if(t==='t'){const em=TREE[biomeAt(x,y)];if(em)View.add(v,{x:x+.35+r*.3,y:y+.55,w:1,h:1+r*.3,art:'emo',o:{em},tall:true});else View.add(v,{x:x+.35+r*.3,y:y+.5,w:1,h:1.25+r*.5,art:'tree',tall:true})}else if(t==='r')View.add(v,{x:x+.5,y:y+.6,w:.95,h:.6+r*.35,art:'rock',tall:true});
    const m=fd.taken[x+','+y]?null:nodeAt(x,y);if(m)View.add(v,{x:x+.5,y:y+.55,z:.05+Math.sin(now/300+x)*.04,w:.55,h:.55,art:'emo',o:{em:MAT[m].em}})}}
  View.add(v,{x:.5,y:.45,w:1.9,h:1.8,art:'emo',o:{em:'🛖'},tall:true});
  outs().forEach((o,i)=>{if(Math.abs(o.x-c.x)>30||o.y<c.near-FAR-2||o.y>c.near+3)return;View.add(v,{x:o.x+.5,y:o.y+.45,w:1.5,h:1.4,art:'emo',o:{em:'⛺'},tall:true,after:(k,X,Y,S)=>{k.font='bold '+Math.max(10,S*.28)+'px sans-serif';k.textAlign='center';k.lineWidth=3;k.strokeStyle='#000';const t='開拓地'+(i+1),yy=Y-1.5*S;k.strokeText(t,X,yy);k.fillStyle='#ffd27a';k.fillText(t,X,yy)}})});
  fixedNear(c.x,c.near-FAR/2,FAR).forEach(f=>{if(fd.dead[f.key])return;const b=f.k==='b';View.add(v,{x:f.x+.5,y:f.y+.6,w:b?1.2:.9,h:b?1.7:1.2,art:'unit',o:{em:EN[f.en[0]].em,ring:'#d0452c'},
   after:(k,X,Y,S)=>{k.font='bold '+Math.max(10,S*.3)+'px sans-serif';k.textAlign='center';k.lineWidth=3;k.strokeStyle='#000';const s=b?'👑ボス':'⚠️強敵',y=Y-(b?1.78:1.28)*S;k.strokeText(s,X,y);k.fillStyle='#ff8a70';k.fillText(s,X,y)}})});
  G.players.forEach((p,i)=>{if(p.out)return;let px=fd.x,py=fd.y;if(i){const t=this.trail[this.trail.length-1-i*5];if(t){px=t[0];py=t[1]}else{px=fd.x-.45*i;py=fd.y}}
   View.add(v,{x:px,y:py,w:.7,h:.98,art:'unit',focus:true,o:{em:CH[p.ch].em,ring:p.id===MY?'#e8b800':'#2f9e56',back:fd.bk,flip:fd.fl},
    after:p.id!==MY||!this.near?null:(k,X,Y,S)=>{k.font=(S*.5)+'px '+View.EMF;k.textAlign='center';k.fillText('✋',X,Y-S*(1.1+Math.sin(now/200)*.05))}})});
  // 同じ世界の仲間（オンライン）。届いた位置へなめらかに動かす
  const ms=mates(),mp={};ms.forEach(m=>{const s=m.s;if(!s||s.w==='b'||s.x==null||byId(m.pid))return;const o=this.mp[m.pid]||{x:s.x,y:s.y};o.x+=(s.x-o.x)*.12;o.y+=(s.y-o.y)*.12;if(Math.hypot(s.x-o.x,s.y-o.y)>6){o.x=s.x;o.y=s.y}mp[m.pid]=o;
   View.add(v,{x:o.x,y:o.y,w:.7,h:.98,art:'unit',o:{em:s.em,ring:'#3a8ee8'},after:(k,X,Y,S)=>{k.font='bold '+Math.max(10,S*.28)+'px sans-serif';k.textAlign='center';k.lineWidth=3;k.strokeStyle='#000';const t=(s.w==='c'?'⚔️':'')+m.name,yy=Y-1.12*S;k.strokeText(t,X,yy);k.fillStyle='#9fd0ff';k.fillText(t,X,yy)}})});this.mp=mp;
  View.flush(v);
  const j=this.joy;if(j){k.globalAlpha=.35;k.fillStyle='#000';k.beginPath();k.arc(j.x0,j.y0,44,0,7);k.fill();k.fillStyle='#fff';const l=Math.hypot(j.dx,j.dy)||1,m=Math.min(1,36/l);k.beginPath();k.arc(j.x0+j.dx*m,j.y0+j.dy*m,18,0,7);k.fill();k.globalAlpha=1}
  const m=Math.round(Math.min(120,v.w*.28));this.mini(k,v.w-m-8,this.top+8,m)},
 // 地図：1マス＝sc ピクセルで、発見済みの区画（8×8マス）だけ描く。zoom＝表示する半径（マス）
 paint(k,ox,oy,sc,x0,y0,x1,y1){for(let by=Math.floor(y0)>>3;by<=Math.floor(y1)>>3;by++)for(let bx=Math.floor(x0)>>3;bx<=Math.floor(x1)>>3;bx++){if(!G.world.seen[bx+','+by])continue;
   if(sc<1.5){const c=FMC[ftile(bx*8+4,by*8+4)];k.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;k.fillRect(ox+bx*8*sc,oy+by*8*sc,8*sc+.6,8*sc+.6);continue}
   for(let y=by*8;y<by*8+8;y++)for(let x=bx*8;x<bx*8+8;x++){const c=FMC[ftile(x,y)];k.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;k.fillRect(ox+x*sc,oy+y*sc,sc+.6,sc+.6)}}},
 marks(k,ox,oy,sc,full,x0,y0,x1,y1){const fd=G.fd,dot=(x,y,r,c)=>{k.fillStyle=c;k.beginPath();k.arc(ox+x*sc,oy+y*sc,r,0,7);k.fill();k.strokeStyle='#000';k.lineWidth=1;k.stroke()},rr=full?5:4;
  if(full&&sc>=3)for(let y=Math.floor(y0);y<=y1;y++)for(let x=Math.floor(x0);x<=x1;x++){if(!seenAt(x,y)||fd.taken[x+','+y])continue;if(nodeAt(x,y)){k.fillStyle='#fff';k.fillRect(ox+(x+.5)*sc-1,oy+(y+.5)*sc-1,2,2)}}
  dot(.5,.5,rr,'#fff');outs().forEach(o=>dot(o.x+.5,o.y+.5,rr,'#ff9a30'));fixedNear((x0+x1)/2,(y0+y1)/2,Math.max(x1-x0,y1-y0)/2).forEach(f=>{if(!fd.dead[f.key]&&seenAt(f.x,f.y))dot(f.x+.5,f.y+.5,rr,f.k==='b'?'#c040ff':'#ff4030')});
  mates().forEach(m=>{const o=this.mp[m.pid]||m.s;if(m.s&&m.s.w!=='b'&&o&&o.x!=null&&!byId(m.pid))dot(o.x,o.y,rr,'#40a0ff')});dot(fd.x,fd.y,rr,'#ffe060')},
 mini(k,x,y,m){const R=12,sc=m/(R*2),fd=G.fd,ox=x-(fd.x-R)*sc,oy=y-(fd.y-R)*sc;k.save();k.beginPath();k.rect(x,y,m,m);k.clip();k.fillStyle='#1a1612';k.fillRect(x,y,m,m);k.globalAlpha=.9;
  this.paint(k,ox,oy,sc,fd.x-R,fd.y-R,fd.x+R,fd.y+R);k.globalAlpha=1;this.marks(k,ox,oy,sc,false,fd.x-R,fd.y-R,fd.x+R,fd.y+R);k.restore();k.strokeStyle='#ffd870';k.lineWidth=2;k.strokeRect(x,y,m,m)},
 // 地図の画面（オーバーレイ）。🔍で広さを切り替える
 full(){const c=document.getElementById('mapcv');if(!c||!G||!G.fd)return;const S=Math.floor(Math.min(innerWidth-50,innerHeight*.6,560)),d=Math.min(2,devicePixelRatio||1);c.style.width=c.style.height=S+'px';c.width=c.height=S*d;
  const k=c.getContext('2d');k.setTransform(d,0,0,d,0,0);k.fillStyle='#1a1612';k.fillRect(0,0,S,S);const R=MAPZ[this.mapZ||1],sc=S/(R*2),fd=G.fd,cx=fd.x,cy=fd.y,ox=S/2-cx*sc,oy=S/2-cy*sc;
  this.paint(k,ox,oy,sc,cx-R,cy-R,cx+R,cy+R);this.marks(k,ox,oy,sc,true,cx-R,cy-R,cx+R,cy+R)}
};
const MAPZ=[16,32,64,128,256];
// 上のバーの地域名と危険度
function regLabel(){const fd=G.fd;if(!fd)return '';const lv=dangerAt(Math.floor(fd.x),Math.floor(fd.y));return bioName(fd.x,fd.y)+(lv?'・危険度'+lv:'')}
document.addEventListener('pointermove',e=>{const j=FV.joy;if(!j||e.pointerId!==j.id)return;const c=document.getElementById(j.c||'fv');if(!c)return;const r=c.getBoundingClientRect();j.dx=e.clientX-r.left-j.x0;j.dy=e.clientY-r.top-j.y0});
['pointerup','pointercancel'].forEach(n=>document.addEventListener(n,e=>{if(FV.joy&&e.pointerId===FV.joy.id)FV.joy=null}));
document.addEventListener('keydown',e=>{if(e.target.tagName!=='INPUT')FV.keys[e.key.toLowerCase()]=1});
document.addEventListener('keyup',e=>{FV.keys[e.key.toLowerCase()]=0});
window.addEventListener('blur',()=>{FV.keys={};FV.joy=null});
(function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-FV.last)/1000||0);FV.last=t;if(typeof G!=='undefined'&&G&&G.phase==='field'&&scr==='game'){FV.tick(dt);FV.draw()}})(0);
