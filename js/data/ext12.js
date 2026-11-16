'use strict';
/* v0.12.0：魔法と文化の研究・乗り物（葦舟・帆船）・防寒具・製造所・診療所・学校・交易所のデータ（ここに足すだけで増やせる） */
// ---- 新しい素材：銀貨（交易所で素材を売ると手に入る。素材を買うのに使う） ----
MAT.coin={n:'銀貨',em:'💰'};
// ---- 研究 ----
Object.assign(TECH,{
 // 古代
 t_boat:{era:1,n:'葦舟',f:'sci',lab:2,rp:18,cost:{reed:10,wood:8},d:'湖や川（水辺）を小舟で渡れる'},
 t_div:{era:1,n:'分業',f:'ind',lab:2,rp:16,cost:{wood:10,clay:4},d:'製造所を建てられる（住民の「製造」の仕事）'},
 // 古典：乗り物・文化
 t_ship:{era:2,n:'帆船',f:'sci',lab:4,rp:40,cost:{wood:30,reed:12,iron:4,fiber:10},req:['t_boat'],d:'海を船で渡れる。交易所をLv3にできる'},
 t_library:{era:2,n:'図書館',f:'cul',lab:4,rp:32,cost:{scroll:4,reed:10,wood:10},d:'研究が1.2倍速くなる。学校をLv3にできる'},
 t_theatre:{era:2,n:'劇場',f:'cul',lab:3,rp:28,cost:{stone:20,scroll:2,wood:12},d:'住民が住める人数+3'},
 // 古典：魔法（魔晶石と古文書を使う）
 t_mana:{era:2,n:'魔晶石の研究',f:'mag',lab:4,rp:36,cost:{mana:3,scroll:2},d:'見習いの杖（新しい武器種「魔法の杖」）・魔法のローブを製作できる'},
 t_fire_m:{era:2,n:'炎の魔法',f:'mag',lab:4,rp:38,cost:{mana:4,ember:4,scroll:1},req:['t_mana'],d:'炎の杖を製作できる'},
 t_ice_m:{era:2,n:'氷の魔法',f:'mag',lab:4,rp:38,cost:{mana:4,ice:6,scroll:1},req:['t_mana'],d:'氷の杖を製作できる'},
 t_ward:{era:2,n:'守りの魔法',f:'mag',lab:4,rp:36,cost:{mana:5,pearl:1,scroll:2},req:['t_mana'],d:'戦闘開始時にブロック+4。魔法使いの帽子を製作できる'},
 t_heal_m:{era:2,n:'癒しの魔法',f:'mag',lab:4,rp:36,cost:{mana:4,herb:8,scroll:2},req:['t_mana'],d:'最大HP+6。戦闘に勝った時の回復が増える'},
 t_ench:{era:2,n:'付与魔法',f:'mag',lab:5,rp:46,cost:{mana:6,gold:3,scroll:2},req:['t_ward'],d:'製作でコモン以外が出やすくなる（工房Lv1つ分）'},
 t_sage:{era:2,n:'賢者の知恵',f:'mag',lab:5,rp:50,cost:{mana:8,scroll:4,gold:3},req:['t_fire_m','t_ice_m'],d:'研究が1.15倍速くなる。賢者の杖を製作できる'}});
Object.assign(TECHFX,{t_ward:{firstBlock:4},t_heal_m:{maxhp:6}});
TECH.t_hide.d+='。毛皮の防寒着（防寒）を製作できる';
// ---- 新しい施設 ----
Object.assign(FAC,{
 works:{era:1,n:'製造所',em:'🏭',d:'住民が「製造」の仕事で、共有倉庫の素材から別の素材を作る（Lvごとに速くなる）',cost:[{wood:16,stone:10,clay:6},{stone:24,clay:10,copper:4},{stone:34,iron:6,wood:20}],work:[8,16,26],need:['t_div','t_masonry','t_coin']},
 clinic:{era:1,n:'診療所',em:'🏥',d:'みんなの最大HP Lv×4。戦闘に勝った時の回復 Lv×3%',cost:[{wood:12,herb:8,clay:4},{stone:16,herb:12,salt:4},{stone:24,herb:16,venom:4,scroll:1}],work:[6,14,22],need:['t_med','t_masonry','t_surgery']},
 school:{era:1,n:'学校',em:'🏫',d:'研究が速くなる（Lv×10%）',cost:[{wood:14,clay:8,reed:6},{stone:20,reed:10,clay:8},{stone:30,scroll:3,reed:12}],work:[8,16,24],need:['t_writing','t_coin','t_library']},
 market:{era:2,n:'交易所',em:'🏪',d:'個人倉庫の素材を銀貨で売り買いできる（倉庫タブ）。Lvが高いほど高く売れて安く買える',cost:[{wood:20,stone:14,copper:6},{stone:24,iron:4,gold:2},{stone:34,iron:6,gold:4,pearl:2}],work:[10,18,28],need:['t_coin','t_road','t_ship']}});
// ---- 製造：in＝共有倉庫から使う素材、out＝作れる数、tech＝必要な研究 ----
JOBS.make={n:'製造',em:'🏭',d:'製造所で素材を作る'};
CFG.jobPrio.make=2;CFG.jobOut.make=.5;
const MAKE={
 fiber:{in:{wood:1},out:2},clay:{in:{stone:1},out:1},reed:{in:{wood:1},out:1},
 copper:{in:{stone:3},out:1,tech:'t_copper'},salt:{in:{stone:2},out:1,tech:'t_salt'},
 iron:{in:{stone:4,wood:2},out:1,tech:'t_iron'},hide:{in:{fiber:3},out:1,tech:'t_mail'}};
// ---- 交易：素材の値打ち [銀貨, 買える時代] ----
const VAL={wood:[1],stone:[1],fiber:[1],berry:[1],clay:[1],reed:[1],meat:[1],herb:[2],flint:[2],hide:[2],bone:[2],cactus:[2],salt:[2],ice:[2],shell:[2],feather:[2],
 fang:[4],obsidian:[3],sulfur:[3],venom:[3],scale:[3],ember:[4],tusk:[6],pearl:[8],copper:[3,1],wool:[3,1],jade:[5,1],relic:[8,1],iron:[4,2],gold:[6,2],scroll:[8,2],mana:[12,2]};
function sellRate(){return .4+.1*facLv('market')}
function buyPrice(m){return Math.ceil(VAL[m][0]*(2.2-.2*facLv('market')))}
// ---- 魔法の杖（新しい武器種）：射程3、体勢ダメージは小さめ ----
WPN.wand={rg:3,pm:.6};REQN.wand='魔法の杖';
C('mg_bolt','魔弾','atk',1,'e','wand',[['d',6]]);
C('mg_ward','魔法障壁','def',1,'s','wand',[['b',6]]);
C('mg_fire','火球','atk',2,'E','wand',[['d',6,1.1],['s','bleed',2,'E']],{rw:1});
C('mg_frost','氷の槍','atk',1,'e','wand',[['d',4,.7],['s','weak',2,'t']],{rw:1});
C('mg_spark','雷撃','atk',1,'r','wand',[['d',3,.5,3]],{rw:1});
C('mg_mend','癒しの光','heal',1,'A','wand',[['hA',4]],{rw:1});
C('mg_focus','魔力集中','sp',0,'s','wand',[['en',1],['dr',1]],{rw:1,x:1});
C('mg_blink','転移','mov',0,'s','wand',[['mv',3],['ev',1]],{rw:1,x:1});
W('wand_novice','見習いの杖','🪄',2,2,'wand',1,3,'mg_bolt mg_bolt mg_ward mg_frost');
W('wand_flame','炎の杖','🔥',2,3,'wand',2,5,'mg_bolt mg_bolt mg_ward mg_fire mg_spark');
W('wand_frost','氷の杖','❄️',2,3,'wand',1,4,'mg_bolt mg_frost mg_frost mg_ward mg_blink');
W('wand_sage','賢者の杖','✨',2,4,'wand',2,6,'mg_bolt mg_fire mg_frost mg_ward mg_mend mg_focus',{pas:{heal:2}});
['wand_novice','wand_flame','wand_frost','wand_sage'].forEach(i=>EQ[i].ranged=true);
// ---- 防具：魔法・防寒（cold＝雪原で寒さを防ぐ） ----
Object.assign(ARM,{
 mage_robe:{n:'魔法のローブ',em:'🧙',sl:'b',hp:14,ps:8,red:1,mv:0,cold:1,d:'魔晶石の糸を織りこんだローブ。あたたかい'},
 mage_hat:{n:'魔法使いの帽子',em:'🎩',sl:'h',hp:12,ps:6,red:1,mv:0,d:'守りの魔法をかけた帽子'},
 fur_coat:{n:'毛皮の防寒着',em:'🧥',sl:'b',hp:8,ps:4,red:0,mv:0,cold:1,d:'毛皮を重ねた防寒着。雪原でも寒くない'}});
['hide_wear','hide_cap','hide_boots','wool_coat','wool_boots'].forEach(i=>{ARM[i].cold=1});
Object.assign(RECIPE,{
 wand_novice:{tech:'t_mana',shop:4,cost:{wood:6,mana:2,scroll:1}},wand_flame:{tech:'t_fire_m',shop:5,cost:{wood:8,mana:3,ember:3}},
 wand_frost:{tech:'t_ice_m',shop:5,cost:{wood:8,mana:3,ice:4}},wand_sage:{tech:'t_sage',shop:5,cost:{wood:10,mana:5,gold:3,scroll:2}},
 mage_robe:{tech:'t_mana',shop:4,cost:{wool:6,mana:2}},mage_hat:{tech:'t_ward',shop:4,cost:{wool:3,mana:2,pearl:1}},
 fur_coat:{tech:'t_hide',shop:1,cost:{hide:6,fiber:2}}});
// ---- 海の敵（古典。帆船で海に出ると出会う） ----
E('shark','サメ','🦈',44,22,'weak','charge',4,1,[['a','かみつき',11],['a','食いちぎり',6,1,'bleed',3]],null,{era:2});
E('pirate','海賊','🏴‍☠️',40,24,'weak','flank',4,1,[['a','カトラス',9],['a','二段斬り',5,2]],null,{era:2});
E('siren','セイレーン','🧜',32,16,'weak','shooter',3,3,[['a','水の矢',8],['x','歌声','weak',1,1]],null,{era:2});
bioAdd(2,'sea',{mobs:['shark','shark','pirate','siren']});
Object.assign(DROP,{shark:['fang',2,.7],pirate:['gold',1,.5],siren:['pearl',1,.4]});
