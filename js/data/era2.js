'use strict';
/* v0.9.0：2時代目「古代」（土器と青銅）・個人施設・カードの強化のデータ（ここに足すだけで増やせる）
   研究の era＝その時代（書いていない物は0＝先史時代）。前の時代の★重要技術をすべて研究すると、次の時代の研究ができるようになる */
ERAS.push({n:'古代',sub:'土器と青銅',ac:'#d8a848'});
// ---- 古代の研究 ----
Object.assign(TECH,{
 t_pottery:{era:1,n:'土器',f:'ind',lab:2,rp:18,cost:{clay:6,wood:6},key:1,d:'炉を建てられる。砂漠の衣・葦の大盾を製作できる'},
 t_copper:{era:1,n:'銅の精錬',f:'sci',lab:2,rp:20,cost:{copper:4,wood:8},req:['t_pottery'],d:'銅のナイフ・銅の斧を製作できる（炉が必要）'},
 t_bronze:{era:1,n:'青銅器',f:'sci',lab:3,rp:30,cost:{copper:8,ember:2,stone:8},req:['t_copper'],key:1,d:'青銅の剣・槍・戦斧・ケペシュ、青銅の兜・胸甲・すね当て・丸盾を製作できる（炉が必要）'},
 t_masonry:{era:1,n:'石積み',f:'ind',lab:2,rp:22,cost:{stone:16,clay:6},d:'施設をLv4にできる。炉をLv3にできる'},
 t_irrig:{era:1,n:'灌漑',f:'agr',lab:2,rp:20,cost:{reed:6,clay:4},key:1,d:'畑の食料が1.5倍になる。畑をLv4にできる'},
 t_salt:{era:1,n:'塩漬け',f:'agr',lab:2,rp:14,cost:{salt:4,meat:3},d:'戦闘に勝った時の回復が増える'},
 t_ice:{era:1,n:'氷室',f:'agr',lab:2,rp:14,cost:{ice:6,stone:6},d:'住民が共有倉庫にためられる量+40'},
 t_med:{era:1,n:'薬学',f:'med',lab:3,rp:24,cost:{herb:8,venom:3},d:'最大HP+8。祭司の杖を製作できる'},
 t_compbow:{era:1,n:'合成弓',f:'sci',lab:3,rp:24,cost:{wood:8,bone:6,scale:2},req:['t_bronze'],d:'合成弓を製作できる'},
 t_writing:{era:1,n:'文字',f:'cul',lab:3,rp:28,cost:{clay:8,reed:6},key:1,d:'研究が1.25倍速くなる。真珠の額飾りを製作できる'}});
Object.assign(TECHFX,{t_med:{maxhp:8}});
// ---- 古代の施設：炉（青銅の製作に必要）と、Lv4 ----
FAC.forge={era:1,n:'炉',em:'🏺',d:'土器と金属を焼く炉。銅・青銅の装備の製作に必要（Lvが高いほど作れる物が増える）',cost:[{stone:12,clay:6},{stone:20,clay:10,copper:4},{stone:30,clay:14,ember:3}],work:[6,12,20],need:['t_pottery','t_bronze','t_masonry']};
FAC.lab.cost.push({stone:30,clay:12,reed:8});FAC.lab.work.push(28);FAC.lab.need.push('t_masonry');
FAC.shop.cost.push({stone:28,wood:20,copper:4});FAC.shop.work.push(28);FAC.shop.need.push('t_masonry');
FAC.house.cost.push({stone:24,clay:12,wood:16});FAC.house.work.push(24);FAC.house.need.push('t_masonry');
FAC.farm.cost.push({reed:10,clay:10,wood:12});FAC.farm.work.push(24);FAC.farm.need.push('t_irrig');
FAC.store.cost.push({stone:26,clay:12,wood:20});FAC.store.work.push(22);FAC.store.need.push('t_masonry');
// ---- 剣（古代の新しい武器種） ----
WPN.sword={rg:1,pm:.9};REQN.sword='剣';
C('sw_slash','斬る','atk',1,'e','sword',[['d',6]]);
C('sw_parry','受け流し','def',1,'s','sword',[['b',5],['ev',1]]);
C('sw_combo','連撃','atk',1,'e','sword',[['d',3,.55,2]],{rw:1});
C('sw_cross','十字斬り','atk',2,'e','sword',[['d',9,1.6],['s','vuln',1,'t']],{rw:1});
C('sw_sweep','横薙ぎ','atk',1,'E','sword',[['d',4,.7]],{rw:1});
C('sw_counter','見切り','evd',0,'s','sword',[['ev',1],['b',2,.3]],{rw:1,x:1});
// ---- 古代の武器（era＝1） ----
W('copper_knife','銅のナイフ','🔪',1,1,'knife',1,2,'kn_stab kn_stab kn_slash kn_dodge kn_quick');
W('copper_axe','銅の斧','🪓',1,1,'axe',1,2,'ax_chop ax_chop ax_guard ax_rend');
W('bronze_sword','青銅の剣','🗡️',1,2,'sword',1,3,'sw_slash sw_slash sw_parry sw_combo');
W('bronze_spear','青銅の槍','🔱',1,2,'spear',1,3,'sp_thrust sp_thrust sp_guard sp_reach sp_pierce');
W('bronze_axe','青銅の戦斧','⚒️',1,3,'axe',1,4,'ax_chop ax_chop ax_guard ax_rend ax_cleave');
W('khopesh','ケペシュ','⚔️',1,3,'sword',1,4,'sw_slash sw_slash sw_parry sw_cross sw_combo',{pas:{atk:1}});
W('priest_staff','祭司の杖','🪄',1,2,'staff',1,2,'st_hit st_hit st_parry st_sweep g_herb',{pas:{heal:2}});
W('comp_bow','合成弓','🏹',1,3,'bow',2,4,'bw_shot bw_shot bw_step bw_aim bw_volley');
// ---- 古代の防具・盾 ----
Object.assign(ARM,{
 desert_robe:{n:'砂漠の衣',em:'🧕',sl:'b',hp:8,ps:6,red:0,mv:1,d:'サボテンの繊維で織った軽い衣。移動力+1'},
 bronze_helm:{n:'青銅の兜',em:'🪖',sl:'h',hp:10,ps:8,red:1,mv:0,d:'青銅を打ち出した兜。とても丈夫'},
 pearl_circlet:{n:'真珠の額飾り',em:'📿',sl:'h',hp:12,ps:4,red:0,mv:0,d:'真珠をあしらった額飾り。不思議と力がわく'},
 bronze_cuirass:{n:'青銅の胸甲',em:'🥋',sl:'b',hp:22,ps:16,red:2,mv:0,d:'青銅の板を合わせた胸甲。よく防ぐ'},
 bronze_greave:{n:'青銅のすね当て',em:'🦿',sl:'f',hp:8,ps:10,red:1,mv:0,d:'青銅のすね当て。ダメージを少し防ぐ'},
 reed_shield:{n:'葦の大盾',em:'🎋',sl:'s',hp:4,ps:8,red:0,mv:0,blk:2,d:'葦を束ねた軽い大盾'},
 bronze_shield:{n:'青銅の丸盾',em:'🛡️',sl:'s',hp:8,ps:12,red:1,mv:0,blk:3,d:'青銅で縁取った丸盾。よく防ぐ'},
 aspis:{n:'大円盾',em:'🔰',sl:'s',hp:10,ps:16,red:1,mv:-1,blk:4,d:'青銅張りの大きな円盾。とても硬いが移動力-1'}});
// 製作（forge＝必要な炉Lv）
Object.assign(RECIPE,{
 copper_knife:{tech:'t_copper',shop:2,forge:1,cost:{copper:3,wood:2}},copper_axe:{tech:'t_copper',shop:2,forge:1,cost:{copper:4,wood:4}},
 bronze_sword:{tech:'t_bronze',shop:3,forge:2,cost:{copper:6,ember:1,hide:2}},bronze_spear:{tech:'t_bronze',shop:3,forge:2,cost:{copper:5,wood:6}},
 bronze_axe:{tech:'t_bronze',shop:3,forge:2,cost:{copper:7,wood:5,ember:1}},khopesh:{tech:'t_bronze',shop:4,forge:3,cost:{copper:8,ember:2,obsidian:2}},
 priest_staff:{tech:'t_med',shop:3,cost:{wood:6,pearl:1,herb:4}},comp_bow:{tech:'t_compbow',shop:3,cost:{wood:8,bone:4,scale:2,fiber:4}},
 desert_robe:{tech:'t_pottery',shop:2,cost:{cactus:5,fiber:4}},reed_shield:{tech:'t_pottery',shop:2,cost:{reed:6,wood:3}},
 bronze_helm:{tech:'t_bronze',shop:3,forge:2,cost:{copper:4,hide:2}},bronze_cuirass:{tech:'t_bronze',shop:3,forge:2,cost:{copper:8,hide:3,ember:1}},
 bronze_greave:{tech:'t_bronze',shop:3,forge:2,cost:{copper:4,hide:1}},bronze_shield:{tech:'t_bronze',shop:3,forge:2,cost:{copper:5,wood:4}},
 aspis:{tech:'t_bronze',shop:4,forge:3,cost:{copper:8,wood:6,hide:3}},pearl_circlet:{tech:'t_writing',shop:3,cost:{pearl:2,copper:2}}});
// ---- 個人施設（v0.9.0）：自分だけの施設。個人倉庫の素材で、すぐに建つ。cost[Lv-1]、need[Lv-1]＝必要な研究 ----
const PFAC={
 train:{n:'鍛錬場',em:'🥋',d:'カードを永久に強化できる（Lvごとに4種類まで）。強化したカードは冒険の最初から強化済み',cost:[{wood:8,stone:6},{wood:14,stone:10,hide:3},{wood:20,stone:16,copper:4}],need:[null,'t_build','t_copper']},
 shed:{n:'物置',em:'🗄️',d:'装備していない装備をしまっておける（Lvごとに10個）。しまった装備は取り出すまで使えない',cost:[{wood:10},{wood:16,stone:8},{wood:24,clay:8}],need:[null,'t_build','t_pottery']},
 bed:{n:'寝床',em:'🛏️',d:'よく眠れて体が丈夫になる（最大HP Lv×4）',cost:[{fiber:8,hide:2},{hide:5,feather:4},{hide:8,feather:6,pearl:1}],need:[null,'t_hide','t_writing']},
 garden:{n:'家庭菜園',em:'🪴',d:'毎日、素材がとれる（「収穫」で個人倉庫へ。7日分までたまる）',cost:[{wood:6,fiber:6},{wood:10,clay:6},{stone:12,clay:8,reed:6}],need:['t_farm','t_build','t_irrig'],
  out:[{berry:2,herb:1},{berry:3,herb:2,fiber:2},{berry:4,herb:3,fiber:3,wood:2}]},
 bench:{n:'作業台',em:'🛠️',d:'自分が製作する時、コモン以外が出やすくなる（Lvごとに工房Lv1つ分の半分）',cost:[{wood:8,stone:4,flint:2},{wood:12,bone:6,fang:2},{stone:12,copper:6}],need:[null,'t_knap','t_copper']}};
// カードの永久強化の素材（n＝これまでに強化した数）
function cupCost(n){const o={wood:4+n*2,stone:3+n*2};if(n>=3)o.hide=n-2;if(n>=6)o.copper=n-5;return o}
// ---- v0.11.0 古代の敵と素材（古代になってから現れる） ----
Object.assign(MAT,{wool:{n:'羊毛',em:'🧶'},jade:{n:'翡翠',em:'🟢'},relic:{n:'古代の遺物',em:'⚱️'}});
E('bandit','野盗','🥷',30,18,'weak','flank',4,1,[['a','斬りつけ',7],['a','足払い',3,1,'weak',1]],[0,0,1],{era:1});
E('archer','野盗の弓兵','🏹',22,12,'weak','shooter',3,4,[['a','矢',6],['a','二連射',3,2]],[0,0,1],{era:1});
E('sheep','野生ヒツジ','🐑',26,16,'rand','charge',3,1,[['a','頭突き',7],['d','毛で守る',6]],[0,0,1],{era:1});
E('goblin','ゴブリン','👺',24,12,'weak','flank',4,1,[['a','こん棒',6],['a','つまずかせ',2,2]],null,{era:1});
E('mummy','ミイラ','🧟',36,22,'rand','guard',2,1,[['a','呪いの手',5,1,'weak',1],['d','包帯を巻く',8]],[0,0,1],{era:1});
E('bwar','青銅の戦士','💂',95,52,'strong','guard',3,1,[['a','青銅の剣',13],['d','盾を構える',12],['A','なぎ払い',6]],null,{era:1});
E('ent','怒れる古木','🌳',100,60,'rand','guard',2,2,[['A','枝の鞭',7],['a','根の締め付け',12,1,'weak',1],['d','樹皮',14]],null,{era:1,ar:2});
E('sphinx','スフィンクス','🦁',190,100,'weak','flank',3,1,[['a','前足',15],['x','謎かけ','weak',1,1],['A','咆哮',8],['d','石の体',12,2]],null,{era:1,ar:2});
E('giant','丘の巨人','🧌',200,105,'strong','charge',2,2,[['A','大こん棒',9],['a','踏みつぶし',18],['d','岩を盾に',12,2]],null,{era:1,ar:2});
bioAdd(1,'grass forest desert snow swamp mount coast',{mobs:['bandit','archer']});
bioAdd(1,'grass',{mobs:['sheep','sheep'],elite:['bwar'],boss:['giant']});
bioAdd(1,'forest',{mobs:['goblin','goblin'],elite:['ent'],boss:['giant']});
bioAdd(1,'desert',{mobs:['mummy','mummy'],elite:['bwar'],boss:['sphinx','sphinx']});
bioAdd(1,'snow',{mobs:['sheep','goblin'],elite:['bwar'],boss:['giant']});
bioAdd(1,'swamp',{mobs:['mummy','goblin'],elite:['ent'],node:['jade']});
bioAdd(1,'mount',{mobs:['sheep','goblin'],elite:['bwar'],boss:['giant','sphinx'],node:['copper','copper','jade']});
bioAdd(1,'volcano',{mobs:['goblin'],elite:['bwar'],node:['copper']});
bioAdd(1,'coast',{mobs:['bandit'],elite:['bwar']});
Object.assign(DROP,{bandit:['copper',1,.5],archer:['feather',1,.6],sheep:['wool',1,.9],goblin:['jade',1,.4],mummy:['relic',1,.3],bwar:['relic',2,1],ent:['wood',6,1],sphinx:['relic',4,1],giant:['relic',4,1]});
// 古代の素材を使う装備
W('jade_staff','翡翠の杖','🦯',1,3,'staff',1,3,'st_hit st_hit st_parry st_sweep g_herb g_band',{pas:{heal:2,atk:1}});
Object.assign(ARM,{
 wool_coat:{n:'羊毛の上着',em:'👘',sl:'b',hp:16,ps:10,red:1,mv:0,d:'あたたかい羊毛の上着。軽くて丈夫'},
 wool_boots:{n:'羊毛のくつ',em:'🥾',sl:'f',hp:8,ps:8,red:0,mv:0,d:'羊毛を詰めたくつ。体勢をくずしにくい'},
 relic_crown:{n:'遺物の冠',em:'👑',sl:'h',hp:16,ps:10,red:1,mv:0,d:'古代の遺物から作った冠。最大HPが高い'}});
Object.assign(RECIPE,{wool_coat:{tech:'t_pottery',shop:2,cost:{wool:6,fiber:4}},wool_boots:{tech:'t_pottery',shop:2,cost:{wool:4,hide:2}},
 relic_crown:{tech:'t_bronze',shop:3,forge:2,cost:{relic:2,jade:2,copper:2}},jade_staff:{tech:'t_writing',shop:3,cost:{wood:6,jade:4,herb:4}}});
PFAC.bed.cost[2].wool=4;
