'use strict';
/* 拠点のデータ：施設・研究・製作・レアリティ・住民の仕事（ここに足すだけで増やせる） */
// 施設：cost[Lv-1]＝そのLvにする素材（共有倉庫）、work＝建築の作業量（建築担当の住民が1時間に1ずつ進める）、need[Lv-1]＝必要な研究
const FAC={
 lab:{n:'研究小屋',em:'🔬',d:'研究ができる。Lvが高いほど研究が速く、難しい研究に挑める',cost:[{wood:6,stone:4},{wood:14,stone:10,flint:3},{wood:24,stone:20,hide:4}],work:[4,10,18],need:[null,'t_build','t_ivory']},
 shop:{n:'工房',em:'🔨',d:'武器を製作できる。Lvが高いほど良いレアリティが出やすい',cost:[{wood:6,fiber:4},{wood:12,stone:8,bone:3},{wood:20,stone:16,fang:2}],work:[4,10,18],need:[null,'t_build','t_ivory']},
 house:{n:'住居',em:'🛖',d:'住民が住める人数が増える（Lv×3＋1人）',cost:[{wood:5},{wood:12,fiber:8},{wood:22,stone:10,hide:4}],work:[3,8,16],need:[null,'t_build','t_fire']},
 farm:{n:'畑',em:'🌾',d:'農業担当の住民が作る食料が増える',cost:[{fiber:6,berry:4},{wood:10,fiber:10},{wood:18,stone:8,herb:6}],work:[4,8,16],need:['t_farm','t_build','t_fire']},
 store:{n:'共有倉庫',em:'📦',d:'住民が集めた素材と食料をためておける量が増える（Lv×40＋40）',cost:[{wood:8},{wood:16,stone:8},{wood:28,stone:16}],work:[3,8,14],need:[null,'t_build','t_fire']}};
// 研究：f＝分野、lab＝必要な研究小屋Lv、rp＝必要な研究ポイント、cost＝素材（共有倉庫）、req＝先に必要な研究、key＝時代を進めるのに必要な重要技術
const FIELD6={sci:'科学・技術',ind:'生産・工業',agr:'農業・食料',cul:'文化・社会',med:'医療・生物',mag:'魔法・異世界技術'};
const TECH={
 t_stone:{n:'打製石器',f:'sci',lab:1,rp:6,cost:{stone:5},key:1,d:'石槍・棍棒・投石紐・骨の杖を製作できる'},
 t_fire:{n:'火の利用',f:'sci',lab:1,rp:8,cost:{wood:5,flint:2},key:1,d:'戦闘に勝った時の回復量が増える'},
 t_farm:{n:'採集と栽培',f:'agr',lab:1,rp:8,cost:{berry:4,fiber:4},key:1,d:'畑を建てられる'},
 t_build:{n:'木組みの建築',f:'ind',lab:1,rp:10,cost:{wood:8,fiber:4},d:'施設をLv2にできる'},
 t_herb:{n:'薬草の知識',f:'med',lab:1,rp:8,cost:{herb:4},d:'最大HP+6'},
 t_knap:{n:'黒曜石の加工',f:'ind',lab:1,rp:10,cost:{stone:6,flint:3},req:['t_stone'],d:'黒曜石のナイフ・石斧を製作できる'},
 t_hide:{n:'皮なめし',f:'ind',lab:2,rp:12,cost:{hide:3,fiber:4},d:'戦闘開始時にブロック+3'},
 t_bow:{n:'弓矢',f:'sci',lab:2,rp:16,cost:{wood:8,fiber:6,bone:2},req:['t_knap'],key:1,d:'狩猟弓・投槍器アトラトルを製作できる'},
 t_ivory:{n:'牙の加工',f:'ind',lab:2,rp:20,cost:{fang:2,tusk:2,bone:4},req:['t_bow'],d:'マンモス牙の武器を製作できる。施設をLv3にできる'}};
// 研究で全員にかかる効果（戦闘の能力値に足す）
const TECHFX={t_herb:{maxhp:6},t_hide:{firstBlock:3}};
// 製作：tech＝必要な研究、shop＝必要な工房Lv、cost＝素材（個人倉庫）
const RECIPE={
 stone_spear:{tech:'t_stone',shop:1,cost:{wood:3,stone:2}},wood_club:{tech:'t_stone',shop:1,cost:{wood:4}},
 sling:{tech:'t_stone',shop:1,cost:{fiber:4,stone:1}},bone_staff:{tech:'t_stone',shop:1,cost:{wood:2,bone:2}},
 obsidian_knife:{tech:'t_knap',shop:1,cost:{stone:4,flint:3}},stone_axe:{tech:'t_knap',shop:1,cost:{stone:5,wood:3}},
 hunt_bow:{tech:'t_bow',shop:2,cost:{wood:6,fiber:5}},atlatl:{tech:'t_bow',shop:2,cost:{wood:4,bone:3,fiber:3}},
 mammoth_spear:{tech:'t_ivory',shop:2,cost:{tusk:2,wood:4,fang:1}},b_tusk:{tech:'t_ivory',shop:2,cost:{tusk:3,hide:2}}};
// レアリティ：p＝出現率、m＝基本性能（武器のカードのダメージとブロック）の倍率、fx＝追加効果の数[最小,最大]
const RAR=[{n:'コモン',c:'#c8c8c8',p:.6,m:1,fx:[0,0]},{n:'アンコモン',c:'#70d070',p:.25,m:1.12,fx:[0,1]},{n:'レア',c:'#60a8ff',p:.1,m:1.25,fx:[1,1]},{n:'エピック',c:'#c080ff',p:.04,m:1.4,fx:[1,2]},{n:'レジェンダリー',c:'#ffb040',p:.01,m:1.6,fx:[2,2]}];
// 追加効果：[能力値, 量, 表示]
const GFX=[['atk',1,'攻撃+1'],['maxhp',6,'最大HP+6'],['blockStart',2,'毎ターン ブロック+2'],['energyFirst',1,'最初のターン ⚡+1'],['drawFirst',1,'最初のターン 手札+1'],['heal',1,'回復量+1'],['move',1,'移動力+1'],['evadeStart',1,'最初のターン 回避1回']];
const GFXN={};GFX.forEach(g=>GFXN[g[0]]=g);
// 住民の仕事（out＝1人が1時間に作る量）
const JOBS={farm:{n:'農業',em:'🌾',d:'食料を作る'},lumber:{n:'林業',em:'🪵',d:'木材を共有倉庫に集める'},mine:{n:'採掘',em:'🪨',d:'石を共有倉庫に集める'},research:{n:'研究',em:'🔬',d:'研究を進める'},build:{n:'建築',em:'🏗️',d:'建築を進める'}};
const PRIO=['なし','低','中','高'];
