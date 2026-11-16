'use strict';
/* イセログ 画面まわり（タイトル・準備・フィールド・戦闘・報酬・帰還）。ソロ＝自分がホストの世界として動かす */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let META=Object.assign({name:'',pid:'',bgm:1,se:1,auto:0,spd:1,code:''},LS.get('iserogu_meta',{}));
if(!META.pid)META.pid='u'+Math.random().toString(36).slice(2,10);if(!META.name)META.name='旅人'+rng(100,999);
const MY=META.pid,saveMeta=()=>LS.set('iserogu_meta',META);saveMeta();
let scr='title',syncT=0;
// セーブの置き場所：ソロ＝端末だけ／クラウドの世界＝端末（控え）＋クラウド
const wkey=()=>Cloud.code?'iserogu_w_'+Cloud.code:'iserogu_world',saveLocal=()=>{LS.set(wkey(),G.world);Cloud.mark()};
const CLOUD_NOW={ret:1,win:1,lose:1,tech:1,built:1,craft:1,donate:1,pop:1}; // この出来事の直後はすぐクラウドに保存
// mode: null / move 移動先を選ぶ / face 向きを選ぶ / target 攻撃対象を選ぶ / look マスを調べる
const ui={panel:0,pid:MY,sel:null,mode:null,cur:{x:1,y:3},tab:'go',ov:null,pick:null,lastEv:0,banner:'',fk:null,fr:null,ph:''};
const me=()=>G&&(byId(ui.pid)||G.players[0]);
function toast(m){const d=document.createElement('div');d.className='ts';d.textContent=m;$('#toast').appendChild(d);setTimeout(()=>d.remove(),3300)}
function sendAct(a,pid){auInit();if(Party.fol){Party.act(a);return ''}const er=act(pid||me().id,a);if(er)toast(er);return er}
const spd=()=>[1,2,4].includes(META.spd)?META.spd:1;
HOOK.sched=(f,ms)=>setTimeout(f,ms/spd()); // 戦闘の速さ（×1・×2・×4）
HOOK.op=a=>Net.op(a);
HOOK.changed=()=>{if(syncT)return;syncT=setTimeout(()=>{syncT=0;onState()},0)};
/* ---------- 状態が変わったとき ---------- */
function onState(){if(!G)return render();const now=performance.now();if(G.evn<ui.lastEv)ui.lastEv=0;
 let cn=false;for(const e of G.evs){if(e.i<=ui.lastEv)continue;ui.lastEv=e.i;if(CLOUD_NOW[e.k])cn=true;const rc={front:'#ffd0b8',side:'#ffd84a',back:'#ff5a3a'}[e.rel]||'#ffd0b8';
  if(e.k==='hit'){BV.float('e'+e.e,e.d>0?'-'+e.d:e.b?'ガード':'0',rc);if(e.d>0&&e.rel&&e.rel!=='front')BV.float('e'+e.e,RELN[e.rel]+'！',rc);sfx(e.d>0?'hit':'block')}
  else if(e.k==='phit'){BV.float('p'+e.p,e.d>0?'-'+e.d:'ガード',e.d>0?'#ff5040':'#80b8ff');if(e.d>0&&e.rel&&e.rel!=='front')BV.float('p'+e.p,RELN[e.rel]+'から！','#ff9a60');sfx(e.d>0?'hurt':'block')}
  else if(e.k==='break'){BV.float(e.p?'p'+e.p:'e'+e.e,'体勢崩し！','#ffe060');sfx('brk')}
  else if(e.k==='skip')BV.float(e.p?'p'+e.p:'e'+e.e,'立て直し中','#ffe060');
  else if(e.k==='heal'){BV.float('p'+e.p,'+'+e.d,'#70f090');sfx('heal')}
  else if(e.k==='evade'){BV.float('p'+e.p,'回避！','#80f0e0');sfx('evade')}
  else if(e.k==='stun')BV.float('e'+e.e,'気絶','#ffe060');
  else if(e.k==='move'){BV.path('p'+e.p,e.path);sfx('step')}else if(e.k==='emove'){BV.path('e'+e.e,e.path);sfx('step')}
  else if(e.k==='eact'){BV.actE=e.e;BV.actT=now}
  else if(e.k==='start'){BV.reset();ui.mode=null;ui.sel=null}
  else if(e.k==='fstart')FV.reset();else if(e.k==='enc')ui.ov=null;
  else if(e.k==='gather'){if(e.p&&e.p!==MY)continue;toast(MAT[e.m].em+MAT[e.m].n+' ×'+e.n+' を手に入れた');sfx('heal')}
  else if(e.k==='drop'){if(!e.p||e.p===MY)toast('戦利品：'+matList(e.o))}else if(e.k==='ret')sfx('win');
  else if(e.k==='turn'){if(G.cb){ui.banner=G.cb.turn===1?(G.cb.kind==='b'?'ボス戦！':'戦闘開始！'):'ターン '+G.cb.turn;sfx('turn')}}
  else if(e.k==='win'){ui.banner='勝利！';sfx('win')}else if(e.k==='lose')sfx('lose');
  else if(e.k==='tech'){toast('🔬 研究完了：'+TECH[e.id].n);sfx('win')}else if(e.k==='built'){toast('🏗️ '+FAC[e.id].n+' がLv'+e.lv+'になった');sfx('win')}else if(e.k==='pop')toast('👥 住民が増えた（'+e.n+'人）');
  else if(e.k==='craft'){toast('🔨 【'+RAR[e.r].n+'】'+itemOf(e.id).n+' を製作した！');sfx(e.r>=2?'win':'buff')}else if(e.k==='donate')sfx('buff');
  else if(e.k==='die')sfx('die');else if(e.k==='down'||e.k==='out')sfx('down');else if(e.k==='card')sfx('card');else if(e.k==='blk')sfx('block');else if(e.k==='buff')sfx('buff');else if(e.k==='deb')sfx('deb')}
 if(ui.ph!==G.phase){ui.ph=G.phase;ui.pick=null;ui.mode=null;ui.sel=null}
 saveLocal();if(cn)setTimeout(()=>Cloud.flush(),1500);let p=me();
 if(G.phase==='combat'){if(G.cb.ph==='p'&&(p.ended||p.down)){const q=G.players.find(x=>Party.mine(x)&&!x.ended&&!x.down&&!x.out);if(q){ui.pid=q.id;ui.sel=null;ui.mode=null;p=q}}
  if(!p.hand.some(c=>c.u===ui.sel))ui.sel=null;if(G.cb.ph!=='p'||p.ended){if(ui.mode!=='look')ui.mode=null}if(ui.mode==='move'&&p.moved)ui.mode=null;if(ui.mode==='target'&&!ui.sel)ui.mode=null}
 else if(G.phase==='reward'&&p.done){const q=G.players.find(x=>Party.mine(x)&&!x.done);if(q)ui.pid=q.id}
 render()}
/* ---------- オンライン ---------- */
// ホスト側：ほかの人の操作で世界が変わった時の描き直し
function netRefresh(){if(!G||scr!=='game')return;if((G.phase==='prep'||(ui.ov&&ui.ov.k==='menu')))onState();else saveLocal()}
// 参加者側：ホストから届いた世界を反映する（自分の個人分は手元を優先。地図は合わせる）
function netApply(w){const o=G.world,ob=o.base||{},nb=w.base||{};
 for(const t in nb.tech||{})if(!(ob.tech||{})[t]&&TECH[t])ev('tech',{id:t});
 for(const f in nb.fac||{})if((nb.fac[f]||0)>((ob.fac||{})[f]||0)&&FAC[f])ev('built',{id:f,lv:nb.fac[f]});
 if(nb.pop>ob.pop)ev('pop',{n:nb.pop});
 if(!w.pl)w.pl={};if(o.pl&&o.pl[MY])w.pl[MY]=o.pl[MY];
 const os=Array.isArray(o.seen)?o.seen:[],ws=Array.isArray(w.seen)?w.seen:[];let ch=false;
 if(ws.length!==os.length){if(os.length)w.seen=os;else ch=true}else for(let i=0;i<ws.length;i++){if(os[i]&&!ws[i])ws[i]=1;else if(ws[i]&&!os[i])ch=true}
 w.sv=(o.sv||0)+(ch?1:0);G.world=w;ensureWorld();netRefresh()}
function netInfoH(){if(!Cloud.code)return '　ソロ（この端末だけに保存）';const ms=Net.members();
 return '　☁️ 世界コード：<b>'+Cloud.code+'</b><br>'+(Net.role==='host'?'👑 あなたがホスト'+(Cloud.err?'（保存できていません）':Cloud.last?'（保存済み）':''):Net.role==='guest'?(Net.conn?'🔗 ホスト：'+esc((ms.find(x=>x.h)||{}).name||'？'):'⏳ '+Net.st):'')+(ms.length>1?'<br>いま世界にいる人：<br>'+ms.map(x=>'　'+(x.h?'👑':'')+esc(x.name)+(x.pid===MY?'（あなた）':'')+'：'+stH(x.s)).join('<br>'):'')}
/* ---------- 仲間の冒険の様子（第3段階） ---------- */
// 自分の様子：w＝b拠点／f探索中／c戦闘中、x・y＝地図上の位置、k＝戦闘の種類（s強敵・bボス）
function myStat(){if(!G||scr!=='game')return null;const ph=G.phase,p=G.players.find(q=>q.id===MY)||G.players[0],w=ph==='field'?'f':ph==='combat'||ph==='reward'?'c':'b',s={w,em:p?CH[p.ch].em:'🙂',hp:p?p.hp:0,mh:p?maxHp(p):0};
 if(w!=='b'&&G.fd){s.x=Math.round(G.fd.x*10)/10;s.y=Math.round(G.fd.y*10)/10}else if(w==='b'&&typeof TV!=='undefined'){s.x=Math.round(TV.x*10)/10;s.y=Math.round(TV.y*10)/10}if(ph==='combat'&&G.cb&&G.cb.kind!=='n')s.k=G.cb.kind==='b'?'b':'s';if(Party.fol)s.pt=Party.fol;else if(Party.fs.length)s.pn=Party.fs.length+1;return s}
function stH(s){if(!s)return '…';return (s.pt||s.pn?'🤝':'')+s.w==='b'?'🛖拠点にいる':s.w==='c'?(s.k==='b'?'👑ボスと戦闘中':s.k==='s'?'⚠️強敵と戦闘中':'⚔️戦闘中')+(s.hp!=null?'（❤️'+s.hp+'/'+s.mh+'）':''):'🌲冒険中'+(s.hp!=null?'（❤️'+s.hp+'/'+s.mh+'）':'')}
const mates=()=>Net.role?Net.members().filter(m=>m.pid!==MY):[];
// 合流できる仲間（近くにいる、冒険中か戦闘中の仲間）
function joinTarget(){if(!Net.role||Party.on()||!G||G.phase!=='field'||!G.fd)return null;const fd=G.fd;let best=null,bd=CFG.joinDist;
 mates().forEach(m=>{const s=m.s;if(!s||(s.w!=='f'&&s.w!=='c')||s.x==null||s.pt===MY)return;const d=Math.hypot(s.x-fd.x,s.y-fd.y);if(d<bd){bd=d;best=m}});return best}
let mateW={};
// 仲間の様子が届いた時：出発・帰還・ボス戦を知らせ、拠点の画面なら描き直す
function netMates(ms){if(!G||scr!=='game')return;let ch=false;const nw={};
 ms.forEach(m=>{if(m.pid===MY)return;const s=m.s,w=s?s.w+(s.k||''):'',d=m.name+stH(s),o=mateW[m.pid];nw[m.pid]={w,d};if(!o||o.d!==d)ch=true;if(!o||o.w===w||!s)return;
  if(s.w==='f'&&o.w[0]==='b')toast('🌲 '+m.name+' が冒険に出発しました');else if(s.w==='b'&&o.w[0]!=='b')toast('🛖 '+m.name+' が拠点に帰ってきました');else if(s.w==='c'&&s.k==='b')toast('👑 '+m.name+' がボスと戦っています！')});
 if(Object.keys(nw).length!==Object.keys(mateW).length)ch=true;mateW=nw;if(!ch)return;
 if(G.phase==='prep'||(ui.ov&&ui.ov.k==='menu'))onState()}
/* ================= マスの操作 ================= */
function fieldOn(){return !!(G&&scr==='game'&&G.phase==='field'&&!ui.ov)}
function matList(o){const ks=Object.keys(o||{}).filter(m=>o[m]>0);return ks.length?ks.map(m=>MAT[m].em+MAT[m].n+'×'+o[m]).join('　'):'なし'}
function bagCount(){let n=0;if(G&&G.fd)for(const m in G.fd.bag)n+=G.fd.bag[m];return n}
function gridOn(){return !!(G&&scr==='game'&&G.phase==='combat'&&!ui.ov&&ui.mode)}
function gridDir(dx,dy){if(ui.mode==='face'){sendAct({t:'face',f:dx>0?1:dx<0?3:dy>0?2:0});ui.mode=null;return}const N=CFG.grid;ui.cur={x:Math.max(0,Math.min(N-1,ui.cur.x+dx)),y:Math.max(0,Math.min(N-1,ui.cur.y+dy))};sfx('sel')}
function tryPlay(u,tg){if(!sendAct({t:'play',u,tg})){ui.sel=null;ui.mode=null}}
// マスをタップ／カーソルで決定したとき
function gridTap(x,y){const p=me(),cb=G.cb;if(!p||G.phase!=='combat')return;const u=unitAt(x,y),my=cb.ph==='p'&&!p.ended&&!p.down;ui.cur={x,y};
 if(ui.mode==='move'){ui.mode=null;if(u!==p&&my)sendAct({t:'move',x,y});return}
 if(ui.mode==='face'){const dx=x-p.x,dy=y-p.y;if(dx||dy)sendAct({t:'face',f:Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0)});ui.mode=null;return}
 const sel=p.hand.find(c=>c.u===ui.sel),c=sel&&CARDS[sel.id];
 if(c&&my){if(c.tg==='e'&&u&&u.side==='e')return tryPlay(sel.u,cb.en.indexOf(u));if(c.tg==='a'&&u&&u.side==='p')return tryPlay(sel.u,u.id);if(c.tg==='e'){ui.mode='target';return}}
 if(u&&u.side==='p'&&u!==p&&!u.down&&Party.mine(u)){ui.pid=u.id;ui.sel=null;ui.mode=null;sfx('sel');return}
 if(u===p&&my&&!p.moved&&!c){ui.mode='move';sfx('sel');return}
 if(!c)ui.mode='look'}
function targets(p,inst){const ci=cardRg(p,inst);return aliveEs().filter(e=>inRange(p,e,ci))}
// LB/RB：対象の切り替え、または操作キャラの切り替え
function cycle(d){const p=me(),sel=p.hand.find(c=>c.u===ui.sel);
 if(ui.mode==='target'&&sel){let ts=targets(p,sel);if(!ts.length)ts=aliveEs();if(!ts.length)return;ts.sort((a,b)=>a.x-b.x||a.y-b.y);let i=ts.findIndex(e=>e.x===ui.cur.x&&e.y===ui.cur.y);i=(i+d+ts.length)%ts.length;ui.cur={x:ts[i].x,y:ts[i].y}}
 else{const ps=G.players.filter(q=>Party.mine(q)&&!q.out&&!q.down);if(ps.length<2)return;const i=(ps.indexOf(p)+d+ps.length)%ps.length;ui.pid=ps[i].id;ui.sel=null;ui.mode=null}}
/* ================= 描画 ================= */
function btn(a,label,o){o=o||{};return `<button class="btn f ${o.c||''}" data-a="${a}"${o.st?` style="${o.st}"`:''}${o.i!=null?` data-i="${esc(o.i)}"`:''}${o.y?' data-y="1"':''}${o.b?' data-b="1"':''}>${label}</button>`}
function cardH(p,inst,o){o=o||{};const c=CARDS[inst.id],us=!p||usable(p,inst);return `<div class="card f t-${c.ty} ${us?'':'unus'} ${inst.up?'up':''} ${o.c||''}" ${o.a?`data-a="${o.a}" data-i="${o.i}"`:''} ${o.k?`data-k="${o.k}"`:''}><div class="cc">${costOf(inst)}</div><div class="cn">${c.n}${inst.up?'+':''}</div><div class="ci">${TYI[c.ty]}</div><div class="cd">${cardDesc(p,inst)}</div>${c.req?`<div class="cr">${REQN[c.req]}</div>`:''}</div>`}
function countNames(ids){const c={};ids.forEach(i=>c[i]=(c[i]||0)+1);return Object.keys(c).map(i=>CARDS[i].n+(c[i]>1?'×'+c[i]:'')).join('、')}
function wInfo(e){const w=WPN[e.tags[0]];return `${e.ranged?'遠距離':'近接'}・射程${w.rg}・体勢ダメージ×${w.pm}${e.atk?'・武器威力+'+e.atk:''}<br>行動：${countNames(e.cards)}`}
function chipH(p){const m=maxHp(p),cmb=G.phase==='combat',mk=cmb?(p.out?'🏠':p.down?'💀':p.ended?'✅':''):p.done&&G.phase==='reward'?'✅':'';
 return `<div class="chip f ${p===me()?'me':''} ${p.down||p.out?'down':''}" data-a="chip" data-i="${p.id}"><span class="pe">${CH[p.ch].em}</span><div class="pi"><div class="pn">${esc(p.name)} ${mk}</div><div class="bar"><i style="width:${p.hp/m*100}%"></i><b>${p.hp}/${m}</b></div>${cmb?`<div class="bar ps"><i style="width:${p.broken?0:p.ps/p.mps*100}%"></i></div>`:''}</div></div>`}
const partyH=()=>`<div class="party">${G.players.map(chipH).join('')}</div>`;
function render(){const app=$('#app'),sc={};$$('[data-sc]').forEach(e=>sc[e.dataset.sc]=[e.scrollLeft,e.scrollTop]);let h='';
 if(scr!=='game'||!G)h=vTitle();
 else if(G.phase==='prep')h=vPrep();
 else{const cb=G.cb;h=`<div class="top"><b>${ERAS[0].n}</b>${cb?`<span>${FIELDS[cb.field].n+(cb.lv?'・危険度'+cb.lv:'')}・ターン${cb.turn}</span>`:G.phase==='field'?`<span id="reg">${regLabel()}</span><span>❤️${me().hp}/${maxHp(me())}</span>`:''}<span class="sp"></span>${btn('ovDeck','🃏',{c:'sm'})}${btn('ovMenu','☰',{c:'sm'})}</div><div class="main">`+({field:vField,combat:vCombat,reward:vReward,over:vOver,home:vHome}[G.phase]||(()=>''))()+'</div>'}
 if(ui.banner){h+=`<div class="banner">${ui.banner}</div>`;ui.banner=''}
 app.innerHTML=h;const ov=$('#ov'),oh=vOverlay();ov.innerHTML=oh;ov.className=oh?'show':'';
 $$('[data-sc]').forEach(e=>{const s=sc[e.dataset.sc];if(s){e.scrollLeft=s[0];e.scrollTop=s[1]}});
 $$('.f').forEach(e=>{if(!e.dataset.k)e.dataset.k=(e.dataset.a||'x')+':'+(e.dataset.i||'')});
 document.body.classList.toggle('grid',gridOn());BV.attach();FV.attach();if(typeof TV!=='undefined')TV.attach();FV.full();restoreFocus();music()}
function vTitle(){return `<div class="title"><div class="ver">v${VERSION} ${btn('reload','更新',{c:'sm'})}</div>
 <div class="icons">🪨🔱🏹🛖🔬✨</div><div class="logo">イセログ</div><div class="sub">〜異世界文明開拓〜<br>v${VERSION}：オンライン協力の試作版（先史時代。拠点の共有・仲間と合流して一緒に戦う）</div>
 <div class="menu"><input class="nm" id="nm" maxlength="10" value="${esc(META.name)}" placeholder="なまえ">
 ${Cloud.on()?`<input class="nm" id="wc" maxlength="6" value="${esc(META.code||'')}" placeholder="世界コード（6けた）" autocapitalize="characters">${btn('wJoin','☁️ この世界に入る',{c:'pri'})}${btn('wNew','☁️ 新しい世界を作る')}${btn('play','ソロで遊ぶ（この端末だけ）')}`:btn('play','冒険をはじめる',{c:'pri'})}${btn('ovHelp','遊び方')}${btn('ovXfer','🔑 引き継ぎ・セーブの書き出し')}
 <div class="row">${btn('tBgm','♪ BGM '+(META.bgm?'ON':'OFF'),{c:'sm'})}${btn('tSe','🔊 効果音 '+(META.se?'ON':'OFF'),{c:'sm'})}</div></div></div>`}
/* ---------- フィールド ---------- */
// 開拓地のボタン（近くにあれば「⛺ 開拓地」、なければ「🚩 開拓」。研究前と合流中の仲間には出さない）
function campLbl(){const fd=G.fd,i=outNear(fd.x,fd.y,CFG.outNearR);return i>=0?'⛺ 開拓地'+(i+1):Math.hypot(fd.x-.5,fd.y-.5)<=CFG.outNearR+1?'🛖 移動':'🚩 開拓'}
function campBtn(){if(Party.fol||!hasTech('t_camp'))return '';return btn('ovCamp',campLbl(),{c:'sm'})}
function vField(){const n=fieldNear();return `<div class="cb"><canvas id="fv"></canvas><div class="cbt">${G.players.length>1?partyH():''}</div><div class="cbs"></div><div class="fctl">${btn('fAct',n?'✋ '+MAT[n.m].n+'を採集':'✋ 採集',{c:'pri '+(n?'':'dis')})}${Party.fol?btn('pLeave','👋 離れる',{c:'sm'}):Net.role&&!Party.fs.length?btn('fJoin','🤝 合流',{c:'sm dis'}):''}${campBtn()}${btn('ovMap','🗺 地図',{c:'sm',y:1})}${btn('ovBag','🎒 荷物 '+bagCount(),{c:'sm'})}</div></div>`}
/* ---------- 戦闘 ---------- */
function unitInfo(u,p){if(u.side==='p')return `<b>${CH[u.ch].em}${esc(u.name)}</b>　HP${u.hp}/${maxHp(u)}・体勢${u.broken?'崩し':u.ps+'/'+u.mps}・向き${DIRN[u.f]}${u.down?'　💀戦闘不能（あと'+Math.max(0,CFG.rescueTurns-u.downT+1)+'ターンで強制帰還）':''}`;
 const d=EN[u.id],it=intentText(u,p),m=u.it&&d.moves[u.it.m];return `<b>${u.em}${u.n}</b>（${AIN[d.ai]}・移動${d.mv}・射程${d.rg}）　HP${u.hp}/${u.mhp}・体勢${u.broken?'崩し':u.ps+'/'+u.mps}・向き${DIRN[u.f]}<br>次の行動：${it?(m&&!u.broken?m[1]+' ':'')+it[0]:'—'}　<span style="color:#ffb060">■</span>攻撃が届く範囲`}
function detailH(p,my){const cb=G.cb,sel=p.hand.find(c=>c.u===ui.sel),cu=ui.mode?unitAt(ui.cur.x,ui.cur.y):null,t=ui.mode?TER[cb.map[ui.cur.y][ui.cur.x]]:null;
 if(sel){const c=CARDS[sel.id],us=usable(p,sel);return `<div class="dt"><b>${c.n}${sel.up?'+':''}</b>（${TYN[c.ty]}・⚡${costOf(sel)}）<br>${cardDesc(p,sel)}${c.tg==='e'?'<br><span class="small">'+(cu&&cu.side==='e'?unitInfo(cu,p).split('<br>')[0]+'・'+RELN[faceRel(p.x,p.y,cu,p)]+'から攻撃':'赤いマスの敵を選んでください')+'</span>':''}${us?'':'<br><span style="color:#ff8060">対応する武器がないため使えません</span>'}</div>${my&&us?btn('use','使う',{c:'pri'}):''}`}
 if(ui.mode==='move')return '<div class="dt">移動先を選んでください（<span style="color:#70b0ff">■</span>移動できる　<span style="color:#ffb060">■</span>敵の攻撃が届く）。移動は1ターンに1回です。</div>';
 if(ui.mode==='face')return '<div class="dt">向きを選んでください（となりのマスをタップ／方向キー）。背後や側面から攻撃されると大きなダメージを受けます。</div>';
 if(ui.mode==='look')return `<div class="dt">${cu?unitInfo(cu,p)+'<br>':''}<span class="small">地形：${t.n}（${t.d}）</span></div>`;
 if(p.down)return '<div class="dt">戦闘不能です。となりのマスの仲間に救助してもらいましょう…</div>';if(cb.ph==='e')return '<div class="dt">敵の行動中…</div>';if(p.ended)return '<div class="dt wait">待機中…</div>';
 return `<div class="dt small">${p.resc!=null?'🆘救助中（次のターン開始まで攻撃を受けなければ成功）<br>':''}カードをタップで選択 → 敵をタップで使用。自分のキャラか「移動」で移動。マスをタップで地形や敵を調べられます。</div>`}
function vCombat(){const cb=G.cb,p=me();if(!p)return '';const my=cb.ph==='p'&&!p.ended&&!p.down,dn=my&&G.players.find(q=>q.down&&!q.out&&dist(p,q)===1);
 return `<div class="cb"><canvas id="cv"></canvas><div class="cbt">${G.players.length>1?partyH():''}</div><div class="cbs"></div><div class="cbb"><div class="logl">${G.log.slice(-2).map(esc).join('<br>')}</div><div class="detail">${detailH(p,my)}</div>
 <div class="hand" id="hand" data-sc="hand">${p.hand.map(c=>cardH(p,c,{a:'card',i:c.u,c:(ui.sel===c.u?'sel ':'')+(costOf(c)>p.en?'noen':'')})).join('')||`<div class="small">${p.down?'':'手札なし'}</div>`}</div>
 <div class="ctl"><div class="orb">⚡${p.en}</div><div class="small st2">HP${p.hp}/${maxHp(p)}<br>体勢${p.broken?'崩し':p.ps+'/'+p.mps}</div><div class="small">山${p.draw.length}<br>捨${p.disc.length}</div><span style="flex:1"></span>
 ${cb.skip&&cb.turn===1&&cb.ph==='p'?btn('skip','⏩スキップ',{c:'sm on'}):''}${btn('spd','⏱×'+spd(),{c:'sm '+(spd()>1?'on':'')})}${btn('auto','🤖オート',{c:'sm '+(META.auto?'on':'')})}${btn('move','👟移動',{c:'sm '+(ui.mode==='move'?'on ':'')+(my&&!p.moved?'':'dis')})}${btn('face','🧭向き',{c:'sm '+(ui.mode==='face'?'on ':'')+(my?'':'dis')})}${btn('look','🔍',{c:'sm '+(ui.mode==='look'?'on':'')})}${dn&&p.resc==null?btn('rescue','🆘救助⚡'+CFG.rescueCost,{c:'sm on'}):''}${btn('end',p.ended?'終了済み':'ターン終了',{c:'pri sm '+(my?'':'dis'),y:1})}</div></div></div>`}
/* ---------- 報酬・結果 ---------- */
function vReward(){const p=me(),r=p.rw[0];let h;
 if(!r)h='<div class="wait">次の戦闘へ…</div>';
 else if(r.k==='card')h=`<div class="box col"><div class="hd">カード報酬（1枚選ぶ）${G.players.length>1?'：'+esc(p.name):''}</div><div class="grid">${r.o.map((id,i)=>cardH(p,{id,up:0},{a:'rwSel',i,c:ui.pick===i?'sel':''})).join('')}</div><div class="row">${btn('rwTake','このカードを取る',{c:'pri '+(ui.pick==null?'dis':''),y:1})}${btn('rwSkip','見送る')}</div></div>`;
 else h=`<div class="box col"><div class="hd">${r.src}（武器を持ち替える）${G.players.length>1?'：'+esc(p.name):''}</div><div class="grid">${r.o.map((id,i)=>`<div class="eq f ${ui.pick===i?'sel':''}" data-a="rwSel" data-i="${i}"><div><span class="em">${EQ[id].em}</span><div class="en">${EQ[id].n}</div></div><div class="ed">${wInfo(EQ[id])}</div></div>`).join('')}</div><div class="small">今の武器：${EQ[p.w].em}${EQ[p.w].n}（持ち替えると武器のカードが入れ替わります）</div><div class="row">${btn('rwTake','これに持ち替える',{c:'pri '+(ui.pick==null?'dis':''),y:1})}${btn('rwSkip','今の武器のまま')}</div></div>`;
 return partyH()+`<div class="pane scroll" data-sc="rw"><div class="small">HPが${Math.round(winHealRate()*100)}%回復した。</div>${h}</div>`}
function vOver(){const fd=G.fd;return `<div class="pane"><div style="font-size:64px">🏠</div><div class="hd">拠点へ強制帰還…</div><div class="box col"><div>失った物（荷物の${CFG.loseBag*100}%）：${matList(fd.lost)}</div><div>持ち帰った物：${matList(fd.home)}</div><div class="small">歩数 ${fd.steps}・勝利 ${fd.wins}回</div></div>${btn('restart','拠点へ',{c:'pri',y:1})}${btn('leave','タイトルへ')}</div>`}
function vHome(){const fd=G.fd;return `<div class="pane"><div style="font-size:64px">🛖</div><div class="hd">拠点に帰還した</div><div class="box col"><div>持ち帰った物：${matList(fd.home)}</div><div class="small">歩数 ${fd.steps}・勝利 ${fd.wins}回</div><div class="small">個人倉庫：${matList(plOf(MY).store)}</div></div><div class="small">冒険中に組んだデッキは元に戻ります。素材は拠点で研究・建築・製作に使えます。</div>${btn('restart','拠点へ',{c:'pri',y:1})}${btn('leave','タイトルへ')}</div>`}
/* ---------- オーバーレイ ---------- */
function dlg(t,b){return `<div class="dlg"><div class="dh">${t}<span class="sp"></span>${btn('ovClose','✕',{c:'sm',b:1})}</div><div class="db scroll" data-sc="ov">${b}</div></div>`}
function vOverlay(){const o=ui.ov,p=me();if(!o)return '';
 if(o.k==='help')return dlg('遊び方',`<div class="help"><b>■ 拠点（町）</b><br>拠点は歩いて回れる町です。建物に近づいて「入る」と、その施設の画面が開きます（🔬研究小屋＝研究、🔨工房＝製作、📦倉庫＝倉庫、🛖住居・🌾畑＝住民、🪧看板＝建築、🚩村の出口＝冒険の準備と出発）。まだ建てていない場所は🚧で、近づくと建築の画面が開きます。「📋一覧」でいつでもタブの画面を開けます。<br>冒険で集めた素材は「個人倉庫」に入ります。武器の製作は個人倉庫の素材、建築と研究は「共有倉庫」の素材を使います（個人倉庫から寄付。寄付した素材は戻せません）。住民は優先度に合わせて自動で働き、時間がたつと研究や建築が進みます（現実1秒＝ゲーム内1分。冒険中も進みます）。研究・建築・製作・装備の変更は拠点でしかできません。<br><b>■ 製作とレアリティ</b><br>武器は作るたびにレアリティ（コモン〜レジェンダリー）が決まり、高いほど武器のカードのダメージとブロックが上がり、追加効果が付きます。<br><b>■ 防具</b><br>研究「編み物」「皮なめし」「牙の加工」で、工房で防具を作れるようになります。防具は1人1つ、「出発」タブで装備します（もう一度押すか「なし」で外す）。最大HPと体勢が増え、種類によっては受けるダメージを1回ごとに減らしたり、移動力が変わったりします。レアリティが高いほどHPと体勢が増え、追加効果も付きます。羽根・貝殻・うろこなど、遠くの地域の素材を使う防具もあります。<br><b>■ 探索</b><br>フィールドを8方向に歩きます（画面をなぞる／方向キー・WASD／スティック）。光っている素材に近づいて「採集」。歩いていると敵に出会い、拠点から遠いほど敵が増えます。⚠️強敵と👑ボスは決まった場所にいます。右上の小さな地図と「地図」で歩いた所を確認できます（地図は🔍で広さを変えられます）。<br><b>■ 広がる世界とバイオーム</b><br>フィールドには端がなく、歩いた先がどんどん作られていきます。草原・森林・砂漠・雪原・沼地・山岳・火山・海岸の地域があり、採れる素材と出る敵がちがいます。拠点から離れるほど「危険度」が上がり、敵が強くなるかわりに戦利品が増えます。⚠️強敵と👑ボスは各地の決まった場所にいます。<br><b>■ 開拓地とファストトラベル</b><br>研究「野営の知識」のあと、拠点から${CFG.outMin}マス以上はなれた所で「🚩 開拓」を押すと、素材を使って開拓地を作れます（荷物から先に使い、足りない分は個人倉庫から）。開拓地は「出発」タブで出発地点に選べます。開拓地の近くで「⛺」を押すと、休んでHPを全回復したり、ほかの開拓地や拠点の前へファストトラベルできます。拠点と開拓地のまわりの敵が出ない範囲は、地面が水色になります。開拓地は世界のみんなで共有します。<br><b>■ 帰還</b><br>メニュー（☰）の「拠点へ帰還する」で、荷物を個人倉庫に持ち帰れます。全員が倒れると強制帰還になり、荷物の${CFG.loseBag*100}%を失います。<br><b>■ オンライン</b><br>同じ世界コードで入ると、拠点（施設・研究・住民・共有倉庫・地図）を仲間と共有できます。最初に入った人がホスト（👑）になり、時間を進めてクラウドに保存します。ホストが抜けると、残っている人が自動でホストを引き継ぎます。冒険はそれぞれ別々に進みますが、フィールドで仲間のコマ（青い輪）に近づいて「🤝合流」を押すと、同じパーティーになって一緒に戦えます（近づかれた側がリーダーで、歩くのはリーダー。戦闘中の仲間には「⚔️加勢」で途中から入れ、次のターンから行動できます）。戦利品と採集は1人ずつ手に入り、リーダーが帰還すると全員が帰還します。「👋離れる」でいつでも1人に戻れます（同時に${CFG.netMax}人まで）。冒険中の仲間はフィールドと地図に🔵で表示され、拠点の「出発」タブやメニューで仲間の様子（拠点・冒険中・戦闘中）が見られます。<br><b>■ 戦闘の流れ</b><br>8×8マスの戦場で戦います。自分のターンに「移動（1回・3歩ぶん）」と「カード（⚡${CFG.energy}・手札${CFG.handSize}枚）」を好きな順で使い、「ターン終了」で敵が動きます。<br><b>■ オートとスキップ</b><br>「🤖オート」を押すと、味方が自動で戦います（もう一度押すと手動に戻る）。弱い敵との戦闘では最初のターンに「⏩スキップ」が出て、少しダメージを受けるかわりにすぐ勝利できます（強敵・ボスは不可）。<br><b>■ 行動予告</b><br>敵の頭上に次の行動が出ます。敵をタップすると、攻撃が届く範囲（オレンジ）が見られます。<br><b>■ 向き</b><br>側面から：HP×${CFG.dirHp.side}・体勢×${CFG.dirPs.side}／背後から：HP×${CFG.dirHp.back}・体勢×${CFG.dirPs.back}。地面の矢印が向きです。移動や攻撃で向きが変わり、「向き」でいつでも変えられます。仲間と敵をはさむと1段階有利になります。<br><b>■ 体勢値（黄色のバー）</b><br>0になると「体勢崩し」：次の行動を1回休み、受けるダメージ×${CFG.brokenDmg}。休んだら全回復します。棍棒は体勢を崩しやすく、弓や投石は崩しにくいです。<br><b>■ 地形</b><br>${Object.values(TER).map(t=>t.n+'：'+t.d).join('<br>')}<br><b>■ 戦闘不能と救助</b><br>HP0で戦闘不能。となりのマスの仲間が「救助」（⚡${CFG.rescueCost}）を選び、次のターン開始まで攻撃を受けなければ復帰します。${CFG.rescueTurns}ターン以内に救助されないか、全員が倒れると拠点へ強制帰還です（1人の時は戦闘不能＝強制帰還）。<br><b>■ 操作</b><br>タッチ・マウス：タップ／クリック<br>キーボード：矢印キーで移動、Enter/Zで決定、Esc/Xで戻る、Eでターン終了、Cでマスを調べる、Q/Wで対象・キャラ切り替え、Mでメニュー<br>コントローラー：十字キー/スティックで移動（戦場では上＝奥）、Aで決定、Bで戻る、Yでターン終了、Xでマスを調べる、LB/RBで対象・キャラ切り替え、STARTでメニュー</div>`);
 if(o.k==='xfer')return dlg('🔑 引き継ぎ',`<div class="help"><b>■ この端末の引き継ぎコード</b><br>別の端末でこのコードを入れると、同じ「なまえ」と「プレイヤー」で遊べます（クラウドの世界の個人倉庫・装備もそのまま使えます）。人に教えないでください。</div>
  <input class="nm" id="xc0" readonly value="${xferCode()}" style="width:100%;font-size:12px">${btn('xCopy','📋 コードをコピー')}
  <div class="help"><b>■ 別の端末から引き継ぐ</b><br>前の端末のコードを入れてください。この端末のプレイヤーは置き換わります（ソロのセーブは別。下の「読み込む」を使ってください）。引き継いだあと、前の端末で同時に遊ぶのはやめてください。</div>
  <input class="nm" id="xc" placeholder="引き継ぎコード" style="width:100%;font-size:12px">${btn('xUse','🔑 このコードで引き継ぐ',{c:'pri'})}
  <div class="help"><b>■ ソロのセーブ</b><br>ソロの世界（この端末だけのセーブ）をファイルに書き出し、別の端末で読み込めます。</div>
  <div class="row">${btn('wExp','📤 書き出す')}${btn('wImp','📥 読み込む')}</div>`);
 if(o.k==='camp'&&G.fd){const fd=G.fd,i=outNear(fd.x,fd.y,CFG.outNearR),atB=i<0&&Math.hypot(fd.x-.5,fd.y-.5)<=CFG.outNearR+1;
  if(i>=0||atB){const ls=[-1].concat(outs().map((_,j)=>j)).filter(j=>j!==i&&!(atB&&j<0));
   return dlg(i>=0?outName(i):'🛖 拠点の前',`${i>=0?`<div class="box col"><div class="hd">💤 休む</div><div class="small">パーティー全員のHPが全回復します。</div><div class="row">${btn('fRest','💤 休む',{c:'pri',y:1})}</div></div>`:''}
   <div class="box col"><div class="hd">🧭 ファストトラベル</div>${ls.length?ls.map(j=>`<div class="row">${btn('fWarp',outName(j),{i:j,y:i<0&&j===ls[0]?1:0})}</div>`).join(''):'<div class="small">移動できる開拓地がまだありません。</div>'}<div class="small">開拓地（と拠点の前）の間を一瞬で移動できます。開拓地のまわり${CFG.outSafe}マスは敵が出ません。</div></div>`)}
  const x=Math.floor(fd.x),y=Math.floor(fd.y),er=outCheck(x,y),C=CFG.outCost,ok=Object.keys(C).every(m=>outHave(m)>=C[m]);
  return dlg('🚩 開拓地を作る',`<div class="small">今いる場所（${bioName(fd.x,fd.y)}・拠点から${fdist(x,y)}マス）に開拓地を作ります。開拓地は「出発」で選べる出発地点になり、休んでHPを回復したり、ほかの開拓地へファストトラベルできます。開拓地は世界のみんなで共有します（${outs().length}/${CFG.outMax}か所）。</div>
   <div class="box col"><div class="hd">必要な素材（荷物→個人倉庫の順に使う）</div>${Object.keys(C).map(m=>`<div class="it"><div class="tx">${MAT[m].em}${MAT[m].n}　${outHave(m)}/${C[m]}</div></div>`).join('')}</div>
   ${er?`<div class="small" style="color:#ff9070">${er}</div>`:''}<div class="row">${btn('fOut','🚩 ここに作る',{c:'pri '+(er||!ok?'dis':''),y:1})}</div>`)}
 if(o.k==='map')return dlg('🗺 地図',`<div class="row">${btn('mapZ','🔍－',{c:'sm',i:1})}<span class="small">半径${MAPZ[FV.mapZ||1]}マス・拠点から${Math.round(fdist(G.fd.x,G.fd.y))}マス</span>${btn('mapZ','🔍＋',{c:'sm',i:-1})}</div><canvas id="mapcv"></canvas><div class="small">🟡自分　🔵仲間　⚪拠点　🟠開拓地　水色の四角＝敵が出ない範囲　🔴強敵　🟣ボス　白い点＝採集ポイント<br>歩いた所のまわりが地図に書き込まれます。</div>`);
 if(o.k==='bag')return dlg('🎒 荷物',`<div>${matList(G.fd&&G.fd.bag)}</div><div class="small">個人倉庫：${matList(plOf(MY).store)}<br>荷物は拠点へ帰還すると個人倉庫に入ります。</div>`);
 if(o.k==='menu')return dlg('メニュー',`<div class="menu">${G.phase==='field'?btn('ret',Party.fol?'🏠 パーティーを離れて帰還する':Party.fs.length?'🏠 パーティーで拠点へ帰還する':'🏠 拠点へ帰還する',{c:'pri'}):''}${G.phase==='field'&&Party.fol?btn('pLeave','👋 パーティーを離れる'):''}${G.phase==='field'&&Party.fs.length?btn('pBreak','👋 パーティーを解散する'):''}${btn('tBgm','♪ BGM '+(META.bgm?'ON':'OFF'))}${btn('tSe','🔊 効果音 '+(META.se?'ON':'OFF'))}${btn('ovHelp','遊び方')}${btn('ovXfer','🔑 引き継ぎコード')}${btn('reload','更新（再読み込み）')}${btn('leave','タイトルへ戻る')}</div><div class="small">v${VERSION}${netInfoH()}</div>`);
 if(o.k==='deck'&&p){const d=p.deck.slice().sort((a,b)=>(a.src?0:1)-(b.src?0:1)||a.id.localeCompare(b.id));return dlg('🃏 デッキ（'+p.deck.length+'枚）：'+esc(p.name),`<div class="small">${EQ[p.w].em}${EQ[p.w].n}：${wInfo(EQ[p.w])}</div><div class="grid">${d.map(c=>cardH(p,c,{k:'dk'+c.u})).join('')}</div>`)}
 return ''}
/* ================= 操作 ================= */
const ACT={
 reload(){location.reload()},ovXfer(){ui.ov={k:'xfer'}},
 xCopy(){const c=xferCode();(navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).then(()=>toast('📋 コピーしました'),()=>{const e=$('#xc0');if(e){e.select();toast('コードを長押ししてコピーしてください')}})},
 xUse(){const e=$('#xc'),d=xferRead(e?e.value:'');if(!d)return toast('引き継ぎコードが正しくありません');if(d.p===META.pid)return toast('この端末と同じコードです');
  if(!confirm('「'+d.n+'」として引き継ぎますか？\nこの端末の今のプレイヤー（'+META.name+'）は使えなくなります。'))return;
  if(G)ACT.leave();META.pid=d.p;META.name=d.n;if(d.c)META.code=d.c;saveMeta();toast('🔑 引き継ぎました。読み込み直します…');setTimeout(()=>location.reload(),800)},
 wExp(){const w=LS.get('iserogu_world',null);if(!w)return toast('ソロのセーブがありません');const b=new Blob([JSON.stringify({app:'iserogu',v:VERSION,at:Date.now(),world:w})],{type:'application/json'}),a=document.createElement('a'),d=new Date();
  a.href=URL.createObjectURL(b);a.download='iserogu_solo_'+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast('📤 書き出しました')},
 wImp(){const f=document.createElement('input');f.type='file';f.accept='.json,application/json';f.onchange=()=>{const fl=f.files[0];if(!fl)return;const r=new FileReader();
  r.onload=()=>{let d;try{d=JSON.parse(r.result)}catch(e){}if(!d||d.app!=='iserogu'||!d.world||typeof d.world!=='object')return toast('イセログのセーブではありません');
   const pl=d.world.pl,ks=pl?Object.keys(pl):[];if(pl&&!pl[META.pid]&&ks.length===1){pl[META.pid]=pl[ks[0]];delete pl[ks[0]]}   // 別の端末のセーブ：個人倉庫・装備をこの端末のプレイヤーに付け替える
   if(LS.get('iserogu_world',null)&&!confirm('この端末のソロのセーブを、読み込んだセーブで上書きしますか？'))return;LS.set('iserogu_world',d.world);toast('📥 ソロのセーブを読み込みました');render()};r.readAsText(fl)};f.click()},play(){Cloud.code=null;enterWorld(LS.get('iserogu_world',null))},
 wNew(){cloudEnter(Cloud.newCode(),true)},wJoin(){const e=$('#wc'),c=Cloud.norm(e?e.value:META.code);if(c.length!==6)return toast('世界コード（英数字6けた）を入れてください');cloudEnter(c,false)},
 leave(){Party.quit();Cloud.flush();Net.leave();mateW={};Cloud.code=null;G=null;scr='title';ui.ov=null;ui.mode=null;ui.sel=null},
 tBgm(){META.bgm=META.bgm?0:1;saveMeta()},tSe(){META.se=META.se?0:1;saveMeta()},
 ovHelp(){ui.ov={k:'help'}},ovMenu(){ui.ov={k:'menu'}},ovDeck(){ui.ov={k:'deck'}},ovMap(){ui.ov={k:'map'}},ovBag(){ui.ov={k:'bag'}},ovCamp(){ui.ov={k:'camp'}},fOut(){if(!sendAct({t:'outpost'})){ui.ov=null;toast('🚩 開拓地を作りました');sfx('buff')}},fRest(){if(!sendAct({t:'rest'})){toast('💤 HPが全回復しました');sfx('buff')}},fWarp(i){if(!sendAct({t:'warp',i:+i})){ui.ov=null;FV.reset();toast('🧭 '+outName(+i)+' へ移動しました')}},fAct(){sendAct({t:'gather'})},ret(){ui.ov=null;if(Party.fol)Party.leave();sendAct({t:'return'})},
 pLeave(){ui.ov=null;Party.leave('👋 パーティーを離れました')},pBreak(){ui.ov=null;Party.disband('リーダーが解散しました');toast('👋 パーティーを解散しました')},
 fJoin(){const m=joinTarget();if(!m)return toast('仲間のコマに近づくと合流できます');Party.req(m.s.pt||m.pid,m.s.pt?(Net.members().find(x=>x.pid===m.s.pt)||m).name:m.name)},ovClose(){ui.ov=null},mapZ(i){FV.mapZ=Math.max(0,Math.min(MAPZ.length-1,(FV.mapZ||1)+ +i))},
 addp(){const q=addPlayer(MY+'_2','仲間');if(q)ui.pid=q.id},rmp(){removePlayer(MY+'_2');ui.pid=MY},
 char(i){sendAct({t:'char',c:i})},start(i){sendAct({t:'start',sp:i==null?-1:+i})},restart(){sendAct({t:'restart'});ui.pid=MY;ui.panel=0;TV.x=TOWN.sx;TV.y=TOWN.sy},
 chip(i){const q=byId(i);if(!q)return;if(G.phase==='combat'&&(q.down||q.out||!Party.mine(q))){ui.cur={x:q.x,y:q.y};ui.mode='look';return}if(!Party.mine(q))return;ui.pid=i;ui.sel=null;ui.mode=null;ui.pick=null},
 card(i){i=+i;const p=me(),c=p.hand.find(x=>x.u===i);if(!c)return;if(ui.sel===i)return ACT.use();ui.sel=i;sfx('sel');
  if(CARDS[c.id].tg==='e'){ui.mode='target';const ts=targets(p,c),es=ts.length?ts:aliveEs();if(es.length&&!es.some(e=>e.x===ui.cur.x&&e.y===ui.cur.y)){const e=es.slice().sort((a,b)=>dist(p,a)-dist(p,b))[0];ui.cur={x:e.x,y:e.y}}}else ui.mode=null},
 use(){const p=me(),c=p.hand.find(x=>x.u===ui.sel);if(!c)return;const tg=CARDS[c.id].tg;
  if(tg==='e'){const u=unitAt(ui.cur.x,ui.cur.y);if(!u||u.side!=='e')return toast('対象の敵を選んでください');tryPlay(c.u,G.cb.en.indexOf(u))}
  else if(tg==='a'){const u=ui.mode?unitAt(ui.cur.x,ui.cur.y):null;tryPlay(c.u,u&&u.side==='p'?u.id:p.id)}else tryPlay(c.u,null)},
 move(){const p=me();ui.sel=null;if(ui.mode==='move'){ui.mode=null;return}ui.mode='move';ui.cur={x:p.x,y:p.y}},
 face(){const p=me();ui.sel=null;if(ui.mode==='face'){ui.mode=null;return}ui.mode='face';ui.cur={x:p.x,y:p.y}},
 look(){const p=me();ui.sel=null;if(ui.mode==='look'){ui.mode=null;return}ui.mode='look';if(!unitAt(ui.cur.x,ui.cur.y))ui.cur={x:p.x,y:p.y}},
 rescue(){const p=me(),t=G.players.find(q=>q.down&&!q.out&&dist(p,q)===1);if(t)sendAct({t:'rescue',p:t.id})},
 spd(){META.spd=spd()===1?2:spd()===2?4:1;saveMeta()},auto(){META.auto=META.auto?0:1;saveMeta();ui.mode=null;ui.sel=null},skip(){sendAct({t:'skip'})},
 end(){const p=me();ui.mode=null;ui.sel=null;if(p&&!p.ended)sendAct({t:'end'})},
 rwSel(i){ui.pick=+i;sfx('sel')},rwSkip(){sendAct({t:'pick',i:-1});ui.pick=null},rwTake(){if(ui.pick==null)return;sendAct({t:'pick',i:ui.pick});ui.pick=null},
};
function enterWorld(w){saveName();ui.panel=0;TV.x=TOWN.sx;TV.y=TOWN.sy;newGame(w);addPlayer(MY,META.name);ui.pid=MY;ui.lastEv=0;ui.tab='go';scr='game'}
// クラウドの世界に入る。make＝新しく作る（この端末のソロのセーブがあれば、それを持っていく）
async function cloudEnter(code,make){if(Cloud.busy)return;Cloud.busy=true;toast('☁️ 通信中…（数秒かかります）');saveName();
 try{let w=make?LS.get('iserogu_world',null):await Cloud.load(code);if(!make&&!w){Cloud.busy=false;return toast('世界「'+code+'」は見つかりませんでした')}
  const r=await Net.enter(code);if(r.role==='guest')w=r.world;   // ホストがいれば、その人の世界をもらう。いなければ自分がホストになり、セーブから始める
  Cloud.code=code;enterWorld(w);if(make)await Cloud.save(code,G.world);
  META.code=code;saveMeta();LS.set(wkey(),G.world);Cloud.dirty=false;Cloud.err='';toast(make?'☁️ 新しい世界を作りました。世界コード：'+code:r.role==='host'?'☁️ 世界「'+code+'」に入りました（あなたがホスト）':'🔗 世界「'+code+'」に入りました（ホスト：'+((Net.ms.find(x=>x.h)||{}).name||'？')+'）')}
 catch(e){Net.leave();Cloud.code=null;G=null;scr='title';toast('☁️ '+e.message)}Cloud.busy=false;render()}
// 引き継ぎコード：ISR- のあとに {p:プレイヤーID, n:なまえ, c:世界コード} をbase64にしたもの
function xferCode(){return 'ISR-'+btoa(unescape(encodeURIComponent(JSON.stringify({p:META.pid,n:META.name,c:META.code||''})))).replace(/=+$/,'')}
function xferRead(s){s=String(s||'').trim().replace(/\s/g,'');if(!/^ISR-/i.test(s))return null;try{const d=JSON.parse(decodeURIComponent(escape(atob(s.slice(4)))));return d&&typeof d.p==='string'&&/^u[a-z0-9]{4,}$/.test(d.p)?{p:d.p,n:String(d.n||'旅人').slice(0,10),c:typeof d.c==='string'?d.c:''}:null}catch(e){return null}}
function saveName(){const e=$('#nm');if(e){META.name=(e.value.trim()||META.name).slice(0,10);saveMeta()}}
function doClick(el){const a=el.closest('[data-a]');if(!a)return;auInit();if(a.classList.contains('dis'))return sfx('no');const f=ACT[a.dataset.a];if(!f)return;if(a.classList.contains('f')){ui.fk=a.dataset.k;ui.fr=a.getBoundingClientRect()}if(!/^(card|rwSel|chip)$/.test(a.dataset.a))sfx('click');f(a.dataset.i,a);render()}
document.addEventListener('click',e=>{if(e.target.id==='nm'||e.target.id==='wc'||e.target.id==='xc'||e.target.id==='xc0'||e.target.id==='cv'||e.target.id==='fv')return;doClick(e.target)});
document.addEventListener('pointerdown',e=>{if(e.pointerType)setMode(false);auInit()});
document.addEventListener('change',e=>{if(e.target.id==='nm')saveName()});
// オートバトル：味方のターンの間、順番に1つずつ行動させる
(function autoLoop(){setTimeout(autoLoop,CFG.autoStep/spd());if(!G||scr!=='game'||G.phase!=='combat'||!META.auto||ui.ov||G.cb.ph!=='p')return;
 if(Party.fol){const q=byId(MY);if(!q||q.ended||q.down||q.out||Party.wait)return;ui.pid=MY;const a=autoAct(q)||{t:'end'};a.au=1;Party.act(a);return}
 const q=G.players.find(x=>!x.net&&!x.ended&&!x.down&&!x.out);if(!q)return;ui.pid=q.id;const a=autoAct(q);if(!a||act(q.id,a))act(q.id,{t:'end'})})();
// 時間：世界を開いている間、1秒ごとに進める（ゲーム内1時間ごとに住民の仕事を計算）。オンラインではホストだけが進める
setInterval(()=>{if(!G||scr!=='game'||Net.role==='guest')return;if(baseTick(1)){if(G.phase==='prep'&&!ui.ov)onState();else saveLocal()}},1000);
// クラウドへの自動保存：60秒ごと＋画面を閉じる時
setInterval(()=>Cloud.flush(),60000);
window.addEventListener('pagehide',()=>{Cloud.bye();Net.bye()});document.addEventListener('visibilitychange',()=>{if(document.hidden)Cloud.flush();else Net.wake()});
window.addEventListener('resize',()=>{if(scr==='game')render()});
render();
