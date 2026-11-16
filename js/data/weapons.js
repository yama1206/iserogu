'use strict';
/* 武器とキャラクター（ERA ARMS の先史時代から流用） */
const EQ={},EQL=[];
function W(id,n,em,era,rar,tags,hands,atk,cards,o){const e=Object.assign({id,n,em,era,rar,k:'w',tags:tags.split(' '),hands,atk,cards:cards.split(' '),pas:{}},o||{});e.ranged=/sling|bow/.test(tags);EQ[id]=e;EQL.push(e)}
W('stone_spear','石槍','🔱',0,0,'spear',1,0,'sp_thrust sp_thrust sp_guard sp_reach');
W('wood_club','棍棒','🏏',0,0,'club',1,0,'cl_smash cl_smash cl_guard cl_crush');
W('sling','投石紐','🪨',0,0,'sling',1,0,'sl_shot sl_shot sl_dodge sl_head');
W('bone_staff','骨の杖','🦴',0,0,'staff',1,0,'st_hit st_hit st_parry st_sweep');
W('obsidian_knife','黒曜石のナイフ','🔪',0,1,'knife',1,1,'kn_stab kn_slash kn_dodge kn_quick');
W('stone_axe','石斧','🪓',0,1,'axe',1,1,'ax_chop ax_chop ax_guard ax_rend');
W('hunt_bow','狩猟弓','🏹',0,2,'bow',2,2,'bw_shot bw_shot bw_step bw_aim bw_pin');
W('atlatl','投槍器アトラトル','🎯',0,2,'sling',1,2,'sl_shot sl_aim sl_rain sl_dodge sl_head');
W('mammoth_spear','マンモス牙の槍','🦷',0,3,'spear',2,3,'sp_thrust sp_thrust sp_guard sp_pierce sp_lunge sp_reach',{pas:{atk:1}});
W('b_tusk','マンモスの大牙','🦣',0,3,'club',2,4,'cl_smash cl_smash cl_guard cl_crush cl_wild cl_stun');
const CHARS=[
 {id:'hunter',n:'狩人',em:'🧑‍🦱',hp:72,ps:30,extra:['g_expose'],pas:{vulnPlus:1},d:'バランス型。無防備を与えて火力を上げる。'},
 {id:'warrior',n:'戦士',em:'🧔',hp:84,ps:40,extra:['g_taunt'],pas:{blockStart:1},d:'高HP・高体勢の前衛。挑発で敵を引きつける。'},
 {id:'slinger',n:'射手',em:'👦',hp:62,ps:24,extra:['g_dodge'],pas:{ranged:1},d:'遠距離攻撃が得意。体勢は崩されやすい。'},
 {id:'shaman',n:'呪医',em:'🧓',hp:66,ps:26,extra:['g_herb','g_herb','g_band'],pas:{heal:2},d:'回復役。薬草で仲間を治療する。'},
];
const CH={};CHARS.forEach(c=>CH[c.id]=c);
