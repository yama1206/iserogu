'use strict';
/* イセログ core：拠点（倉庫・研究・建築・製作とレアリティ・住民・時間）。画面と通信に依存しません
   共有＝G.world.base（施設・研究・住民・時間）と G.world.share（共有倉庫）／個人＝G.world.pl[プレイヤーID]（個人倉庫 store・装備 gear） */
function ownerId(id){return String(id).replace(/_2$/,'')}   // 連れていく仲間（〜_2）は、持ち主の倉庫と装備を使う
function ensureWorld(){const w=G.world;if(!w.pl)w.pl={};if(!w.share)w.share={};
 if(!w.base)w.base={t:0,acc:0,fac:{house:1},tech:{},res:null,bld:null,pop:CFG.popStart,food:CFG.foodStart,job:Object.assign({},CFG.jobPrio),frac:{}};w.v=2;return w}
function plOf(id){const w=ensureWorld(),o=ownerId(id);
 if(!w.pl[o]){const pl=w.pl[o]={store:{},gear:[],gu:0};CFG.startWeapons.forEach(i=>pl.gear.push({u:++pl.gu,id:i,r:0,fx:{}}));if(w.store){pl.store=w.store;delete w.store}}   // v0.2 の倉庫は個人倉庫へ引き継ぐ
 return w.pl[o]}
function gearUsed(p,u){return G.players.some(q=>q!==p&&ownerId(q.id)===ownerId(p.id)&&q.g===u)}
function gearOf(p){return plOf(p.id).gear.find(g=>g.u===p.g)||null}
function gearFree(p){return plOf(p.id).gear.find(g=>!gearUsed(p,g.u))||null}
function facLv(id){return G.world.base.fac[id]||0}
function hasTech(id){return !!(G.world.base&&G.world.base.tech[id])}
function techFx(){const o={};if(!G.world.base)return o;for(const t in TECHFX)if(hasTech(t))for(const k in TECHFX[t])o[k]=(o[k]||0)+TECHFX[t][k];return o}
function winHealRate(){return CFG.winHeal+(hasTech('t_fire')?CFG.fireHeal:0)}
function eraReady(){return Object.keys(TECH).filter(t=>TECH[t].key).every(hasTech)}
function canPay(st,cost){for(const m in cost)if((st[m]||0)<cost[m])return false;return true}
function pay(st,cost){for(const m in cost)st[m]-=cost[m]}
function shareCap(){return CFG.shareCap[0]+CFG.shareCap[1]*facLv('store')}
function popCap(){return facLv('house')*3+1}
/* ---------- 住民：優先度から自動で仕事に配置（することがない仕事には付かない） ---------- */
function jobActive(j){const b=G.world.base;return j==='research'?!!b.res:j==='build'?!!b.bld:true}
function jobAlloc(){const b=G.world.base,ks=Object.keys(JOBS),w=ks.map(j=>jobActive(j)?(b.job[j]||0):0),tot=w.reduce((a,c)=>a+c,0),out={};ks.forEach(j=>out[j]=0);if(!tot)return out;
 const ex=ks.map((j,i)=>b.pop*w[i]/tot);let left=b.pop;ks.forEach((j,i)=>{out[j]=Math.floor(ex[i]);left-=out[j]});
 ks.map((j,i)=>[ex[i]-out[j],w[i],j]).sort((a,c)=>c[0]-a[0]||c[1]-a[1]).forEach(r=>{if(left>0&&r[1]>0){out[r[2]]++;left--}});return out}
function jobRate(j,n){const O=CFG.jobOut;return n*O[j]*(j==='farm'?1+CFG.farmLv*facLv('farm'):j==='research'?1+CFG.labLv*Math.max(0,facLv('lab')-1):1)}
/* ---------- 時間：ゲーム内1時間ごとにまとめて計算 ---------- */
function baseHour(){const b=G.world.base,sh=G.world.share,a=jobAlloc(),cap=shareCap();
 if(b.food<cap)b.food=Math.min(cap,b.food+jobRate('farm',a.farm));b.food=Math.max(0,Math.round((b.food-b.pop*CFG.eat)*100)/100);
 const add=(m,v)=>{b.frac[m]=(b.frac[m]||0)+v;const n=Math.floor(b.frac[m]);if(n>0){b.frac[m]-=n;if((sh[m]||0)<cap)sh[m]=Math.min(cap,(sh[m]||0)+n)}};
 add('wood',jobRate('lumber',a.lumber));add('stone',jobRate('mine',a.mine));
 if(b.res){b.res.rp+=jobRate('research',a.research);if(b.res.rp>=TECH[b.res.id].rp){const id=b.res.id;b.tech[id]=1;b.res=null;log('研究「'+TECH[id].n+'」が完了した。');ev('tech',{id})}}
 if(b.bld){b.bld.w+=jobRate('build',a.build);const id=b.bld.id;if(b.bld.w>=FAC[id].work[facLv(id)]){b.fac[id]=facLv(id)+1;b.bld=null;log(FAC[id].n+'がLv'+b.fac[id]+'になった。');ev('built',{id,lv:b.fac[id]})}}
 if(Math.floor(b.t/60)%24===0&&b.pop<popCap()&&b.food>=b.pop*CFG.growFood){b.pop++;ev('pop',{n:b.pop})}}
// sec＝進んだ現実の秒数。進んだゲーム内時間（時間）を返す
function baseTick(sec){if(!G)return 0;const b=ensureWorld().base;b.acc=(b.acc||0)+sec*CFG.minPerSec;let n=0;while(b.acc>=60&&n<48){b.acc-=60;b.t+=60;baseHour();n++}return n}
/* ---------- 製作：作るたびにレアリティと追加効果を抽選 ---------- */
function rarOdds(){const lv=facLv('shop'),ws=RAR.map((r,i)=>i?r.p*(1+CFG.rarShop*Math.max(0,lv-1)):r.p),t=ws.reduce((a,c)=>a+c,0);return ws.map(w=>w/t)}
function rollGear(id){const ws=rarOdds();let x=Math.random(),r=0;for(let i=0;i<ws.length;i++){x-=ws[i];if(x<0){r=i;break}}
 const n=rng(RAR[r].fx[0],RAR[r].fx[1]),fx={};shuf(GFX.slice()).slice(0,n).forEach(g=>fx[g[0]]=g[1]);return {id,r,fx}}
/* ---------- 共有分（共有倉庫・建築・研究・仕事）への操作。オンラインでは、参加者の操作をホストがこれで反映する ---------- */
function shareOp(a){const w=ensureWorld(),b=w.base,sh=w.share;
 switch(a.t){
  case 'give':{const n=a.n|0;if(!MAT[a.m]||n<=0||n>99999)return '';sh[a.m]=(sh[a.m]||0)+n;return ''}
  case 'build':{const f=FAC[a.id];if(!f)return '';const lv=facLv(a.id);if(lv>=f.cost.length)return 'これ以上は上げられません';if(b.bld)return '建築中の施設があります（建築は1つずつ）';if(f.need[lv]&&!hasTech(f.need[lv]))return '研究「'+TECH[f.need[lv]].n+'」が必要です';if(!canPay(sh,f.cost[lv]))return '共有倉庫の素材が足りません（倉庫で寄付できます）';pay(sh,f.cost[lv]);b.bld={id:a.id,w:0};return ''}
  case 'research':{const t=TECH[a.id];if(!t||hasTech(a.id))return '';if(b.res)return '研究中の技術があります（研究は1つずつ）';if(facLv('lab')<t.lab)return '研究小屋Lv'+t.lab+'が必要です';if((t.req||[]).some(r=>!hasTech(r)))return '先に「'+(t.req||[]).filter(r=>!hasTech(r)).map(r=>TECH[r].n).join('・')+'」の研究が必要です';if(!canPay(sh,t.cost))return '共有倉庫の素材が足りません（倉庫で寄付できます）';pay(sh,t.cost);b.res={id:a.id,rp:0};return ''}
  case 'job':{if(!JOBS[a.j])return '';b.job[a.j]=Math.max(0,Math.min(3,a.v|0));return ''}
 }
 return ''}
/* ---------- 拠点での行動（拠点にいる時だけ） ---------- */
function baseAct(p,a){if(G.phase!=='prep')return '拠点でしかできません';const w=ensureWorld(),b=w.base,pl=plOf(p.id),sh=w.share;
 switch(a.t){
  case 'equip':{const g=pl.gear.find(x=>x.u===a.g);if(!g)return '';if(gearUsed(p,g.u))return '仲間が装備しています';p.g=g.u;setChar(p);return ''}
  case 'donate':{const m=a.m,have=pl.store[m]||0,n=a.n==='all'?have:Math.min(a.n|0,have);if(!MAT[m]||n<=0)return '寄付できる素材がありません';pl.store[m]-=n;const o={t:'give',m,n};shareOp(o);HOOK.op(o);ev('donate',{m,n});return ''}
  case 'build':case 'research':case 'job':{const er=shareOp(a);if(!er)HOOK.op(a);return er}
  case 'craft':{const r=RECIPE[a.id];if(!r)return '';if(!hasTech(r.tech))return '研究「'+TECH[r.tech].n+'」が必要です';if(facLv('shop')<r.shop)return '工房Lv'+r.shop+'が必要です';if(pl.gear.length>=CFG.gearMax)return '装備がいっぱいです（いらない装備を手放してください）';if(!canPay(pl.store,r.cost))return '個人倉庫の素材が足りません';pay(pl.store,r.cost);const g=rollGear(a.id);g.u=++pl.gu;pl.gear.push(g);ev('craft',{id:g.id,r:g.r});return ''}
  case 'scrap':{const g=pl.gear.find(x=>x.u===a.g);if(!g)return '';if(G.players.some(q=>ownerId(q.id)===ownerId(p.id)&&q.g===g.u))return '装備中の物は手放せません';pl.gear=pl.gear.filter(x=>x!==g);return ''}}
 return ''}
