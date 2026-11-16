'use strict';
/* 防具（v0.8.0）：製作して装備する。1人1つ（胴）。ここに足すだけで増やせる
   hp＝最大HP、ps＝体勢、red＝受けるダメージを1回ごとに減らす量、mv＝移動力。hp・ps はレアリティの倍率がかかる */
const ARM={
 grass_wear:{n:'草編みの服',em:'🥻',hp:4,ps:4,red:0,mv:0,d:'軽くて動きやすい、はじめての防具'},
 feather_cloak:{n:'羽根の外套',em:'🪶',hp:4,ps:2,red:0,mv:1,d:'とても軽い。移動力+1'},
 hide_wear:{n:'毛皮の服',em:'🧥',hp:10,ps:4,red:1,mv:0,d:'丈夫な毛皮。HPが増え、ダメージを少し防ぐ'},
 bone_mail:{n:'骨の鎧',em:'🦴',hp:8,ps:10,red:1,mv:0,d:'骨を編みこんだ鎧。体勢が崩れにくい'},
 shell_plate:{n:'貝殻の胸当て',em:'🐚',hp:6,ps:14,red:1,mv:0,d:'貝殻を重ねた胸当て。とても体勢が崩れにくい'},
 scale_mail:{n:'うろこの鎧',em:'💠',hp:14,ps:8,red:2,mv:0,d:'硬いうろこの鎧。ダメージをよく防ぐ'},
 tusk_mail:{n:'牙の鎧',em:'🦣',hp:18,ps:12,red:2,mv:-1,d:'マンモスの牙の重い鎧。とても硬いが移動力-1'}};
// 防具の製作（RECIPE に足す。tech＝必要な研究、shop＝必要な工房Lv、cost＝素材（個人倉庫））
Object.assign(RECIPE,{
 grass_wear:{tech:'t_weave',shop:1,cost:{fiber:6,wood:1}},feather_cloak:{tech:'t_weave',shop:2,cost:{feather:4,fiber:6}},
 hide_wear:{tech:'t_hide',shop:1,cost:{hide:4,fiber:3}},bone_mail:{tech:'t_hide',shop:2,cost:{bone:6,hide:2}},shell_plate:{tech:'t_hide',shop:2,cost:{shell:6,fiber:4}},
 scale_mail:{tech:'t_ivory',shop:2,cost:{scale:4,hide:3}},tusk_mail:{tech:'t_ivory',shop:2,cost:{tusk:2,bone:4,hide:3}}});
TECH.t_weave={n:'編み物',f:'ind',lab:1,rp:6,cost:{fiber:5,wood:2},d:'草編みの服・羽根の外套（防具）を製作できる'};
TECH.t_hide.d='戦闘開始時にブロック+3。毛皮の服・骨の鎧・貝殻の胸当て（防具）を製作できる';
TECH.t_ivory.d+='。うろこの鎧・牙の鎧（防具）を製作できる';
// 武器でも防具でも、装備の名前と絵文字
function itemOf(id){return EQ[id]||ARM[id]||{n:'？',em:'❔'}}
// 装備した防具（実物 g）の性能
function armStat(g){const a=ARM[g.id],m=RAR[g.r].m;return {hp:Math.round(a.hp*m),ps:Math.round(a.ps*m),red:a.red,mv:a.mv}}
function armInfo(g){const s=armStat(g);return ['HP+'+s.hp,'体勢+'+s.ps,s.red?'被ダメージ-'+s.red:'',s.mv?'移動力'+(s.mv>0?'+':'')+s.mv:''].filter(x=>x).join('・')}
