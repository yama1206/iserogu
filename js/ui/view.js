'use strict';
/* イセログ 描画エンジン（戦闘・フィールド・町で共用）
   ペーパーマリオ風：正面から少し見下ろす視点。マスは斜めにせず横一列に並び、奥ほど小さく・上に描く。
   core のマス座標(x,y)をそのまま渡す（x=左→右、y=奥→手前）。絵は ART に登録した仮絵で、あとで画像に差し替えられる。 */
const View=(()=>{
 const ART={},EMF='"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
 function create(){return {cv:null,ctx:null,w:0,h:0,cam:{x:4,near:8,tile:40,F:12,H:8,hz:0,cx:0},items:[]}}
 function attach(v,cv){const r=cv.getBoundingClientRect(),d=Math.min(2,window.devicePixelRatio||1);v.cv=cv;v.w=r.width;v.h=r.height;cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);v.ctx=cv.getContext('2d');v.ctx.setTransform(d,0,0,d,0,0)}
 // cols×rows の盤面全体が入るようにカメラを決める。head=奥の列の上に空ける高さ（マス数）、ins={t,b}=上下のUIぶん
 function fit(v,cols,rows,head,ins){const c=v.cam,k=1-c.F/(c.F+rows),t=ins&&ins.t||0,b=ins&&ins.b||0,aw=Math.max(80,v.w-(ins&&ins.r||0)),ah=Math.max(80,(v.h-t-b)*.96);c.cx=aw/2;let H=7,tile=Math.min(aw*.98/cols,ah/(H*k+head));
  const sp=ah-tile*(H*k+head);if(sp>0)H=Math.min(11,H+sp/(tile*k));const tot=tile*(H*k+head);c.tile=tile;c.H=H;c.x=cols/2;c.near=rows;c.hz=t+(v.h-t-b-tot)/2+tile*head+tile*H*k-tile*H}
 // フィールド・町用：カメラの中心と手前の位置を直接決める
 function look(v,x,near,tile,H){const c=v.cam;c.x=x;c.near=near;if(tile)c.tile=tile;if(H)c.H=H}
 function pr(v,x,y,z){const c=v.cam,s=c.F/(c.F+Math.max(-c.F*.8,c.near-y));return {x:(c.cx||v.w/2)+(x-c.x)*c.tile*s,y:c.hz+c.tile*c.H*s-(z||0)*c.tile*s,s:c.tile*s}}
 function unpr(v,sx,sy){const c=v.cam,s=(sy-c.hz)/(c.tile*c.H);if(s<=0)return null;return {x:c.x+(sx-(c.cx||v.w/2))/(c.tile*s),y:c.near-(c.F/s-c.F)}}
 function begin(v){v.ctx.clearRect(0,0,v.w,v.h);v.items=[]}
 function bg(v,sky1,sky2,ground){const x=v.ctx,hz=v.cam.hz+v.cam.tile*v.cam.H*.42,g=x.createLinearGradient(0,0,0,Math.max(1,hz));g.addColorStop(0,sky1);g.addColorStop(1,sky2);x.fillStyle=g;x.fillRect(0,0,v.w,Math.max(0,hz));
  x.fillStyle=ground;x.fillRect(0,hz,v.w,v.h-hz);x.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<5;i++){const cx=v.w*(i*.27-.05),r=v.w*(.16+(i%3)*.05);x.beginPath();x.ellipse(cx,hz,r,r*.35,0,Math.PI,0);x.fill()}}
 function poly(v,pts,z,fill,stroke,lw){const x=v.ctx;x.beginPath();pts.forEach((p,i)=>{const q=pr(v,p[0],p[1],z);i?x.lineTo(q.x,q.y):x.moveTo(q.x,q.y)});x.closePath();if(fill){x.fillStyle=fill;x.fill()}if(stroke){x.strokeStyle=stroke;x.lineWidth=lw||1;x.stroke()}}
 // 地面のマス。st={c,c2,h,side}（h があると少し高い台になる）
 function tile(v,x,y,st){const col=st.c2&&((x+y)&1)?st.c2:st.c,h=st.h||0;
  if(h){const a=pr(v,x,y+1,0),b=pr(v,x+1,y+1,0),c=pr(v,x+1,y+1,h),d=pr(v,x,y+1,h),k=v.ctx;k.beginPath();k.moveTo(a.x,a.y);k.lineTo(b.x,b.y);k.lineTo(c.x,c.y);k.lineTo(d.x,d.y);k.closePath();k.fillStyle=st.side||'#0006';k.fill()}
  poly(v,[[x,y],[x+1,y],[x+1,y+1],[x,y+1]],h,col,'rgba(0,0,0,.2)',1)}
 function quad(v,x,y,col,z,ins){const i=ins==null?.05:ins;poly(v,[[x+i,y+i],[x+1-i,y+i],[x+1-i,y+1-i],[x+i,y+1-i]],z||0,col)}
 function outline(v,x,y,col,z,lw){const i=.04;poly(v,[[x+i,y+i],[x+1-i,y+i],[x+1-i,y+1-i],[x+i,y+1-i]],z||0,null,col,lw||3)}
 // 地面に描く向きの矢印（f: 0奥 1右 2手前 3左）
 function arrow(v,x,y,f,col,z){const d=[[0,-1],[1,0],[0,1],[-1,0]][f],cx=x+.5,cy=y+.5,px=-d[1],py=d[0];poly(v,[[cx+d[0]*.47,cy+d[1]*.47],[cx+d[0]*.2+px*.26,cy+d[1]*.2+py*.26],[cx+d[0]*.2-px*.26,cy+d[1]*.2-py*.26]],z||0,col,'rgba(0,0,0,.5)',1)}
 function line(v,x0,y0,x1,y1,col,z0,z1){const a=pr(v,x0,y0,z0),b=pr(v,x1,y1,z1),k=v.ctx;k.save();k.setLineDash([6,5]);k.strokeStyle=col;k.lineWidth=2.5;k.beginPath();k.moveTo(a.x,a.y);k.lineTo(b.x,b.y);k.stroke();k.restore()}
 // 立っている物（キャラ・木・岩・建物）。it={x,y,z,w,h,art,o,alpha,rot,tall,focus,after(ctx,px,py,s)}。flush でまとめて奥から描く
 function add(v,it){v.items.push(it)}
 function flush(v){const k=v.ctx,its=v.items.sort((a,b)=>a.y-b.y),box=it=>{const p=pr(v,it.x,it.y,it.z);return {p,l:p.x-it.w*p.s/2,r:p.x+it.w*p.s/2,t:p.y-it.h*p.s,b:p.y}};
  const foc=its.filter(i=>i.focus).map(i=>({y:i.y,b:box(i)}));
  its.forEach(it=>{const b=box(it),p=b.p;let al=it.alpha==null?1:it.alpha;
   // 手前の物の後ろにプレイヤーが隠れたら、手前の物を半透明にする
   if(it.tall&&foc.some(f=>f.y<it.y&&f.b.l<b.r&&f.b.r>b.l&&f.b.t<b.b&&f.b.b-(f.b.b-f.b.t)*.3>b.t))al*=.4;
   k.save();k.globalAlpha=al*.3;k.fillStyle='#000';k.beginPath();k.ellipse(p.x,p.y,it.w*p.s*.45,it.w*p.s*.13,0,0,7);k.fill();
   k.globalAlpha=al;k.translate(p.x,p.y);if(it.rot)k.rotate(it.rot);const a=ART[it.art];if(a){if(a.img&&a.img.complete&&a.img.naturalWidth)k.drawImage(a.img,-it.w*p.s/2,-it.h*p.s,it.w*p.s,it.h*p.s);else if(a.draw)a.draw(k,it.w*p.s,it.h*p.s,it.o||{})}k.restore();
   if(it.after)it.after(k,p.x,p.y,p.s)})}
 function setImage(name,url){const img=new Image();img.src=url;ART[name]=Object.assign(ART[name]||{},{img})}
 function rr(k,x,y,w,h,r){k.beginPath();k.moveTo(x+r,y);k.arcTo(x+w,y,x+w,y+h,r);k.arcTo(x+w,y+h,x,y+h,r);k.arcTo(x,y+h,x,y,r);k.arcTo(x,y,x+w,y,r);k.closePath()}
 /* ---------- 仮絵（図形） ---------- */
 // 紙人形：o={em,ring,back,flip,gray}
 ART.unit={draw(k,w,h,o){rr(k,-w/2,-h,w,h*.96,w*.16);k.fillStyle=o.gray?'#8a8a8a':o.back?'#d6cdb6':'#fbf6e8';k.fill();k.lineWidth=Math.max(2,w*.07);k.strokeStyle=o.ring||'#333';k.stroke();
  k.save();if(o.flip)k.scale(-1,1);if(o.back)k.globalAlpha*=.45;k.font=(h*.6)+'px '+EMF;k.textAlign='center';k.textBaseline='middle';k.fillStyle='#222';k.fillText(o.em||'?',0,-h*.5);k.restore()}};
 ART.tree={draw(k,w,h){k.fillStyle='#7a5230';k.fillRect(-w*.08,-h*.3,w*.16,h*.3);k.strokeStyle='#f4f0e0';k.lineWidth=Math.max(1.5,w*.04);[[.5,.22,.62],[.4,.5,.95]].forEach(([hw,b,t],i)=>{k.beginPath();k.moveTo(-w*hw,-h*b);k.lineTo(0,-h*t);k.lineTo(w*hw,-h*b);k.closePath();k.fillStyle=i?'#3f9a4a':'#2f7f3c';k.fill();k.stroke()})}};
 ART.rock={draw(k,w,h){k.beginPath();k.moveTo(-w*.5,0);k.lineTo(-w*.4,-h*.6);k.lineTo(-w*.1,-h);k.lineTo(w*.3,-h*.85);k.lineTo(w*.5,-h*.3);k.lineTo(w*.45,0);k.closePath();k.fillStyle='#8d8f96';k.fill();k.strokeStyle='#f4f0e0';k.lineWidth=Math.max(1.5,w*.04);k.stroke();k.beginPath();k.moveTo(-w*.1,-h);k.lineTo(0,-h*.5);k.lineTo(w*.5,-h*.3);k.strokeStyle='rgba(0,0,0,.25)';k.stroke()}};
 return {ART,EMF,create,attach,fit,look,pr,unpr,begin,bg,poly,tile,quad,outline,arrow,line,add,flush,setImage,rr};
})();
