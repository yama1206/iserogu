# イセログ 〜異世界文明開拓〜

v0.3.3：拠点の試作版（ソロ・先史時代。探索 → 素材を持ち帰る → 研究・建築・製作 → また冒険へ）。`index.html` を開くと遊べます。

- `js/data/`  設定とデータ（cfg / terrain / cards / weapons / enemies / regions / base＝施設・研究・製作・レアリティ・仕事）
- `js/core/`  ルール（battle＝戦闘、ai＝敵の動き方とオートバトル、field＝探索、base＝拠点）。画面と通信に依存しません
- `js/ui/`    画面（view＝描画エンジン、battleview＝戦場、fieldview＝フィールド、baseview＝拠点、input、audio、main）
- `js/net/`   通信（cloud＝クラウドセーブ）。接続先は `js/data/fbconfig.js` の `FB_URL`（空ならソロのみ）
