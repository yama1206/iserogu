'use strict';
/* イセログ core：探索（フィールド・エンカウント・採集・帰還・地図）。画面と通信に依存しません
   世界は「種(seed)」から毎回同じ形に作り直す。セーブ(G.world)に持つのは 種・発見済みの区画・倉庫 だけ */
let WORLD=null;
function hsh(x,y,s){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,2246822519)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),w=fy*fy*(3-2*fy),a=hsh(xi,yi,s),b=hsh(xi+1,yi,s),c=hsh(xi,yi+1,s),d=hsh(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*w+(a-b-c+d)*u*w}
function newWorld(){return {v:2,seed:R(1e9)+1,seen:[],sv:0}}
// フィールドの地形：p平地 f森の地面 h丘 ＝歩ける ／ t木 r岩 w水 ＝通れない
function genWorld(seed){if(WORLD&&WORLD.seed===seed)return WORLD;const N=CFG.worldN,c=N>>1,far=(x,y)=>Math.max(Math.abs(x-c),Math.abs(y-c));
 for(let salt=0;salt<30;salt++){const s=(seed+salt*7919)|0,t=[],reg=[];
  for(let y=0;y<N;y++){const row=[],rr=[];for(let x=0;x<N;x++){const edge=Math.min(x,y,N-1-x,N-1-y),r=hsh(x,y,s),fo=vnoise(x/10,y/10,s+2)>.5;let k;
    if(edge<2||vnoise(x/7,y/7,s+1)<.24+(edge<6?(6-edge)*.05:0))k='w';
    else if(fo)k=r<.3?'t':r>.975?'r':'f';
    else if(vnoise(x/5,y/5,s+3)>.7)k=r<.05?'r':'h';
    else k=r<.03?'t':r<.06?'r':'p';
    if(far(x,y)<=2)k='p';row.push(k);rr.push(fo&&far(x,y)>2?1:0)}t.push(row);reg.push(rr)}
  const seen={},q=[[c,c]],list=[];seen[c+','+c]=1;
  while(q.length){const [x,y]=q.pop();list.push([x,y]);for(const d of DIR){const a=x+d[0],b=y+d[1];if(a<0||b<0||a>=N||b>=N||'twr'.includes(t[b][a])||seen[a+','+b])continue;seen[a+','+b]=1;q.push([a,b])}}
  if(list.length<N*N*.3&&salt<29)continue;
  const nodes={};list.forEach(([x,y])=>{if(far(x,y)>3&&hsh(x,y,s+9)<CFG.nodeRate){const o=NODES[t[y][x]];if(o)nodes[x+','+y]=o[Math.floor(hsh(x,y,s+10)*o.length)]}});
  const fixed=[];FIXED.forEach((f,i)=>{let cs=list.filter(([x,y])=>far(x,y)>=f.far[0]&&far(x,y)<=f.far[1]&&(f.on==='forest')===!!reg[y][x]&&!fixed.some(o=>Math.abs(o.x-x)+Math.abs(o.y-y)<6));
   if(!cs.length)cs=list.filter(([x,y])=>far(x,y)>=Math.min(f.far[0],10));if(!cs.length)return;const p=cs[Math.floor(hsh(i,7,s+11)*cs.length)];delete nodes[p[0]+','+p[1]];fixed.push({x:p[0],y:p[1],k:f.k,en:f.en,field:reg[p[1]][p[0]]?'forest':'grass'})});
  return WORLD={seed,N,c,t,reg,nodes,fixed}}}
function ftile(x,y){const W=WORLD;return x<0||y<0||x>=W.N||y>=W.N?'w':W.t[y][x]}
function fblock(x,y){return 'twr'.includes(ftile(Math.floor(x),Math.floor(y)))}
function fhit(x,y){const r=.28;return fblock(x-r,y-r)||fblock(x+r,y-r)||fblock(x-r,y+r)||fblock(x+r,y+r)}
function seenAt(x,y){return !!G.world.seen[(y>>2)*(CFG.worldN>>2)+(x>>2)]}
// 地図：4×4マスの区画ごとに「発見済み」にする
function reveal(){const fd=G.fd,se=G.world.seen,B=CFG.worldN>>2;let ch=false;for(let by=0;by<B;by++)for(let bx=0;bx<B;bx++){const i=by*B+bx;if(!se[i]&&Math.hypot(bx*4+2-fd.x,by*4+2-fd.y)<=CFG.sight){se[i]=1;ch=true}}if(ch)G.world.sv=(G.world.sv||0)+1;return ch}
function fieldStart(){const W=genWorld(G.world.seed),B=CFG.worldN>>2;if(!Array.isArray(G.world.seen)||G.world.seen.length!==B*B)G.world.seen=Array(B*B).fill(0);
 G.fd={x:W.c+.5,y:W.c+1.5,fl:false,bk:false,steps:0,enc:CFG.encBase,grace:CFG.encGrace,bag:{},taken:{},dead:{},wins:0,home:null,lost:null};G.cb=null;G.phase='field';reveal();log('冒険に出発した。');ev('fstart')}
// 荷物：自分＝fd.bag／合流した仲間＝fd.pb[プレイヤーID]（リーダーの端末が預かる）
function bagOf(pid){const fd=G.fd;if(!pid||pid===G.players[0].id)return fd.bag;if(!fd.pb)fd.pb={};return fd.pb[pid]||(fd.pb[pid]={})}
function addBag(m,n,pid){const b=bagOf(pid);b[m]=(b[m]||0)+n}
function fieldEnc(st){G.fd.enc=CFG.encBase;ev('enc');startCombat(st)}
function rollEnc(x,y){const W=WORLD,field=W.reg[y][x]?'forest':'grass',T=ENC[field],d=Math.max(Math.abs(x-W.c),Math.abs(y-W.c));
 if(d>=CFG.eliteDist&&Math.random()<CFG.eliteRate)return {k:'e',en:[pick(T.elite)],field};
 const n=1+(d>CFG.encFar[0]?1:0)+(d>CFG.encFar[1]&&Math.random()<.6?1:0),en=[];for(let i=0;i<n;i++)en.push(pick(T.mobs));return {k:'n',en,field}}
// 歩く（dx,dy は -1/0/1 の8方向）。画面を作り直す必要がある出来事（遭遇）が起きたら true
function fieldWalk(dx,dy,dt){const fd=G.fd,W=WORLD;dx=Math.sign(dx||0);dy=Math.sign(dy||0);if(!dx&&!dy)return false;
 const sp=CFG.walkSpeed*Math.max(0,Math.min(.1,dt||0))/Math.hypot(dx,dy),ox=Math.floor(fd.x),oy=Math.floor(fd.y);if(dx)fd.fl=dx>0;fd.bk=dy<0;
 const nx=fd.x+dx*sp;if(!fhit(nx,fd.y))fd.x=nx;const ny=fd.y+dy*sp;if(!fhit(fd.x,ny))fd.y=ny;
 for(let i=0;i<W.fixed.length;i++){const f=W.fixed[i];if(!fd.dead[i]&&Math.hypot(f.x+.5-fd.x,f.y+.5-fd.y)<.9){fieldEnc({k:f.k,en:f.en,field:f.field,fix:i});return true}}
 const tx=Math.floor(fd.x),ty=Math.floor(fd.y);if(tx===ox&&ty===oy)return false;
 fd.steps++;reveal();if(!CFG.encOn)return false;if(fd.grace>0){fd.grace--;return false}if(Math.max(Math.abs(tx-W.c),Math.abs(ty-W.c))<=CFG.safeR)return false;
 if(Math.random()<fd.enc){fieldEnc(rollEnc(tx,ty));return true}fd.enc+=CFG.encStep;return false}
// いちばん近い採集ポイント（触れている物）
function fieldNear(){const fd=G.fd,W=WORLD;if(!fd||!W)return null;let best=null,bd=1.05;const cx=Math.floor(fd.x),cy=Math.floor(fd.y);
 for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){const key=x+','+y,m=W.nodes[key];if(!m||fd.taken[key])continue;const d=Math.hypot(x+.5-fd.x,y+.5-fd.y);if(d<bd){bd=d;best={key,m}}}return best}
function fieldGather(pid){const n=fieldNear();if(!n)return '近くに採集できる物がありません';const c=rng(CFG.gatherN[0],CFG.gatherN[1]);G.fd.taken[n.key]=1;addBag(n.m,c,pid);ev('gather',{m:n.m,n:c,p:pid});return ''}
// 荷物を倉庫へ（rate＝失う割合。強制帰還のとき）
function bagHome(rate){const fd=G.fd,st=plOf(G.players[0].id).store;fd.home={};fd.lost={};for(const m in fd.bag){const n=fd.bag[m],l=Math.round(n*rate);if(l)fd.lost[m]=l;if(n-l>0){fd.home[m]=n-l;st[m]=(st[m]||0)+n-l}}fd.bag={}}
function fieldReturn(){if(G.phase!=='field')return '今は帰還できません';bagHome(0);G.phase='home';log('拠点に帰還した。荷物を個人倉庫に入れた。');ev('ret');return ''}
