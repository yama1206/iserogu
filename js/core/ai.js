'use strict';
/* イセログ core：敵の動き方（突撃型／回り込み型／射手型／守備型） */
function aiMove(e,tgt){const d=EN[e.id];let ai=d.ai;
 if(ai==='guard'){if(!e.aggro&&dist(e,tgt)>d.mv+d.rg+1)return;ai='charge'}   // 守備型：近づかれるか攻撃されるまで動かない
 const rg=d.rg,rm=reachOf(e,d.mv),far=reachOf({x:tgt.x,y:tgt.y,side:'p'},99,true),ps=alivePs();let best=null,bs=-1e9;
 for(const k in rm){const c=rm[k];if(c.occ)continue;const dd=Math.abs(c.x-tgt.x)+Math.abs(c.y-tgt.y),inR=dd<=rg&&(rg===1||los(c.x,c.y,tgt.x,tgt.y)),t=terAt(c.x,c.y);
  let s=inR?100:-(far[k]?far[k].c:dd+20)*10;
  if(ai==='shooter'){s+=Math.min(4,Math.min(...ps.map(p=>Math.abs(c.x-p.x)+Math.abs(c.y-p.y))))*6;if(t==='h')s+=8;if(t==='f')s+=4;s-=c.c}     // 射手型：射程を保って離れる
  else{if(inR&&ai==='flank'){const r=faceRel(c.x,c.y,tgt,e);s+=r==='back'?40:r==='side'?20:0}                                                // 回り込み型：背後・側面を取る
   if(inR&&t==='h')s+=5;if(t==='w')s-=6;s-=c.c*2}
  if(s>bs){bs=s;best=c}}
 if(!best||(best.x===e.x&&best.y===e.y))return;
 const path=pathTo(rm,best.x,best.y),l=path[path.length-1],pv=path.length>1?path[path.length-2]:[e.x,e.y];e.f=DIR.findIndex(v=>v[0]===l[0]-pv[0]&&v[1]===l[1]-pv[1]);e.x=best.x;e.y=best.y;ev('emove',{e:G.cb.en.indexOf(e),path})}
/* ---------- オートバトル：味方1人ぶんの次の行動を決める（返り値を act に渡す） ---------- */
function autoAct(p){if(canAct(p))return null;const es=aliveEs();if(!es.length)return {t:'end'};
 const dn=G.players.find(q=>q.down&&!q.out&&dist(p,q)===1);if(dn&&p.resc==null&&p.en>=CFG.rescueCost)return {t:'rescue',p:dn.id};
 const D=c=>CARDS[c.id],hand=p.hand.filter(c=>usable(p,c)&&costOf(c)<=p.en),ps=alivePs();
 const dmg=c=>{let v=0;D(c).fx.forEach(f=>{if(f[0]==='d')v+=dmgOf(p,c,f)*(f[3]||1)});return v};
 const healT=(c,lim)=>{const d=D(c),t=ps.filter(q=>q.hp<maxHp(q)*lim&&(d.tg==='A'||dist(p,q)<=(d.rg||2))).sort((a,b)=>a.hp-b.hp)[0];return t?{t:'play',u:c.u,tg:d.tg==='A'?null:t.id}:null};
 // 1) 回復（HPが半分を切った味方がいる時）
 for(const c of hand)if(D(c).ty==='heal'){const a=healT(c,.5);if(a)return a}
 // 2) コスト0の支援・特殊
 const free=hand.find(c=>costOf(c)===0&&/^(sp|sup)$/.test(D(c).ty));if(free)return {t:'play',u:free.u,tg:D(free).tg==='a'?p.id:null};
 // 3) 攻撃・妨害：いちばん効率のよいカードを、倒せる敵→弱った敵の順にねらう
 const atk=hand.filter(c=>'eEr'.includes(D(c).tg));let best=null,bs=-1;
 atk.forEach(c=>{const d=D(c),ci=cardRg(p,c),ts=es.filter(e=>inRange(p,e,ci));if(!ts.length)return;const v=dmg(c);let t=null,s=(v*(d.tg==='E'?ts.length:1)+2)/(d.cost+.5);
  if(d.tg==='e'){t=ts.slice().sort((a,b)=>(a.hp+a.blk<=v?0:1)-(b.hp+b.blk<=v?0:1)||a.hp-b.hp)[0];if(t.hp+t.blk<=v)s+=5;const r=faceRel(p.x,p.y,t,p);s+=r==='back'?3:r==='side'?1.5:0}
  if(s>bs){bs=s;best={t:'play',u:c.u,tg:t?G.cb.en.indexOf(t):null}}});
 if(best)return best;
 // 4) 移動：攻撃が届くマス（できれば背後・側面）へ。届かなければ近づく
 if(!p.moved&&atk.length){const rm=reachOf(p,p.mp),cis=atk.map(c=>cardRg(p,c));let cell=null,cs=-1e9;
  for(const k in rm){const c=rm[k];if(c.occ&&!(c.x===p.x&&c.y===p.y))continue;let s=-Math.min(...es.map(e=>Math.abs(e.x-c.x)+Math.abs(e.y-c.y)))*10-c.c;
   es.forEach(e=>{if(cis.some(ci=>inRange(c,e,ci))){const r=faceRel(c.x,c.y,e,p);s=Math.max(s,100+(r==='back'?30:r==='side'?15:0)-c.c)}});
   if(terAt(c.x,c.y)==='w')s-=6;if(s>cs){cs=s;cell=c}}
  if(cell&&!(cell.x===p.x&&cell.y===p.y))return {t:'move',x:cell.x,y:cell.y}}
 // 5) 残りのエネルギーで防御・回避・支援・回復
 for(const c of hand){const d=D(c);if(/^(def|evd|sup|sp)$/.test(d.ty)&&'saA'.includes(d.tg))return {t:'play',u:c.u,tg:d.tg==='a'?p.id:null};if(d.ty==='heal'){const a=healT(c,1);if(a)return a}}
 return {t:'end'}}
