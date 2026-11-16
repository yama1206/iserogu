'use strict';
/* イセログ：調整用の数値はすべてここ（data/cfg） */
const VERSION='0.1.0';
const CFG={
 grid:8,handSize:5,energy:3,handMax:10,maxPlayers:4,moveMp:3,
 // 向き：攻撃する面ごとの倍率（HPダメージ／体勢ダメージ）
 dirHp:{front:1,side:1.25,back:1.5},dirPs:{front:1,side:1.5,back:2},
 followPs:1.25,   // 追撃：同じターンに別の味方が攻撃済みの敵への体勢ダメージ
 brokenDmg:1.3,   // 体勢崩し中に受けるダメージ
 psRegen:.15,     // 体勢値の自然回復（最大値に対する割合・毎ターン）
 blockPs:.5,      // 攻撃を全部ブロックした時に受ける体勢ダメージの割合
 enemyPs:.6,      // 敵の攻撃の体勢ダメージ（HPダメージに対する割合）
 hillDmg:1.15,hillRange:1,forestRanged:.75,
 rescueCost:2,rescuePct:.3,rescueTurns:3,afterDownPct:.25,winHeal:.2,
 hpMul:[1,1.4,1.7,2],eliteHpMul:[1,2,3,4],bossHpMul:[1,2.9,5.6,8],dmgMul:[1,1.25,1.5,1.7],bossDmgMul:[1,1.6,2.3,2.8],bossHp:.8,bossDmg:.85,
 enemyStep:800,
 startWeapons:['stone_spear','wood_club','sling','bone_staff'],
 eliteWeapons:['obsidian_knife','stone_axe','hunt_bow','atlatl'],
 bossWeapons:['mammoth_spear','b_tusk'],
 mobs:['hyena','wolf','boar','snake','monkey'],
 // v0.1.0 の連戦（探索ができるまでの仮の進行）
 stages:[{k:'n',en:['hyena','wolf'],field:'grass'},{k:'n',en:['boar','monkey','snake'],field:'forest'},{k:'e',en:['saber'],field:'forest'},{k:'n',en:['wolf','boar','monkey'],field:'grass'},{k:'b',en:['mammoth'],field:'grass'}]
};
// 武器種ごとの性質（射程・体勢ダメージ倍率）。レアリティや時代では変わらない
const WPN={spear:{rg:2,pm:1},club:{rg:1,pm:1.5},sling:{rg:4,pm:.5},staff:{rg:1,pm:.8},knife:{rg:1,pm:.5},axe:{rg:1,pm:.7},bow:{rg:5,pm:.4},none:{rg:1,pm:.6}};
