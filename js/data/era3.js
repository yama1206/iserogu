'use strict';
/* v0.10.0：3時代目「古典」（鉄と帝国）のデータ（ここに足すだけで増やせる）
   古代の★重要技術（土器・青銅器・灌漑・文字）をすべて研究すると、この時代へ進む */
ERAS.push({n:'古典',sub:'鉄と帝国',ac:'#9fb4c8'});
// ---- 新しい素材：鉄鉱石（山岳・火山の採集ポイント） ----
MAT.iron={n:'鉄鉱石',em:'🔩'};
BIO.mount.node.push('iron','iron');BIO.volcano.node.push('iron');
// ---- 古典の研究 ----
Object.assign(TECH,{
 t_iron:{era:2,n:'鉄器',f:'sci',lab:3,rp:34,cost:{iron:8,ember:2,wood:10},key:1,d:'炉をLv4にできる。鉄の剣・槍・斧・鎚矛、鉄の兜・すね当て・丸盾を製作できる（炉Lv4が必要）'},
 t_steel:{era:2,n:'鍛鉄',f:'sci',lab:4,rp:40,cost:{iron:12,ember:3,sulfur:2},req:['t_iron'],d:'グラディウス・ファルカタ・戦鎚、ロリカ・スクトゥムを製作できる'},
 t_mail:{era:2,n:'鎖かたびら',f:'ind',lab:3,rp:28,cost:{iron:6,hide:4},req:['t_iron'],d:'鎖頭巾・鎖かたびらを製作できる'},
 t_coin:{era:2,n:'貨幣',f:'ind',lab:3,rp:30,cost:{copper:8,iron:2,salt:4},key:1,d:'住民の木こり・採掘が1.25倍になる。施設（研究小屋・工房・住居・共有倉庫）をLv5にできる'},
 t_aqueduct:{era:2,n:'水道',f:'agr',lab:3,rp:30,cost:{stone:24,clay:10,iron:2},key:1,d:'畑の食料が1.3倍になる。畑をLv5にできる'},
 t_philo:{era:2,n:'哲学',f:'cul',lab:4,rp:36,cost:{reed:10,clay:8,pearl:1},key:1,d:'研究が1.25倍速くなる。医術の杖を製作できる'},
 t_surgery:{era:2,n:'医術',f:'med',lab:3,rp:28,cost:{herb:10,venom:4,salt:2},req:['t_philo'],d:'最大HP+8。戦闘に勝った時の回復が増える'},
 t_firearrow:{era:2,n:'火矢',f:'sci',lab:3,rp:26,cost:{sulfur:4,feather:4,wood:6},d:'火矢の弓を製作できる'},
 t_road:{era:2,n:'街道',f:'ind',lab:3,rp:26,cost:{stone:20,iron:2},d:'開拓地を4か所多く作れる。旅人のサンダルを製作できる'}});
Object.assign(TECHFX,{t_surgery:{maxhp:8}});
// ---- 施設：炉Lv4（鉄）・ほかの施設Lv5 ----
FAC.forge.cost.push({stone:40,clay:16,iron:6});FAC.forge.work.push(30);FAC.forge.need.push('t_iron');
FAC.lab.cost.push({stone:40,iron:6,reed:12});FAC.lab.work.push(34);FAC.lab.need.push('t_coin');
FAC.shop.cost.push({stone:36,wood:28,iron:8});FAC.shop.work.push(34);FAC.shop.need.push('t_coin');
FAC.house.cost.push({stone:32,clay:16,wood:24});FAC.house.work.push(30);FAC.house.need.push('t_coin');
FAC.farm.cost.push({stone:20,clay:14,reed:12});FAC.farm.work.push(30);FAC.farm.need.push('t_aqueduct');
FAC.store.cost.push({stone:34,iron:4,wood:26});FAC.store.work.push(28);FAC.store.need.push('t_coin');
// ---- 鎚矛（古典の新しい武器種）：体勢を大きく崩す ----
WPN.mace={rg:1,pm:1.3};REQN.mace='鎚矛';
C('mc_bash','打ち据える','atk',1,'e','mace',[['d',7]]);
C('mc_guard','柄で受ける','def',1,'s','mace',[['b',5]]);
C('mc_break','兜割り','atk',2,'e','mace',[['d',9,1.6],['s','stun',1,'t']],{rw:1,pk:1.4,x:1});
C('mc_quake','地響き','atk',2,'E','mace',[['d',5,.9],['s','weak',1,'E']],{rw:1});
C('mc_rage','振りかぶり','sup',1,'s','mace',[['s','tstr',2,'s']],{rw:1});
C('sw_thrust','突き刺し','atk',1,'e','sword',[['d',6,1.1],['s','vuln',1,'t']],{rw:1});
C('bw_fire','火矢','atk',1,'e','bow',[['d',5,1],['s','bleed',3,'t']],{rw:1});
// ---- 古典の武器（era＝2） ----
W('iron_sword','鉄の剣','🗡️',2,2,'sword',1,4,'sw_slash sw_slash sw_parry sw_combo sw_thrust');
W('iron_spear','鉄の槍','🔱',2,2,'spear',1,4,'sp_thrust sp_thrust sp_guard sp_reach sp_pierce');
W('iron_axe','鉄の斧','🪓',2,2,'axe',1,4,'ax_chop ax_chop ax_guard ax_rend ax_cleave');
W('iron_mace','鉄の鎚矛','🔨',2,2,'mace',1,4,'mc_bash mc_bash mc_guard mc_break');
W('gladius','グラディウス','⚔️',2,3,'sword',1,5,'sw_slash sw_thrust sw_parry sw_combo sw_cross',{pas:{atk:1}});
W('falcata','ファルカタ','🔪',2,3,'sword',1,5,'sw_slash sw_slash sw_cross sw_sweep sw_counter');
W('warhammer','戦鎚','⚒️',2,4,'mace',2,6,'mc_bash mc_bash mc_guard mc_break mc_quake mc_rage');
W('fire_bow','火矢の弓','🏹',2,3,'bow',2,5,'bw_shot bw_shot bw_step bw_fire bw_volley');
W('healer_staff','医術の杖','⚕️',2,3,'staff',1,3,'st_hit st_hit st_parry st_sweep g_herb g_band',{pas:{heal:3}});
// ---- 古典の防具・盾 ----
Object.assign(ARM,{
 iron_helm:{n:'鉄の兜',em:'🪖',sl:'h',hp:12,ps:10,red:1,mv:0,d:'鉄を打った兜。青銅より丈夫'},
 mail_coif:{n:'鎖頭巾',em:'⛑️',sl:'h',hp:14,ps:8,red:2,mv:0,d:'鉄の輪を編んだ頭巾。よく防ぐ'},
 mail_shirt:{n:'鎖かたびら',em:'🦺',sl:'b',hp:24,ps:14,red:2,mv:0,d:'鉄の輪を編んだ鎧。動きやすい'},
 lorica:{n:'ロリカ',em:'🥋',sl:'b',hp:30,ps:20,red:3,mv:0,d:'鋼の板を重ねた鎧。とても丈夫'},
 iron_greave:{n:'鉄のすね当て',em:'🦿',sl:'f',hp:10,ps:12,red:1,mv:0,d:'鉄のすね当て。ダメージを少し防ぐ'},
 caligae:{n:'旅人のサンダル',em:'🩴',sl:'f',hp:8,ps:6,red:0,mv:1,d:'鋲を打った丈夫なサンダル。移動力+1'},
 iron_shield:{n:'鉄の丸盾',em:'🛡️',sl:'s',hp:10,ps:14,red:1,mv:0,blk:4,d:'鉄で縁取った丸盾。よく防ぐ'},
 scutum:{n:'スクトゥム',em:'🔰',sl:'s',hp:14,ps:20,red:2,mv:-1,blk:5,d:'体を隠す大きな長方形の盾。とても硬いが移動力-1'}});
// 製作（forge＝必要な炉Lv）
Object.assign(RECIPE,{
 iron_sword:{tech:'t_iron',shop:3,forge:4,cost:{iron:6,wood:2,hide:2}},iron_spear:{tech:'t_iron',shop:3,forge:4,cost:{iron:5,wood:6}},
 iron_axe:{tech:'t_iron',shop:3,forge:4,cost:{iron:6,wood:5}},iron_mace:{tech:'t_iron',shop:3,forge:4,cost:{iron:7,wood:4}},
 gladius:{tech:'t_steel',shop:4,forge:4,cost:{iron:8,ember:2,hide:2}},falcata:{tech:'t_steel',shop:4,forge:4,cost:{iron:8,ember:2,bone:3}},
 warhammer:{tech:'t_steel',shop:5,forge:4,cost:{iron:12,ember:3,wood:6}},
 fire_bow:{tech:'t_firearrow',shop:4,cost:{wood:10,sulfur:3,feather:4,fiber:4}},healer_staff:{tech:'t_philo',shop:4,cost:{wood:8,pearl:1,herb:6,iron:2}},
 iron_helm:{tech:'t_iron',shop:3,forge:4,cost:{iron:5,hide:2}},iron_greave:{tech:'t_iron',shop:3,forge:4,cost:{iron:4,hide:1}},
 iron_shield:{tech:'t_iron',shop:3,forge:4,cost:{iron:6,wood:4}},
 mail_coif:{tech:'t_mail',shop:3,forge:4,cost:{iron:5,hide:1}},mail_shirt:{tech:'t_mail',shop:4,forge:4,cost:{iron:9,hide:3}},
 lorica:{tech:'t_steel',shop:5,forge:4,cost:{iron:12,hide:3,ember:2}},scutum:{tech:'t_steel',shop:4,forge:4,cost:{iron:8,wood:8,hide:3}},
 caligae:{tech:'t_road',shop:3,cost:{hide:4,iron:1}}});
// ---- 個人施設 Lv4（古典） ----
PFAC.train.cost.push({wood:26,stone:20,iron:4});PFAC.train.need.push('t_iron');
PFAC.shed.cost.push({wood:30,stone:12,iron:2});PFAC.shed.need.push('t_iron');
PFAC.bed.cost.push({hide:12,feather:8,salt:4});PFAC.bed.need.push('t_surgery');
PFAC.garden.cost.push({stone:16,clay:10,iron:2});PFAC.garden.need.push('t_aqueduct');PFAC.garden.out.push({berry:5,herb:4,fiber:4,wood:3,clay:2});
PFAC.bench.cost.push({stone:16,iron:6,wood:10});PFAC.bench.need.push('t_steel');
// 開拓地の上限（街道で+4）
function outMaxN(){return CFG.outMax+(hasTech('t_road')?4:0)}
