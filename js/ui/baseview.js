'use strict';
/* イセログ 拠点の画面（出発・倉庫・建築・研究・製作・住民）。タブで切り替える */
const TABS=[['go','⚔️出発'],['store','📦倉庫'],['build','🏗️建築'],['tech','🔬研究'],['craft','🔨製作'],['people','👥住民']];
function timeH(){const b=G.world.base;return (Math.floor(b.t/1440)+1)+'日目 '+(Math.floor(b.t/60)%24)+'時'}
// 必要な素材（st＝支払う倉庫。足りない物は赤）
function costH(cost,st){return Object.keys(cost).map(m=>`<span class="${(st[m]||0)<cost[m]?'ng':''}">${MAT[m].em}${MAT[m].n} ${st[m]||0}/${cost[m]}</span>`).join('　')}
function gearFxH(g){const fx=Object.keys(g.fx||{}).map(k=>GFXN[k][2]);return `<span style="color:${RAR[g.r].c}">【${RAR[g.r].n}】</span>${g.r?'性能×'+RAR[g.r].m:''}${fx.length?'　'+fx.join('・'):''}`}
function pgH(v,max){return `<div class="pg"><i style="width:${Math.min(100,v/max*100)}%"></i></div>`}
function etaH(left,rate){return rate>0?'あと約'+Math.ceil(left/rate)+'時間（現実'+Math.ceil(left/rate*60/CFG.minPerSec/60)+'分）':'<span class="ng">担当の住民がいません（住民タブで優先度を上げてください）</span>'}
function vPrep(){const b=G.world.base,t=ui.tab||'go';
 return `<div class="top"><b>🛖 拠点</b><span>${timeH()}</span><span>👥${b.pop}</span><span>🍖${Math.floor(b.food)}</span>${Net.role?`<span>${Net.role==='host'?'👑':Net.conn?'🔗':'⏳'}${Net.members().length}人</span>`:''}<span class="sp"></span>${btn('ovHelp','？',{c:'sm'})}${btn('ovMenu','☰',{c:'sm',b:1})}</div>
 <div class="tabs">${TABS.map(x=>btn('tab',x[1],{i:x[0],c:'sm '+(t===x[0]?'on':'')})).join('')}</div>
 <div class="pane scroll" data-sc="base-${t}">${({go:tGo,store:tStore,build:tBuild,tech:tTech,craft:tCraft,people:tPeople}[t]||tGo)()}</div>`}
/* ---------- 出発 ---------- */
function tGo(){const p=me(),ch=CH[p.ch],w=EQ[p.w],pl=plOf(p.id),g=gearOf(p);
 return `${partyH()}<div class="row">${G.players.length<2?btn('addp','＋ 仲間を連れていく（2人を1人で操作）',{c:'sm'}):btn('rmp','－ 仲間を外す',{c:'sm'})}</div>
 <div class="box col"><div class="hd">キャラクター${G.players.length>1?'（'+esc(p.name)+'）':''}</div><div class="chs">${CHARS.map(c=>`<button class="btn f chb ${p.ch===c.id?'on':''}" data-a="char" data-i="${c.id}"><div class="pe">${c.em}</div>${c.n}<div class="small">HP${c.hp}・体勢${c.ps}</div></button>`).join('')}</div><div class="small" style="text-align:center">${ch.d}<br>初期カード：${countNames(ch.extra)}</div></div>
 <div class="box col"><div class="hd">装備する武器</div><div class="chs">${pl.gear.map(x=>`<button class="btn f chb ${p.g===x.u?'on':''} ${gearUsed(p,x.u)?'dim':''}" data-a="equip" data-i="${x.u}"><div class="pe">${EQ[x.id].em}</div>${EQ[x.id].n}<div class="small" style="color:${RAR[x.r].c}">${RAR[x.r].n}</div></button>`).join('')}</div><div class="small" style="text-align:center">${g?gearFxH(g)+'<br>':''}${wInfo(w)}</div></div>
 <div class="row">${btn('start','冒険へ出発',{c:'pri',y:1})}</div>`}
/* ---------- 倉庫 ---------- */
function tStore(){const pl=plOf(MY),sh=G.world.share,ks=Object.keys(MAT).filter(m=>(pl.store[m]||0)>0),b=G.world.base;
 return `<div class="box col"><div class="hd">個人倉庫</div><div class="small">冒険で持ち帰った素材。武器の製作に使います。</div>
 ${ks.length?ks.map(m=>`<div class="it"><div class="tx"><b>${MAT[m].em}${MAT[m].n}</b> ×${pl.store[m]}</div>${btn('donate','寄付 1',{i:m+':1',c:'sm'})}${btn('donate','寄付 5',{i:m+':5',c:'sm'})}${btn('donate','すべて',{i:m+':all',c:'sm'})}</div>`).join(''):'<div class="small">まだ何もありません。冒険で素材を集めましょう。</div>'}</div>
 <div class="box col"><div class="hd">共有倉庫</div><div class="small">建築と研究に使います。<b style="color:#ffb060">寄付した素材は戻せません。</b></div><div>${matList(sh)}</div><div class="small">🍖食料 ${Math.floor(b.food)}　／　住民がためられる上限 ${shareCap()}（共有倉庫のLvで増える）</div></div>`}
/* ---------- 建築 ---------- */
function tBuild(){const b=G.world.base,sh=G.world.share,a=jobAlloc();let h='';
 if(b.bld){const f=FAC[b.bld.id],wk=f.work[facLv(b.bld.id)];h+=`<div class="box col"><div class="hd">建築中：${f.em}${f.n} Lv${facLv(b.bld.id)+1}</div>${pgH(b.bld.w,wk)}<div class="small">建築担当 ${a.build}人　${etaH(wk-b.bld.w,jobRate('build',a.build))}</div></div>`}
 h+=`<div class="box col"><div class="hd">施設</div>${Object.keys(FAC).map(id=>{const f=FAC[id],lv=facLv(id),mx=lv>=f.cost.length,nd=!mx&&f.need[lv]&&!hasTech(f.need[lv]);
  return `<div class="it"><div class="tx"><b>${f.em}${f.n}</b> ${lv?'Lv'+lv:'（まだ無い）'}<br><span class="small">${f.d}</span>${mx?'':`<br><span class="small">${lv?'Lv'+(lv+1)+'へ':'建てる'}：${costH(f.cost[lv],sh)}${nd?`　<span class="ng">研究「${TECH[f.need[lv]].n}」が必要</span>`:''}</span>`}</div>${mx?'<span class="small">最大</span>':btn('build',lv?'Lvを上げる':'建てる',{i:id,c:'sm '+(nd||b.bld||!canPay(sh,f.cost[lv])?'dim':'pri')})}</div>`}).join('')}</div>
 <div class="small">素材は共有倉庫から使います（倉庫タブで寄付）。建築は1つずつ、建築担当の住民が進めます。</div>`;return h}
/* ---------- 研究 ---------- */
function tTech(){const b=G.world.base,sh=G.world.share,a=jobAlloc(),keys=Object.keys(TECH).filter(t=>TECH[t].key);let h='';
 if(b.res){const t=TECH[b.res.id];h+=`<div class="box col"><div class="hd">研究中：${t.n}</div>${pgH(b.res.rp,t.rp)}<div class="small">研究担当 ${a.research}人　${etaH(t.rp-b.res.rp,jobRate('research',a.research))}</div></div>`}
 else if(!facLv('lab'))h+='<div class="box small" style="text-align:center">研究するには、まず建築タブで「🔬研究小屋」を建ててください。</div>';
 h+=`<div class="box col"><div class="hd">技術（${ERAS[0].n}）</div>${Object.keys(TECH).map(id=>{const t=TECH[id],done=hasTech(id),cur=b.res&&b.res.id===id,rq=(t.req||[]).filter(r=>!hasTech(r)),ng=facLv('lab')<t.lab||rq.length||!canPay(sh,t.cost)||b.res;
  return `<div class="it"><div class="tx"><b>${done?'✅':cur?'⏳':''}${t.n}</b>${t.key?' <span style="color:#ffd870">★重要</span>':''} <span class="small">${FIELD6[t.f]}</span><br><span class="small">${t.d}${done||cur?'':`<br>研究ポイント${t.rp}・${costH(t.cost,sh)}${facLv('lab')<t.lab?`　<span class="ng">研究小屋Lv${t.lab}が必要</span>`:''}${rq.length?`　<span class="ng">先に「${rq.map(r=>TECH[r].n).join('・')}」</span>`:''}`}</span></div>${done?'<span class="small">研究済み</span>':cur?'<span class="small">研究中</span>':btn('research','研究する',{i:id,c:'sm '+(ng?'dim':'pri')})}</div>`}).join('')}</div>
 <div class="box small" style="text-align:center">★重要技術 ${keys.filter(hasTech).length}/${keys.length}　${eraReady()?'すべて研究しました！次の時代へ進めます（次の時代は今後のアップデートで追加します）':'すべて研究すると次の時代へ進めます'}</div>`;return h}
/* ---------- 製作 ---------- */
function tCraft(){const p=me(),pl=plOf(p.id),lv=facLv('shop'),od=rarOdds();let h='';
 if(!lv)h+='<div class="box small" style="text-align:center">製作するには、まず建築タブで「🔨工房」を建ててください。</div>';
 h+=`<div class="box col"><div class="hd">武器の製作${lv?'（工房Lv'+lv+'）':''}</div><div class="small">${RAR.map((r,i)=>`<span style="color:${r.c}">${r.n}${(od[i]*100).toFixed(od[i]<.1?1:0)}%</span>`).join(' ')}</div>
 ${Object.keys(RECIPE).map(id=>{const r=RECIPE[id],e=EQ[id],nt=!hasTech(r.tech),ns=lv<r.shop;
  return `<div class="it"><div class="tx"><b>${e.em}${e.n}</b><br><span class="small">${wInfo(e).split('<br>')[0]}<br>${costH(r.cost,pl.store)}${nt?`　<span class="ng">研究「${TECH[r.tech].n}」が必要</span>`:''}${ns?`　<span class="ng">工房Lv${r.shop}が必要</span>`:''}</span></div>${btn('craft','製作',{i:id,c:'sm '+(nt||ns||!canPay(pl.store,r.cost)?'dim':'pri')})}</div>`}).join('')}</div>
 <div class="box col"><div class="hd">持っている装備（${pl.gear.length}/${CFG.gearMax}）</div>${pl.gear.map(g=>{const eq=G.players.some(q=>ownerId(q.id)===ownerId(p.id)&&q.g===g.u);
  return `<div class="it"><div class="tx"><b>${EQ[g.id].em}${EQ[g.id].n}</b> ${gearFxH(g)}${eq?' <span class="small">（装備中）</span>':''}</div>${eq?'':btn('scrap','手放す',{i:g.u,c:'sm'})}</div>`}).join('')}</div>
 <div class="small">素材は個人倉庫から使います。装備の変更は「出発」タブで。</div>`;return h}
/* ---------- 住民 ---------- */
function tPeople(){const b=G.world.base,a=jobAlloc(),un={farm:'食料',lumber:'木材',mine:'石',research:'研究ポイント',build:'作業'};
 return `<div class="box col"><div class="hd">住民 ${b.pop}人（住める人数 ${popCap()}人）</div><div class="small">🍖食料 ${Math.floor(b.food)}（1時間に${(b.pop*CFG.eat).toFixed(1)}食べる）。1日1回、空き家があり食料が${b.pop*CFG.growFood}以上あると1人増えます。</div></div>
 <div class="box col"><div class="hd">仕事の優先度</div><div class="small">優先度を決めると、住民が自動で配置されます。</div>
 ${Object.keys(JOBS).map(j=>{const J=JOBS[j],act=jobActive(j);return `<div class="it"><div class="tx"><b>${J.em}${J.n}</b> ${a[j]}人<br><span class="small">${J.d}${act?(a[j]?`（1時間に${un[j]}+${+jobRate(j,a[j]).toFixed(1)}）`:''):'（今はすることがありません）'}</span></div>${PRIO.map((n,v)=>btn('job',n,{i:j+':'+v,c:'sm '+((b.job[j]||0)===v?'on':'')})).join('')}</div>`}).join('')}</div>`}
Object.assign(ACT,{
 tab(i){ui.tab=i},equip(i){sendAct({t:'equip',g:+i})},
 donate(i){const [m,n]=i.split(':');sendAct({t:'donate',m,n:n==='all'?'all':+n})},
 build(i){sendAct({t:'build',id:i})},research(i){sendAct({t:'research',id:i})},craft(i){sendAct({t:'craft',id:i})},scrap(i){sendAct({t:'scrap',g:+i})},
 job(i){const [j,v]=i.split(':');sendAct({t:'job',j,v:+v})}});
