'use strict';
/* 探索のデータ：素材・採集ポイント・出現する敵・戦利品（地域や素材はここに足すだけで増やせる） */
const MAT={
 wood:{n:'木材',em:'🪵'},stone:{n:'石',em:'🪨'},fiber:{n:'草の繊維',em:'🌿'},berry:{n:'木の実',em:'🍒'},herb:{n:'薬草',em:'🍀'},flint:{n:'火打石',em:'✨'},
 hide:{n:'毛皮',em:'🧥'},meat:{n:'肉',em:'🍖'},bone:{n:'骨',em:'🦴'},fang:{n:'鋭い牙',em:'🦷'},tusk:{n:'マンモスの牙',em:'🐘'}};
// 採集ポイント：フィールドの地形ごとに出る素材（多く書いた物ほど出やすい）
const NODES={p:['fiber','fiber','stone'],f:['wood','wood','berry','herb'],h:['flint','stone','stone']};
// ランダムエンカウント：地域ごとの敵（mobs＝通常、elite＝遠くでまれに出る強敵）
const ENC={grass:{mobs:['hyena','hyena','wolf','boar'],elite:['bear']},forest:{mobs:['boar','snake','monkey','wolf'],elite:['bear']}};
// 決まった場所にいる敵（k: e強敵 / b ボス、far＝拠点からの距離[最小,最大]、on＝置く地域）
const FIXED=[{k:'e',en:['saber'],on:'forest',far:[12,18]},{k:'b',en:['mammoth'],on:'grass',far:[22,99]}];
// 戦利品：[素材, 数, 落とす確率]
const DROP={wolf:['hide',1,.6],hyena:['bone',1,.6],boar:['meat',1,.8],snake:['bone',1,.4],monkey:['berry',1,.6],saber:['fang',2,1],bear:['hide',3,1],mammoth:['tusk',2,1]};
