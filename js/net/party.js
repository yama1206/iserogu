'use strict';
/* イセログ オンライン第4段階（v0.4.0）：合流
   ・フィールドで仲間のコマに近づくと「🤝合流」（仲間が戦闘中なら「⚔️加勢」）。近づかれた側＝リーダーになる
   ・リーダーの端末が、パーティー全員の探索と戦闘を計算する（act(pid, 行動) で受け付け）
     仲間（フォロワー）の端末は、届いた状態を映すだけ。操作はリーダーへ送る
   ・戦闘中に加勢した人は、次の味方ターンから行動できる
   ・戦利品と採集は1人ずつ。フォロワーの荷物はリーダーの fd.pb[ID] が預かり、離れる・帰還する時に持ち帰る
   ・リーダーが拠点へ帰還すると全員帰還。全滅したら全員が荷物の一部を失って強制帰還
   ・やりとり（Net.to で送る。参加者どうしはホストが中継）
     フォロワー→リーダー：pj（合流したい。自分のキャラと荷物）／act（行動）／pk（生きている）／pq（離れる）
     リーダー→フォロワー：ps（状態まるごと）／pp（フィールドの位置だけ）／pk／er（行動のエラー）／pn（断る）／pend（解散） */
const Party={fol:null,fs:[],own:null,rx0:0,tx0:0,pend:null,pendT:0,wait:0,sent:'',sentP:'',lastS:null,
 on(){return !!(this.fol||this.fs.length)},
 // この端末で操作するキャラか
 mine(p){return !!p&&(this.fol?p.id===MY:!p.net)},
 /* ---------- フォロワー（合流した側） ---------- */
 req(pid,name){if(this.on()||!G||G.phase!=='field')return;
  const p=byId(MY);if(!Net.to(pid,{t:'pj',p,bag:G.fd.bag}))return toast('つながっていません');this.pend=pid;this.pendT=Date.now();toast('🤝 '+name+' に合流を申し込みました…')},
 act(a){if(!this.fol)return;this.wait=Date.now();Net.to(this.fol,{t:'act',a})},
 // 届いた状態を映す
 apply(s,first){if(!s||typeof s!=='object'||!Array.isArray(s.pl)||!s.pl.some(p=>p.id===MY))return this.leave('パーティーから外れました');
  if(first){this.own=G.fd;BV.reset();FV.reset();ui.mode=null;ui.sel=null;ui.ov=null;ui.pid=MY}
  this.wait=0;this.lastS=s;
  if(s.ph==='home'||s.ph==='over')return this.leave(null,s.ph);
  G.phase=s.ph;G.fd=s.fd;G.cb=s.cb;G.players=s.pl;G.log=s.log||[];G.evs=s.evs||[];G.evn=s.evn||0;if(s.uid>G.uid)G.uid=s.uid;
  if(first)ui.lastEv=G.evn;ui.pid=MY;onState()},
 // パーティーを離れる（res：home＝リーダーと一緒に帰還／over＝全滅）。フィールドのその場所から1人で続ける
 leave(msg,res){if(!this.fol)return;const lead=this.fol;this.fol=null;this.pend=null;if(!res)Net.to(lead,{t:'pq'});
  const s=this.lastS||{},fd=Object.assign({},G&&G.fd||{},s.fd||{}),own=this.own||fd,mp=(s.pl||G.players||[]).find(p=>p.id===MY)||byId(MY);this.own=null;this.lastS=null;
  if(!G)return;
  if(mp){delete mp.net;Object.assign(mp,{hand:[],draw:[],disc:[],exh:[],st:{},blk:0,broken:false,down:false,out:false,resc:null,ended:false,done:false,rw:[],ps:mp.mps});if(mp.hp<=0)mp.hp=1;G.players=[mp]}
  const nf=Object.assign({},own,{x:fd.x!=null?fd.x:own.x,y:fd.y!=null?fd.y:own.y,fl:!!fd.fl,bk:!!fd.bk,bag:(fd.pb&&fd.pb[MY])||{},grace:CFG.encGrace,enc:CFG.encBase,
   taken:Object.assign({},own.taken,fd.taken),dead:Object.assign({},own.dead,fd.dead),wins:(own.wins||0)});delete nf.pb;
  G.fd=nf;G.cb=null;G.phase='field';G.log=[];G.evs=[];ui.lastEv=G.evn;ui.pid=MY;ui.mode=null;ui.sel=null;BV.reset();FV.reset();
  if(res==='home'){fieldReturn();toast('🛖 パーティーで拠点に帰還しました')}
  else if(res==='over'){bagHome(CFG.loseBag);G.phase='over';ev('lose')}
  else if(msg)toast(msg);
  onState()},
 /* ---------- リーダー（合流された側） ---------- */
 okP(p){return !!(p&&typeof p==='object'&&CH[p.ch]&&EQ[p.w]&&Array.isArray(p.eq)&&p.eq.every(i=>EQ[i])&&Array.isArray(p.deck)&&p.deck.length<200&&p.deck.every(c=>c&&CARDS[c.id])&&typeof p.hp==='number'&&isFinite(p.hp))},
 okBag(b){const o={};if(b&&typeof b==='object')for(const m in b)if(MAT[m]&&b[m]>0)o[m]=Math.min(9999,Math.floor(b[m]));return o},
 join(from,m){const no=why=>Net.to(from,{t:'pn',why});
  if(this.fol)return no('その人は別のパーティーにいます');
  if(this.pend){if(this.pend===from&&MY<from)this.pend=null;else return no('相手も合流を申し込み中です。少し待ってください')}if(!G||scr!=='game'||!['field','combat','reward'].includes(G.phase))return no('相手は冒険中ではありません');
  if(byId(from))return this.send(true);if(G.players.length>=CFG.maxPlayers)return no('パーティーは'+CFG.maxPlayers+'人までです');if(!this.okP(m.p))return no('データが正しくありません');
  const mb=Net.members().find(x=>x.pid===from),q=m.p,ps=(n,d)=>typeof n==='number'&&isFinite(n)?n:d;
  const p={id:from,side:'p',net:1,name:String(mb?mb.name:q.name||'仲間').slice(0,10),ch:q.ch,w:q.w,eq:q.eq.slice(0,4),g:q.g,rm:ps(q.rm,1),gfx:q.gfx&&typeof q.gfx==='object'?q.gfx:null,
   deck:q.deck.map(c=>({u:++G.uid,id:c.id,up:c.up?1:0,src:EQ[c.src]?c.src:undefined})),mhp:ps(q.mhp,1),mps:ps(q.mps,1),hp:0,ps:0,conn:true,en:0,blk:0,st:{},x:0,y:0,f:1,mp:0,moved:false,broken:false,down:false,out:false,downT:0,resc:null,ended:true,done:true,rw:[],hand:[],draw:[],disc:[],exh:[]};
  p.hp=Math.max(1,Math.min(maxHp(p),Math.round(q.hp)));p.ps=p.mps;
  if(G.phase==='combat'){const N=CFG.grid,ys=[3,4,2,5,1,6,0,7];let c=null;for(let x=0;x<2&&!c;x++)for(const y of ys)if(!TER[terAt(x,y)].block&&!unitAt(x,y)){c=[x,y];break}
   if(!c)return no('戦場に入る場所がありません');p.x=c[0];p.y=c[1];p.draw=shuf(p.deck.map(c=>Object.assign({},c)));log(p.name+'が加勢に来た！（次のターンから行動）')}
  G.players.push(p);bagOf(from);Object.assign(G.fd.pb[from],this.okBag(m.bag));
  this.fs.push({pid:from,rx:Date.now()});toast('🤝 '+p.name+' が'+(G.phase==='combat'?'加勢に来ました！':'合流しました'));sfx('buff');this.send(true);HOOK.changed()},
 state(){const fd=Object.assign({},G.fd);['x','y','fl','bk','steps','enc','grace'].forEach(k=>delete fd[k]);return {ph:G.phase,fd,cb:G.cb,pl:G.players,log:G.log.slice(-6),evs:G.evs.slice(-30),evn:G.evn,uid:G.uid}},
 pos(){const f=G.fd;return {t:'pp',x:Math.round(f.x*100)/100,y:Math.round(f.y*100)/100,fl:f.fl,bk:f.bk,steps:f.steps,enc:f.enc,grace:f.grace}},
 cast(m){this.tx0=Date.now();this.fs.forEach(f=>Net.to(f.pid,m))},
 send(force){if(!this.fs.length||!G)return;const st=this.state(),k=JSON.stringify(st);if(force||k!==this.sent){this.sent=k;this.cast({t:'ps',s:st});this.sentP='';}
  if(G.phase==='field'){const pp=this.pos(),kp=JSON.stringify(pp);if(kp!==this.sentP){this.sentP=kp;this.cast(pp)}}},
 // フォロワーを外す（戦闘中なら、その戦闘は抜けた扱い）
 drop(pid,msg){const f=this.fs.find(x=>x.pid===pid);if(!f)return;this.fs=this.fs.filter(x=>x!==f);const p=byId(pid);
  if(p&&G){if(G.phase==='combat'){p.out=true;p.down=true;p.ended=true;p.hand=[];log(p.name+'がパーティーを離れた')}else removePlayer(pid);p.done=true;progress()}
  if(msg)toast(msg);this.sent='';HOOK.changed()},
 // 解散：全員に知らせて、仲間のキャラを外す
 disband(why){if(!this.fs.length)return;this.cast({t:'pend',why:why||''});this.fs=[];if(G){G.players=G.players.filter(p=>!p.net);ui.pid=MY}this.sent='';},
 /* ---------- 受信 ---------- */
 rx(from,m){if(!m||typeof m!=='object'||!from)return;const t=Date.now();
  if(this.fol===from){this.rx0=t;
   if(m.t==='ps')this.apply(m.s,false);
   else if(m.t==='pp'){if(G&&G.phase==='field'&&G.fd){['x','y','steps','enc','grace'].forEach(k=>{if(typeof m[k]==='number')G.fd[k]=m[k]});G.fd.fl=!!m.fl;G.fd.bk=!!m.bk}}
   else if(m.t==='er'){this.wait=0;if(m.m&&!m.au)toast(m.m)}
   else if(m.t==='pend')this.leave('👋 パーティーが解散しました'+(m.why?'（'+m.why+'）':''))
   return}
  if(this.pend===from&&!this.fol){
   if(m.t==='ps'){if(!G||scr!=='game'||G.phase!=='field'||this.fs.length){Net.to(from,{t:'pq'});this.pend=null;return}this.pend=null;this.fol=from;this.rx0=t;this.apply(m.s,true);
    const mb=Net.members().find(x=>x.pid===from);toast('🤝 '+(mb?mb.name:'仲間')+' のパーティーに入りました');return}
   if(m.t==='pn'){this.pend=null;toast('🤝 合流できませんでした：'+(m.why||''));return}}
  if(m.t==='pj')return this.join(from,m);
  const f=this.fs.find(x=>x.pid===from);if(!f)return;f.rx=t;
  if(m.t==='act'){const a=m.a;if(!a||typeof a!=='object'||!['move','face','play','end','rescue','skip','pick','gather'].includes(a.t))return;
   const er=act(from,a);if(er){if(a.au&&a.t!=='end')act(from,{t:'end'});Net.to(from,{t:'er',m:er,au:a.au?1:0})}else this.send()}
  else if(m.t==='pq'){const p=byId(from);this.drop(from,'👋 '+(p?p.name:'仲間')+' がパーティーを離れました')}},
 /* ---------- 定期処理（0.15秒ごと） ---------- */
 tick(){const t=Date.now();
  if(this.pend&&t-this.pendT>10000){this.pend=null;toast('🤝 返事がありませんでした')}
  if(!G||scr!=='game'){if(this.on())this.reset();return}
  if(this.fol){if(t-this.rx0>CFG.ptLost)return this.leave('リーダーとの通信が切れたので、1人で続けます');
   if(t-this.tx0>3000){this.tx0=t;Net.to(this.fol,{t:'pk'})}if(this.wait&&t-this.wait>3000)this.wait=0;return}
  if(!this.fs.length)return;
  const ids=Net.members().map(x=>x.pid);this.fs.slice().forEach(f=>{if(t-f.rx>CFG.ptLost||(Net.role&&ids.length&&!ids.includes(f.pid)&&t-f.rx>5000))this.drop(f.pid,'通信が切れたため、仲間がパーティーを離れました')});
  if(!['field','combat','reward'].includes(G.phase)){this.send(true);this.disband();return}
  if(G.phase!=='combat'){const gone=G.players.filter(p=>p.net&&!this.fs.some(f=>f.pid===p.id));if(gone.length){gone.forEach(p=>removePlayer(p.id));progress();HOOK.changed()}}
  this.send();if(t-this.tx0>3000)this.cast({t:'pk'})},
 // タイトルへ戻る時など
 quit(){if(this.fol){const l=this.fol;this.fol=null;Net.to(l,{t:'pq'})}this.disband('リーダーが世界から出ました');this.reset()},
 reset(){Object.assign(this,{fol:null,fs:[],own:null,pend:null,wait:0,sent:'',sentP:'',lastS:null})}
};
setInterval(()=>Party.tick(),150);
