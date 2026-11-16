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
const ui={pid:MY,sel:null,mode:null,cur:{x:1,y:3},tab:'go',ov:null,pick:null,lastEv:0,banner:'',fk:null,fr:null,ph:''};
const me=()=>G&&(byId(ui.pid)||G.players[0]);
function toast(m){const d=document.createElement('div');d.className='ts';d.textContent=m;$('#toast').appendChild(d);setTimeout(()=>d.remove(),3300)}
function sendAct(a,pid){auInit();const er=act(pid||me().id,a);if(er)toast(er);return er}
const spd=()=>[1,2,4].includes(META.spd)?META.spd:1;
HOOK.sched=(f,ms)=>setTimeout(f,ms/spd()); // 戦闘の速さ（×1・×2・×4）
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
  else if(e.k==='gather'){toast(MAT[e.m].em+MAT[e.m].n+' ×'+e.n+' を手に入れた');sfx('heal')}
  else if(e.k==='drop')toast('戦利品：'+matList(e.o));else if(e.k==='ret')sfx('win');
  else if(e.k==='turn'){if(G.cb){ui.banner=G.cb.turn===1?(G.cb.kind==='b'?'ボス戦！':'戦闘開始！'):'ターン '+G.cb.turn;sfx('turn')}}
  else if(e.k==='win'){ui.banner='勝利！';sfx('win')}else if(e.k==='lose')sfx('lose');
  else if(e.k==='tech'){toast('🔬 研究完了：'+TECH[e.id].n);sfx('win')}else if(e.k==='built'){toast('🏗️ '+FAC[e.id].n+' がLv'+e.lv+'になった');sfx('win')}else if(e.k==='pop')toast('👥 住民が増えた（'+e.n+'人）');
  else if(e.k==='craft'){toast('🔨 【'+RAR[e.r].n+'】'+EQ[e.id].n+' を製作した！');sfx(e.r>=2?'win':'buff')}else if(e.k==='donate')sfx('buff');
  else if(e.k==='die')sfx('die');else if(e.k==='down'||e.k==='out')sfx('down');else if(e.k==='card')sfx('card');else if(e.k==='blk')sfx('block');else if(e.k==='buff')sfx('buff');else if(e.k==='deb')sfx('deb')}
 if(ui.ph!==G.phase){ui.ph=G.phase;ui.pick=null;ui.mode=null;ui.sel=null}
 saveLocal();if(cn)setTimeout(()=>Cloud.flush(),1500);let p=me();
 if(G.phase==='combat'){if(G.cb.ph==='p'&&(p.ended||p.down)){const q=G.players.find(x=>!x.ended&&!x.down&&!x.out);if(q){ui.pid=q.id;ui.sel=null;ui.mode=null;p=q}}
  if(!p.hand.some(c=>c.u===ui.sel))ui.sel=null;if(G.cb.ph!=='p'||p.ended){if(ui.mode!=='look')ui.mode=null}if(ui.mode==='move'&&p.moved)ui.mode=null;if(ui.mode==='target'&&!ui.sel)ui.mode=null}
 else if(G.phase==='reward'&&p.done){const q=G.players.find(x=>!x.done);if(q)ui.pid=q.id}
 render()}
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
 if(u&&u.side==='p'&&u!==p&&!u.down){ui.pid=u.id;ui.sel=null;ui.mode=null;sfx('sel');return}
 if(u===p&&my&&!p.moved&&!c){ui.mode='move';sfx('sel');return}
 if(!c)ui.mode='look'}
function targets(p,inst){const ci=cardRg(p,inst);return aliveEs().filter(e=>inRange(p,e,ci))}
// LB/RB：対象の切り替え、または操作キャラの切り替え
function cycle(d){const p=me(),sel=p.hand.find(c=>c.u===ui.sel);
 if(ui.mode==='target'&&sel){let ts=targets(p,sel);if(!ts.length)ts=aliveEs();if(!ts.length)return;ts.sort((a,b)=>a.x-b.x||a.y-b.y);let i=ts.findIndex(e=>e.x===ui.cur.x&&e.y===ui.cur.y);i=(i+d+ts.length)%ts.length;ui.cur={x:ts[i].x,y:ts[i].y}}
 else{const ps=G.players.filter(q=>!q.out&&!q.down);if(ps.length<2)return;const i=(ps.indexOf(p)+d+ps.length)%ps.length;ui.pid=ps[i].id;ui.sel=null;ui.mode=null}}
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
 else{const cb=G.cb;h=`<div class="top"><b>${ERAS[0].n}</b>${cb?`<span>${FIELDS[cb.field].n}・ターン${cb.turn}</span>`:G.phase==='field'?`<span id="reg">${FIELDS[WORLD.reg[Math.floor(G.fd.y)][Math.floor(G.fd.x)]?'forest':'grass'].n}</span><span>❤️${me().hp}/${maxHp(me())}</span>`:''}<span class="sp"></span>${btn('ovDeck','🃏',{c:'sm'})}${btn('ovMenu','☰',{c:'sm'})}</div><div class="main">`+({field:vField,combat:vCombat,reward:vReward,over:vOver,home:vHome}[G.phase]||(()=>''))()+'</div>'}
 if(ui.banner){h+=`<div class="banner">${ui.banner}</div>`;ui.banner=''}
 app.innerHTML=h;const ov=$('#ov'),oh=vOverlay();ov.innerHTML=oh;ov.className=oh?'show':'';
 $$('[data-sc]').forEach(e=>{const s=sc[e.dataset.sc];if(s){e.scrollLeft=s[0];e.scrollTop=s[1]}});
 $$('.f').forEach(e=>{if(!e.dataset.k)e.dataset.k=(e.dataset.a||'x')+':'+(e.dataset.i||'')});
 document.body.classList.toggle('grid',gridOn());BV.attach();FV.attach();FV.full();restoreFocus();music()}
function vTitle(){return `<div class="title"><div class="ver">v${VERSION} ${btn('reload','更新',{c:'sm'})}</div>
 <div class="icons">🪨🔱🏹🛖🔬✨</div><div class="logo">イセログ</div><div class="sub">〜異世界文明開拓〜<br>v${VERSION}：拠点の試作版（ソロ・先史時代。探索 → 持ち帰る → 研究・建築・製作）</div>
 <div class="menu"><input class="nm" id="nm" maxlength="10" value="${esc(META.name)}" placeholder="なまえ">
 ${Cloud.on()?`<input class="nm" id="wc" maxlength="6" value="${esc(META.code||'')}" placeholder="世界コード（6けた）" autocapitalize="characters">${btn('wJoin','☁️ この世界に入る',{c:'pri'})}${btn('wNew','☁️ 新しい世界を作る')}${btn('play','ソロで遊ぶ（この端末だけ）')}`:btn('play','冒険をはじめる',{c:'pri'})}${btn('ovHelp','遊び方')}
 <div class="row">${btn('tBgm','♪ BGM '+(META.bgm?'ON':'OFF'),{c:'sm'})}${btn('tSe','🔊 効果音 '+(META.se?'ON':'OFF'),{c:'sm'})}</div></div></div>`}
/* ---------- フィールド ---------- */
function vField(){const n=fieldNear();return `<div class="cb"><canvas id="fv"></canvas><div class="cbt">${G.players.length>1?partyH():''}</div><div class="cbs"></div><div class="fctl">${btn('fAct',n?'✋ '+MAT[n.m].n+'を採集':'✋ 採集',{c:'pri '+(n?'':'dis')})}${btn('ovMap','🗺 地図',{c:'sm',y:1})}${btn('ovBag','🎒 荷物 '+bagCount(),{c:'sm'})}</div></div>`}
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
 if(o.k==='help')return dlg('遊び方',`<div class="help"><b>■ 拠点</b><br>冒険で集めた素材は「個人倉庫」に入ります。武器の製作は個人倉庫の素材、建築と研究は「共有倉庫」の素材を使います（個人倉庫から寄付。寄付した素材は戻せません）。住民は優先度に合わせて自動で働き、時間がたつと研究や建築が進みます（現実1秒＝ゲーム内1分。冒険中も進みます）。研究・建築・製作・装備の変更は拠点でしかできません。<br><b>■ 製作とレアリティ</b><br>武器は作るたびにレアリティ（コモン〜レジェンダリー）が決まり、高いほど武器のカードのダメージとブロックが上がり、追加効果が付きます。<br><b>■ 探索</b><br>フィールドを8方向に歩きます（画面をなぞる／方向キー・WASD／スティック）。光っている素材に近づいて「採集」。歩いていると敵に出会い、拠点から遠いほど敵が増えます。⚠️強敵と👑ボスは決まった場所にいます。右上の小さな地図と「地図」で歩いた所を確認できます。<br><b>■ 帰還</b><br>メニュー（☰）の「拠点へ帰還する」で、荷物を個人倉庫に持ち帰れます。全員が倒れると強制帰還になり、荷物の${CFG.loseBag*100}%を失います。<br><b>■ 戦闘の流れ</b><br>8×8マスの戦場で戦います。自分のターンに「移動（1回・3歩ぶん）」と「カード（⚡${CFG.energy}・手札${CFG.handSize}枚）」を好きな順で使い、「ターン終了」で敵が動きます。<br><b>■ オートとスキップ</b><br>「🤖オート」を押すと、味方が自動で戦います（もう一度押すと手動に戻る）。弱い敵との戦闘では最初のターンに「⏩スキップ」が出て、少しダメージを受けるかわりにすぐ勝利できます（強敵・ボスは不可）。<br><b>■ 行動予告</b><br>敵の頭上に次の行動が出ます。敵をタップすると、攻撃が届く範囲（オレンジ）が見られます。<br><b>■ 向き</b><br>側面から：HP×${CFG.dirHp.side}・体勢×${CFG.dirPs.side}／背後から：HP×${CFG.dirHp.back}・体勢×${CFG.dirPs.back}。地面の矢印が向きです。移動や攻撃で向きが変わり、「向き」でいつでも変えられます。仲間と敵をはさむと1段階有利になります。<br><b>■ 体勢値（黄色のバー）</b><br>0になると「体勢崩し」：次の行動を1回休み、受けるダメージ×${CFG.brokenDmg}。休んだら全回復します。棍棒は体勢を崩しやすく、弓や投石は崩しにくいです。<br><b>■ 地形</b><br>${Object.values(TER).map(t=>t.n+'：'+t.d).join('<br>')}<br><b>■ 戦闘不能と救助</b><br>HP0で戦闘不能。となりのマスの仲間が「救助」（⚡${CFG.rescueCost}）を選び、次のターン開始まで攻撃を受けなければ復帰します。${CFG.rescueTurns}ターン以内に救助されないか、全員が倒れると拠点へ強制帰還です（1人の時は戦闘不能＝強制帰還）。<br><b>■ 操作</b><br>タッチ・マウス：タップ／クリック<br>キーボード：矢印キーで移動、Enter/Zで決定、Esc/Xで戻る、Eでターン終了、Cでマスを調べる、Q/Wで対象・キャラ切り替え、Mでメニュー<br>コントローラー：十字キー/スティックで移動（戦場では上＝奥）、Aで決定、Bで戻る、Yでターン終了、Xでマスを調べる、LB/RBで対象・キャラ切り替え、STARTでメニュー</div>`);
 if(o.k==='map')return dlg('🗺 地図',`<canvas id="mapcv"></canvas><div class="small">🟡自分　⚪拠点　🔴強敵　🟣ボス　白い点＝採集ポイント<br>歩いた所のまわりが地図に書き込まれます。</div>`);
 if(o.k==='bag')return dlg('🎒 荷物',`<div>${matList(G.fd&&G.fd.bag)}</div><div class="small">個人倉庫：${matList(plOf(MY).store)}<br>荷物は拠点へ帰還すると個人倉庫に入ります。</div>`);
 if(o.k==='menu')return dlg('メニュー',`<div class="menu">${G.phase==='field'?btn('ret','🏠 拠点へ帰還する',{c:'pri'}):''}${btn('tBgm','♪ BGM '+(META.bgm?'ON':'OFF'))}${btn('tSe','🔊 効果音 '+(META.se?'ON':'OFF'))}${btn('ovHelp','遊び方')}${btn('reload','更新（再読み込み）')}${btn('leave','タイトルへ戻る')}</div><div class="small">v${VERSION}${Cloud.code?'　☁️ 世界コード：<b>'+Cloud.code+'</b>'+(Cloud.err?'（保存できていません）':Cloud.last?'（保存済み）':''):'　ソロ（この端末だけに保存）'}</div>`);
 if(o.k==='deck'&&p){const d=p.deck.slice().sort((a,b)=>(a.src?0:1)-(b.src?0:1)||a.id.localeCompare(b.id));return dlg('🃏 デッキ（'+p.deck.length+'枚）：'+esc(p.name),`<div class="small">${EQ[p.w].em}${EQ[p.w].n}：${wInfo(EQ[p.w])}</div><div class="grid">${d.map(c=>cardH(p,c,{k:'dk'+c.u})).join('')}</div>`)}
 return ''}
/* ================= 操作 ================= */
const ACT={
 reload(){location.reload()},play(){Cloud.code=null;enterWorld(LS.get('iserogu_world',null))},
 wNew(){cloudEnter(Cloud.newCode(),true)},wJoin(){const e=$('#wc'),c=Cloud.norm(e?e.value:META.code);if(c.length!==6)return toast('世界コード（英数字6けた）を入れてください');cloudEnter(c,false)},
 leave(){Cloud.flush();Cloud.code=null;G=null;scr='title';ui.ov=null;ui.mode=null;ui.sel=null},
 tBgm(){META.bgm=META.bgm?0:1;saveMeta()},tSe(){META.se=META.se?0:1;saveMeta()},
 ovHelp(){ui.ov={k:'help'}},ovMenu(){ui.ov={k:'menu'}},ovDeck(){ui.ov={k:'deck'}},ovMap(){ui.ov={k:'map'}},ovBag(){ui.ov={k:'bag'}},fAct(){sendAct({t:'gather'})},ret(){ui.ov=null;sendAct({t:'return'})},ovClose(){ui.ov=null},
 addp(){const q=addPlayer(MY+'_2','仲間');if(q)ui.pid=q.id},rmp(){removePlayer(MY+'_2');ui.pid=MY},
 char(i){sendAct({t:'char',c:i})},start(){sendAct({t:'start'})},restart(){sendAct({t:'restart'});ui.pid=MY},
 chip(i){const q=byId(i);if(!q)return;if(G.phase==='combat'&&(q.down||q.out)){ui.cur={x:q.x,y:q.y};ui.mode='look';return}ui.pid=i;ui.sel=null;ui.mode=null;ui.pick=null},
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
function enterWorld(w){saveName();newGame(w);addPlayer(MY,META.name);ui.pid=MY;ui.lastEv=0;ui.tab='go';scr='game'}
// クラウドの世界に入る。make＝新しく作る（この端末のソロのセーブがあれば、それを持っていく）
async function cloudEnter(code,make){if(Cloud.busy)return;Cloud.busy=true;toast('☁️ 通信中…');
 try{let w=make?null:await Cloud.load(code);if(!make&&!w){Cloud.busy=false;return toast('世界「'+code+'」は見つかりませんでした')}
  if(make){w=LS.get('iserogu_world',null);Cloud.code=code;enterWorld(w);await Cloud.save(code,G.world)}else{Cloud.code=code;enterWorld(w)}
  META.code=code;saveMeta();LS.set(wkey(),G.world);Cloud.dirty=false;Cloud.err='';toast(make?'☁️ 新しい世界を作りました。世界コード：'+code:'☁️ 世界「'+code+'」に入りました')}
 catch(e){Cloud.code=null;G=null;scr='title';toast('☁️ '+e.message)}Cloud.busy=false;render()}
function saveName(){const e=$('#nm');if(e){META.name=(e.value.trim()||META.name).slice(0,10);saveMeta()}}
function doClick(el){const a=el.closest('[data-a]');if(!a)return;auInit();if(a.classList.contains('dis'))return sfx('no');const f=ACT[a.dataset.a];if(!f)return;if(a.classList.contains('f')){ui.fk=a.dataset.k;ui.fr=a.getBoundingClientRect()}if(!/^(card|rwSel|chip)$/.test(a.dataset.a))sfx('click');f(a.dataset.i,a);render()}
document.addEventListener('click',e=>{if(e.target.id==='nm'||e.target.id==='wc'||e.target.id==='cv'||e.target.id==='fv')return;doClick(e.target)});
document.addEventListener('pointerdown',e=>{if(e.pointerType)setMode(false);auInit()});
document.addEventListener('change',e=>{if(e.target.id==='nm')saveName()});
// オートバトル：味方のターンの間、順番に1つずつ行動させる
(function autoLoop(){setTimeout(autoLoop,CFG.autoStep/spd());if(!G||scr!=='game'||G.phase!=='combat'||!META.auto||ui.ov||G.cb.ph!=='p')return;const q=G.players.find(x=>!x.ended&&!x.down&&!x.out);if(!q)return;ui.pid=q.id;const a=autoAct(q);if(!a||act(q.id,a))act(q.id,{t:'end'})})();
// 時間：世界を開いている間、1秒ごとに進める（ゲーム内1時間ごとに住民の仕事を計算）
setInterval(()=>{if(!G||scr!=='game')return;if(baseTick(1)){if(G.phase==='prep'&&!ui.ov)onState();else saveLocal()}},1000);
// クラウドへの自動保存：60秒ごと＋画面を閉じる時
setInterval(()=>Cloud.flush(),60000);
window.addEventListener('pagehide',()=>Cloud.bye());document.addEventListener('visibilitychange',()=>{if(document.hidden)Cloud.flush()});
window.addEventListener('resize',()=>{if(scr==='game')render()});
render();
