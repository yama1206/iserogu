'use strict';
/* 探索のデータ：素材・バイオーム（地域）・出現する敵・戦利品（ここに足すだけで増やせる）
   フィールドは端のない世界。拠点(0,0)から離れるほど危険度が上がる */
const MAT={
 wood:{n:'木材',em:'🪵'},stone:{n:'石',em:'🪨'},fiber:{n:'草の繊維',em:'🌿'},berry:{n:'木の実',em:'🍒'},herb:{n:'薬草',em:'🍀'},flint:{n:'火打石',em:'✨'},
 hide:{n:'毛皮',em:'🧥'},meat:{n:'肉',em:'🍖'},bone:{n:'骨',em:'🦴'},fang:{n:'鋭い牙',em:'🦷'},tusk:{n:'マンモスの牙',em:'🐘'},
 // v0.6.0 で追加（バイオームの素材。次の時代の研究・製作で使う予定）
 cactus:{n:'サボテン',em:'🌵'},salt:{n:'塩',em:'🧂'},ice:{n:'氷',em:'🧊'},clay:{n:'粘土',em:'🟤'},reed:{n:'葦',em:'🎋'},
 copper:{n:'銅鉱石',em:'🟠'},obsidian:{n:'黒曜石',em:'🖤'},sulfur:{n:'硫黄',em:'🟡'},shell:{n:'貝殻',em:'🐚'},
 feather:{n:'羽根',em:'🪶'},venom:{n:'毒袋',em:'🧪'},scale:{n:'うろこ',em:'💠'},ember:{n:'火の核',em:'🔥'},pearl:{n:'真珠',em:'⚪'}};
// バイオーム：n名前、bg戦闘の地面の色、node採集ポイントの素材（多く書いた物ほど出やすい）、mobs通常の敵、elite強敵、boss主（なければ強敵）
// 地面の種類：p平地 f森の地面 h丘 s砂 n雪 m泥 a灰 ＝歩ける ／ t木 r岩 w水 l溶岩 ＝通れない
const BIO={
 grass:{n:'草原',bg:'#5f9a48',node:['fiber','fiber','stone','herb'],mobs:['hyena','hyena','wolf','boar'],elite:['bear'],boss:['mammoth']},
 forest:{n:'森林',bg:'#3c6e3a',node:['wood','wood','berry','herb'],mobs:['boar','snake','monkey','wolf'],elite:['saber'],boss:['saber']},
 desert:{n:'砂漠',bg:'#d8b46a',node:['cactus','stone','flint','salt'],mobs:['scorp','scorp','vulture','lizard'],elite:['worm'],boss:['kscorp']},
 snow:{n:'雪原',bg:'#dfe8ef',node:['ice','stone','wood'],mobs:['swolf','swolf','hare','fox'],elite:['rhino'],boss:['pbear']},
 swamp:{n:'沼地',bg:'#5c6e44',node:['clay','reed','herb','reed'],mobs:['croc','frog','frog','leech'],elite:['bcroc'],boss:['hydra']},
 mount:{n:'山岳',bg:'#8b8478',node:['stone','flint','stone'],mobs:['goat','goat','eagle','lynx'],elite:['roc'],boss:['yeti']},
 volcano:{n:'火山',bg:'#5a4440',node:['obsidian','sulfur','stone'],mobs:['salam','salam','spark','mlizard'],elite:['golem'],boss:['drake']},
 coast:{n:'海岸',bg:'#e6d49a',node:['shell','salt','fiber','shell'],mobs:['crab','crab','gull','turtle'],elite:['octo'],boss:['octo']},
 sea:{n:'海',bg:'#58a8e0',node:[],mobs:['crab'],elite:['octo'],boss:['octo']}};
// v0.11.0：時代が進むと増える物（敵・採集ポイント）。BIO[b].ex[時代]={node,mobs,elite,boss}。今の時代までの分を足して使う
function bioAdd(era,bs,o){bs.split(' ').forEach(b=>{const B=BIO[b];B.ex=B.ex||[];const x=B.ex[era]=B.ex[era]||{};for(const k in o)x[k]=(x[k]||[]).concat(o[k])})}
function bioL(b,k){const B=BIO[b]||BIO.grass,e=typeof eraOf==='function'?eraOf():0;let ls=B[k]||[];for(let i=1;i<=e;i++){const x=B.ex&&B.ex[i];if(x&&x[k])ls=ls.concat(x[k])}return ls}
// ランダムエンカウントの表（バイオームから作る）
const ENC={};for(const k in BIO)ENC[k]={mobs:BIO[k].mobs,elite:BIO[k].elite};
// 戦利品：[素材, 数, 落とす確率]（危険度3ごとに数が1増える）
const DROP={wolf:['hide',1,.6],hyena:['bone',1,.6],boar:['meat',1,.8],snake:['bone',1,.4],monkey:['berry',1,.6],saber:['fang',2,1],bear:['hide',3,1],mammoth:['tusk',2,1],
 scorp:['venom',1,.5],vulture:['feather',1,.6],lizard:['scale',1,.5],worm:['scale',3,1],kscorp:['venom',4,1],
 swolf:['hide',1,.6],hare:['meat',1,.7],fox:['hide',1,.5],rhino:['tusk',2,1],pbear:['hide',5,1],
 croc:['scale',1,.6],frog:['venom',1,.5],leech:['herb',1,.5],bcroc:['scale',3,1],hydra:['scale',5,1],
 goat:['meat',1,.7],eagle:['feather',1,.7],lynx:['fang',1,.4],roc:['feather',4,1],yeti:['hide',5,1],
 salam:['ember',1,.5],spark:['sulfur',1,.6],mlizard:['scale',1,.5],golem:['obsidian',4,1],drake:['ember',5,1],
 crab:['shell',1,.7],gull:['feather',1,.6],turtle:['shell',2,.6],octo:['pearl',2,1]};
