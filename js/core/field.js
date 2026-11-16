'use strict';
/* イセログ core：探索（広がるフィールド・バイオーム・エンカウント・採集・帰還・地図）。画面と通信に依存しません
   フィールドは端がなく、マス(x,y)の地形・採集ポイント・強敵は「種(seed)」から毎回同じ形に計算する（保存しない）
   セーブ(G.world)に持つのは 種・発見済みの区画(seen：8×8マスごと) だけ。拠点は(0,0) */
let WORLD=null;
function hsh(x,y,s){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,2246822519)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,u=fx*fx*(3-2*fx),w=fy*fy*(3-2*fy),a=hsh(xi,yi,s),b=hsh(xi+1,yi,s),c=hsh(xi,yi+1,s),d=hsh(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*w+(a-b-c+d)*u*w}
function newWorld(){return {v:3,seed:R(1e9)+1,seen:{},sv:0}}
function genWorld(seed){if(WORLD&&WORLD.seed===seed)return WORLD;return WORLD={seed,s:seed|0,fx:new Map(),tc:new Map()}}
const wld=()=>genWorld(G.world.seed);
const BLOCK='twrl';
// 拠点からの距離（マス。チェビシェフ距離）と危険度
function fdist(x,y){return Math.max(Math.abs(x),Math.abs(y))}
function dangerAt(x,y){return Math.min(CFG.lvMax,Math.floor(fdist(x,y)/CFG.lvStep))}
// 高さ・気温・湿り気からバイオームを決める（拠点のまわりは草原と森林）
function biomeAt(x,y){const s=wld().s,B=CFG.biomeScale,d=Math.hypot(x,y),k=Math.max(0,1-d/CFG.homeR);
 let el=vnoise(x/64,y/64,s+11)*.6+vnoise(x/24,y/24,s+12)*.3+vnoise(x/9,y/9,s+13)*.1;if(k>0)el=Math.max(el,.42+k*.3);
 let te=vnoise(x/B,y/B,s+21)*.8+vnoise(x/30,y/30,s+22)*.2,mo=vnoise(x/(B*.9),y/(B*.9),s+31)*.8+vnoise(x/27,y/27,s+32)*.2;
 if(k>0){const q=Math.min(1,k*1.6);te=te+(.5-te)*q;mo=mo+(.56-mo)*q}
 if(k>.3)return mo>.52?'forest':'grass';   // 拠点の近くは草原と森林だけ
 if(el<.34)return 'sea';if(el<.375)return 'coast';
 if(el>.72)return te>.62?'volcano':'mount';
 if(te<.33)return 'snow';if(te>.64&&mo<.48)return 'desert';if(mo>.64&&te>.42)return 'swamp';if(mo>.52)return 'forest';return 'grass'}
// マスの地形（区画ごとにまとめて計算して覚えておく）
function tileCalc(x,y){if(Math.abs(x)<=2&&Math.abs(y)<=2)return 'p';const s=wld().s,b=biomeAt(x,y),r=hsh(x,y,s);
 switch(b){
  case 'sea':return 'w';
  case 'coast':return r<.02?'r':'s';
  case 'forest':return r<.3?'t':r>.975?'r':'f';
  case 'desert':return r<.022?'t':r<.045?'r':vnoise(x/6,y/6,s+3)>.72?'h':'s';
  case 'snow':return vnoise(x/7,y/7,s+1)<.22?'w':r<.12?'t':r<.15?'r':'n';
  case 'swamp':return vnoise(x/4,y/4,s+4)<.36?'w':r<.12?'t':'m';
  case 'mount':return vnoise(x/6,y/6,s+5)>.67||r<.1?'r':'h';
  case 'volcano':return vnoise(x/6,y/6,s+6)<.24?'l':r<.1?'r':'a';
  default:if(vnoise(x/7,y/7,s+1)<.2)return 'w';if(vnoise(x/5,y/5,s+3)>.7)return r<.05?'r':'h';return r<.03?'t':r<.06?'r':'p'}}
function ftile(x,y){const C=CFG.chunk,cx=Math.floor(x/C),cy=Math.floor(y/C),W=wld(),key=cx+','+cy;let c=W.tc.get(key);
 if(!c){if(W.tc.size>900)W.tc.clear();c=[];for(let j=0;j<C;j++)for(let i=0;i<C;i++)c.push(tileCalc(cx*C+i,cy*C+j));W.tc.set(key,c)}
 return c[(y-cy*C)*C+(x-cx*C)]}
function fblock(x,y){return BLOCK.includes(ftile(Math.floor(x),Math.floor(y)))}
function fhit(x,y){const r=.28;return fblock(x-r,y-r)||fblock(x+r,y-r)||fblock(x-r,y+r)||fblock(x+r,y+r)}
// 区画の強敵・ボス（区画に0か1体）。key＝"x,y"（倒したかどうかは fd.dead[key]）
function chunkFixed(cx,cy){const W=wld(),key=cx+','+cy;if(W.fx.has(key))return W.fx.get(key);if(W.fx.size>5000)W.fx.clear();let f=null;const C=CFG.chunk,s=W.s;
 const d=fdist(cx*C+C/2,cy*C+C/2),r=hsh(cx,cy,s+50);let k=null;if(d>=CFG.bossDist&&r>1-CFG.bossChunk)k='b';else if(d>=14&&r<CFG.eliteChunk)k='e';
 if(k)for(let t=0;t<14;t++){const x=cx*C+2+Math.floor(hsh(cx*31+t,cy,s+51)*(C-4)),y=cy*C+2+Math.floor(hsh(cx,cy*31+t,s+52)*(C-4));if(BLOCK.includes(ftile(x,y)))continue;
  const b=biomeAt(x,y),B=BIO[b],ls=k==='b'?B.boss:B.elite;f={x,y,k,key:x+','+y,en:[ls[Math.floor(hsh(x,y,s+53)*ls.length)]],field:b,lv:dangerAt(x,y)};break}
 W.fx.set(key,f);return f}
function fixedNear(x,y,rad){const C=CFG.chunk,o=[];for(let cy=Math.floor((y-rad)/C);cy<=Math.floor((y+rad)/C);cy++)for(let cx=Math.floor((x-rad)/C);cx<=Math.floor((x+rad)/C);cx++){const f=chunkFixed(cx,cy);if(f)o.push(f)}return o}
// 採集ポイント（そのマスの素材。なければ null）
function nodeAt(x,y){if(fdist(x,y)<=3)return null;const s=wld().s;if(hsh(x,y,s+9)>=CFG.nodeRate)return null;const t=ftile(x,y);if(BLOCK.includes(t))return null;
 const f=chunkFixed(Math.floor(x/CFG.chunk),Math.floor(y/CFG.chunk));if(f&&f.x===x&&f.y===y)return null;
 const ls=t==='h'&&biomeAt(x,y)==='grass'?['flint','stone','stone']:BIO[biomeAt(x,y)].node;return ls.length?ls[Math.floor(hsh(x,y,s+10)*ls.length)]:null}
// 地図：8×8マスの区画ごとに「発見済み」にする（G.world.seen["bx,by"]=1）
function seenAt(x,y){return !!G.world.seen[(Math.floor(x)>>3)+','+(Math.floor(y)>>3)]}
function reveal(){const fd=G.fd,se=G.world.seen,S=CFG.sight;let ch=false;
 for(let by=(Math.floor(fd.y-S)>>3);by<=(Math.floor(fd.y+S)>>3);by++)for(let bx=(Math.floor(fd.x-S)>>3);bx<=(Math.floor(fd.x+S)>>3);bx++){const k=bx+','+by;if(!se[k]&&Math.hypot(bx*8+4-fd.x,by*8+4-fd.y)<=S+2){se[k]=1;ch=true}}
 if(ch)G.world.sv=(G.world.sv||0)+1;return ch}
/* ---------- 開拓地（v0.7.0）：共有分 G.world.base.out=[{x,y}]。出発地点・休憩所・ファストトラベル先になる ---------- */
function outs(){return (G.world.base&&G.world.base.out)||[]}
function outNear(x,y,r){let b=-1,bd=r;outs().forEach((o,i)=>{const d=Math.hypot(o.x+.5-x,o.y+.5-y);if(d<=bd){bd=d;b=i}});return b}
function outSafe(x,y){return outs().some(o=>fdist(x-o.x,y-o.y)<=CFG.outSafe)}
function outName(i){const o=outs()[i];if(!o)return '🛖 拠点';return '⛺ 開拓地'+(i+1)+'（'+BIO[biomeAt(o.x,o.y)].n+(dangerAt(o.x,o.y)?'・危険度'+dangerAt(o.x,o.y):'')+'）'}
// 開拓地の前の、立てる場所
function outSpot(o){for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]])if(!fhit(o.x+dx+.5,o.y+dy+.5))return [o.x+dx+.5,o.y+dy+.5];return [o.x+.5,o.y+.5]}
// 作れるかどうか（できない理由。できるなら ''）
function outCheck(x,y){if(!hasTech('t_camp'))return '研究「'+TECH.t_camp.n+'」が必要です';if(outs().length>=outMaxN())return '開拓地はこれ以上作れません（最大'+outMaxN()+'か所）';
 if(BLOCK.includes(ftile(x,y)))return 'ここには作れません';if(fdist(x,y)<CFG.outMin)return '拠点から'+CFG.outMin+'マス以上はなれた所に作れます';
 if(outs().some(o=>fdist(x-o.x,y-o.y)<CFG.outMin))return 'ほかの開拓地から'+CFG.outMin+'マス以上はなれた所に作れます';return ''}
// 費用は荷物から先に使い、足りない分を個人倉庫から
function outHave(m,pid){return (bagOf(pid)[m]||0)+(plOf(pid||G.players[0].id).store[m]||0)}
function fieldOutpost(pid){if(G.phase!=='field')return '';const fd=G.fd,x=Math.floor(fd.x),y=Math.floor(fd.y),er=outCheck(x,y);if(er)return er;const C=CFG.outCost;
 for(const m in C)if(outHave(m,pid)<C[m])return '素材が足りません（荷物と個人倉庫の合計）';
 const b=bagOf(pid),st=plOf(pid||G.players[0].id).store;for(const m in C){let n=C[m];const u=Math.min(n,b[m]||0);if(u){b[m]-=u;if(!b[m])delete b[m];n-=u}if(n)st[m]-=n}
 const o={t:'outpost',x,y};shareOp(o);HOOK.op(o);log('開拓地を作った。');ev('outpost',{x,y});return ''}
// 休む：パーティー全員のHPが全回復
function fieldRest(){if(G.phase!=='field')return '';if(outNear(G.fd.x,G.fd.y,CFG.outNearR)<0)return '開拓地の近くで休めます';G.players.forEach(p=>{if(!p.out)p.hp=maxHp(p)});log('開拓地で休んだ。');ev('rest');return ''}
// ファストトラベル：開拓地（か拠点）の近くから、別の開拓地か拠点の前へ。i＝開拓地の番号（-1＝拠点）
function fieldWarp(i){if(G.phase!=='field')return '';const fd=G.fd;if(outNear(fd.x,fd.y,CFG.outNearR)<0&&Math.hypot(fd.x-.5,fd.y-.5)>CFG.outNearR+1)return '開拓地か拠点の近くから移動できます';
 const o=i<0?{x:0,y:0}:outs()[i];if(!o)return '';[fd.x,fd.y]=outSpot(o);fd.grace=CFG.encGrace;fd.enc=CFG.encBase;reveal();log(outName(i)+'へ移動した。');ev('warp',{i});return ''}
function fieldStart(sp){wld();if(!G.world.seen||Array.isArray(G.world.seen))G.world.seen={};   // v0.5 までの地図（64×64）は使わない
 const so=sp!=null&&sp>=0&&outs()[sp]?outSpot(outs()[sp]):[.5,1.5];G.fd={x:so[0],y:so[1],fl:false,bk:false,steps:0,enc:CFG.encBase,grace:CFG.encGrace,bag:{},taken:{},dead:{},wins:0,home:null,lost:null};G.cb=null;G.phase='field';reveal();log('冒険に出発した。');ev('fstart')}
// 荷物：自分＝fd.bag／合流した仲間＝fd.pb[プレイヤーID]（リーダーの端末が預かる）
function bagOf(pid){const fd=G.fd;if(!pid||pid===G.players[0].id)return fd.bag;if(!fd.pb)fd.pb={};return fd.pb[pid]||(fd.pb[pid]={})}
function addBag(m,n,pid){const b=bagOf(pid);b[m]=(b[m]||0)+n}
function fieldEnc(st){G.fd.enc=CFG.encBase;ev('enc');startCombat(st)}
function rollEnc(x,y){const field=biomeAt(x,y),T=ENC[field],d=fdist(x,y),lv=dangerAt(x,y);
 if(d>=CFG.eliteDist&&Math.random()<CFG.eliteRate)return {k:'e',en:[pick(T.elite)],field,lv};
 const n=1+(d>CFG.encFar[0]?1:0)+(d>CFG.encFar[1]&&Math.random()<.6?1:0),en=[];for(let i=0;i<n;i++)en.push(pick(T.mobs));return {k:'n',en,field,lv}}
// 歩く（dx,dy は -1/0/1 の8方向）。画面を作り直す必要がある出来事（遭遇）が起きたら true
function fieldWalk(dx,dy,dt){const fd=G.fd;dx=Math.sign(dx||0);dy=Math.sign(dy||0);if(!dx&&!dy)return false;
 const sp=CFG.walkSpeed*Math.max(0,Math.min(.1,dt||0))/Math.hypot(dx,dy),ox=Math.floor(fd.x),oy=Math.floor(fd.y);if(dx)fd.fl=dx>0;fd.bk=dy<0;
 const nx=fd.x+dx*sp;if(!fhit(nx,fd.y))fd.x=nx;const ny=fd.y+dy*sp;if(!fhit(fd.x,ny))fd.y=ny;
 for(const f of fixedNear(fd.x,fd.y,2)){if(!fd.dead[f.key]&&Math.hypot(f.x+.5-fd.x,f.y+.5-fd.y)<.9){fieldEnc({k:f.k,en:f.en,field:f.field,fix:f.key,lv:f.lv});return true}}
 const tx=Math.floor(fd.x),ty=Math.floor(fd.y);if(tx===ox&&ty===oy)return false;
 fd.steps++;reveal();if(!CFG.encOn)return false;if(fd.grace>0){fd.grace--;return false}if(fdist(tx,ty)<=CFG.safeR||outSafe(tx,ty))return false;
 if(Math.random()<fd.enc){fieldEnc(rollEnc(tx,ty));return true}fd.enc+=CFG.encStep;return false}
// いちばん近い採集ポイント（触れている物）
function fieldNear(){const fd=G.fd;if(!fd||!G.world)return null;let best=null,bd=1.05;const cx=Math.floor(fd.x),cy=Math.floor(fd.y);
 for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){const key=x+','+y;if(fd.taken[key])continue;const m=nodeAt(x,y);if(!m)continue;const d=Math.hypot(x+.5-fd.x,y+.5-fd.y);if(d<bd){bd=d;best={key,m}}}return best}
function fieldGather(pid){const n=fieldNear();if(!n)return '近くに採集できる物がありません';const c=rng(CFG.gatherN[0],CFG.gatherN[1]);G.fd.taken[n.key]=1;addBag(n.m,c,pid);ev('gather',{m:n.m,n:c,p:pid});return ''}
// 荷物を倉庫へ（rate＝失う割合。強制帰還のとき）
function bagHome(rate){const fd=G.fd,st=plOf(G.players[0].id).store;fd.home={};fd.lost={};for(const m in fd.bag){const n=fd.bag[m],l=Math.round(n*rate);if(l)fd.lost[m]=l;if(n-l>0){fd.home[m]=n-l;st[m]=(st[m]||0)+n-l}}fd.bag={}}
function fieldReturn(){if(G.phase!=='field')return '今は帰還できません';bagHome(0);G.phase='home';log('拠点に帰還した。荷物を個人倉庫に入れた。');ev('ret');return ''}
