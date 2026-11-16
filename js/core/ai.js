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
