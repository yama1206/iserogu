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
 scale_greave:{n:'うろこのすね当て',em:'🦵',sl:'f',hp:6,ps:6,red:1,mv:0,d:'うろこのすね当て。ダメージを少し防ぐ'},
 // 盾（v0.8.2）：blk＝毎ターンのブロック。両手武器（弓・大牙など）を持っている時は装備できない
 wicker_shield:{n:'編み盾',em:'🧺',sl:'s',hp:0,ps:2,red:0,mv:0,blk:1,d:'草と枝で編んだ軽い盾'},
 wood_shield:{n:'木の盾',em:'🪵',sl:'s',hp:2,ps:5,red:0,mv:0,blk:1,d:'丸太を削った素朴な盾'},
 hide_shield:{n:'毛皮張りの盾',em:'🛡️',sl:'s',hp:4,ps:6,red:0,mv:0,blk:2,d:'木の枠に毛皮を張った盾。よく防ぐ'},
 shell_shield:{n:'甲羅の盾',em:'🐢',sl:'s',hp:4,ps:10,red:0,mv:0,blk:2,d:'大きな甲羅の盾。体勢が崩れにくい'},
 tusk_shield:{n:'牙の大盾',em:'🦣',sl:'s',hp:6,ps:12,red:1,mv:-1,blk:3,d:'牙で組んだ大盾。とても硬いが移動力-1'}};
// 部位：k＝プレイヤーに覚える場所（装備している防具の u）
const SLOTS={h:{n:'頭',k:'ah'},b:{n:'胴',k:'a'},f:{n:'足',k:'af'},s:{n:'盾',k:'as'}},SLOTL=['h','b','f','s'];
// 防具の製作（RECIPE に足す。tech＝必要な研究、shop＝必要な工房Lv、cost＝素材（個人倉庫））
Object.assign(RECIPE,{
 grass_wear:{tech:'t_weave',shop:1,cost:{fiber:6,wood:1}},feather_cloak:{tech:'t_weave',shop:2,cost:{feather:4,fiber:6}},
 hide_wear:{tech:'t_hide',shop:1,cost:{hide:4,fiber:3}},bone_mail:{tech:'t_hide',shop:2,cost:{bone:6,hide:2}},shell_plate:{tech:'t_hide',shop:2,cost:{shell:6,fiber:4}},
 scale_mail:{tech:'t_ivory',shop:2,cost:{scale:4,hide:3}},tusk_mail:{tech:'t_ivory',shop:2,cost:{tusk:2,bone:4,hide:3}},
 grass_hat:{tech:'t_weave',shop:1,cost:{fiber:4}},straw_sandal:{tech:'t_weave',shop:1,cost:{fiber:4,wood:1}},
 hide_cap:{tech:'t_hide',shop:1,cost:{hide:2,fiber:1}},hide_boots:{tech:'t_hide',shop:1,cost:{hide:2,fiber:2}},bone_helm:{tech:'t_hide',shop:2,cost:{bone:4,hide:1}},
 wood_shield:{tech:'t_stone',shop:1,cost:{wood:5,fiber:2}},wicker_shield:{tech:'t_weave',shop:1,cost:{fiber:5,wood:2}},
 hide_shield:{tech:'t_hide',shop:1,cost:{wood:4,hide:3}},shell_shield:{tech:'t_hide',shop:2,cost:{shell:5,wood:3}},tusk_shield:{tech:'t_ivory',shop:2,cost:{tusk:2,hide:3,wood:4}},
 tusk_helm:{tech:'t_ivory',shop:2,cost:{tusk:1,fang:1,bone:2}},scale_greave:{tech:'t_ivory',shop:2,cost:{scale:2,hide:2}}});
TECH.t_weave={n:'編み物',f:'ind',lab:1,rp:6,cost:{fiber:5,wood:2},d:'草編みの服・羽根の外套・草の帽子・草鞋・編み盾（防具）を製作できる'};
TECH.t_hide.d='戦闘開始時にブロック+3。毛皮の服・骨の鎧・貝殻の胸当て・毛皮の帽子・骨の兜・毛皮の靴・毛皮張りの盾・甲羅の盾（防具）を製作できる';
TECH.t_ivory.d+='。うろこの鎧・牙の鎧・牙の兜・うろこのすね当て・牙の大盾（防具）を製作できる';
// 武器でも防具でも、装備の名前と絵文字
function itemOf(id){return EQ[id]||ARM[id]||{n:'？',em:'❔'}}
// 装備した防具（実物 g）の性能
function armStat(g){const a=ARM[g.id],m=RAR[g.r].m;return {hp:Math.round(a.hp*m),ps:Math.round(a.ps*m),red:a.red,mv:a.mv,blk:a.blk||0}}
function armInfo(g){const s=armStat(g);return ['HP+'+s.hp,'体勢+'+s.ps,s.red?'被ダメージ-'+s.red:'',s.blk?'毎ターン ブロック+'+s.blk:'',s.mv?'移動力'+(s.mv>0?'+':'')+s.mv:'',ARM[g.id].cold?'防寒':''].filter(x=>x).join('・')}
TECH.t_stone.d+='。木の盾を製作できる';
// 盾が使えるか（両手武器では使えない）
function shieldOk(p){return !(EQ[p.w]&&EQ[p.w].hands>=2)}
