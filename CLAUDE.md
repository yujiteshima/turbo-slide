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
├── server.js              # Expressサーバー（メインエントリ）
├── package.json           # 依存関係・スクリプト
├── tailwind.config.js     # Tailwind設定
├── views/
│   ├── layout.html        # ベースレイアウトテンプレート
│   └── print.html         # PDF印刷用テンプレート
├── public/
│   ├── styles.css         # カスタムスタイル（16:9対応）
│   ├── tailwind.css       # Tailwindビルド出力
│   ├── tailwind-input.css # Tailwind入力ファイル
│   ├── print.css          # 印刷用スタイル
│   └── script.js          # クライアント側JavaScript
├── slides/
│   ├── slide-XX.html      # 各スライドのコンテンツ（23枚）
│   └── images/            # スライド用画像
└── test/
    └── test.html          # Turbo Frame動作検証ページ
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

### スライドの追加
1. `slides/` ディレクトリに `slide-XX.html` を追加（番号は連番・ゼロパディング）
2. サーバー再起動が必要（現状の課題）

### スライドのフォーマット
```html
<div class="slide">
  <!-- Tailwind CSSクラスを使用 -->
  <h1 class="text-4xl font-bold mb-4">タイトル</h1>
  <p class="text-xl">本文</p>
  <img src="/images/example.png" alt="説明" class="max-w-lg">
</div>
```

## アーキテクチャ

### 16:9アスペクト比の実装
```css
.slide {
  width: 100%;
  aspect-ratio: 16 / 9;
  max-width: calc((100vh - 60px) * 16 / 9);
  max-height: calc(100vh - 60px);
}
```
- CSS `aspect-ratio` プロパティで16:9を維持
- `max-width` と `max-height` でビューポートに収まるよう制約

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

### 優先度: 高

#### 1. スライド数の動的取得（todo.mdに記載）
**現状の問題**: サーバー起動時に一度だけスライド数を取得するため、新しいスライドを追加してもサーバー再起動が必要

**修正案**: リクエストごとに `getSlideCount()` を呼び出す

#### 2. 他ユーザーへの配布・共有改善
- [ ] 静的HTML出力（サーバーなしで動作）
- [ ] スライドテンプレート機能
- [ ] 設定ファイル（タイマー時間、タイトル等）

### 優先度: 中

#### 3. プレゼンター機能の強化
- [ ] スピーカーノート機能
- [ ] 次のスライドプレビュー
- [ ] レーザーポインター機能

#### 4. コンテンツ作成支援
- [ ] Markdownサポート
- [ ] コードハイライト（Prism.js/Shiki統合）
- [ ] 数式表示（KaTeX統合）

### 優先度: 低

#### 5. テーマ・デザイン
- [ ] ダークモード対応
- [ ] テーマ切り替え機能
- [ ] カスタムフォント対応

#### 6. アニメーション
- [ ] スライド遷移アニメーション
- [ ] 要素ごとのアニメーション

## 設計方針
- **Hotwireファースト**: JavaScriptを最小化し、HTMLを中心とした設計
- **シンプルさ優先**: 依存関係を最小限に（Express + Turbo + Tailwind）
- **カスタマイズ性**: 各スライドでTailwind CSSを自由に使用可能

---

## スライド生成ガイド（AI向け）

このセクションは、Claude Code等のAIがスライドを生成・編集する際のルールを定義します。

### デザイントークン（カラーパレット）

| トークン | 値 | 用途 |
|---------|-----|------|
| `slide-primary` | `#1e293b` (Slate 800) | メインカラー、タイトル |
| `slide-secondary` | `#64748b` (Slate 500) | サブテキスト、ボーダー |
| `slide-accent` | `#3b82f6` (Blue 500) | アクセント、強調 |
| `slide-warning` | `#60a5fa` (Blue 400) | 注意、ハイライト |

### フォントサイズ規約

**重要**: スライドタイプごとに定められたフォントサイズを厳守すること。個別調整は禁止。

| 要素 | タイトルスライド | 通常スライド |
|-----|-----------------|-------------|
| h1 | `text-6xl` または `text-7xl` | `text-5xl` |
| h2 | - | `text-3xl` |
| 本文 | `text-3xl` | `text-2xl` または `text-3xl` |
| 補足 | - | `text-xl` |

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

### スライド作成ワークフロー

1. **スライドの目的を決定** → 適切なタイプを選択
2. **テンプレートをコピー** → 上記のHTMLを使用
3. **コンテンツを埋める** → テキスト・画像を差し替え
4. **ルールを確認** → 禁止事項に違反していないかチェック
5. **プレビュー確認** → `npm start`で表示確認

### スライド内容の指示方法（Markdown形式）

AIにスライド生成を依頼する際は、以下の形式で指示できます：

```markdown
## slide-XX: タイトル

type: comparison

### 左カラム
- 項目1
- 項目2

### 右カラム
- 項目A
- 項目B

<!-- speaker_notes -->
ここで説明したいポイント：
- ポイント1
- ポイント2
```
