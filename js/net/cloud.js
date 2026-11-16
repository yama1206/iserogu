'use strict';
/* イセログ クラウドセーブ（v0.4.0 第1段階）。Firebase Realtime Database をRESTで読み書きする（SDKなし）
   置き場所：worlds/世界コード/save ＝ {sv:セーブ形式の番号, ver:ゲームのバージョン, at:保存時刻, by:プレイヤーID, data:世界(JSON文字列)}
   第2段階（ホスト選出）では worlds/世界コード/host を足す予定 */
const Cloud={SV:1,code:null,dirty:false,busy:false,last:0,err:'',
 on:()=>typeof FB_URL==='string'&&/^https:\/\//.test(FB_URL),
 url(code,k){return FB_URL.replace(/\/+$/,'')+'/worlds/'+code+'/'+k+'.json'},
 newCode(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=A[Math.floor(Math.random()*A.length)];return s},
 norm(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)},
 // 読み込み：世界がなければ null。通信できない時・形式が新しすぎる時はエラー
 async load(code){const r=await fetch(this.url(code,'save'),{cache:'no-store'});if(!r.ok)throw new Error('通信に失敗しました（'+r.status+'）');const o=await r.json();if(!o)return null;
  if(o.sv>this.SV)throw new Error('この世界は新しいバージョンで保存されています。「更新」を押してください');return JSON.parse(o.data)},
 pack(world){return JSON.stringify({sv:this.SV,ver:VERSION,at:Date.now(),by:MY,data:JSON.stringify(world)})},
 async save(code,world){const r=await fetch(this.url(code,'save'),{method:'PUT',body:this.pack(world),headers:{'Content-Type':'application/json'}});if(!r.ok)throw new Error('保存に失敗しました（'+r.status+'）')},
 mark(){if(this.code)this.dirty=true},
 // たまった変更を保存する（force＝すぐ）
 async flush(){if(!this.code||!this.dirty||this.busy||!G)return;this.busy=true;this.dirty=false;
  try{await this.save(this.code,G.world);this.last=Date.now();this.err=''}catch(e){this.dirty=true;if(!this.err)toast('☁️ '+e.message);this.err=e.message}this.busy=false},
 // 画面を閉じる時：送りっぱなしで保存
 bye(){if(!this.code||!G)return;try{fetch(this.url(this.code,'save'),{method:'PUT',body:this.pack(G.world),headers:{'Content-Type':'application/json'},keepalive:true})}catch(e){}}
};
