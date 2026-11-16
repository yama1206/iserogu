'use strict';
/* イセログ core：個人施設とカードの永久強化（v0.9.0）。個人分（G.world.pl[自分]）に入るので、オンラインでは自分の端末が持つ
   pl.fac＝個人施設のLv、pl.cup＝永久に強化したカード（カードの種類ごと）、pl.gd＝家庭菜園を最後に収穫した日 */
function pfLv(pl,id){return (pl&&pl.fac&&pl.fac[id])||0}
function gearMaxOf(pl){return CFG.gearMax}
function shedMax(pl){return pfLv(pl,'shed')*10}
function cupMax(pl){return pfLv(pl,'train')*4}
function cupN(pl){return Object.keys(pl.cup||{}).length}
function dayOf(){return Math.floor(G.world.base.t/1440)}
// 家庭菜園：たまっている日数と、とれる素材
function harvestDays(pl){return pfLv(pl,'garden')?Math.max(0,Math.min(7,dayOf()-(pl.gd==null?dayOf():pl.gd))):0}
function harvestOut(pl){const d=harvestDays(pl),o={};if(!d)return o;const t=PFAC.garden.out[pfLv(pl,'garden')-1];for(const m in t)o[m]=t[m]*d;return o}
// 冒険のデッキ：永久強化したカードは最初から強化済み
function cupApply(p,cards){const pl=G.world.pl&&G.world.pl[ownerId(p.id)];if(!pl||!pl.cup)return;cards.forEach(c=>{if(pl.cup[c.id])c.up=1})}
// 寝床の最大HPを装備の能力（apas）にまとめる（合流しても仲間の端末で同じになる）
function homeFx(p){const pl=G.world.pl&&G.world.pl[ownerId(p.id)],lv=pfLv(pl,'bed');if(!lv)return;const o=p.apas||(p.apas={aps:0});o.maxhp=(o.maxhp||0)+lv*4}
// 自分の冒険の最初のデッキに入るカードの種類（鍛錬場で強化できる物）
function baseCards(p){const s=['punch','guard','step'].concat(EQ[p.w].cards,CH[p.ch].extra);return s.filter((x,i)=>s.indexOf(x)===i)}
function homeAct(p,pl,a){if(!pl.fac)pl.fac={};
 switch(a.t){
  case 'pbuild':{const f=PFAC[a.id];if(!f)return '';const lv=pfLv(pl,a.id);if(lv>=f.cost.length)return 'これ以上は上げられません';if(f.need[lv]&&!hasTech(f.need[lv]))return '研究「'+techN(f.need[lv])+'」が必要です';if(!canPay(pl.store,f.cost[lv]))return '個人倉庫の素材が足りません';
   if(a.id==='garden'&&lv){const o=harvestOut(pl);for(const m in o)pl.store[m]=(pl.store[m]||0)+o[m]}   // 上げる前にたまった分を収穫
   pay(pl.store,f.cost[lv]);pl.fac[a.id]=lv+1;if(a.id==='garden')pl.gd=dayOf();setChar(p);ev('pbuilt',{id:a.id,lv:lv+1});return ''}
  case 'pup':{if(!CARDS[a.id]||!baseCards(p).includes(a.id))return '';if(!pl.cup)pl.cup={};if(pl.cup[a.id])return 'もう強化しています';if(!pfLv(pl,'train'))return '鍛錬場が必要です';if(cupN(pl)>=cupMax(pl))return '鍛錬場のLvを上げると、もっと強化できます';
   const c=cupCost(cupN(pl));if(!canPay(pl.store,c))return '個人倉庫の素材が足りません';pay(pl.store,c);pl.cup[a.id]=1;setChar(p);ev('pup',{id:a.id});return ''}
  case 'stow':{const g=pl.gear.find(x=>x.u===a.g);if(!g)return '';if(gearInUse(p,g.u))return '装備中の物はしまえません';if(!pl.shed)pl.shed=[];if(pl.shed.length>=shedMax(pl))return '物置がいっぱいです（Lvを上げると増えます）';pl.gear=pl.gear.filter(x=>x!==g);pl.shed.push(g);return ''}
  case 'unstow':{const g=(pl.shed||[]).find(x=>x.u===a.g);if(!g)return '';if(pl.gear.length>=gearMaxOf(pl))return '持っている装備がいっぱいです';pl.shed=pl.shed.filter(x=>x!==g);pl.gear.push(g);return ''}
  case 'harvest':{const o=harvestOut(pl);if(!Object.keys(o).length)return 'まだ収穫できる物がありません（1日ごとに実ります）';for(const m in o)pl.store[m]=(pl.store[m]||0)+o[m];pl.gd=dayOf();ev('harvest',{o});return ''}}
 return ''}
