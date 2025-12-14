# turbo-slide

LT（ライトニングトーク）発表用のシンプルなスライドアプリケーション。Hotwire Turbo Framesを活用し、ページ全体のリロードなしにスムーズなスライド遷移を実現。

## プロジェクト概要

### 技術スタック
- **バックエンド**: Express.js (Node.js >= 18.0.0)
- **フロントエンド**: Hotwire Turbo 8.0.4（CDN経由）
- **スタイリング**: Tailwind CSS 3.4 + カスタムCSS
- **リアルタイム通信**: Server-Sent Events (SSE)

### ディレクトリ構成
```
turbo-slide/
├── server.js                 # Expressサーバー（メインエントリ）
├── package.json              # 依存関係・スクリプト
├── turbo-slide.config.json   # プロジェクト設定ファイル
├── tailwind.config.js        # Tailwind設定
├── views/
│   ├── layout.html           # ベースレイアウトテンプレート
│   └── print.html            # PDF印刷用テンプレート
├── public/
│   ├── styles.css            # カスタムスタイル（16:9対応）
│   ├── tailwind.css          # Tailwindビルド出力
│   ├── tailwind-input.css    # Tailwind入力ファイル
│   ├── print.css             # 印刷用スタイル
│   └── script.js             # クライアント側JavaScript
├── slides/                   # ユーザーのスライド
│   ├── content/              # Markdownソース（AIへの指示）
│   │   ├── slide-01.md
│   │   └── slide-02.md
│   ├── slide-01.html         # AIが生成したHTML
│   ├── slide-02.html
│   └── images/               # スライド用画像
├── samples/                  # サンプルスライド（参考用）
│   └── hotwire-lt/
│       ├── slide-XX.html
│       └── images/
└── test/
    └── test.html             # Turbo Frame動作検証ページ
```

### 主要機能
- **Turbo Framesによるスムーズなスライド遷移**
- **URLベースのスライド管理**（`/slide/1`, `/slide/2`...）
- **10分カウントダウンタイマー**（プログレスバー付き）
- **スライド進捗表示**（プログレスバー + ページ番号）
- **キーボード操作**（← / →）
- **フルスクリーンモード**
- **PDF出力機能**（`/print`）
- **プレゼンターモード**（`/presenter`）- 発表者用
- **ビューアーモード**（`/viewer`）- SSEで同期
- **16:9アスペクト比の維持**

## 開発ガイド

### 起動方法
```bash
npm install
npm start
# http://localhost:3000 でアクセス
```

### Tailwind CSSのビルド
```bash
# 開発時（watchモード）
npm run build:css

# 本番用（minify）
npm run build:css:prod
```

### ビジュアルテスト（Playwright）
```bash
# 全テスト実行
npm test

# UIモードでテスト実行（デバッグ用）
npm run test:ui

# スナップショット更新
npm run test:update

# テストレポート表示
npm run test:report
```

**テスト内容:**
- 各スライドのビジュアルスナップショット（4解像度: 1920, 1440, 1280, タブレット）
- 16:9アスペクト比の維持確認
- コンテンツオーバーフロー検出
- キーボードナビゲーション動作確認
- Transform Scaleによるスケーリング確認

### エンドポイント一覧
| パス | 説明 |
|-----|------|
| `/` | スライド1にリダイレクト |
| `/slide/:id` | 通常のスライド表示 |
| `/presenter` | プレゼンターモード（操作側） |
| `/viewer` | ビューアーモード（SSE同期） |
| `/print` | PDF出力用（全スライド一覧） |
| `/events` | SSEエンドポイント |
| `/api/slide/:id` | スライド変更API（POST） |
| `/test` | Turbo Frame動作検証 |

### 設定ファイル（turbo-slide.config.json）

```json
{
  "title": "My Presentation",
  "author": "@username",
  "timer": 600,
  "slidesDir": "./slides",
  "imagesDir": "./slides/images"
}
```

| 設定項目 | 説明 | デフォルト |
|---------|------|----------|
| `title` | プレゼンテーションのタイトル | "Turbo Slide" |
| `author` | 発表者名 | "" |
| `timer` | タイマー秒数 | 600 |
| `slidesDir` | スライドディレクトリ | "./slides" |
| `imagesDir` | 画像ディレクトリ | "./slides/images" |

### スライドの追加
1. `slides/` ディレクトリに `slide-XX.html` を追加（番号は連番・ゼロパディング）
2. サーバー再起動不要（動的にスライド数を取得）

### サンプルスライドの利用
`samples/hotwire-lt/` に実際のLTで使用したスライドがあります。参考にしてください。

```bash
# サンプルをコピーして使う場合
cp -r samples/hotwire-lt/slides/* slides/
cp -r samples/hotwire-lt/images/* slides/images/
```

### スライドのフォーマット
```html
<div class="slide-container">
  <!-- Tailwind CSSクラスを使用 -->
  <h1 class="text-5xl font-bold mb-5 text-center">タイトル</h1>
  <p class="text-3xl">本文</p>
  <img src="/images/example.png" alt="説明" class="max-w-lg">
</div>
```

## アーキテクチャ

### 16:9アスペクト比の実装（Transform Scale方式）

**reveal.js風のスケーリング**: 固定デザイン解像度（960×540px）で設計し、画面サイズに合わせてスケール。

```css
/* styles.css */
.slide {
  /* 固定デザイン解像度（16:9） */
  width: 960px;
  height: 540px;

  /* スケール用の設定 */
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
  /* transform は JavaScript で設定 */

  overflow: hidden;
}
```

```javascript
// script.js - スケール計算
const DESIGN_WIDTH = 960;
const DESIGN_HEIGHT = 540;

const scaleX = containerWidth / DESIGN_WIDTH;
const scaleY = containerHeight / DESIGN_HEIGHT;
const scale = Math.min(scaleX, scaleY);

slide.style.transform = `translate(-50%, -50%) scale(${scale})`;
```

**利点:**
- どのディスプレイサイズでも一貫した見た目を保証
- コンテンツが見切れることがない
- px単位でデザインするため直感的

### Turbo Framesの活用
```
ユーザー操作（キーボード ← / →）
    ↓
JavaScript がナビゲーションリンクを取得・クリック
    ↓
<a data-turbo-frame="slide-content"> がTurbo Frameリクエストを発火
    ↓
サーバーが turbo-frame ヘッダーを検出
    ↓
差分コンテンツ（<turbo-frame>）のみを返却
    ↓
TurboがDOM差分更新 → スムーズなスライド切り替え
```

### プレゼンター/ビューアー同期（SSE）
```
プレゼンター（/presenter）でスライド操作
    ↓
POST /api/slide/:id でサーバーに通知
    ↓
サーバーが全SSEクライアントにブロードキャスト
    ↓
ビューアー（/viewer）がSSEイベントを受信
    ↓
ビューアーのスライドが自動更新
```

## 課題と開発ロードマップ

### 完了済み

- [x] スライド数の動的取得（サーバー再起動不要に）
- [x] 設定ファイル対応（turbo-slide.config.json）
- [x] サンプルスライドの分離（samples/ディレクトリ）
- [x] スライドタイプ定義とテンプレート（CLAUDE.md）
- [x] Markdownスライド定義フォーマット
- [x] Transform Scale方式（reveal.js風 / 960×540px固定解像度）

### 優先度: 高

#### 1. 他ユーザーへの配布・共有改善
- [ ] 静的HTML出力（サーバーなしで動作）
- [ ] GitHub Template Repository化
- [ ] NPXコマンド対応（将来）

### 優先度: 中

#### 2. プレゼンター機能の強化
- [ ] スピーカーノート機能
- [ ] 次のスライドプレビュー
- [ ] レーザーポインター機能

#### 3. コンテンツ作成支援
- [ ] Markdownサポート
- [ ] コードハイライト（Prism.js/Shiki統合）
- [ ] 数式表示（KaTeX統合）

### 優先度: 低

#### 4. テーマ・デザイン
- [ ] ダークモード対応
- [ ] テーマ切り替え機能
- [ ] カスタムフォント対応

#### 5. アニメーション
- [ ] スライド遷移アニメーション
- [ ] 要素ごとのアニメーション

#### 6. ビジュアルテスト
- [x] Playwrightセットアップ
- [x] 複数解像度でのスクリーンショットテスト
- [x] オーバーフロー検出

## 設計方針
- **Hotwireファースト**: JavaScriptを最小化し、HTMLを中心とした設計
- **シンプルさ優先**: 依存関係を最小限に（Express + Turbo + Tailwind）
- **カスタマイズ性**: 各スライドでTailwind CSSを自由に使用可能

---

## スライド生成ガイド（AI向け）

このセクションは、Claude Code等のAIがスライドを生成・編集する際のルールを定義します。

### クイックリファレンス

#### 1. デザイントークン

| トークン | 用途 |
|---------|------|
| `slide-primary` | メインカラー |
| `slide-secondary` | サブテキスト |
| `slide-accent` | アクセント |
| `slide-warning` | ハイライト |

#### 2. スライドタイプ（13種類）

| タイプ | 用途 | コンテナ |
|--------|------|---------|
| `title` | タイトル/エンディング | `slide-container-center` |
| `profile` | 自己紹介 | `slide-container` |
| `content` | 通常コンテンツ | `slide-container` |
| `comparison` | 比較（2カラム） | `slide-container` |
| `list` | 箇条書き | `slide-container` |
| `image` | 画像中心 | `slide-container` |
| `quote` | 引用・強調 | `slide-container` |
| `definition` | 用語定義・説明 | `slide-container` |
| `tech-overview` | 技術概要 | `slide-container` |
| `statement` | メッセージ中心 | `slide-container` |
| `insights` | 発見・気づき | `slide-container` |
| `code-showcase` | コード/スクショ紹介 | `slide-container` |
| `promotion` | 宣伝・紹介 | `slide-container` |

#### 2.5 スライドデザイン原則

Transform Scale方式により、コンテンツが見切れることはありませんが、以下の原則を守ることで視認性の高いスライドを作成できます。

**黄金ルール:**
1. **1スライド1メッセージ** - 伝えたいことは1つに絞る
2. **リストは5項目程度** - 多い場合はスライドを分割
3. **シンプルさを優先** - 情報を詰め込みすぎない
4. **余白を活かす** - 窮屈なレイアウトは避ける

#### 3. 禁止事項

- フォントサイズの個別調整
- インラインスタイル
- 固定幅/高さの使用
- コンテナクラスの変更
- カラーパレット外の色（例外: 外部ブランドカラー）

#### 4. Markdown形式での指示方法

**title（タイトルスライド）**
```markdown
## slide-01: プレゼンタイトル
type: title

# プレゼンテーションタイトル

@発表者名
```

**profile（自己紹介）**
```markdown
## slide-02: 自己紹介
type: profile

# 自己紹介

![プロフィール画像](/images/profile.png)

## 名前
所属・役職

追加情報
```

**content（通常コンテンツ）**
```markdown
## slide-03: 概要
type: content

# タイトル

本文テキスト

本文テキスト

**強調テキスト**
```

**comparison（比較スライド）**
```markdown
## slide-04: 比較
type: comparison

# タイトル

### 左カラム: 従来の方法
- 項目1
- 項目2

### 右カラム: 新しい方法
- 項目A
- 項目B
```

**list（リストスライド）**
```markdown
## slide-05: ポイント
type: list

# タイトル

## セクションタイトル
- 項目1
- 項目2
- 項目3
```

**image（画像中心）**
```markdown
## slide-06: スクリーンショット
type: image

# タイトル

## サブタイトル

説明テキスト

![画像の説明](/images/screenshot.png)
```

**quote（引用・強調）**
```markdown
## slide-07: 結論
type: quote

# タイトル

> 強調したいメッセージ
```

**definition（用語定義）**
```markdown
## slide-08: 用語解説
type: definition

# 用語の定義

## キーワード
説明テキスト

### 比較: 従来の方法 vs 新しい方法
従来: 説明
新方式: 説明

> 結論・まとめ
```

**tech-overview（技術概要）**
```markdown
## slide-09: 技術スタック
type: tech-overview

# 技術概要

### 左カラム: コンポーネント1
#### サブ項目A
- 説明1
- 説明2

#### サブ項目B
- 説明

### 右カラム: コンポーネント2
概要説明
```

**statement（メッセージ中心）**
```markdown
## slide-10: 問いかけ
type: statement

# メインメッセージ

補足テキスト

**強調したい問いかけ**

結論
```

**insights（発見・気づき）**
```markdown
## slide-11: 気づき
type: insights

# 気づき・発見

### カテゴリ1
- 項目1
- 項目2

### カテゴリ2
- 項目A
- 項目B

> まとめメッセージ
```

**code-showcase（コード紹介）**
```markdown
## slide-12: 実装紹介
type: code-showcase

# コード紹介

## サブタイトル
説明テキスト

![ファイル名1](/images/code1.png)
![ファイル名2](/images/code2.png)
```

**promotion（宣伝・紹介）**
```markdown
## slide-13: コミュニティ紹介
type: promotion

# 紹介タイトル

![イベント画像](/images/event.png)

## グループ名
- 活動: 説明
- 場所: 説明

**ぜひ参加してください！**
```

---

### デザイントークン詳細（design-tokens.css）

Transform Scale方式に合わせ、**固定px単位**のデザイントークンを使用します。
デザイン解像度は960×540px（16:9）です。

**ファイル**: `public/design-tokens.css`

#### カラーパレット

| CSS変数 | 値 | 用途 |
|---------|-----|------|
| `--slide-primary` | `#1e293b` (Slate 800) | メインカラー、タイトル |
| `--slide-secondary` | `#64748b` (Slate 500) | サブテキスト、ボーダー |
| `--slide-accent` | `#3b82f6` (Blue 500) | アクセント、強調 |
| `--slide-warning` | `#60a5fa` (Blue 400) | 注意、ハイライト |

#### フォントサイズ（px単位 - 960px幅基準）

| クラス | サイズ | 用途 |
|--------|--------|------|
| `.slide-title-text` | 58px | タイトルスライドのメインタイトル |
| `.slide-title-text-lg` | 68px | 大きなタイトル（エンディング等） |
| `.slide-h1` | 48px | 通常スライドの見出し |
| `.slide-h2` | 30px | セクション見出し |
| `.slide-body` | 24px | 本文テキスト |
| `.slide-body-lg` | 30px | 大きめの本文 |
| `.slide-caption` | 20px | キャプション、補足 |
| `.slide-caption-sm` | 17px | 小さいキャプション |
| `.slide-subtitle` | 30px | サブタイトル（発表者名等） |

#### 余白スケール（px単位）

| クラス | サイズ | クラス | サイズ |
|--------|--------|--------|--------|
| `.slide-mb-2` | 10px | `.slide-mt-2` | 10px |
| `.slide-mb-4` | 20px | `.slide-mt-4` | 20px |
| `.slide-mb-6` | 30px | `.slide-mt-5` | 25px |
| `.slide-mb-8` | 40px | `.slide-p-4` | 20px |
| `.slide-mb-10` | 50px | `.slide-p-5` | 25px |

#### コンテナ最大幅（px単位 - 960px基準）

| クラス | サイズ | 備考 |
|--------|--------|------|
| `.slide-max-w-4xl` | 768px | 80% of 960px |
| `.slide-max-w-6xl` | 864px | 90% of 960px |

#### カラーユーティリティ

```css
/* テキスト色 */
.text-slide-primary    /* #1e293b */
.text-slide-secondary  /* #64748b */
.text-slide-accent     /* #3b82f6 */

/* 背景色（Tailwindの透明度と組み合わせ可） */
.bg-slide-accent/10    /* 10%透明度 */

/* ボーダー色 */
.border-slide-accent
```

### フォントサイズ規約

**重要**: Transform Scale方式では、デザイントークンクラス（`slide-*`）またはTailwindクラスどちらも使用可能。
スライドは常に960×540pxでレンダリングされ、画面サイズに合わせてスケールされます。

| 要素 | デザイントークン（推奨） | Tailwind（代替） |
|-----|---------------------|-----------------|
| タイトル | `.slide-title-text` (58px) | `text-6xl` |
| h1 | `.slide-h1` (48px) | `text-5xl` |
| h2 | `.slide-h2` (30px) | `text-3xl` |
| 本文 | `.slide-body` (24px) | `text-2xl` |
| サブタイトル | `.slide-subtitle` (30px) | `text-3xl opacity-80` |

### 画像サイズ規約（見切れ防止）

**重要**: スライドは960×540pxでレンダリングされ、パディング後のコンテンツ領域は約500pxです。画像サイズはレイアウトの複雑さに応じて選択してください。

#### 画像サイズクラス一覧

| クラス | max-height | 使用するレイアウト |
|--------|------------|------------------|
| `.slide-img-xl` | 350px | H1 + 画像のみのシンプルなスライド |
| `.slide-img-lg` | 260px | H1 + 説明ボックス + 画像 |
| `.slide-img-md` | 200px | 複数セクションがあるレイアウト（デフォルト） |
| `.slide-img-sm` | 140px | 複数画像を並べる場合（グリッド等） |
| （指定なし） | 200px | デフォルト値 |

#### 選択ガイドライン

**レイアウト別の利用可能高さ計算**:
- コンテンツ領域: 500px（540px - 40px padding）
- H1見出し: 約68px使用
- 説明ボックス（slide-p-3）: 約80-100px使用
- テキスト行: 約30-40px使用

**選択フローチャート**:
1. スライドにH1と画像のみ → `slide-img-xl`
2. H1 + 説明ボックス + 画像 → `slide-img-lg`
3. H1 + 画像 + 下部にテキストやボックス → `slide-img-md`
4. グリッドで複数画像を表示 → `slide-img-sm`

**使用例**:
```html
<!-- H1 + 画像のみ -->
<img src="/images/diagram.svg" class="slide-img-xl">

<!-- H1 + 説明ボックス + 画像 -->
<img src="/images/architecture.svg" class="slide-img-lg">

<!-- 複数セクション -->
<img src="/images/photo.png" class="slide-img-md">

<!-- グリッド表示 -->
<div class="grid grid-cols-2 slide-gap-2">
  <img src="/images/code1.png" class="slide-img-sm">
  <img src="/images/code2.png" class="slide-img-sm">
</div>
```

**自動縮小**: 画像は`flex-shrink: 1`が設定されており、コンテンツがオーバーフローしそうな場合は自動的に縮小されます。ただし`min-height: 80px`以下にはなりません。

### スライドタイプ定義

#### 1. `title` - タイトル/エンディングスライド

**用途**: プレゼンの最初と最後
**コンテナ**: `slide-container-center`（中央配置）

```html
<div class="slide-container-center">
  <div class="text-center">
    <h1 class="text-6xl leading-tight mb-3 font-bold">
      スライドタイトル
    </h1>
    <p class="text-3xl opacity-80">@発表者名</p>
  </div>
</div>
```

**グラデーションタイトル（エンディング用）**:
```html
<h1 class="text-7xl font-bold mb-10 bg-gradient-to-r from-slide-accent via-slide-warning to-slide-primary bg-clip-text text-transparent">
  ありがとうございました！
</h1>
```

---

#### 2. `profile` - 自己紹介スライド

**用途**: 発表者紹介（画像 + テキスト横並び）
**コンテナ**: `slide-container`

```html
<div class="slide-container">
  <h1 class="text-5xl font-bold mb-2 text-center">自己紹介</h1>
  <div class="flex gap-12 items-center justify-center w-full max-w-6xl mx-auto">
    <!-- 画像（左側） -->
    <img src="/images/profile.png" alt="名前" class="w-80 h-auto object-contain">

    <!-- テキスト（右側） -->
    <div class="text-left">
      <h2 class="text-5xl font-bold mb-4">名前</h2>
      <div class="text-3xl leading-relaxed mb-4">
        <div>所属</div>
      </div>
      <div class="mt-5 pt-7 border-t border-gray-600">
        <div class="text-3xl leading-relaxed mb-4">追加情報</div>
      </div>
    </div>
  </div>
</div>
```

---

#### 3. `content` - 通常コンテンツスライド

**用途**: 説明、ストーリーテリング
**コンテナ**: `slide-container`

```html
<div class="slide-container">
  <h1 class="text-5xl font-bold mb-5 text-center">タイトル</h1>

  <div class="text-3xl leading-relaxed text-left max-w-4xl mx-auto space-y-6">
    <p>本文テキスト</p>
    <p>本文テキスト</p>
    <p class="text-slide-secondary font-bold">強調テキスト</p>
  </div>
</div>
```

**強調ボックス付き**:
```html
<div class="bg-slide-primary/15 p-5 rounded-xl border-l-4 border-slide-primary">
  <p class="text-2xl leading-relaxed">
    強調したいメッセージ
  </p>
</div>
```

---

#### 4. `comparison` - 比較スライド（2カラム）

**用途**: 2つの概念を比較、Before/After
**コンテナ**: `slide-container`
**レイアウト**: `grid grid-cols-2`

```html
<div class="slide-container">
  <h1 class="text-5xl font-bold mb-2 text-center bg-gradient-to-r from-slide-primary to-slide-secondary bg-clip-text text-transparent">タイトル</h1>

  <div class="max-w-6xl mx-auto text-2xl">
    <div class="grid grid-cols-2 gap-4">
      <!-- 左カラム -->
      <div class="bg-white/5 p-4 rounded-lg border-2 border-slide-secondary">
        <h2 class="text-3xl text-slide-secondary mb-2">左タイトル</h2>
        <p class="text-xl">説明テキスト</p>
      </div>

      <!-- 右カラム -->
      <div class="bg-slide-primary/10 p-4 rounded-lg border-2 border-slide-primary">
        <h2 class="text-3xl text-slide-primary mb-2">右タイトル</h2>
        <p class="text-xl">説明テキスト</p>
      </div>
    </div>
  </div>
</div>
```

---

#### 5. `list` - リストスライド

**用途**: 箇条書き、ポイント列挙
**コンテナ**: `slide-container`

```html
<div class="slide-container">
  <h1 class="text-5xl font-bold mb-2 text-center">タイトル</h1>

  <div class="max-w-6xl mx-auto text-3xl">
    <div class="bg-white/[0.06] p-4 rounded-xl border-2 border-slide-accent">
      <h2 class="text-3xl text-slide-accent mb-2">セクションタイトル</h2>
      <ul class="list-none space-y-2 text-3xl">
        <li class="pl-8 relative before:content-['▸'] before:absolute before:left-0 before:text-slide-secondary">項目1</li>
        <li class="pl-8 relative before:content-['▸'] before:absolute before:left-0 before:text-slide-secondary">項目2</li>
        <li class="pl-8 relative before:content-['▸'] before:absolute before:left-0 before:text-slide-secondary">項目3</li>
      </ul>
    </div>
  </div>
</div>
```

**絵文字付きリスト**:
```html
<li class="pl-8 relative before:content-['😰'] before:absolute before:left-0">項目</li>
```

---

#### 6. `image` - 画像中心スライド

**用途**: スクリーンショット、図解
**コンテナ**: `slide-container`

```html
<div class="slide-container px-6 pt-8 pb-4">
  <h1 class="text-4xl font-bold mb-2 text-slide-accent text-center">タイトル</h1>

  <div class="max-w-4xl mx-auto text-center">
    <div class="bg-slide-accent/10 p-3 rounded-xl border-2 border-slide-accent mb-2">
      <h2 class="text-3xl text-slide-accent mb-1">サブタイトル</h2>
      <p class="text-lg">説明テキスト</p>
    </div>

    <img src="/images/screenshot.png" alt="説明"
         class="w-full rounded-lg border-2 border-slide-secondary shadow-lg">
  </div>
</div>
```

**複数画像（縦並び）**:
```html
<div class="flex flex-col items-center gap-1">
  <div class="text-center">
    <h3 class="text-lg text-slide-secondary font-bold mb-0.5">ラベル1</h3>
    <img src="/images/img1.png" alt="説明" class="w-full rounded-lg border-2 border-slide-secondary">
  </div>
  <div class="text-center">
    <h3 class="text-lg text-slide-secondary font-bold mb-0.5">ラベル2</h3>
    <img src="/images/img2.png" alt="説明" class="w-full rounded-lg border-2 border-slide-secondary">
  </div>
</div>
```

---

#### 7. `quote` - 引用・強調スライド

**用途**: 重要なメッセージ、結論
**コンテナ**: `slide-container`

```html
<div class="slide-container">
  <h1 class="text-5xl font-bold mb-4 text-center">タイトル</h1>

  <div class="max-w-4xl mx-auto">
    <div class="bg-slide-accent/10 p-5 rounded-xl border-2 border-slide-accent">
      <p class="text-3xl text-slide-accent font-bold text-center">
        強調したいメッセージ
      </p>
    </div>
  </div>
</div>
```

---

#### 8. `definition` - 用語定義・説明スライド

**用途**: 用語解説、概念説明（説明ボックス + 比較 + 強調）
**コンテナ**: `slide-container`

```html
<div class="slide-container">
  <h1 class="text-6xl font-bold mb-6 text-center bg-gradient-to-r from-slide-primary to-slide-secondary bg-clip-text text-transparent">用語の定義</h1>

  <div class="text-left max-w-6xl mx-auto space-y-5">
    <div class="bg-slide-accent/10 p-5 rounded-xl border-2 border-slide-accent">
      <h2 class="text-3xl text-slide-accent font-bold mb-3">キーワード</h2>
      <p class="text-2xl">「<span class="text-slide-accent font-bold">説明</span>」の解説</p>
    </div>

    <div class="space-y-3">
      <h2 class="text-3xl text-slide-secondary font-bold">比較タイトル</h2>
      <div class="grid grid-cols-2 gap-4 text-2xl">
        <div class="bg-white/5 p-4 rounded-lg">
          <p class="text-red-400 font-bold mb-2">従来の方法</p>
          <p>説明テキスト</p>
        </div>
        <div class="bg-slide-primary/10 p-4 rounded-lg border-2 border-slide-primary">
          <p class="text-slide-primary font-bold mb-2">新しい方法</p>
          <p>説明テキスト</p>
        </div>
      </div>
    </div>

    <div class="bg-slide-primary/15 p-5 rounded-xl border-l-4 border-slide-primary">
      <p class="text-2xl leading-relaxed">
        <span class="text-slide-primary font-bold text-3xl">結論・まとめ</span>のメッセージ
      </p>
    </div>
  </div>
</div>
```

---

#### 9. `tech-overview` - 技術概要スライド

**用途**: 技術スタックの説明、複数コンポーネントの紹介
**コンテナ**: `slide-container`
**レイアウト**: `grid grid-cols-2`

```html
<div class="slide-container">
  <h1 class="text-5xl font-bold mb-2 text-center">技術概要</h1>

  <div class="max-w-6xl mx-auto text-left">
    <div class="grid grid-cols-2 gap-3 mb-2">
      <div class="bg-white/5 p-4 rounded-lg border-2 border-slide-secondary">
        <h2 class="text-3xl text-slide-secondary mb-2">コンポーネント1</h2>
        <h3 class="text-2xl text-slide-primary mt-3 mb-1">サブ項目A</h3>
        <ul class="text-xl space-y-1 list-none pl-4">
          <li class="before:content-['→_'] before:text-slide-secondary">説明1</li>
          <li class="before:content-['→_'] before:text-slide-secondary">説明2</li>
        </ul>
        <h3 class="text-2xl text-slide-primary mt-3 mb-1">サブ項目B</h3>
        <ul class="text-xl space-y-1 list-none pl-4">
          <li class="before:content-['→_'] before:text-slide-secondary">説明</li>
        </ul>
      </div>

      <div class="bg-white/5 p-4 rounded-lg border-2 border-slide-secondary">
        <h2 class="text-3xl text-slide-secondary mb-2">コンポーネント2</h2>
        <p class="text-xl mb-2">概要説明</p>
      </div>
    </div>
  </div>
</div>
```

---

#### 10. `statement` - メッセージ中心スライド

**用途**: シンプルな強調メッセージ、問いかけ
**コンテナ**: `slide-container`

```html
<div class="slide-container">
  <h1 class="text-6xl font-bold mb-8 text-slide-primary text-center">メインメッセージ</h1>

  <div class="max-w-5xl mx-auto text-3xl space-y-6">
    <p class="text-center">補足テキスト</p>
    <p class="text-slide-accent font-bold text-center text-4xl">強調したい問いかけ</p>
    <p class="text-5xl text-slide-accent font-bold text-center mt-8">結論</p>
  </div>
</div>
```

---

#### 11. `insights` - 発見・気づきスライド

**用途**: 複数の発見・気づきをカード形式で表示
**コンテナ**: `slide-container`
**レイアウト**: `grid grid-cols-2` + 横断ボックス

```html
<div class="slide-container">
  <h1 class="text-5xl font-bold mb-2 text-center bg-gradient-to-r from-slide-primary to-slide-secondary bg-clip-text text-transparent">気づき・発見</h1>

  <div class="max-w-6xl mx-auto text-2xl">
    <div class="grid grid-cols-2 gap-2">
      <div class="bg-white/5 p-4 rounded-xl border-2 border-slide-secondary">
        <h2 class="text-3xl text-slide-secondary mb-2">カテゴリ1</h2>
        <ul class="list-none space-y-2 text-2xl">
          <li class="pl-5 relative before:content-['▸'] before:absolute before:left-0 before:text-slide-secondary">項目1</li>
          <li class="pl-5 relative before:content-['▸'] before:absolute before:left-0 before:text-slide-secondary">項目2</li>
        </ul>
      </div>

      <div class="bg-white/5 p-4 rounded-xl border-2 border-slide-secondary">
        <h2 class="text-3xl text-slide-secondary mb-2">カテゴリ2</h2>
        <ul class="list-none space-y-2 text-2xl">
          <li class="pl-5 relative before:content-['▸'] before:absolute before:left-0 before:text-slide-secondary">項目A</li>
          <li class="pl-5 relative before:content-['▸'] before:absolute before:left-0 before:text-slide-secondary">項目B</li>
        </ul>
      </div>

      <!-- 横断強調ボックス -->
      <div class="bg-orange-500/10 p-4 rounded-xl border-l-4 border-slide-accent col-span-2">
        <h2 class="text-3xl text-slide-accent mb-2">まとめ</h2>
        <p class="text-2xl">全体を通しての気づき・メッセージ</p>
      </div>
    </div>
  </div>
</div>
```

---

#### 12. `code-showcase` - コード/スクリーンショット紹介

**用途**: 複数のコードファイルやスクリーンショットを紹介
**コンテナ**: `slide-container px-6 pt-8 pb-4`

```html
<div class="slide-container px-6 pt-8 pb-4">
  <h1 class="text-4xl font-bold mb-2 text-slide-accent text-center">コード紹介</h1>

  <div class="max-w-4xl mx-auto text-center">
    <div class="bg-orange-500/15 p-3 rounded-xl border-2 border-slide-accent mb-2">
      <h2 class="text-3xl text-slide-accent mb-1">サブタイトル</h2>
      <p class="text-lg">説明テキスト</p>
    </div>

    <div class="flex flex-col items-center gap-1">
      <div class="text-center">
        <h3 class="text-lg text-slide-secondary font-bold mb-0.5">ファイル名1</h3>
        <img src="/images/code1.png" alt="説明" class="w-full rounded-lg border-2 border-slide-secondary shadow-lg">
      </div>

      <div class="text-center">
        <h3 class="text-lg text-slide-secondary font-bold mb-0.5">ファイル名2</h3>
        <img src="/images/code2.png" alt="説明" class="w-full rounded-lg border-2 border-slide-secondary shadow-lg">
      </div>
    </div>
  </div>
</div>
```

---

#### 13. `promotion` - 宣伝/紹介スライド

**用途**: コミュニティ紹介、イベント告知、CTA
**コンテナ**: `slide-container`

```html
<div class="slide-container">
  <h1 class="text-5xl font-bold mb-2 text-center bg-gradient-to-r from-slide-primary to-slide-secondary bg-clip-text text-transparent">紹介タイトル</h1>

  <div class="flex flex-col items-center gap-3 max-w-4xl mx-auto text-center">
    <img src="/images/event.png" alt="イベント画像" class="w-full max-w-2xl rounded-lg border-2 border-slide-primary shadow-lg">

    <div class="bg-teal-500/10 px-5 py-3 rounded-lg border-2 border-slide-primary text-left w-full">
      <h2 class="text-3xl text-slide-primary mb-2 text-center">グループ名</h2>
      <div class="text-2xl mb-2 pl-4">
        <strong class="text-slide-secondary inline-block min-w-[5rem]">活動：</strong>説明
      </div>
      <div class="text-2xl mb-2 pl-4">
        <strong class="text-slide-secondary inline-block min-w-[5rem]">場所：</strong>説明
      </div>
    </div>

    <p class="text-3xl text-slide-accent font-bold">ぜひ参加してください！</p>
  </div>
</div>
```

---

### 禁止事項

1. **フォントサイズの個別調整禁止**
   - ❌ `text-4xl`を`text-[2.5rem]`に変更
   - ✅ タイプ定義のサイズを使用

2. **インラインスタイル禁止**
   - ❌ `style="font-size: 20px;"`
   - ✅ Tailwindクラスを使用

3. **固定幅/高さの使用禁止**
   - ❌ `w-[500px]`, `h-[300px]`
   - ✅ `max-w-4xl`, `w-full`, `h-auto`

4. **コンテナクラスの変更禁止**
   - ❌ `slide-container`のpaddingを個別変更
   - ✅ 定義されたコンテナクラスをそのまま使用

5. **カラーパレット外の色使用禁止**
   - ❌ `text-purple-500`, `bg-green-400`
   - ✅ `text-slide-accent`, `bg-slide-primary/10`
   - ⚠️ 例外: 外部ブランドカラー（React青 `#61dafb` など）

---

### スライド作成ワークフロー（AI生成）

このプロジェクトでは、**Markdownでスライド内容を定義し、AIがHTMLを生成する**ワークフローを採用しています。

#### ワークフロー

```
1. slides/content/slide-XX.md にMarkdownでスライド内容を定義
    ↓
2. AIに「このMarkdownからHTMLスライドを生成して」と依頼
    ↓
3. AIがCLAUDE.mdのルール・テンプレートに従ってHTMLを生成
    ↓
4. 生成されたHTMLを slides/slide-XX.html に保存
    ↓
5. npm start でプレビュー確認
```

#### ディレクトリ構造

```
slides/
├── content/              # Markdownソース（スライド定義）
│   ├── slide-01.md
│   ├── slide-02.md
│   └── ...
├── slide-01.html         # 生成されたHTML
├── slide-02.html
└── images/
```

---

### Markdownスライド定義フォーマット

`slides/content/slide-XX.md` に以下の形式でスライドを定義します：

#### 基本構造

```markdown
---
type: content
---

# スライドタイトル

本文テキスト

- 箇条書き1
- 箇条書き2

> 強調したいメッセージ

![画像の説明](/images/example.png)

<!-- speaker_notes -->
- ここで話すポイント
- 補足説明
```

#### フロントマター（必須）

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `type` | 必須 | スライドタイプ（title, profile, content, comparison, list, image, quote） |

#### スライドタイプ別の記述例

**title（タイトルスライド）**
```markdown
---
type: title
---

# プレゼンテーションタイトル

@発表者名
```

**content（通常コンテンツ）**
```markdown
---
type: content
---

# タイトル

本文テキスト

本文テキスト

**強調テキスト**
```

**comparison（比較スライド）**
```markdown
---
type: comparison
---

# タイトル

## 左カラム: 左タイトル
- 項目1
- 項目2

## 右カラム: 右タイトル
- 項目A
- 項目B
```

**list（リストスライド）**
```markdown
---
type: list
---

# タイトル

## セクションタイトル
- 項目1
- 項目2
- 項目3
```

**image（画像中心）**
```markdown
---
type: image
---

# タイトル

## サブタイトル

説明テキスト

![画像の説明](/images/screenshot.png)
```

**quote（引用・強調）**
```markdown
---
type: quote
---

# タイトル

> 強調したいメッセージ
```

---

### AI向け: HTML生成ルール

**AIがMarkdownからHTMLを生成する際の手順:**

1. **フロントマターの`type`を読み取る**
2. **対応するスライドタイプのテンプレート（上記参照）を使用**
3. **Markdownの内容をテンプレートに埋め込む**
4. **禁止事項に違反していないか確認**
5. **`slides/slide-XX.html`として出力**

**変換ルール:**
- `# 見出し` → `<h1>` （タイトル）
- `## 見出し` → `<h2>` またはセクション区切り
- `- 項目` → リスト項目
- `> 引用` → 強調ボックス
- `![alt](/path)` → `<img>` タグ
- `**太字**` → `<span class="font-bold">`
- `<!-- speaker_notes -->` 以下 → 無視（HTMLには含めない）

**重要: テンプレートのクラス名・構造を維持すること。個別のスタイル調整は禁止。**
