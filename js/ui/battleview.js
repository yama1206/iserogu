'use strict';
/* イセログ 戦場の描画とマス選択（描画は View を使う） */
const TILE={p:{c:'#74b455',c2:'#6aa94d'},f:{c:'#4c8f45',c2:'#468841'},h:{c:'#c7ae68',c2:'#bfa560',h:.3,side:'#8a7340'},w:{c:'#58a8e0',c2:'#4f9fd8'},r:{c:'#7d8a6e',c2:'#78856a'}};
const BV={v:View.create(),an:{},fl:[],actE:-1,actT:0,last:0,
 reset(){this.an={};this.fl=[]},
 attach(){const c=document.getElementById('cv');if(!c)return;View.attach(this.v,c);const cb=c.parentElement.getBoundingClientRect(),t=document.querySelector('.cbt'),b=document.querySelector('.cbb');
  const br=b?b.getBoundingClientRect():null,side=br&&br.left>cb.left+20;   // 横長の画面ではUIが右側に並ぶ
  View.fit(this.v,CFG.grid,CFG.grid,1.7,{t:t?t.getBoundingClientRect().bottom-cb.top:0,b:br&&!side?cb.bottom-br.top:0,r:side?cb.right-br.left:0});
  c.onclick=e=>{const r=c.getBoundingClientRect(),w=View.unpr(this.v,e.clientX-r.left,e.clientY-r.top);if(!w)return;const x=Math.floor(w.x),y=Math.floor(w.y);if(x<0||y<0||x>=CFG.grid||y>=CFG.grid)return;auInit();gridTap(x,y);render()};this.draw()},
 key(u){return u.side==='p'?'p'+u.id:'e'+G.cb.en.indexOf(u)},
 pos(u){const k=this.key(u);let a=this.an[k];if(!a)a=this.an[k]={x:u.x,y:u.y,q:[],hit:0};return a},
 path(k,path){const a=this.an[k];if(a)a.q=path.map(p=>({x:p[0],y:p[1]}))},
 float(k,s,c){const n=this.fl.filter(f=>f.k===k&&performance.now()-f.t<400).length;this.fl.push({k,s,c,t:performance.now()+n*120});if(s[0]==='-'&&this.an[k])this.an[k].hit=performance.now()},
 tick(dt){if(!G||!G.cb)return;const all=G.players.filter(p=>!p.out).concat(G.cb.en);all.forEach(u=>{const a=this.pos(u),t=a.q[0]||u,dx=t.x-a.x,dy=t.y-a.y,d=Math.hypot(dx,dy),s=dt*9;if(d<=s){a.x=t.x;a.y=t.y;if(a.q.length)a.q.shift()}else{a.x+=dx/d*s;a.y+=dy/d*s}})},
 draw(){const v=this.v;if(!v.ctx||!document.getElementById('cv'))return;if(!G||!G.cb)return;const cb=G.cb,N=CFG.grid,p=me(),now=performance.now(),my=p&&cb.ph==='p'&&!p.ended&&!p.down;
  View.begin(v);View.bg(v,'#8fd0f4','#e6f4dc',cb.field==='forest'?'#3c6e3a':'#5f9a48');
  // 色を付けるマス
  const blue={},red={},org={},wht={};let lookE=null;const cu=ui.mode?unitAt(ui.cur.x,ui.cur.y):null;if(cu&&cu.side==='e')lookE=cu;
  if(my&&ui.mode==='move'){const rm=reachOf(p,p.mp);for(const k in rm)if(!rm[k].occ&&rm[k].c>0)blue[k]=1;aliveEs().forEach(e=>Object.assign(org,dangerOf(e)))}
  if(my&&ui.mode==='face')DIR.forEach(d=>{wht[(p.x+d[0])+','+(p.y+d[1])]=1});
  const sel=p&&p.hand.find(c=>c.u===ui.sel),sc=sel&&CARDS[sel.id];
  if(sel&&'eEr'.includes(sc.tg)&&usable(p,sel)){const ci=cardRg(p,sel);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if((x!==p.x||y!==p.y)&&!TER[cb.map[y][x]].block&&inRange(p,{x,y},ci))red[x+','+y]=1}
  if(lookE)Object.assign(org,dangerOf(lookE));
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const t=cb.map[y][x],st=TILE[t],z=st.h||0,k=x+','+y;View.tile(v,x,y,st);
   if(blue[k]){View.quad(v,x,y,'rgba(60,140,255,.62)',z);if(org[k])View.quad(v,x,y,'rgba(255,150,30,.85)',z,.36)}else if(org[k])View.quad(v,x,y,'rgba(255,150,30,.4)',z);if(red[k])View.quad(v,x,y,'rgba(255,70,50,.38)',z);if(wht[k])View.quad(v,x,y,'rgba(255,255,255,.45)',z)}
  // 向きの矢印とカーソル
  const us=G.players.filter(q=>!q.out).concat(aliveEs());
  us.forEach(u=>{if(u.down)return;const a=this.pos(u);if(Math.abs(a.x-u.x)+Math.abs(a.y-u.y)<.05)View.arrow(v,u.x,u.y,u.f,u.side==='p'?(u===p?'#ffe060':'#9fe8a8'):'#ff7a5c',TILE[cb.map[u.y][u.x]].h||0)});
  if(ui.mode)View.outline(v,ui.cur.x,ui.cur.y,'#fff36a',TILE[cb.map[ui.cur.y][ui.cur.x]].h||0,3+Math.sin(now/150));
  // 立っている物
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const t=cb.map[y][x];if(t==='f')View.add(v,{x:x+.5,y:y+.42,w:.8,h:1.05,art:'tree',tall:true});else if(t==='r')View.add(v,{x:x+.5,y:y+.6,w:.9,h:.75,art:'rock',tall:true})}
  us.forEach(u=>{const a=this.pos(u),isP=u.side==='p',ix=isP?-1:cb.en.indexOf(u),z=TILE[cb.map[Math.round(a.y)][Math.round(a.x)]].h||0,sh=now-a.hit<260?Math.sin(now/22)*.07:0,lunge=!isP&&cb.ph==='e'&&this.actE===ix&&now-this.actT<350?.18:0;
   View.add(v,{x:a.x+.5+sh,y:a.y+.66+lunge,z,w:u.boss?.98:.7,h:u.boss?1.4:.98,art:'unit',focus:isP&&!u.down,rot:u.down?-1.35:u.broken?.3:0,
    o:{em:isP?CH[u.ch].em:u.em,ring:isP?(u===p?'#e8b800':'#2f9e56'):'#d0452c',back:u.f===0&&!u.down,flip:u.f===1,gray:u.down},
    after:(k,X,Y,S)=>this.hud(k,u,X,Y-(u.boss?1.45:1.02)*S,S,p)})});
  View.flush(v);
  if(lookE&&lookE.it&&lookE.it.t){const t=byId(lookE.it.t);if(t&&!t.down)View.line(v,lookE.x+.5,lookE.y+.5,t.x+.5,t.y+.5,'#ff5030',.5,.5)}
  // 浮き文字
  const k=v.ctx;this.fl=this.fl.filter(f=>now-f.t<1000);this.fl.forEach(f=>{const dt=now-f.t;if(dt<0)return;const u=f.k[0]==='p'?byId(f.k.slice(1)):cb.en[+f.k.slice(1)];if(!u)return;const a=this.an[f.k]||u,q=View.pr(v,a.x+.5,a.y+.6,.9+dt/1000*.9);
   k.globalAlpha=1-Math.max(0,dt-600)/400;k.font='900 '+Math.max(15,q.s*.42)+'px sans-serif';k.textAlign='center';k.lineWidth=4;k.strokeStyle='#000';k.strokeText(f.s,q.x,q.y);k.fillStyle=f.c;k.fillText(f.s,q.x,q.y);k.globalAlpha=1})},
 // 頭上の表示：行動予告・HP・体勢値・状態
 hud(k,u,X,Y,S,p){const w=S*.86,bh=Math.max(4,S*.1),isP=u.side==='p';if(u.side==='e'&&u.hp<=0)return;
  const bar=(y,r,c1,c0)=>{k.fillStyle=c0;k.fillRect(X-w/2,y,w,bh);k.fillStyle=c1;k.fillRect(X-w/2,y,w*Math.max(0,Math.min(1,r)),bh);k.strokeStyle='#000a';k.lineWidth=1;k.strokeRect(X-w/2,y,w,bh)};
  bar(Y-bh*2.4,u.hp/(isP?maxHp(u):u.mhp),'#e8483a','#400');bar(Y-bh*1.3,u.broken?0:u.ps/u.mps,'#f2c230','#443a10');
  const fs=Math.max(9,S*.24);k.font='bold '+fs+'px '+View.EMF;k.textAlign='center';k.textBaseline='alphabetic';const txt=(s,y,c)=>{k.lineWidth=3;k.strokeStyle='#000';k.strokeText(s,X,y);k.fillStyle=c;k.fillText(s,X,y)};
  let st=(u.blk>0?'🛡'+u.blk:'')+(u.broken?'💫崩':'');for(const s in u.st)if(u.st[s]>0&&ST[s])st+=ST[s][1]+u.st[s];if(isP&&u.resc!=null)st+='🆘';
  let y=Y-bh*2.9;if(st){txt(st,y,'#fff');y-=fs*1.15}
  if(!isP){const it=intentText(u,p);if(it)txt(it[0],y,it[1])}else if(u.down)txt('💀あと'+Math.max(0,CFG.rescueTurns-u.downT+1),y,'#ff8060')}
};
// 敵の行動予告：[文字, 色]
function intentText(e,p){if(e.hp<=0)return null;if(e.broken)return ['💫体勢崩し','#ffe060'];if(e.st.stun>0)return ['💫気絶','#ffe060'];if(!e.it)return null;const m=EN[e.id].moves[e.it.m],k=m[0],t=e.it.t?byId(e.it.t):null,mine=t&&p&&t.id===p.id,h=m[3]>1?'×'+m[3]:'',tn=t&&G.players.length>1?'→'+t.name.slice(0,3):'';
 return k==='a'?['⚔️'+eDmg(e,m)+h+tn,mine||G.players.length===1?'#ff8a70':'#ffd0c0']:k==='A'?['💥'+eDmg(e,m)+h+'範囲','#ff8a70']:k==='d'?['🛡️防御','#a8d0ff']:k==='u'?['💪強化','#ffd870']:k==='x'?['🌀妨害'+tn,'#d8a8ff']:['⏳準備','#ddd']}
(function loop(t){requestAnimationFrame(loop);const dt=Math.min(.05,(t-BV.last)/1000||0);BV.last=t;if(typeof G!=='undefined'&&G&&G.cb){BV.tick(dt);BV.draw()}})(0);
