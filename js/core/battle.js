'use strict';
/* イセログ core：戦闘のルール。画面・通信に依存しない（ホストだけが動かす） */
const R=n=>Math.floor(Math.random()*n),pick=a=>a[R(a.length)],rng=(a,b)=>a+R(b-a+1);
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=R(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
let G=null;
const HOOK={sched:(f,ms)=>setTimeout(f,ms),changed:()=>{}};
// 向き：0=奥 1=右 2=手前 3=左（マス座標は x=左→右、y=奥→手前）
const DIR=[[0,-1],[1,0],[0,1],[-1,0]],DIRN=['奥','右','手前','左'],RELN={front:'正面',side:'側面',back:'背後'};
function newGame(world){G={v:2,phase:'prep',players:[],cb:null,fd:null,world:world&&world.seed?world:newWorld(),log:[],evs:[],evn:0,uid:0};return G}
function byId(id){return G.players.find(p=>p.id===id)}
function log(m){G.log.push(m);if(G.log.length>30)G.log.shift()}
function ev(k,o){G.evs.push(Object.assign({i:++G.evn,k},o||{}));if(G.evs.length>60)G.evs.shift()}
function addPlayer(id,name){if(byId(id))return byId(id);if(G.players.length>=CFG.maxPlayers)return null;const n=G.players.length;
 const p={id,side:'p',name:String(name||'プレイヤー').slice(0,10),ch:CHARS[n%4].id,w:CFG.startWeapons[n%4],conn:true,hp:1,mhp:1,ps:1,mps:1,eq:[],deck:[],draw:[],hand:[],disc:[],exh:[],en:0,blk:0,st:{},x:0,y:0,f:0,mp:0,moved:false,broken:false,down:false,out:false,downT:0,resc:null,ended:false,done:false,rw:[]};
 G.players.push(p);setChar(p);return p}
function removePlayer(id){G.players=G.players.filter(p=>p.id!==id)}
function cinst(id,src){const c={u:++G.uid,id,up:0};if(src)c.src=src;return c}
function setChar(p){const ch=CH[p.ch];p.mhp=ch.hp;p.mps=ch.ps;p.eq=[p.w];p.deck=[cinst('punch'),cinst('guard'),cinst('guard'),cinst('step')];EQ[p.w].cards.forEach(id=>p.deck.push(cinst(id,p.w)));ch.extra.forEach(id=>p.deck.push(cinst(id)));
 p.hp=maxHp(p);p.ps=p.mps;p.down=false;p.out=false;p.broken=false;p.rw=[];p.st={};p.blk=0;p.hand=[];p.draw=[];p.disc=[];p.exh=[]}
function setWeapon(p,w){const old=p.w;let ups=p.deck.filter(c=>c.src===old&&c.up).length;const at=Math.max(0,p.deck.findIndex(c=>c.src===old));p.deck=p.deck.filter(c=>c.src!==old);
 p.deck.splice(at,0,...EQ[w].cards.map(id=>{const c=cinst(id,w);if(ups>0){c.up=1;ups--}return c}));p.w=w;p.eq=p.eq.map(i=>i===old?w:i)}
/* ---------- パッシブ集計 ---------- */
function pasList(p){const l=p.eq.map(i=>EQ[i].pas);if(CH[p.ch])l.push(CH[p.ch].pas);return l}
function pstat(p,k){let v=0;pasList(p).forEach(s=>{if(s&&s[k])v+=s[k]});return v}
function maxHp(p){return Math.max(1,p.mhp+pstat(p,'maxhp'))}
/* ---------- 盤面 ---------- */
function dist(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)}
function terAt(x,y){return G.cb.map[y][x]}
function unitAt(x,y){return G.players.find(p=>!p.out&&p.x===x&&p.y===y)||G.cb.en.find(e=>e.hp>0&&e.x===x&&e.y===y)||null}
function alivePs(){return G.players.filter(p=>!p.down&&!p.out)}
function aliveEs(){return G.cb.en.filter(e=>e.hp>0)}
// 射線：途中に岩があると通らない
function los(x0,y0,x1,y1){let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,er=dx-dy,x=x0,y=y0;
 while(x!==x1||y!==y1){const e2=2*er;if(e2>-dy){er-=dy;x+=sx}if(e2<dx){er+=dx;y+=sy}if((x!==x1||y!==y1)&&TER[terAt(x,y)].block)return false}return true}
// 移動できるマス：{ 'x,y':{x,y,c:コスト,prev,occ:味方がいて止まれない} }。free=true でユニットを無視
function reachOf(u,mp,free){const N=CFG.grid,res={},open=[{x:u.x,y:u.y,c:0}];res[u.x+','+u.y]={x:u.x,y:u.y,c:0,prev:null,occ:false};
 while(open.length){open.sort((a,b)=>a.c-b.c);const n=open.shift();if(res[n.x+','+n.y].c<n.c)continue;
  for(const d of DIR){const x=n.x+d[0],y=n.y+d[1];if(x<0||y<0||x>=N||y>=N)continue;const t=TER[terAt(x,y)];if(t.block)continue;
   const o=free?null:unitAt(x,y);if(o&&o!==u&&(o.side!==u.side||o.down))continue;const c=n.c+t.cost;if(c>mp)continue;const k=x+','+y;
   if(!res[k]||res[k].c>c){res[k]={x,y,c,prev:n.x+','+n.y,occ:!!o&&o!==u};open.push({x,y,c})}}}
 return res}
function pathTo(rm,x,y){const out=[];let k=x+','+y;while(rm[k]&&rm[k].prev){out.unshift([rm[k].x,rm[k].y]);k=rm[k].prev}return out}
// 攻撃する面：(ax,ay) から t を攻撃した時、正面・側面・背後のどれか。挟み撃ちなら1段階有利
function faceRel(ax,ay,t,att){const dx=ax-t.x,dy=ay-t.y,c=[];if(Math.abs(dx)>=Math.abs(dy)&&dx)c.push(dx>0?1:3);if(Math.abs(dy)>=Math.abs(dx)&&dy)c.push(dy>0?2:0);if(!c.length)return 'front';
 let k=c.includes(t.f)?'front':c.length===1&&c[0]===(t.f+2)%4?'back':'side';
 const o=DIR[(c[0]+2)%4],al=unitAt(t.x+o[0],t.y+o[1]);
 if(al&&att&&al!==att&&al.side===att.side&&!al.down&&!(al.x===ax&&al.y===ay))k=k==='front'?'side':'back';
 return k}
function faceTo(u,t){const dx=t.x-u.x,dy=t.y-u.y;if(!dx&&!dy)return;u.f=Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0)}
function genMap(field){const F=FIELDS[field]||FIELDS.grass,N=CFG.grid;
 for(let tr=0;tr<40;tr++){const m=[];for(let y=0;y<N;y++)m.push(Array(N).fill('p'));
  const put=(k,ok)=>{const n=rng(F[k][0],F[k][1]);for(let i=0,t=0;i<n&&t<300;t++){const x=R(N),y=R(N);if(m[y][x]!=='p'||!ok(y))continue;m[y][x]=k;i++}};
  put('f',()=>true);put('w',y=>y>0&&y<N-1);put('h',()=>true);put('r',y=>y>=2&&y<=N-3);
  let cnt=0,tot=0;const seen={},q=[[3,N-1]];seen['3,'+(N-1)]=1;m.forEach(r=>r.forEach(c=>{if(c!=='r')tot++}));
  while(q.length){const [x,y]=q.pop();cnt++;for(const d of DIR){const a=x+d[0],b=y+d[1];if(a<0||b<0||a>=N||b>=N||m[b][a]==='r'||seen[a+','+b])continue;seen[a+','+b]=1;q.push([a,b])}}
  if(cnt===tot)return m}
 const m=[];for(let y=0;y<N;y++)m.push(Array(N).fill('p'));return m}
/* ---------- カード値 ---------- */
function upv(v){return v+Math.max(2,Math.round(v*.35))}
function upKind(c){return c.fx.some(f=>/^(d|b|ba|h|hA)$/.test(f[0]))?'num':c.fx.some(f=>f[0]==='dr')?'dr':'st'}
function wsrc(p,inst){const c=CARDS[inst.id];if(!c.req||!p)return null;if(inst.src)return p.eq.includes(inst.src)?EQ[inst.src]:null;let b=null;p.eq.forEach(i=>{const e=EQ[i];if(e.k==='w'&&(c.req==='any'||e.tags.includes(c.req))&&(!b||e.atk>b.atk))b=e});return b}
function usable(p,inst){const c=CARDS[inst.id];if(!c.req)return true;return !!wsrc(p,inst)}
function costOf(inst){return CARDS[inst.id].cost}
// 射程・遠距離かどうか・体勢ダメージ倍率
function cardRg(p,inst){const c=CARDS[inst.id],w=wsrc(p,inst),wp=w?WPN[w.tags[0]]:WPN.none,ranged=!!(w&&w.ranged&&!c.rg);let rg=c.rg||(c.req?wp.rg:1);
 if(ranged&&p&&G&&G.cb&&terAt(p.x,p.y)==='h')rg+=CFG.hillRange;return {rg,ranged,pm:wp.pm*(c.pk||1)}}
function inRange(p,t,ci){return dist(p,t)<=ci.rg&&(!ci.ranged||los(p.x,p.y,t.x,t.y))}
function dmgOf(p,inst,f){let v=inst.up?upv(f[1]):f[1];if(!p)return v;const w=wsrc(p,inst);if(w)v+=Math.round(w.atk*(f[2]==null?1:f[2]));return v+pstat(p,'atk')+pstat(p,w&&w.ranged?'ranged':'melee')}
function blkOf(p,inst,f){let v=inst.up?upv(f[1]):f[1];return p?v+Math.round(pstat(p,'blk')*(f[2]==null?1:f[2])):v}
function healOf(p,inst,f){let v=inst.up?upv(f[1]):f[1];return p?v+pstat(p,'heal'):v}
function stOf(p,inst,f){const c=CARDS[inst.id];let v=f[2]+(inst.up&&upKind(c)==='st'?1:0);if(p&&f[3]!=='s'&&f[3]!=='A'){if(f[1]==='bleed')v+=pstat(p,'bleedPlus');if(f[1]==='vuln')v+=pstat(p,'vulnPlus')}return v}
function drOf(inst,f){return f[1]+(inst.up&&upKind(CARDS[inst.id])==='dr'?1:0)}
function evOf(p,inst,f){return f[1]+(inst.up&&upKind(CARDS[inst.id])==='st'?1:0)}
function cardDesc(p,inst){const c=CARDS[inst.id],o=[],ci=cardRg(p,inst);if('eEr'.includes(c.tg))o.push('射程'+ci.rg);
 c.fx.forEach(f=>{const k=f[0];
  if(k==='d'){const h=f[3]||1,t=c.tg==='E'?'射程内の敵すべてに':c.tg==='r'?'射程内のランダムな敵に':'',v=dmgOf(p,inst,f);o.push(t+v+'ダメージ'+(h>1?'×'+h:'')+'（体勢'+Math.round(v*ci.pm)+'）'+(f[4]?'。'+ST[f[4].s][0]+'の敵には+'+f[4].v:''))}
  else if(k==='b')o.push('ブロック'+blkOf(p,inst,f));else if(k==='ba')o.push('味方1人にブロック'+blkOf(p,inst,f));
  else if(k==='h')o.push('味方1人のHPを'+healOf(p,inst,f)+'回復');else if(k==='hA')o.push('味方全員のHPを'+healOf(p,inst,f)+'回復');
  else if(k==='dr')o.push(drOf(inst,f)+'枚引く');else if(k==='en')o.push('エネルギー+'+f[1]);
  else if(k==='s'){const n=ST[f[1]][0]+stOf(p,inst,f);o.push(f[1]==='taunt'?'敵の単体攻撃を引きつける':f[3]==='t'?n+'を与える':f[3]==='s'?'自分に'+n:f[3]==='E'?'射程内の敵すべてに'+n:'味方全員に'+n)}
  else if(k==='cl')o.push(ST[f[1]][0]+'を治す');else if(k==='ev')o.push('回避'+evOf(p,inst,f));else if(k==='mv')o.push('もう一度移動できる（'+f[1]+'歩ぶん）')});
 if(c.x)o.push('【消耗】');return o.join('。')}
function rollCards(p,n){const pool=[];Object.values(CARDS).forEach(c=>{if(!c.rw)return;if(!c.req)pool.push(c.id);else if(usable(p,{id:c.id})){pool.push(c.id);if(c.req!=='any')pool.push(c.id)}});const out=[];for(let tr=0;tr<80&&out.length<n;tr++){const id=pick(pool);if(!out.includes(id))out.push(id)}return out}
/* ================= 戦闘 ================= */
function startRun(){G.log=[];G.players.forEach(setChar);fieldStart()}
function spawn(id,kind){const d=EN[id],n=Math.min(4,G.players.length),hm=(kind==='b'?CFG.bossHp:1)*(kind==='b'?CFG.bossHpMul:kind==='e'?CFG.eliteHpMul:CFG.hpMul)[n-1],hp=Math.round(d.hp*hm),ps=Math.round(d.ps*hm);
 return {id,side:'e',n:d.n,em:d.em,hp,mhp:hp,ps,mps:ps,blk:0,st:{},mi:R(d.seq.length),it:null,x:0,y:0,f:2,broken:false,aggro:false,hitBy:[],boss:kind==='b',dm:(kind==='b'||kind==='e'?CFG.bossDmgMul:CFG.dmgMul)[n-1]*(kind==='b'?CFG.bossDmg:1)}}
// st={k:n通常/e強敵/bボス, en:[敵ID], field:地域, fix:決まった場所の敵の番号}
function startCombat(st){const n=Math.min(4,G.players.length),N=CFG.grid,map=genMap(st.field),en=[];
 G.phase='combat';G.cb={kind:st.k,field:st.field,fix:st.fix,map,en,turn:0,ph:'p',ei:0};
 const sp=[[3,N-1],[4,N-1],[2,N-1],[5,N-1]];
 G.players.forEach((p,i)=>{p.x=sp[i][0];p.y=sp[i][1];p.f=0;p.draw=shuf(p.deck.map(c=>Object.assign({},c)));p.hand=[];p.disc=[];p.exh=[];p.st={};p.blk=0;p.ps=p.mps;p.broken=false;p.out=false;p.downT=0;p.resc=null;p.done=false;if(p.hp<=0){p.hp=0;p.down=true}else p.down=false});
 const ids=st.en.slice();for(let i=1;i<n;i++)ids.push(pick(CFG.mobs));
 ids.forEach((id,i)=>{const e=spawn(id,i===0?st.k:'n'),c=[];for(let y=0;y<=2;y++)for(let x=0;x<N;x++)if(!TER[map[y][x]].block&&!unitAt(x,y)&&(!e.boss||(y<=1&&x>=2&&x<=5)))c.push([x,y]);const s=pick(c);e.x=s[0];e.y=s[1];en.push(e)});
 log(st.k==='b'?'ボス「'+en[0].n+'」が現れた！':st.k==='e'?'強敵が現れた！':'敵が現れた！');ev('start');startPlayerPhase()}
function nearestP(e){const ps=alivePs();if(!ps.length)return null;const m=Math.min(...ps.map(p=>dist(e,p)));return pick(ps.filter(p=>dist(e,p)===m))}
function pickTarget(e){const d=EN[e.id],ps=alivePs();if(!ps.length)return null;let c=ps;
 if(d.tgt==='weak'){const m=Math.min(...ps.map(p=>p.hp));c=ps.filter(p=>p.hp===m)}
 else if(d.tgt==='strong'){const m=Math.max(...ps.map(p=>p.hp));c=ps.filter(p=>p.hp===m)}
 else if(d.tgt==='ranged'){const r=ps.filter(p=>p.eq.some(i=>EQ[i].ranged));if(r.length)c=r}
 else if(d.tgt==='healer'){const r=ps.filter(p=>p.deck.some(x=>CARDS[x.id].ty==='heal'));if(r.length)c=r}
 return pick(c).id}
function pickIntent(e){const d=EN[e.id],m=d.seq[e.mi%d.seq.length],k=d.moves[m][0];e.mi++;e.it={m,t:k==='a'||k==='w'||(k==='x'&&!d.moves[m][4])?pickTarget(e):null}}
function eDmg(e,m){return Math.max(0,Math.floor((Math.round(m[2]*(m[0]==='a'?e.dm:(1+(e.dm-1)*.4)))+(e.st.str||0))*(e.st.weak?.75:1)))}
function startPlayerPhase(){const cb=G.cb;cb.turn++;cb.ph='p';
 // 救助の成否（次の味方ターン開始まで攻撃を受けなければ成功）
 G.players.forEach(p=>{if(p.resc==null)return;const t=byId(p.resc);p.resc=null;if(!p.down&&t&&t.down&&!t.out){log(p.name+'が'+t.name+'を救助した！');reviveP(t,CFG.rescuePct)}});
 G.players.forEach(p=>{if(p.down&&!p.out){p.downT++;if(p.downT>CFG.rescueTurns||alivePs().length===0){p.out=true;log(p.name+'は拠点へ強制帰還した…');ev('out',{p:p.id})}}});
 aliveEs().forEach(e=>{e.hitBy=[];pickIntent(e)});
 G.players.forEach(p=>{if(p.down||p.out){p.ended=true;return}p.ended=false;p.moved=false;p.mp=CFG.moveMp+pstat(p,'move');p.blk=pstat(p,'blockStart')+(cb.turn===1?pstat(p,'firstBlock'):0);p.st.taunt=0;p.st.evade=cb.turn===1?pstat(p,'evadeStart'):0;if(cb.turn===1)p.st.str=pstat(p,'strStart');
  if(p.broken){p.broken=false;p.ps=p.mps;p.en=0;p.ended=true;log(p.name+'は体勢を立て直している（1回休み）');ev('skip',{p:p.id});return}
  if(terAt(p.x,p.y)!=='w')p.ps=Math.min(p.mps,p.ps+Math.ceil(p.mps*CFG.psRegen));
  p.en=CFG.energy+pstat(p,'energy')+(cb.turn===1?pstat(p,'energyFirst'):0);drawCards(p,CFG.handSize+pstat(p,'draw')+(cb.turn===1?pstat(p,'drawFirst'):0))});
 ev('turn');
 if(!checkCombatEnd()&&G.players.every(p=>p.ended))HOOK.sched(()=>{if(G&&G.phase==='combat'&&G.cb.ph==='p'){progress();HOOK.changed()}},900)}
function drawCards(p,n){for(let i=0;i<n;i++){if(p.hand.length>=CFG.handMax)break;if(!p.draw.length){if(!p.disc.length)break;p.draw=shuf(p.disc);p.disc=[]}p.hand.push(p.draw.pop())}}
function addSt(o,s,v){o.st[s]=(o.st[s]||0)+v}
function killE(e,msg){e.st={};e.blk=0;e.it=null;ev('die',{e:G.cb.en.indexOf(e)});log(e.n+msg)}
// ci: {ranged,pm}
function hitEnemy(p,e,v,ci){if(e.hp<=0)return;const ix=G.cb.en.indexOf(e),rel=faceRel(p.x,p.y,e,p);let d=v+(p.st.str||0)+(p.st.tstr||0),pd=v*ci.pm;
 if(p.st.weak)d*=.75;if(e.st.vuln)d*=1.5;d*=CFG.dirHp[rel];pd*=CFG.dirPs[rel];
 if(terAt(p.x,p.y)==='h')d*=CFG.hillDmg;if(ci.ranged&&terAt(e.x,e.y)==='f')d*=CFG.forestRanged;if(e.broken)d*=CFG.brokenDmg;
 if(e.hitBy.some(id=>id!==p.id))pd*=CFG.followPs;if(!e.hitBy.includes(p.id))e.hitBy.push(p.id);
 d=Math.max(0,Math.floor(d));const b=Math.min(e.blk,d);e.blk-=b;d-=b;e.hp=Math.max(0,e.hp-d);e.aggro=true;ev('hit',{e:ix,d,b,rel});
 if(e.hp<=0)return killE(e,'を倒した！');
 if(!e.broken){e.ps=Math.max(0,e.ps-Math.round(pd));if(e.ps<=0){e.broken=true;ev('break',{e:ix});log(e.n+'の体勢が崩れた！')}}}
function downP(p){p.hp=0;p.down=true;p.downT=0;p.blk=0;p.st={};p.broken=false;p.resc=null;p.disc.push(...p.hand);p.hand=[];p.ended=true;ev('down',{p:p.id});log(p.name+'が戦闘不能になった！')}
function hurtP(p,d){p.hp=Math.max(0,p.hp-d);if(p.hp<=0&&!p.down)downP(p)}
function hitPlayer(e,p,v,ranged){if(p.down||p.out)return;if(p.st.evade>0){p.st.evade--;ev('evade',{p:p.id});return}
 const rel=faceRel(e.x,e.y,p,e);let d=v*CFG.dirHp[rel],pd=v*CFG.enemyPs*CFG.dirPs[rel];if(p.st.vuln)d*=1.5;if(ranged&&terAt(p.x,p.y)==='f')d*=CFG.forestRanged;if(p.broken)d*=CFG.brokenDmg;
 d=Math.max(0,Math.floor(d)-pstat(p,'dmgRed'));const b=Math.min(p.blk,d);p.blk-=b;d-=b;if(!d&&b)pd*=CFG.blockPs;ev('phit',{p:p.id,d,b,rel});
 if(p.resc!=null){p.resc=null;log(p.name+'の救助が中断された！')}
 hurtP(p,d);if(!p.down&&!p.broken){p.ps=Math.max(0,p.ps-Math.round(pd));if(p.ps<=0){p.broken=true;ev('break',{p:p.id});log(p.name+'の体勢が崩れた！')}}}
function healP(p,v){if(p.down||p.out)return;const m=maxHp(p),b=p.hp;p.hp=Math.min(m,p.hp+v);ev('heal',{p:p.id,d:p.hp-b})}
function reviveP(t,pct){t.down=false;t.downT=0;t.hp=Math.max(1,Math.ceil(maxHp(t)*pct));t.st={};t.blk=0;t.ps=Math.ceil(t.mps/2);t.broken=false;ev('heal',{p:t.id,d:t.hp})}
function canAct(p){const cb=G.cb;if(G.phase!=='combat'||cb.ph!=='p')return '今は行動できません';if(p.down||p.out)return '戦闘不能です';if(p.ended)return 'ターン終了済みです';return ''}
function moveP(p,x,y){const er=canAct(p);if(er)return er;if(p.moved)return 'このターンはもう移動しました';const rm=reachOf(p,p.mp),c=rm[x+','+y];if(!c||(x===p.x&&y===p.y))return 'そこへは移動できません';if(c.occ)return '味方のいるマスには止まれません';
 const path=pathTo(rm,x,y),l=path[path.length-1],pv=path.length>1?path[path.length-2]:[p.x,p.y];p.f=DIR.findIndex(d=>d[0]===l[0]-pv[0]&&d[1]===l[1]-pv[1]);p.x=x;p.y=y;p.moved=true;p.mp=0;ev('move',{p:p.id,path});return ''}
function playCard(p,uid,t){let er=canAct(p);if(er)return er;const cb=G.cb,i=p.hand.findIndex(c=>c.u===uid);if(i<0)return 'そのカードは手札にありません';const inst=p.hand[i],c=CARDS[inst.id];
 if(!usable(p,inst))return '対応する武器（'+REQN[c.req]+'）がありません';if(p.en<c.cost)return 'エネルギーが足りません';
 const ci=cardRg(p,inst);let te=null,tp=null,es=[];
 if(c.tg==='e'){te=cb.en[t];if(!te||te.hp<=0)return '対象の敵を選んでください';if(!inRange(p,te,ci))return dist(p,te)>ci.rg?'届きません（射程'+ci.rg+'）':'岩にさえぎられています'}
 else if(c.tg==='E'||c.tg==='r'){es=aliveEs().filter(e=>inRange(p,e,ci));if(!es.length)return '射程内に敵がいません（射程'+ci.rg+'）'}
 else if(c.tg==='a'){tp=byId(t)||p;if(tp.down||tp.out)return '対象は戦闘不能です';if(dist(p,tp)>(c.rg||2))return '届きません（射程'+(c.rg||2)+'）'}
 p.en-=c.cost;p.hand.splice(i,1);if(te)faceTo(p,te);log(p.name+'：'+c.n+(inst.up?'+':'')+(te?' → '+te.n:tp&&tp!==p?' → '+tp.name:''));ev('card',{p:p.id,ty:c.ty});
 for(const f of c.fx){const k=f[0];
  if(k==='d'){const h=f[3]||1;for(let n=0;n<h;n++){let v=dmgOf(p,inst,f);
    if(c.tg==='E')es.forEach(e=>hitEnemy(p,e,v,ci));else{const al=es.filter(e=>e.hp>0),e=c.tg==='r'?(al.length?pick(al):null):te;if(!e||e.hp<=0)break;if(c.tg==='r')faceTo(p,e);if(f[4]&&e.st[f[4].s])v+=f[4].v;hitEnemy(p,e,v,ci)}}}
  else if(k==='b'){p.blk+=blkOf(p,inst,f);ev('blk',{p:p.id})}
  else if(k==='ba'){tp.blk+=blkOf(p,inst,f);ev('blk',{p:tp.id})}
  else if(k==='h')healP(tp,healOf(p,inst,f));
  else if(k==='hA'){const v=healOf(p,inst,f);alivePs().forEach(q=>healP(q,v))}
  else if(k==='dr')drawCards(p,drOf(inst,f));
  else if(k==='en')p.en+=f[1];
  else if(k==='s'){const v=stOf(p,inst,f);if(f[3]==='t'){if(te&&te.hp>0)addSt(te,f[1],v)}else if(f[3]==='s')addSt(p,f[1],v);else if(f[3]==='E')es.forEach(e=>{if(e.hp>0)addSt(e,f[1],v)});else alivePs().forEach(q=>addSt(q,f[1],v));ev(f[3]==='s'||f[3]==='A'?'buff':'deb')}
  else if(k==='cl'){if(tp)tp.st[f[1]]=0}
  else if(k==='ev'){p.st.evade=(p.st.evade||0)+evOf(p,inst,f);ev('buff')}
  else if(k==='mv'){p.moved=false;p.mp=f[1]}}
 (c.x?p.exh:p.disc).push(inst);return ''}
// 救助：隣のマスの戦闘不能の味方を選ぶ。次の味方ターン開始まで攻撃を受けなければ成功
function rescue(p,tid){const er=canAct(p);if(er)return er;const t=byId(tid);if(!t||!t.down||t.out)return '対象は戦闘不能ではありません';if(dist(p,t)!==1)return '隣のマスにいる味方しか救助できません';if(p.resc!=null)return 'すでに救助中です';if(p.en<CFG.rescueCost)return '救助にはエネルギーが'+CFG.rescueCost+'必要です';
 p.en-=CFG.rescueCost;p.resc=t.id;faceTo(p,t);log(p.name+'が'+t.name+'の救助を始めた（攻撃を受けると中断）');ev('buff');return ''}
function endTurn(p){if(G.phase!=='combat'||G.cb.ph!=='p'||p.ended)return '';p.ended=true;p.disc.push(...p.hand);p.hand=[];p.st.tstr=0;if(p.st.weak>0)p.st.weak--;return ''}
function checkCombatEnd(){if(G.phase!=='combat')return true;if(!aliveEs().length){winCombat();return true}if(!alivePs().length){G.phase='over';G.cb.ph='x';bagHome(CFG.loseBag);ev('lose');log('全員が倒れ、拠点へ強制帰還した…');return true}return false}
function startEnemyPhase(){const cb=G.cb;cb.ph='e';cb.ei=0;HOOK.sched(enemyStep,500)}
function enemyStep(){if(!G||G.phase!=='combat'||G.cb.ph!=='e')return;const cb=G.cb;while(cb.ei<cb.en.length&&cb.en[cb.ei].hp<=0)cb.ei++;
 if(cb.ei>=cb.en.length){endEnemyPhase();HOOK.changed();return}
 const e=cb.en[cb.ei];cb.ei++;enemyAct(e);if(!checkCombatEnd())HOOK.sched(enemyStep,CFG.enemyStep);HOOK.changed()}
function enemyAct(e){const d=EN[e.id],ix=G.cb.en.indexOf(e);e.blk=0;
 if(e.broken){e.broken=false;e.ps=e.mps;log(e.n+'は体勢を立て直している（行動できない）');ev('skip',{e:ix})}
 else if(e.st.stun>0){e.st.stun--;log(e.n+'は気絶している！');ev('stun',{e:ix})}
 else if(e.it){const m=d.moves[e.it.m],k=m[0],rg=d.rg,can=p=>dist(e,p)<=rg&&(rg===1||los(e.x,e.y,p.x,p.y));ev('eact',{e:ix,k});let tgt=null;
  if('aAwx'.includes(k)&&alivePs().length){const ta=alivePs().filter(p=>p.st.taunt>0);tgt=ta.length?pick(ta):byId(e.it.t);if(!tgt||tgt.down||tgt.out)tgt=nearestP(e)}
  if(tgt&&(k==='a'||k==='A'||k==='w'||(k==='x'&&!m[4])))aiMove(e,tgt);
  if(k==='a'){if(tgt&&!can(tgt)){const c=alivePs().filter(can);tgt=c.length?pick(c):null}
   if(!tgt)log(e.n+'は様子をうかがっている…');else{faceTo(e,tgt);log(e.n+'の'+m[1]+' → '+tgt.name);const h=m[3]||1;for(let i=0;i<h&&!tgt.down&&e.hp>0;i++)hitPlayer(e,tgt,eDmg(e,m),rg>1);if(m[4]&&!tgt.down)addSt(tgt,m[4],m[5])}}
  else if(k==='A'){const hs=alivePs().filter(p=>dist(e,p)<=(d.ar||rg));if(!hs.length)log(e.n+'は様子をうかがっている…');else{if(tgt)faceTo(e,hs.includes(tgt)?tgt:hs[0]);log(e.n+'の'+m[1]+'（範囲）');const h=m[3]||1;hs.forEach(p=>{for(let i=0;i<h&&!p.down&&e.hp>0;i++)hitPlayer(e,p,eDmg(e,m),false);if(m[4]&&!p.down)addSt(p,m[4],m[5])})}}
  else if(k==='d'){e.blk+=Math.round(m[2]*e.dm*e.dm);if(m[3])addSt(e,'str',m[3]);log(e.n+'は'+m[1]+'。')}
  else if(k==='u'){(m[3]?aliveEs():[e]).forEach(x=>addSt(x,'str',m[2]));log(e.n+'の'+m[1]+'！')}
  else if(k==='x'){(m[4]?alivePs():tgt&&dist(e,tgt)<=Math.max(rg,3)?[tgt]:[]).forEach(p=>{addSt(p,m[2],m[3]);if(m[5])addSt(p,m[5],m[6])});log(e.n+'の'+m[1]+'！')}
  else log(e.n+'は'+m[1]+'…')}
 if(e.hp>0&&e.st.bleed>0){e.hp=Math.max(0,e.hp-e.st.bleed);ev('hit',{e:ix,d:e.st.bleed,b:0});e.st.bleed--;if(e.hp<=0)killE(e,'は出血で倒れた！')}
 if(e.st.weak>0)e.st.weak--;
 if(e.hp>0&&!e.broken&&terAt(e.x,e.y)!=='w')e.ps=Math.min(e.mps,e.ps+Math.ceil(e.mps*CFG.psRegen))}
function endEnemyPhase(){G.cb.en.forEach(e=>{if(e.st.vuln>0)e.st.vuln--});G.players.forEach(p=>{if(p.down||p.out)return;if(p.st.bleed>0){ev('phit',{p:p.id,d:p.st.bleed,b:0});const b=p.st.bleed;p.st.bleed--;hurtP(p,b)}if(p.st.vuln>0)p.st.vuln--});if(!checkCombatEnd())startPlayerPhase()}
function winCombat(){const cb=G.cb,st={k:cb.kind},fd=G.fd,got={};ev('win');
 G.players.forEach(p=>{if(p.down||p.out){p.down=false;p.out=false;p.hp=Math.max(1,Math.ceil(maxHp(p)*CFG.afterDownPct))}else p.hp=Math.min(maxHp(p),p.hp+Math.ceil(maxHp(p)*CFG.winHeal));
  p.st={};p.blk=0;p.broken=false;p.ps=p.mps;p.resc=null;p.hand=[];p.draw=[];p.disc=[];p.exh=[];p.done=false;p.rw=[];
  if(st.k==='e')p.rw.push({k:'w',o:shuf(CFG.eliteWeapons.filter(w=>w!==p.w)).slice(0,2),src:'強敵の戦利品'});if(st.k==='b')p.rw.push({k:'w',o:CFG.bossWeapons.filter(w=>w!==p.w),src:'ボスの戦利品'});p.rw.push({k:'card',o:rollCards(p,3)})});
 cb.en.forEach(e=>{const d=DROP[e.id];if(d&&Math.random()<d[2]){addBag(d[0],d[1]);got[d[0]]=(got[d[0]]||0)+d[1]}});if(Object.keys(got).length)ev('drop',{o:got});
 if(cb.fix!=null)fd.dead[cb.fix]=1;fd.wins++;fd.grace=CFG.encGrace;log('戦闘に勝利した！');G.cb=null;G.phase='reward'}
// 敵の攻撃が届く範囲（行動予告の表示用）
function dangerOf(e){const d=EN[e.id],m=e.it?d.moves[e.it.m]:null,out={};if(!m||e.broken||e.st.stun>0||!'aA'.includes(m[0]))return out;const rg=m[0]==='A'?(d.ar||d.rg):d.rg,rm=reachOf(e,d.mv),N=CFG.grid;
 for(const k in rm){const c=rm[k];if(c.occ)continue;for(let y=Math.max(0,c.y-rg);y<=Math.min(N-1,c.y+rg);y++)for(let x=Math.max(0,c.x-rg);x<=Math.min(N-1,c.x+rg);x++)if(Math.abs(x-c.x)+Math.abs(y-c.y)<=rg&&!TER[terAt(x,y)].block)out[x+','+y]=1}return out}
/* ================= 行動の受付（ホストに届いた順に処理） ================= */
function act(pid,a){const p=byId(pid);if(!p)return '参加していません';let er='';
 if(a.t==='walk'){if(G.phase==='field'&&fieldWalk(a.dx,a.dy,a.dt))HOOK.changed();return ''}
 switch(a.t){
  case 'char':if(G.phase==='prep'&&CH[a.c]){p.ch=a.c;setChar(p)}break;
  case 'weapon':if(G.phase==='prep'&&CFG.startWeapons.includes(a.w)){p.w=a.w;setChar(p)}break;
  case 'start':if(G.phase!=='prep')return '';startRun();break;
  case 'move':er=moveP(p,a.x,a.y);break;
  case 'face':er=canAct(p);if(!er&&a.f>=0&&a.f<4)p.f=a.f;break;
  case 'play':er=playCard(p,a.u,a.tg);break;
  case 'end':er=endTurn(p);break;
  case 'rescue':er=rescue(p,a.p);break;
  case 'pick':{const r=p.rw[0];if(!r||G.phase!=='reward')return '';if(a.i!=null&&a.i>=0){const id=r.o[a.i];if(!id)return '';if(r.k==='card')p.deck.push(cinst(id));else{setWeapon(p,id);log(p.name+'は「'+EQ[id].n+'」を手に入れた。')}}p.rw.shift();if(!p.rw.length)p.done=true;break}
  case 'gather':if(G.phase!=='field')return '';er=fieldGather();break;
  case 'return':er=fieldReturn();break;
  case 'restart':if(!['over','home'].includes(G.phase))return '';G.phase='prep';G.cb=null;G.fd=null;G.players.forEach(setChar);break;
  default:return ''}
 if(er)return er;progress();HOOK.changed();return ''}
function progress(){if(!G)return;
 if(G.phase==='combat'){if(G.cb.ph==='p'&&!checkCombatEnd()&&G.players.every(p=>p.ended))startEnemyPhase()}
 else if(G.phase==='reward'){if(G.players.every(p=>p.done)){G.phase='field';ev('field')}}}
