'use strict';
/* イセログ：調整用の数値はすべてここ（data/cfg） */
const VERSION='0.6.0';
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
 autoStep:450,     // オートバトルで1つの行動にかける時間（ミリ秒）
 skipTurns:3,skipHp:.2,skipHit:.7,skipDmg:.5, // バトルスキップ：倒すまで3ターン以内・受けるダメージが今のHPの20%以内の時だけ（skipHit＝攻撃に使える割合、skipDmg＝受けるダメージの見積もり）
 startWeapons:['stone_spear','wood_club','sling','bone_staff'],
 eliteWeapons:['obsidian_knife','stone_axe','hunt_bow','atlatl'],
 bossWeapons:['mammoth_spear','b_tusk'],
 mobs:['hyena','wolf','boar','snake','monkey'],
 // ---- 探索（v0.2.0） ----
 // ---- 広がるフィールド（v0.6.0）：端がなく、近づいた所から種で作る。拠点は(0,0) ----
 chunk:16,         // 区画の大きさ（マス）。強敵・ボスは区画ごとに決まる
 homeR:36,         // 拠点のまわりの、草原と森林だけになる範囲（マス）
 biomeScale:110,   // バイオームの大きさ（大きいほど1つの地域が広い）
 lvStep:40,lvMax:12,         // 拠点から何マスごとに危険度が1上がるか／危険度の上限
 lvHp:.18,lvDmg:.1,          // 危険度1あたりの敵のHP・攻撃力の上がり方
 eliteChunk:.1,bossChunk:.035,bossDist:56, // 区画に強敵がいる確率／ボスがいる確率と、ボスが出始める距離
 walkSpeed:4.2,    // 歩く速さ（マス／秒）
 sight:8,          // 地図に書き込まれる範囲（マス。8×8マスの区画ごと）
 encOn:true,       // ランダムエンカウントのスイッチ
 encBase:.03,encStep:.006,   // 遭遇率：基本＋1歩ごとの上乗せ（遭遇で元に戻る）
 encGrace:5,       // 出発直後・戦闘直後に敵が出ない歩数
 safeR:4,          // 拠点のまわりで敵が出ない範囲（マス）
 encFar:[9,18],    // 拠点からこの距離を超えると敵が1体ずつ増える
 eliteDist:14,eliteRate:.07, // 遠くでは通常の遭遇がまれに強敵になる
 nodeRate:.045,gatherN:[1,3],// 採集ポイントの多さ／1回で採れる数
 loseBag:.3,       // 強制帰還で失う荷物の割合
 // ---- 拠点（v0.3.2） ----
 minPerSec:1,      // 現実1秒で進むゲーム内の分（1時間＝現実60秒）。世界を開いている間だけ進む
 popStart:3,       // 最初の住民の数
 jobPrio:{farm:2,lumber:1,mine:1,research:2,build:2}, // 仕事の優先度の初期値（0なし 1低 2中 3高）
 jobOut:{farm:1,lumber:.5,mine:.5,research:1,build:1}, // 住民1人が1時間に作る量
 farmLv:.5,labLv:.25, // 畑Lvごとの食料の増え方／研究小屋Lv2からの研究の速さの増え方
 eat:.25,          // 住民1人が1時間に食べる食料
 foodStart:10,growFood:3, // 最初の食料／1日1回、空き家があり食料が「住民×この数」以上なら住民が1人増える
 shareCap:[40,40], // 住民が共有倉庫にためられる量：基本＋共有倉庫Lvごと（寄付はこの上限に関係なく入る）
 rarShop:.3,       // 工房Lv2から、コモン以外の出やすさがLvごとにこの割合だけ上がる
 gearMax:40,       // 持てる装備の数
 fireHeal:.1,      // 「火の利用」で増える勝利時の回復
 // ---- オンライン（v0.3.4） ----
 netMax:4,         // 同時に入れる人数（ホストをふくむ）
 netBeat:6000,     // ホストが掲示板を更新する間隔（ミリ秒）
 netTtl:20000,     // 掲示板がこれより古ければ、ホストがいないとみなす（ミリ秒）
 netSync:2000,     // ホストが世界を配る間隔（ミリ秒。変わった時だけ送る）
 netLost:15000,    // 参加者：ホストからこれだけ何も届かなければ、切れたとみなす（ミリ秒）
 // ---- 合流（v0.4.0） ----
 joinDist:1.6,     // 仲間のコマにこれだけ近づくと「合流」できる（マス）
 ptLost:15000      // パーティー：相手からこれだけ何も届かなければ、切れたとみなす（ミリ秒）
};
// 武器種ごとの性質（射程・体勢ダメージ倍率）。レアリティや時代では変わらない
const WPN={spear:{rg:2,pm:1},club:{rg:1,pm:1.5},sling:{rg:4,pm:.5},staff:{rg:1,pm:.8},knife:{rg:1,pm:.5},axe:{rg:1,pm:.7},bow:{rg:5,pm:.4},none:{rg:1,pm:.6}};
