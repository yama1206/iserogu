'use strict';
/* v0.13.0：武器の整理（ここが最後に読まれる）
   どの武器種も先史時代の基本の武器から始まり、時代が進むほど上位互換（攻撃と枚数が上）に置きかわっていく
   ・短剣は剣にまとめる（黒曜石のナイフ → 銅のナイフ → 青銅の剣 → … ）
   ・鎚矛はなくし、棍棒からハンマーへ（棍棒 → マンモスの大牙 → 青銅のハンマー → 鉄のハンマー・戦鎚）
   ・魔法の杖はショボい枝から始まり、良い素材になっていく（ねじれた枝 → 翡翠のワンド → 魔晶石のワンド → …）
   ※ 武器の id は今のまま（セーブの装備がそのまま使える） */
// 武器を作りかえる（[時代, レアリティ, 武器種, 手, 攻撃, カード, 名前, 絵]。名前と絵は省略できる）
function reW(id,era,rar,tag,hands,atk,cards,n,em){const e=EQ[id];Object.assign(e,{era,rar,tags:[tag],hands,atk,cards:cards.split(' ')});if(n)e.n=n;if(em)e.em=em;e.ranged=/bow|wand/.test(tag)}
// ---- 短剣・鎚矛をなくす（カードも） ----
['knife','mace'].forEach(k=>{delete WPN[k];delete REQN[k]});
Object.keys(CARDS).forEach(id=>{if(/^(kn|mc)_/.test(id))delete CARDS[id]});
// ---- 新しい武器 ----
W('twig_wand','ねじれた枝','🌿',0,0,'wand',1,0,'mg_bolt mg_bolt mg_ward mg_frost');
W('jade_wand','翡翠のワンド','🟢',1,2,'wand',1,2,'mg_bolt mg_bolt mg_ward mg_frost mg_spark');
W('bronze_hammer','青銅のハンマー','🔨',1,2,'club',1,3,'cl_smash cl_smash cl_guard cl_crush cl_bash');
Object.assign(RECIPE,{twig_wand:{tech:'t_stone',shop:1,cost:{wood:2,herb:1}},jade_wand:{tech:'t_writing',shop:3,cost:{wood:4,jade:3}},
 bronze_hammer:{tech:'t_bronze',shop:3,forge:2,cost:{copper:6,wood:4}}});
// ---- 槍 ----
reW('stone_spear',0,0,'spear',1,0,'sp_thrust sp_thrust sp_guard sp_reach');
reW('mammoth_spear',0,3,'spear',2,2,'sp_thrust sp_thrust sp_guard sp_pierce sp_lunge');
reW('bronze_spear',1,2,'spear',1,3,'sp_thrust sp_thrust sp_guard sp_reach sp_pierce');
reW('iron_spear',2,2,'spear',1,5,'sp_thrust sp_thrust sp_guard sp_reach sp_pierce sp_twin');
// ---- 棍棒 → ハンマー ----
reW('wood_club',0,0,'club',1,0,'cl_smash cl_smash cl_guard cl_crush');
reW('b_tusk',0,3,'club',2,2,'cl_smash cl_smash cl_guard cl_crush cl_wild');
reW('iron_mace',2,2,'club',1,5,'cl_smash cl_smash cl_guard cl_crush cl_bash cl_stun','鉄のハンマー','🔨');
reW('warhammer',2,4,'club',2,6,'cl_smash cl_smash cl_guard cl_crush cl_stun cl_wild','戦鎚','⚒️');
// ---- 弓 ----
reW('short_bow',0,0,'bow',2,0,'bw_shot bw_shot bw_step bw_pin');
reW('hunt_bow',0,2,'bow',2,2,'bw_shot bw_shot bw_step bw_aim bw_pin');
reW('comp_bow',1,3,'bow',2,4,'bw_shot bw_shot bw_step bw_aim bw_volley');
reW('fire_bow',2,3,'bow',2,5,'bw_shot bw_shot bw_step bw_fire bw_volley bw_aim');
// ---- 杖 ----
reW('bone_staff',0,0,'staff',1,0,'st_hit st_hit st_parry st_sweep');
reW('priest_staff',1,2,'staff',1,2,'st_hit st_hit st_parry st_sweep g_herb');
reW('jade_staff',1,3,'staff',1,3,'st_hit st_hit st_parry st_sweep g_herb g_band');
reW('healer_staff',2,3,'staff',1,4,'st_hit st_hit st_parry st_sweep g_herb g_band');
reW('mana_staff',2,4,'staff',1,5,'st_hit st_hit st_parry st_crack g_herb g_band');
// ---- 斧 ----
reW('stone_axe',0,1,'axe',1,1,'ax_chop ax_chop ax_guard ax_rend');
reW('copper_axe',1,1,'axe',1,2,'ax_chop ax_chop ax_guard ax_rend ax_throw');
reW('bronze_axe',1,3,'axe',1,3,'ax_chop ax_chop ax_guard ax_rend ax_cleave');
reW('iron_axe',2,2,'axe',1,5,'ax_chop ax_chop ax_guard ax_rend ax_cleave ax_heavy');
// ---- 短剣 → 剣 ----
reW('obsidian_knife',0,1,'sword',1,1,'sw_slash sw_slash sw_parry sw_combo');
reW('copper_knife',1,1,'sword',1,2,'sw_slash sw_slash sw_parry sw_combo sw_counter');
reW('bronze_sword',1,2,'sword',1,3,'sw_slash sw_slash sw_parry sw_combo sw_thrust');
reW('khopesh',1,3,'sword',1,4,'sw_slash sw_slash sw_parry sw_cross sw_combo');
reW('iron_sword',2,2,'sword',1,5,'sw_slash sw_slash sw_parry sw_combo sw_thrust sw_cross');
reW('gladius',2,3,'sword',1,6,'sw_slash sw_thrust sw_parry sw_combo sw_cross sw_counter');
reW('falcata',2,3,'sword',1,6,'sw_slash sw_slash sw_cross sw_sweep sw_counter sw_parry');
reW('cent_sword',2,4,'sword',1,7,'sw_slash sw_thrust sw_parry sw_combo sw_cross sw_counter');
['gladius','cent_sword'].forEach(i=>{EQ[i].pas={}});   // 攻撃の上乗せは攻撃の数字にまとめた
// ---- 魔法の杖 ----
reW('wand_novice',2,2,'wand',1,4,'mg_bolt mg_bolt mg_ward mg_frost mg_spark','魔晶石のワンド','🔮');
reW('wand_frost',2,3,'wand',1,5,'mg_bolt mg_frost mg_frost mg_ward mg_blink mg_lance');
reW('wand_flame',2,3,'wand',2,5,'mg_bolt mg_bolt mg_ward mg_fire mg_spark mg_lance');
reW('wand_sage',2,4,'wand',2,7,'mg_bolt mg_fire mg_frost mg_ward mg_mend mg_lance');
// ---- 研究の説明 ----
TECH.t_stone.d='石槍・棍棒・小弓・骨の杖・ねじれた枝を製作できる。木の盾を製作できる';
TECH.t_knap.d='黒曜石のナイフ（剣）・石斧を製作できる';
TECH.t_copper.d='銅のナイフ（剣）・銅の斧を製作できる（炉が必要）';
TECH.t_bronze.d='青銅の剣・槍・戦斧・ハンマー・ケペシュ、青銅の兜・胸甲・すね当て・丸盾を製作できる（炉が必要）';
TECH.t_writing.d='研究が1.25倍速くなる。真珠の額飾り・翡翠のワンドを製作できる';
TECH.t_iron.d='炉をLv4にできる。鉄の剣・槍・斧・ハンマー、鉄の兜・すね当て・丸盾を製作できる（炉Lv4が必要）';
TECH.t_mana.d='魔晶石のワンド・魔法のローブを製作できる';
