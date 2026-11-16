'use strict';
/* イセログ フィールドの描画と歩く操作（描画は View を使う。視点は戦闘と同じ：上＝奥） */
const FT={p:['#74b455','#6aa94d'],f:['#4c8f45','#468841'],t:['#4c8f45','#468841'],h:['#c7ae68','#bfa560'],w:['#58a8e0','#4f9fd8'],r:['#8a9478','#848e72']};
const FMC={p:[116,180,85],f:[62,128,60],t:[38,92,44],h:[199,174,104],w:[88,168,224],r:[128,130,128]};
View.ART.emo={draw(k,w,h,o){k.font=(h*.9)+'px '+View.EMF;k.textAlign='center';k.textBaseline='alphabetic';k.fillStyle='#222';k.fillText(o.em||'?',0,-h*.06)}};
const FV={v:View.create(),keys:{},joy:null,tile:40,top:0,last:0,trail:[],img:null,sv:-1,mp:{},seed:0,near:undefined,reg:-1,st:0,
 reset(){this.trail=[];this.joy=null;this.sv=-1;this.near=undefined;this.reg=-1},
 attach(){const c=document.getElementById('fv');if(!c)return;const v=this.v;View.attach(v,c);this.tile=Math.max(30,Math.min(v.w/7.5,v.h/11));v.cam.cx=v.w/2;v.cam.H=16;v.cam.tile=this.tile;v.cam.hz=v.h*.72-this.tile*16*.75;
  const t=document.querySelector('.cbt');this.top=t?t.getBoundingClientRect().bottom-c.getBoundingClientRect().top:0;
  c.onpointerdown=e=>{auInit();const r=c.getBoundingClientRect();this.joy={id:e.pointerId,x0:e.clientX-r.left,y0:e.clientY-r.top,dx:0,dy:0};e.preventDefault()};this.near=undefined;this.reg=-1;this.draw()},
 // 入力をまとめて8方向にする（キーボード／コントローラー／画面をなぞる）
 dir(){let dx=0,dy=0;const k=this.keys;if(k.arrowleft||k.a)dx--;if(k.arrowright||k.d)dx++;if(k.arrowup||k.w)dy--;if(k.arrowdown||k.s)dy++;
  const gs=navigator.getGamepads?navigator.getGamepads():[];for(const g of gs){if(!g||!g.connected)continue;const b=i=>g.buttons[i]&&g.buttons[i].pressed;if(b(14)||g.axes[0]<-.4)dx--;if(b(15)||g.axes[0]>.4)dx++;if(b(12)||g.axes[1]<-.4)dy--;if(b(13)||g.axes[1]>.4)dy++;break}
  const j=this.joy;if(j&&Math.hypot(j.dx,j.dy)>14){const a=Math.round(Math.atan2(j.dy,j.dx)/(Math.PI/4))*Math.PI/4;dx+=Math.round(Math.cos(a));dy+=Math.round(Math.sin(a))}
  return [Math.sign(dx),Math.sign(dy)]},
 tick(dt){if(!fieldOn()){if(!G||G.phase!=='field')this.joy=null;return}const d=this.dir(),fd=G.fd;
  if(d[0]||d[1]){act(me().id,{t:'walk',dx:d[0],dy:d[1],dt});if(!G||G.phase!=='field')return;const t=this.trail,l=t[t.length-1];if(!l||Math.hypot(l[0]-fd.x,l[1]-fd.y)>.12){t.push([fd.x,fd.y]);if(t.length>40)t.shift()}
   if(fd.steps!==this.st){this.st=fd.steps;if(fd.steps%2===0)sfx('step')}}
  const n=fieldNear(),nk=n?n.key:null;if(nk!==this.near){this.near=nk;const b=document.querySelector('[data-a="fAct"]');if(b){b.classList.toggle('dis',!n);b.textContent=n?'✋ '+MAT[n.m].n+'を採集':'✋ 採集'}}
  const r=WORLD.reg[Math.floor(fd.y)][Math.floor(fd.x)];if(r!==this.reg){this.reg=r;const e=document.getElementById('reg');if(e)e.textContent=FIELDS[r?'forest':'grass'].n}},
 draw(){const v=this.v;if(!v.ctx||!document.getElementById('fv')||!G||G.phase!=='field'||!WORLD)return;const fd=G.fd,W=WORLD,c=v.cam,k=v.ctx,now=performance.now(),FAR=26;
  View.look(v,fd.x,fd.y+4);View.begin(v);
  const hy=View.pr(v,0,c.near-FAR).y,g=k.createLinearGradient(0,0,0,Math.max(1,hy));g.addColorStop(0,'#8fd0f4');g.addColorStop(1,'#e6f4dc');k.fillStyle=g;k.fillRect(0,0,v.w,Math.max(0,hy));k.fillStyle='#62a487';k.fillRect(0,hy,v.w,v.h-hy);
  // 地面（奥から手前へ。同じ色が続く所はまとめて描く）と、立っている物
  for(let y=Math.floor(c.near-FAR);y<=Math.floor(c.near+1.5);y++){const s=c.F/(c.F+Math.max(-c.F*.8,c.near-y)),hw=v.w/2/(c.tile*s)+1,x0=Math.floor(c.x-hw),x1=Math.ceil(c.x+hw);let rs=x0,rk=null;
   for(let x=x0;x<=x1+1;x++){const key=x<=x1?ftile(x,y)+(((x>>1)+(y>>1))&1):null;if(key!==rk){if(rk)View.poly(v,[[rs,y],[x,y],[x,y+1.04],[rs,y+1.04]],0,FT[rk[0]][+rk[1]]);rs=x;rk=key}}
   if(y<0||y>=W.N)continue;
   for(let x=Math.max(0,x0);x<=Math.min(W.N-1,x1);x++){const t=W.t[y][x],r=hsh(x,y,77);
    if(t==='t')View.add(v,{x:x+.35+r*.3,y:y+.5,w:1,h:1.25+r*.5,art:'tree',tall:true});else if(t==='r')View.add(v,{x:x+.5,y:y+.6,w:.95,h:.6+r*.35,art:'rock',tall:true});
    const m=W.nodes[x+','+y];if(m&&!fd.taken[x+','+y])View.add(v,{x:x+.5,y:y+.55,z:.05+Math.sin(now/300+x)*.04,w:.55,h:.55,art:'emo',o:{em:MAT[m].em}})}}
  View.add(v,{x:W.c+.5,y:W.c+.45,w:1.9,h:1.8,art:'emo',o:{em:'🛖'},tall:true});
  W.fixed.forEach((f,i)=>{if(fd.dead[i])return;const b=f.k==='b';View.add(v,{x:f.x+.5,y:f.y+.6,w:b?1.2:.9,h:b?1.7:1.2,art:'unit',o:{em:EN[f.en[0]].em,ring:'#d0452c'},
   after:(k,X,Y,S)=>{k.font='bold '+Math.max(10,S*.3)+'px sans-serif';k.textAlign='center';k.lineWidth=3;k.strokeStyle='#000';const s=b?'👑ボス':'⚠️強敵',y=Y-(b?1.78:1.28)*S;k.strokeText(s,X,y);k.fillStyle='#ff8a70';k.fillText(s,X,y)}})});
  G.players.forEach((p,i)=>{if(p.out)return;let px=fd.x,py=fd.y;if(i){const t=this.trail[this.trail.length-1-i*5];if(t){px=t[0];py=t[1]}else{px=fd.x-.45*i;py=fd.y}}
   View.add(v,{x:px,y:py,w:.7,h:.98,art:'unit',focus:true,o:{em:CH[p.ch].em,ring:i?'#2f9e56':'#e8b800',back:fd.bk,flip:fd.fl},
    after:i||!this.near?null:(k,X,Y,S)=>{k.font=(S*.5)+'px '+View.EMF;k.textAlign='center';k.fillText('✋',X,Y-S*(1.1+Math.sin(now/200)*.05))}})});
  // 同じ世界の仲間（オンライン）。届いた位置へなめらかに動かす
  const ms=mates(),mp={};ms.forEach(m=>{const s=m.s;if(!s||s.w==='b'||s.x==null)return;const o=this.mp[m.pid]||{x:s.x,y:s.y};o.x+=(s.x-o.x)*.12;o.y+=(s.y-o.y)*.12;if(Math.hypot(s.x-o.x,s.y-o.y)>6){o.x=s.x;o.y=s.y}mp[m.pid]=o;
   View.add(v,{x:o.x,y:o.y,w:.7,h:.98,art:'unit',o:{em:s.em,ring:'#3a8ee8'},after:(k,X,Y,S)=>{k.font='bold '+Math.max(10,S*.28)+'px sans-serif';k.textAlign='center';k.lineWidth=3;k.strokeStyle='#000';const t=(s.w==='c'?'⚔️':'')+m.name,yy=Y-1.12*S;k.strokeText(t,X,yy);k.fillStyle='#9fd0ff';k.fillText(t,X,yy)}})});this.mp=mp;
  View.flush(v);
  const j=this.joy;if(j){k.globalAlpha=.35;k.fillStyle='#000';k.beginPath();k.arc(j.x0,j.y0,44,0,7);k.fill();k.fillStyle='#fff';const l=Math.hypot(j.dx,j.dy)||1,m=Math.min(1,36/l);k.beginPath();k.arc(j.x0+j.dx*m,j.y0+j.dy*m,18,0,7);k.fill();k.globalAlpha=1}
  const m=Math.round(Math.min(120,v.w*.28));this.mini(k,v.w-m-8,this.top+8,m)},
 // 地図の画像（1マス＝1ドット）。発見済みの区画が増えた時だけ作り直す
 image(){const W=WORLD,N=W.N,sv=G.world.sv||0;if(this.img&&this.sv===sv&&this.seed===W.seed)return this.img;const cv=this.img||document.createElement('canvas');cv.width=cv.height=N;const x=cv.getContext('2d'),d=x.createImageData(N,N);
  for(let y=0;y<N;y++)for(let xx=0;xx<N;xx++){const i=(y*N+xx)*4,c=seenAt(xx,y)?FMC[W.t[y][xx]]:[26,22,18];d.data[i]=c[0];d.data[i+1]=c[1];d.data[i+2]=c[2];d.data[i+3]=255}
  x.putImageData(d,0,0);this.img=cv;this.sv=sv;this.seed=W.seed;return cv},
 marks(k,ox,oy,sc,full){const W=WORLD,fd=G.fd,dot=(x,y,r,c)=>{k.fillStyle=c;k.beginPath();k.arc(ox+x*sc,oy+y*sc,r,0,7);k.fill();k.strokeStyle='#000';k.lineWidth=1;k.stroke()};
  if(full)for(const key in W.nodes){const [x,y]=key.split(',').map(Number);if(!fd.taken[key]&&seenAt(x,y)){k.fillStyle='#fff';k.fillRect(ox+(x+.5)*sc-1,oy+(y+.5)*sc-1,2,2)}}
  dot(W.c+.5,W.c+.5,full?5:4,'#fff');W.fixed.forEach((f,i)=>{if(!fd.dead[i]&&seenAt(f.x,f.y))dot(f.x+.5,f.y+.5,full?5:4,f.k==='b'?'#c040ff':'#ff4030')});mates().forEach(m=>{const o=this.mp[m.pid]||m.s;if(m.s&&m.s.w!=='b'&&o&&o.x!=null)dot(o.x,o.y,full?5:4,'#40a0ff')});dot(fd.x,fd.y,full?5:4,'#ffe060')},
 mini(k,x,y,m){const R=12,sc=m/(R*2),fd=G.fd,N=WORLD.N,ox=x-(fd.x-R)*sc,oy=y-(fd.y-R)*sc;k.save();k.beginPath();k.rect(x,y,m,m);k.clip();k.fillStyle='#1a1612';k.fillRect(x,y,m,m);k.imageSmoothingEnabled=false;k.globalAlpha=.9;k.drawImage(this.image(),ox,oy,N*sc,N*sc);k.globalAlpha=1;this.marks(k,ox,oy,sc,false);k.restore();k.strokeStyle='#ffd870';k.lineWidth=2;k.strokeRect(x,y,m,m)},
 // 地図の画面（オーバーレイ）
 full(){const c=document.getElementById('mapcv');if(!c||!G||!G.fd||!WORLD)return;const S=Math.floor(Math.min(innerWidth-50,innerHeight*.6,560)),d=Math.min(2,devicePixelRatio||1);c.style.width=c.style.height=S+'px';c.width=c.height=S*d;const k=c.getContext('2d');k.setTransform(d,0,0,d,0,0);k.imageSmoothingEnabled=false;k.drawImage(this.image(),0,0,S,S);this.marks(k,0,0,S/WORLD.N,true)}
};
document.addEventListener('pointermove',e=>{const j=FV.joy;if(!j||e.pointerId!==j.id)return;const c=document.getElementById('fv');if(!c)return;const r=c.getBoundingClientRect();j.dx=e.clientX-r.left-j.x0;j.dy=e.clientY-r.top-j.y0});
['pointerup','pointercancel'].forEach(n=>document.addEventListener(n,e=>{if(FV.joy&&e.pointerId===FV.joy.id)FV.joy=null}));
document.addEventListener('keydown',e=>{if(e.target.tagName!=='INPUT')FV.keys[e.key.toLowerCase()]=1});
document.addEventListener('keyup',e=>{FV.keys[e.key.toLowerCase()]=0});
window.addEventListener('blur',()=>{FV.keys={};FV.joy=null});
(function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-FV.last)/1000||0);FV.last=t;if(typeof G!=='undefined'&&G&&G.phase==='field'&&scr==='game'){FV.tick(dt);FV.draw()}})(0);
