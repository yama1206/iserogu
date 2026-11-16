'use strict';
/* イセログ オンライン（v0.4.0 第2段階＋第3段階）：ホスト選出と引き継ぎ／仲間の冒険の様子を配る
   ・掲示板：worlds/世界コード/host ＝ {id:ホストのPeerJS ID, pid, name, n:合言葉, at:サーバー時刻}
     ホストは CFG.netBeat ごとに at を更新する。CFG.netTtl より古ければ「空き」とみなして、次の人がホストになる
   ・ホスト：共有分（world.base・world.share・地図）を持ち、時間を進め、クラウドへ保存する
   ・参加者：冒険は自分の端末で進める。自分の個人分（world.pl[自分]）は自分が持ち、変わるたびにホストへ送る
     共有分への操作（寄付・建築・研究・仕事）は手元で先に反映し、同じ操作をホストへ送る（shareOp）
   ・やりとり　参加者→ホスト：hi（入る）/ pl（個人分）/ op（共有分への操作）/ seen（地図）
   　　　　　　ホスト→参加者：w（世界まるごと＋参加者の一覧）/ ms（全員の様子）/ ping / no（入れない理由）
   ・第4段階（合流）：rl＝ほかの人あてのメッセージ。参加者→ホスト {t:'rl',to,m}／ホスト→参加者 {t:'rl',f:送り主,m}。中身は party.js
   ・第3段階：参加者→ホスト：st（自分の様子＝拠点・探索・戦闘、地図上の位置、HP）。ホストは全員ぶんをまとめて ms で配る */
const PEER_SRC='https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const Net={role:null,code:null,peer:null,nonce:'',off:0,hbOk:0,host:null,conn:null,gs:[],ms:[],q:[],st:'',lastRx:0,lastTx:0,tBeat:0,tSync:0,sentW:'',sentPl:'',sentSeen:'',sentSt:'',sentMs:'',busy:false,gen:0,ft:0,_pf:null,
 now(){return Date.now()+this.off},
 fresh(h){return !!(h&&h.at&&this.now()-h.at<CFG.netTtl)},
 async rest(k,method,body,ka){const o={method:method||'GET',cache:'no-store',keepalive:!!ka};if(body!==undefined){o.body=JSON.stringify(body);o.headers={'Content-Type':'application/json'}}
  const r=await fetch(Cloud.url(this.code,k),o);if(!r.ok)throw new Error('通信に失敗しました（'+r.status+'）');return r.json()},
 rec(){return {id:this.peer&&this.peer.open?this.peer.id:'',pid:MY,name:META.name,n:this.nonce,at:{'.sv':'timestamp'}}},
 members(){if(this.role==='host')return [{pid:MY,name:META.name,h:1,s:myStat()}].concat(this.gs.map(g=>({pid:g.pid,name:g.name,s:g.s||null})));
  return this.ms.map(m=>m.pid===MY?Object.assign({},m,{s:myStat()}):m)},
 // 届いた「様子」を確かめる（おかしな値は捨てる）
 okSt(s){if(!s||typeof s!=='object'||!['b','f','c'].includes(s.w))return null;const n=v=>typeof v==='number'&&isFinite(v)?v:undefined;
  return {w:s.w,em:String(s.em||'🙂').slice(0,4),hp:n(s.hp),mh:n(s.mh),x:n(s.x),y:n(s.y),k:s.k==='b'?'b':s.k==='s'?'s':undefined,pt:typeof s.pt==='string'?s.pt.slice(0,14):undefined,pn:n(s.pn)}},
 canSave(){return !this.role||(this.role==='host'&&Date.now()-this.hbOk<CFG.netTtl)},
 /* ---------- PeerJS ---------- */
 loadLib(){return new Promise((res,rej)=>{if(window.Peer)return res();const s=document.createElement('script');s.src=PEER_SRC;s.onload=()=>res();s.onerror=()=>rej(new Error('lib'));document.head.appendChild(s);setTimeout(()=>rej(new Error('lib')),10000)})},
 openPeer(){return new Promise((res,rej)=>{if(this.peer&&!this.peer.destroyed&&this.peer.open)return res();try{if(this.peer)this.peer.destroy()}catch(e){}
  const p=this.peer=new Peer(),tm=setTimeout(()=>rej(new Error('peer')),10000);
  p.on('open',()=>{clearTimeout(tm);res()});p.on('connection',c=>this.onConn(c));
  p.on('disconnected',()=>setTimeout(()=>{try{if(this.peer===p&&!p.destroyed)p.reconnect()}catch(e){}},2000));
  p.on('error',e=>{if(e&&e.type==='peer-unavailable'&&this._pf)this._pf('unavailable')})})},
 /* ---------- 世界に入る：ホストがいれば参加者、いなければ自分がホスト。{role, world（参加者の時だけ）} を返す ---------- */
 async enter(code){this.reset();this.code=code;
  try{const t=await this.rest('clk/'+MY,'PUT',{'.sv':'timestamp'});if(typeof t==='number')this.off=t-Date.now()}catch(e){}
  try{await this.loadLib();await this.openPeer()}catch(e){}   // PeerJSが使えなくても、ホストとして1人では遊べる
  let h=await this.rest('host');
  for(let tr=0;tr<4;tr++){
   if(this.fresh(h)){
    if(this.peer&&this.peer.open&&h.id){try{return {role:'guest',world:await this.join(h)}}catch(e){if(e.no)throw e}}
    await sleep(2500)}
   else if(await this.claim())return {role:'host'};
   h=await this.rest('host')}
  throw new Error('ホストにつながりませんでした。少し待ってから、もう一度入ってください')},
 // ホストに名乗り出る：書いてから少し待って読み直し、自分の合言葉が残っていればホスト
 async claim(){this.nonce=Math.random().toString(36).slice(2,10);await this.rest('host','PUT',this.rec());await sleep(1200+Math.random()*400);const h=await this.rest('host');
  if(!h||h.n!==this.nonce)return false;this.role='host';this.hbOk=this.tBeat=Date.now();this.host=null;this.conn=null;this.gs=[];this.q=[];this.st='';this.sentW='';this.sentMs='';return true},
 // 参加者としてホストにつなぐ。最初の世界データが届いたら成功
 join(h){return new Promise((res,rej)=>{let done=false;const c=this.peer.connect(h.id,{reliable:true,serialization:'json'});
  const fail=(e,no)=>{if(done)return;done=true;clearTimeout(tm);this._pf=null;try{c.close()}catch(_){}const er=new Error(String(e));er.no=!!no;rej(er)};
  const tm=setTimeout(()=>fail('timeout'),10000);this._pf=fail;
  c.on('open',()=>{try{c.send({t:'hi',pid:MY,name:META.name,pl:G?plOf(MY):null,seen:G?G.world.seen:null})}catch(e){}});
  c.on('data',m=>{if(!m)return;this.lastRx=Date.now();
   if(m.t==='no')return fail(m.why||'入れませんでした',true);
   if(m.t==='w'){if(!done){done=true;clearTimeout(tm);this._pf=null;this.conn=c;this.role='guest';this.host=h;this.st='';this.sentPl=this.sentSeen=this.sentSt='';res(m.w)}
    if(this.conn!==c)return;this.ms=m.ms||[];if(G&&scr==='game')netApply(m.w)}
   else if(m.t==='ms'&&this.conn===c&&Array.isArray(m.ms)){this.ms=m.ms;netMates(this.members())}
   else if(m.t==='rl'&&this.conn===c)Party.rx(String(m.f||''),m.m)});
  c.on('close',()=>{if(!done)fail('close');else this.lost(c)});c.on('error',e=>{if(!done)fail(e)})})},
 /* ---------- 参加者：ホストが消えた時 ---------- */
 lost(c){if(this.conn!==c||this.role!=='guest')return;this.conn=null;this.st='ホストを探しています…';this.rejoin()},
 // ホストを探し直す。掲示板が古くなっていたら、自分が名乗り出る（引き継ぎ）。その間も冒険は続けられる
 async rejoin(){if(this.busy)return;this.busy=true;const g=this.gen;
  while(g===this.gen&&this.role==='guest'&&!this.conn){
   try{if(window.Peer&&!(this.peer&&this.peer.open&&!this.peer.destroyed))await this.openPeer();
    const h=await this.rest('host');if(g!==this.gen)break;
    if(this.fresh(h)){if(h.id&&this.peer&&this.peer.open)try{await this.join(h);break}catch(e){}}
    else{await sleep(Math.random()*2000);const h2=await this.rest('host');
     if(g===this.gen&&!this.fresh(h2)&&await this.claim()){toast('👑 あなたがこの世界のホストになりました');Cloud.mark();netRefresh();break}}
   }catch(e){}
   await sleep(3000)}
  this.busy=false},
 /* ---------- ホスト ---------- */
 onConn(c){c.on('data',m=>{try{this.onGuest(c,m)}catch(e){}});c.on('close',()=>this.drop(c));c.on('error',()=>this.drop(c))},
 drop(c){const g=this.gs.find(x=>x.c===c);if(!g)return;this.gs=this.gs.filter(x=>x!==g);this.sentW='';if(this.role==='host'){toast('🔗 '+g.name+' が世界から出ました');netRefresh()}},
 no(c,why){try{c.send({t:'no',why})}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}},800)},
 okPl(pl){return !!(pl&&typeof pl==='object'&&pl.store&&typeof pl.store==='object'&&Array.isArray(pl.gear))},
 onGuest(c,m){if(!m||typeof m!=='object')return;
  if(m.t==='hi'){const pid=String(m.pid||'');
   if(this.role!=='host'||!G||scr!=='game')return this.no(c,'ホストが準備中です。少し待ってから入ってください');
   if(!/^u[a-z0-9]{1,12}$/.test(pid)||pid===MY)return this.no(c,'同じプレイヤーがすでに入っています');
   this.gs.filter(x=>x.pid===pid).forEach(x=>{this.gs=this.gs.filter(y=>y!==x);try{x.c.close()}catch(e){}});
   if(this.gs.length>=CFG.netMax-1)return this.no(c,'この世界は満員です（同時に'+CFG.netMax+'人まで）');
   const g={c,pid,name:String(m.name||'旅人').slice(0,10),s:null};this.gs.push(g);
   if(this.okPl(m.pl))G.world.pl[pid]=m.pl;else plOf(pid);this.orSeen(m.seen);
   Cloud.mark();this.sendW(true);toast('🔗 '+g.name+' が世界に入りました');netRefresh();return}
  const g=this.gs.find(x=>x.c===c);if(!g||this.role!=='host'||!G)return;
  if(m.t==='pl'){if(this.okPl(m.pl)){G.world.pl[g.pid]=m.pl;Cloud.mark();this.flushSoon()}}
  else if(m.t==='op'){if(m.a&&typeof m.a==='object'){shareOp(m.a);Cloud.mark();this.flushSoon();this.sendW();netRefresh()}}
  else if(m.t==='seen')this.orSeen(m.seen)
  else if(m.t==='st'){g.s=this.okSt(m.s);this.sendMs()}
  else if(m.t==='rl'){const to=String(m.to||'');if(to===MY)Party.rx(g.pid,m.m);else{const g2=this.gs.find(x=>x.pid===to);if(g2)try{g2.c.send({t:'rl',f:g.pid,m:m.m})}catch(e){}}}},
 // 第4段階：ほかの人へのメッセージ（参加者どうしはホストが中継する）
 to(pid,m){if(this.role==='host'){const g=this.gs.find(x=>x.pid===pid);if(!g||!g.c.open)return false;try{g.c.send({t:'rl',f:MY,m});return true}catch(e){return false}}
  if(this.role==='guest'&&this.conn&&this.conn.open){this.tx({t:'rl',to:pid,m});return true}return false},
 orSeen(s){if(!Array.isArray(s)||!G)return;const w=G.world,o=Array.isArray(w.seen)?w.seen:[];let ch=false;
  if(o.length!==s.length){if(s.length>o.length){w.seen=s.slice();ch=true}}else for(let i=0;i<s.length;i++)if(s[i]&&!o[i]){o[i]=1;ch=true}
  if(ch){w.sv=(w.sv||0)+1;Cloud.mark()}},
 flushSoon(){if(!this.ft)this.ft=setTimeout(()=>{this.ft=0;Cloud.flush()},3000)},
 cast(m){this.lastTx=Date.now();this.gs.forEach(g=>{try{if(g.c.open)g.c.send(m)}catch(e){}})},
 // 世界を配る（変わった時だけ。変わっていなければ、ときどき ping）
 sendW(force){if(!G||!this.gs.length)return;const w=G.world,b=w.base,a=b.acc;b.acc=0;const ms=this.members(),key=JSON.stringify(w)+JSON.stringify(ms.map(x=>x.pid+x.name));b.acc=a;
  if(!force&&key===this.sentW){if(Date.now()-this.lastTx>4000)this.cast({t:'ping'});return}this.sentW=key;this.cast({t:'w',w,ms})},
 // 全員の様子を配る（変わった時だけ）。ホスト自身の画面の仲間表示もここで更新
 sendMs(){const ms=this.members(),k=JSON.stringify(ms);if(k===this.sentMs)return;this.sentMs=k;if(this.gs.length)this.cast({t:'ms',ms});netMates(ms)},
 // 掲示板の更新。別の人がホストになっていたら、参加者に戻る
 async beat(){const g=this.gen;try{const h=await this.rest('host');if(g!==this.gen||this.role!=='host')return;
   if(h&&h.n!==this.nonce&&this.fresh(h)){this.role='guest';this.gs.forEach(x=>{try{x.c.close()}catch(e){}});this.gs=[];this.conn=null;this.host=null;this.st='ホストを探しています…';toast('別の人がホストになりました。参加者として続けます');this.rejoin();netRefresh();return}
   await this.rest('host','PUT',this.rec());if(g===this.gen)this.hbOk=Date.now()}catch(e){}},
 /* ---------- 参加者 → ホスト ---------- */
 tx(m){try{if(this.conn&&this.conn.open)this.conn.send(m)}catch(e){}},
 op(a){if(this.role!=='guest')return;this.q.push(a);this.drain()},
 drain(){while(this.conn&&this.conn.open&&this.q.length)this.tx({t:'op',a:this.q.shift()})},
 syncMine(){if(!G||!this.conn)return;const pl=JSON.stringify(plOf(MY));if(pl!==this.sentPl){this.sentPl=pl;this.tx({t:'pl',pl:plOf(MY)})}
  const st=JSON.stringify(myStat());if(st!==this.sentSt){this.sentSt=st;this.tx({t:'st',s:myStat()})}
  const se=JSON.stringify(G.world.seen||[]);if(se!==this.sentSeen){this.sentSeen=se;this.tx({t:'seen',seen:G.world.seen})}},
 /* ---------- 1秒ごと ---------- */
 tick(){if(!this.role||!G||scr!=='game')return;const t=Date.now();
  if(this.role==='host'){if(t-this.tBeat>=CFG.netBeat){this.tBeat=t;this.beat()}if(t-this.tSync>=CFG.netSync){this.tSync=t;this.sendW()}this.sendMs()}
  else if(this.conn){if(t-this.lastRx>CFG.netLost){const c=this.conn;try{c.close()}catch(e){}this.lost(c);return}this.drain();this.syncMine()}},
 wake(){if(this.role==='host'&&G){this.tBeat=Date.now();this.beat()}},
 /* ---------- 出る ---------- */
 reset(){this.gen++;clearTimeout(this.ft);this.ft=0;this.gs.forEach(g=>{try{g.c.close()}catch(e){}});try{if(this.conn)this.conn.close()}catch(e){}try{if(this.peer)this.peer.destroy()}catch(e){}
  Object.assign(this,{role:null,code:null,peer:null,nonce:'',host:null,conn:null,gs:[],ms:[],q:[],st:'',sentW:'',sentPl:'',sentSeen:'',sentSt:'',sentMs:'',busy:false,_pf:null})},
 leave(){if(this.role==='guest'){this.drain();this.syncMine()}else if(this.role==='host')this.rest('host','DELETE',undefined,true).catch(()=>{});this.reset()},
 // 画面を閉じる時：ホストは掲示板を消して、すぐ次の人が引き継げるようにする
 bye(){if(this.role==='host')this.rest('host','DELETE',undefined,true).catch(()=>{});else if(this.role==='guest'){this.drain();this.syncMine()}}
};
setInterval(()=>Net.tick(),1000);
