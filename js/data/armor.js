'use strict';
/* 防具（v0.8.0〜）：製作して装備する。部位は 頭・胴・足 の3つ（sl：h頭 b胴 f足）。どれを作れるかは研究で増える。ここに足すだけで増やせる
   hp＝最大HP、ps＝体勢、red＝受けるダメージを1回ごとに減らす量、mv＝移動力。hp・ps はレアリティの倍率がかかる */
const ARM={
 grass_wear:{n:'草編みの服',em:'🥻',hp:4,ps:4,red:0,sl:'b',mv:0,d:'軽くて動きやすい、はじめての防具'},
 feather_cloak:{n:'羽根の外套',em:'🪶',hp:4,ps:2,red:0,sl:'b',mv:1,d:'とても軽い。移動力+1'},
 hide_wear:{n:'毛皮の服',em:'🧥',hp:10,ps:4,red:1,sl:'b',mv:0,d:'丈夫な毛皮。HPが増え、ダメージを少し防ぐ'},
 bone_mail:{n:'骨の鎧',em:'🦴',hp:8,ps:10,red:1,sl:'b',mv:0,d:'骨を編みこんだ鎧。体勢が崩れにくい'},
 shell_plate:{n:'貝殻の胸当て',em:'🐚',hp:6,ps:14,red:1,sl:'b',mv:0,d:'貝殻を重ねた胸当て。とても体勢が崩れにくい'},
 scale_mail:{n:'うろこの鎧',em:'💠',hp:14,ps:8,red:2,sl:'b',mv:0,d:'硬いうろこの鎧。ダメージをよく防ぐ'},
 tusk_mail:{n:'牙の鎧',em:'🦣',hp:18,ps:12,red:2,sl:'b',mv:-1,d:'マンモスの牙の重い鎧。とても硬いが移動力-1'},
 // 頭（v0.8.1）
 grass_hat:{n:'草の帽子',em:'👒',sl:'h',hp:2,ps:2,red:0,mv:0,d:'日よけの帽子。少しだけ丈夫になる'},
 hide_cap:{n:'毛皮の帽子',em:'🧢',sl:'h',hp:5,ps:3,red:0,mv:0,d:'あたたかい毛皮の帽子。HPが増える'},
 bone_helm:{n:'骨の兜',em:'💀',sl:'h',hp:4,ps:6,red:1,mv:0,d:'獣の頭骨の兜。ダメージを少し防ぐ'},
 tusk_helm:{n:'牙の兜',em:'⛑️',sl:'h',hp:8,ps:6,red:1,mv:0,d:'牙で補強した兜。とても丈夫'},
 // 足（v0.8.1）
 straw_sandal:{n:'草鞋',em:'🩴',sl:'f',hp:2,ps:3,red:0,mv:0,d:'草で編んだはきもの。足場が安定する'},
 hide_boots:{n:'毛皮の靴',em:'🥾',sl:'f',hp:4,ps:5,red:0,mv:0,d:'毛皮の靴。体勢が崩れにくい'},
 scale_greave:{n:'うろこのすね当て',em:'🦵',sl:'f',hp:6,ps:6,red:1,mv:0,d:'うろこのすね当て。ダメージを少し防ぐ'}};
// 部位：k＝プレイヤーに覚える場所（装備している防具の u）
const SLOTS={h:{n:'頭',k:'ah'},b:{n:'胴',k:'a'},f:{n:'足',k:'af'}},SLOTL=['h','b','f'];
// 防具の製作（RECIPE に足す。tech＝必要な研究、shop＝必要な工房Lv、cost＝素材（個人倉庫））
Object.assign(RECIPE,{
 grass_wear:{tech:'t_weave',shop:1,cost:{fiber:6,wood:1}},feather_cloak:{tech:'t_weave',shop:2,cost:{feather:4,fiber:6}},
 hide_wear:{tech:'t_hide',shop:1,cost:{hide:4,fiber:3}},bone_mail:{tech:'t_hide',shop:2,cost:{bone:6,hide:2}},shell_plate:{tech:'t_hide',shop:2,cost:{shell:6,fiber:4}},
 scale_mail:{tech:'t_ivory',shop:2,cost:{scale:4,hide:3}},tusk_mail:{tech:'t_ivory',shop:2,cost:{tusk:2,bone:4,hide:3}},
 grass_hat:{tech:'t_weave',shop:1,cost:{fiber:4}},straw_sandal:{tech:'t_weave',shop:1,cost:{fiber:4,wood:1}},
 hide_cap:{tech:'t_hide',shop:1,cost:{hide:2,fiber:1}},hide_boots:{tech:'t_hide',shop:1,cost:{hide:2,fiber:2}},bone_helm:{tech:'t_hide',shop:2,cost:{bone:4,hide:1}},
 tusk_helm:{tech:'t_ivory',shop:2,cost:{tusk:1,fang:1,bone:2}},scale_greave:{tech:'t_ivory',shop:2,cost:{scale:2,hide:2}}});
TECH.t_weave={n:'編み物',f:'ind',lab:1,rp:6,cost:{fiber:5,wood:2},d:'草編みの服・羽根の外套・草の帽子・草鞋（防具）を製作できる'};
TECH.t_hide.d='戦闘開始時にブロック+3。毛皮の服・骨の鎧・貝殻の胸当て・毛皮の帽子・骨の兜・毛皮の靴（防具）を製作できる';
TECH.t_ivory.d+='。うろこの鎧・牙の鎧・牙の兜・うろこのすね当て（防具）を製作できる';
// 武器でも防具でも、装備の名前と絵文字
function itemOf(id){return EQ[id]||ARM[id]||{n:'？',em:'❔'}}
// 装備した防具（実物 g）の性能
function armStat(g){const a=ARM[g.id],m=RAR[g.r].m;return {hp:Math.round(a.hp*m),ps:Math.round(a.ps*m),red:a.red,mv:a.mv}}
function armInfo(g){const s=armStat(g);return ['HP+'+s.hp,'体勢+'+s.ps,s.red?'被ダメージ-'+s.red:'',s.mv?'移動力'+(s.mv>0?'+':'')+s.mv:''].filter(x=>x).join('・')}
