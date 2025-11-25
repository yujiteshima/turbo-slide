# Turbo Slide 汎用化実装計画

## 目次
1. [現状分析](#現状分析)
2. [汎用化に必要な改善点](#汎用化に必要な改善点)
3. [段階的実装計画](#段階的実装計画)
4. [優先順位と工数見積もり](#優先順位と工数見積もり)
5. [具体的な実装例](#具体的な実装例)

---

## 現状分析

### アーキテクチャ概要

#### スライド管理メカニズム
- `/slides/slide-{番号}.html` 形式で固定（例: slide-01.html～slide-23.html）
- `getSlideCount()` で自動検出：正規表現 `/^slide-\d+\.html$/`
- `TOTAL_SLIDES` を起動時に計算

#### 3つのモード実装
1. **スライドモード** (`/slide/:id`)
   - 通常表示
   - キーボード（← →）とボタン操作

2. **プレゼンターモード** (`/presenter/:id`)
   - API呼び出しでブロードキャスト
   - 複数端末に同期配信

3. **ビューアーモード** (`/viewer?slide=:id`)
   - SSEで受信
   - プレゼンターからの同期を受信

### ハードコードされている設定値

| 項目 | ファイル | 行番号 | 現在の値 |
|------|---------|-------|---------|
| スライド総数 | `script.js` | 59, 95, 118, 他 | `23` |
| タイマー秒数 | `script.js` | 7 | `10 * 60` (10分) |
| ポート番号 | `server.js` | 7 | `3000` |
| スライド形式 | `server.js` | 22 | `/^slide-\d+\.html$/` |
| レイアウトパス | `server.js` | 41 | `views/layout.html` |
| 画像パス | `server.js` | 15 | `slides/images` |

### 依存関係

```json
{
  "dependencies": {
    "express": "^4.19.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**特徴:**
- ✅ 非常にミニマル（Express.jsのみ）
- ✅ Turbo.jsはCDN読み込み
- ✅ 軽量でデプロイしやすい

### 現在の課題

1. **設定変更にコード編集が必要**
   - タイマー時間を変更 → `script.js`を編集
   - テーマ色を変更 → 複数ファイルを編集

2. **スライド作成の難易度が高い**
   - HTML/CSSの知識が必須
   - テンプレートがない

3. **ドキュメント不足**
   - カスタマイズ方法が不明確
   - 初心者向けガイドなし

---

## 汎用化に必要な改善点

### 1. 設定のカスタマイズ

#### 提案: `config.json` の導入

```json
{
  "presentation": {
    "title": "My Presentation",
    "author": "@username"
  },
  "timer": {
    "enabled": true,
    "minutes": 10,
    "warning": {
      "enabled": true,
      "minutes": 2,
      "color": "#ff6b6b"
    }
  },
  "theme": {
    "mode": "light",
    "colors": {
      "primary": "#06b6d4",
      "secondary": "#0d9488",
      "accent": "#f97316",
      "timerProgress": "#d97706"
    },
    "fontFamily": "system-ui, -apple-system, sans-serif"
  },
  "server": {
    "port": 3000
  },
  "paths": {
    "slides": "./slides",
    "images": "./slides/images",
    "public": "./public"
  }
}
```

#### メリット
- ✅ コード変更不要で設定可能
- ✅ 複数プロジェクトの切り替えが容易
- ✅ バージョン管理しやすい

### 2. スライドテンプレートの提供

#### 提案: `/templates/` ディレクトリ

```
/templates/
├── README.md                      # テンプレート使用方法
├── slide-template-title.html     # タイトルスライド
├── slide-template-content.html   # 本文スライド
├── slide-template-image.html     # 画像スライド
└── slide-template-twocol.html    # 2段組みスライド
```

#### テンプレート例（タイトルスライド）

```html
<style>
  /* タイトルスライド用のスタイル */
  .title-slide {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .title-slide h1 {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    /* ここにカスタムカラーを設定 */
    background: linear-gradient(135deg, #f97316 0%, #d97706 50%, #0d9488 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .title-slide .subtitle {
    font-size: 1.8rem;
    opacity: 0.8;
  }
</style>

<div class="slide title-slide">
  <div>
    <!-- ここにタイトルを入力 -->
    <h1>プレゼンテーションのタイトル</h1>

    <!-- ここにサブタイトルを入力 -->
    <p class="subtitle">@your_username</p>
  </div>
</div>
```

### 3. README.md の大幅改善

#### 追加すべきセクション

```markdown
# Turbo Slide

## 📖 目次
- クイックスタート
- スライドの作成方法
- カスタマイズ
- 3つのモード
- トラブルシューティング
- デプロイ

## 🚀 クイックスタート
### インストール
### 起動方法
### 初回設定

## ✍️ スライドの作成方法
### HTMLスライドの基本構造
### テンプレートの使用
### スタイリングのコツ

## ⚙️ カスタマイズ
### config.jsonの設定
### テーマカラーの変更
### タイマーの設定

## 📊 3つのモード
### スライドモード
### プレゼンターモード
### ビューアーモード

## 🐛 トラブルシューティング
### よくある問題と解決方法

## 🚢 デプロイ
### Herokuへのデプロイ
### Vercelへのデプロイ
### Dockerでのデプロイ
```

### 4. 環境変数サポート

#### `.env.example` の作成

```env
# サーバー設定
PORT=3000
NODE_ENV=development

# スライド設定（オプション：config.jsonで上書き可能）
TIMER_MINUTES=10
SLIDE_DIR=./slides
PUBLIC_DIR=./public
```

---

## 段階的実装計画

### Phase 1: 基礎固め（今週）

**優先度**: 高 ★★★★★
**工数**: 2-3時間
**効果**: 大

#### 実装項目

1. **config.json の作成と読み込み**
   - [ ] `config.json` スキーマ定義
   - [ ] `server.js` に読み込み機能追加
   - [ ] `script.js` にconfig値注入

2. **スライドテンプレート4種類**
   - [ ] タイトルスライドテンプレート
   - [ ] 本文スライドテンプレート
   - [ ] 画像スライドテンプレート
   - [ ] 2段組みスライドテンプレート
   - [ ] テンプレートREADME

3. **README.md 大幅改善**
   - [ ] クイックスタートガイド
   - [ ] スライド作成ガイド
   - [ ] カスタマイズ方法
   - [ ] 3モードの説明
   - [ ] トラブルシューティング

4. **環境変数サポート**
   - [ ] `.env.example` 作成
   - [ ] `.gitignore` に `.env` 追加

5. **ライセンスとコントリビューション**
   - [ ] `LICENSE` ファイル（MIT推奨）
   - [ ] `CONTRIBUTING.md`

#### 期待される成果

✅ ユーザーがコード編集不要で設定変更可能
✅ テンプレートで初心者も簡単にスライド作成
✅ 充実したドキュメントで自己解決率UP
✅ オープンソースプロジェクトとして公開準備完了

---

### Phase 2: 機能強化（2-4週間後）

**優先度**: 中 ★★★★☆
**工数**: 1-2週間
**効果**: 大

#### 実装項目

1. **スライド追加CLI**
   ```bash
   npm run add-slide "スライドタイトル"
   ```
   - 自動的に次のスライド番号を割り当て
   - テンプレートから生成
   - メタデータYAML追加

2. **Markdownサポート**
   - Markdownファイル → HTML変換
   - `marked.js` または `showdown.js` 統合
   - `.md` と `.html` 混在可能

3. **テーマプリセット**
   ```json
   {
     "theme": {
       "preset": "light" // light, dark, nature, ocean
     }
   }
   ```
   - CSSカスタムプロパティで実装
   - 簡単に切り替え可能

4. **プレビュー機能**
   - `/preview` エンドポイント
   - スライド一覧表示
   - サムネイル表示

#### 期待される成果

✅ スライド追加が爆速
✅ Markdownユーザーも利用可能
✅ 複数プレゼンの切り替えが簡単

---

### Phase 3: 高度な機能（1-2ヶ月後）

**優先度**: 低 ★★☆☆☆
**工数**: 2-4週間
**効果**: 中

#### 実装項目

1. **Web UIエディタ**
   - スライドプレビュー
   - リアルタイム編集
   - ドラッグ&ドロップでスライド並び替え

2. **ファイルアップロード**
   - ZIP/Markdownファイル一括アップロード
   - 画像一括アップロード

3. **プリセット共有**
   - GitHub連携
   - テンプレート配布
   - コミュニティテーマ

4. **分析機能**
   - プレゼン時間統計
   - スライド滞在時間
   - エクスポート機能

---

## 優先順位と工数見積もり

| 改善項目 | ユーザー需要 | 実装難度 | 工数 | 推奨タイミング |
|---------|-----------|--------|------|---------------|
| config.json | ★★★★★ | 低 | 1時間 | 今すぐ |
| テンプレート | ★★★★★ | 低 | 2時間 | 今すぐ |
| README改善 | ★★★★★ | 低 | 1時間 | 今すぐ |
| .env対応 | ★★★★☆ | 低 | 30分 | 今すぐ |
| CLI追加 | ★★★★☆ | 中 | 4時間 | 2週間後 |
| Markdown | ★★★★☆ | 中 | 3時間 | 2週間後 |
| テーマプリセット | ★★★☆☆ | 中 | 2時間 | 1ヶ月後 |
| 設定UI | ★★★☆☆ | 中 | 8時間 | 1ヶ月後 |
| Web Editor | ★★☆☆☆ | 高 | 20時間 | 2ヶ月後 |

---

## 具体的な実装例

### 1. config.json の読み込み（server.js）

```javascript
// server.js の冒頭に追加
const fs = require("fs");
const path = require("path");

// config.json を読み込み
let config = {
  timer: { minutes: 10 },
  theme: { colors: { primary: "#06b6d4" } },
  server: { port: 3000 }
};

try {
  const configPath = path.join(__dirname, "config.json");
  if (fs.existsSync(configPath)) {
    const userConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    config = { ...config, ...userConfig };
  }
} catch (err) {
  console.warn("⚠️  config.json not found, using defaults");
}

// PORT を config から取得
const PORT = process.env.PORT || config.server.port || 3000;

// スライドレンダリング時にconfigを注入
function renderSlide(index, mode = 'slide') {
  const slideContent = loadSlide(index);
  const navButtons = renderNavButtons(index, mode);
  let layout = loadLayout();

  // configをJavaScriptに注入
  const configScript = `
    <script>
      window.APP_CONFIG = ${JSON.stringify(config)};
      window.TOTAL_SLIDES = ${TOTAL_SLIDES};
    </script>
  `;

  layout = layout.replace("</head>", configScript + "</head>");
  layout = layout.replace("{{SLIDE_CONTENT}}", slideContent || "");
  layout = layout.replace("{{NAV_BUTTONS}}", navButtons);

  return layout;
}
```

### 2. script.js での config 利用

```javascript
// script.js の冒頭で config を取得
(function startTimer() {
  const timerEl = document.getElementById("timer");
  const timerProgressEl = document.getElementById("timer-progress");
  if (!timerEl) return;

  // config から設定を取得
  const config = window.APP_CONFIG || {};
  const timerMinutes = config.timer?.minutes || 10;
  const totalTime = timerMinutes * 60;

  let remaining = totalTime;

  // ... 以下同じ
})();

// スライド総数も config から取得
(function updateSlideProgress() {
  const slideProgressEl = document.getElementById("slide-progress");
  const slideTextEl = document.getElementById("slide-text");

  const totalSlides = window.TOTAL_SLIDES || 23;

  // ... 以下同じ
})();
```

### 3. テーマカラーの動的適用

```javascript
// script.js または layout.html に追加
(function applyTheme() {
  const config = window.APP_CONFIG || {};
  const colors = config.theme?.colors || {};

  if (colors.primary) {
    document.documentElement.style.setProperty('--color-primary', colors.primary);
  }
  if (colors.accent) {
    document.documentElement.style.setProperty('--color-accent', colors.accent);
  }
})();
```

```css
/* styles.css でカスタムプロパティを使用 */
:root {
  --color-primary: #06b6d4;
  --color-accent: #f97316;
}

.progress-bar {
  background: linear-gradient(90deg, var(--color-primary) 0%, #0d9488 100%);
}
```

### 4. スライド追加CLIスクリプト（add-slide.js）

```javascript
#!/usr/bin/env node
// add-slide.js

const fs = require('fs');
const path = require('path');

const slidesDir = path.join(__dirname, 'slides');
const templatePath = path.join(__dirname, 'templates', 'slide-template-content.html');

// 既存のスライド番号を取得
const files = fs.readdirSync(slidesDir);
const slideNumbers = files
  .filter(f => f.match(/^slide-\d+\.html$/))
  .map(f => parseInt(f.match(/\d+/)[0]))
  .sort((a, b) => a - b);

const nextNumber = slideNumbers.length > 0 ? slideNumbers[slideNumbers.length - 1] + 1 : 1;
const fileName = `slide-${String(nextNumber).padStart(2, '0')}.html`;
const filePath = path.join(slidesDir, fileName);

// テンプレートをコピー
const template = fs.readFileSync(templatePath, 'utf-8');
const title = process.argv[2] || 'New Slide';

// タイトルを置換
const content = template.replace('<!-- タイトルをここに入力 -->', `<h1>${title}</h1>`);

fs.writeFileSync(filePath, content);
console.log(`✅ Created: ${fileName}`);
console.log(`   Title: ${title}`);
```

package.jsonに追加：
```json
{
  "scripts": {
    "start": "node server.js",
    "add-slide": "node add-slide.js"
  }
}
```

使用方法：
```bash
npm run add-slide "新しいスライド"
```

---

## 次のステップ

### すぐに実装可能（Phase 1）

1. このプランを確認
2. `config.json` のスキーマを決定
3. Phase 1の実装開始
4. テストとドキュメント更新
5. GitHub公開準備

### 中期的な目標（Phase 2）

- コミュニティフィードバック収集
- CLI機能の充実
- Markdown対応
- 使用例の追加

### 長期的なビジョン（Phase 3）

- Web UIエディタ
- プリセット共有プラットフォーム
- プラグインシステム

---

## 追加計画: スタイリング・レイアウトシステムの改善

### 現状の課題

現在のスライド実装では、各スライドファイル（`slide-*.html`）に `<style>` タグで直接CSSを記述しています。

**問題点:**
- ❌ レイアウト作成に多くのCSS知識が必要
- ❌ スタイルの再利用が困難
- ❌ 複雑なレイアウト（カラム割、グリッド等）の実装が大変
- ❌ 各スライドで同じようなスタイルを繰り返し記述
- ❌ 保守性が低い（共通デザイン変更が困難）

### 解決策: Tailwind CSS + レイアウトテンプレートシステム

---

### Phase A: Tailwind CSS 導入（30-45分）

**優先度**: 高 ★★★★★
**工数**: 30-45分
**効果**: 大

#### 実装手順

1. **Tailwind CSSのインストール**
   ```bash
   npm install -D tailwindcss
   npx tailwindcss init
   ```

2. **tailwind.config.js の設定**
   ```javascript
   /** @type {import('tailwindcss').Config} */
   module.exports = {
     content: [
       "./slides/**/*.html",
       "./views/**/*.html",
       "./templates/**/*.html"
     ],
     theme: {
       extend: {
         colors: {
           'slide-primary': '#0d9488',
           'slide-secondary': '#06b6d4',
           'slide-accent': '#f97316',
           'slide-warning': '#d97706'
         },
         aspectRatio: {
           'slide': '16 / 9'
         }
       }
     },
     plugins: []
   }
   ```

3. **Tailwind入力ファイルの作成**
   ```css
   /* public/tailwind-input.css */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   /* スライド専用カスタムクラス */
   @layer components {
     .slide-container {
       @apply w-full h-full flex flex-col justify-center items-center p-8;
     }

     .slide-title {
       @apply text-5xl font-bold mb-6;
     }

     .slide-subtitle {
       @apply text-2xl opacity-80;
     }

     .slide-content {
       @apply text-xl leading-relaxed max-w-4xl mx-auto;
     }
   }
   ```

4. **ビルドスクリプトの追加**
   ```json
   // package.json
   {
     "scripts": {
       "start": "node server.js",
       "build:css": "npx tailwindcss -i ./public/tailwind-input.css -o ./public/tailwind.css --watch",
       "build:css:prod": "npx tailwindcss -i ./public/tailwind-input.css -o ./public/tailwind.css --minify"
     }
   }
   ```

5. **layout.htmlへの追加**
   ```html
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Turbo Slide</title>
     <link rel="stylesheet" href="/styles.css">
     <link rel="stylesheet" href="/tailwind.css">  <!-- 追加 -->
     <script src="https://unpkg.com/@hotwired/turbo@8.0.12/dist/turbo.es2017-esm.js" type="module"></script>
   </head>
   ```

#### メリット

✅ **開発速度向上** - ユーティリティクラスで素早くレイアウト構築
✅ **一貫性** - 統一されたデザインシステム
✅ **保守性** - CSS直書きからの脱却
✅ **レスポンシブ** - ブレークポイントが標準装備
✅ **カスタマイズ** - config.jsで色やサイズを一元管理

---

### Phase B: レイアウトテンプレートシステム構築（1-2時間）

**優先度**: 高 ★★★★★
**工数**: 1-2時間
**効果**: 大

#### テンプレート構造

```
/templates/
├── README.md                          # テンプレート使用ガイド
├── layouts/
│   ├── title.html                    # タイトルスライド
│   ├── content.html                  # 標準コンテンツ
│   ├── two-column.html               # 2カラム（テキスト + 画像）
│   ├── two-column-reverse.html       # 2カラム逆順（画像 + テキスト）
│   ├── three-column.html             # 3カラム等幅
│   ├── split-30-70.html              # 2カラム（30% / 70%）
│   ├── split-70-30.html              # 2カラム（70% / 30%）
│   ├── grid-2x2.html                 # 4グリッド（2x2）
│   ├── grid-3x2.html                 # 6グリッド（3x2）
│   ├── list-with-icons.html          # アイコン付きリスト
│   ├── fullscreen-image.html         # フルスクリーン画像
│   ├── code-showcase.html            # コード表示用
│   └── quote.html                    # 引用スライド
└── components/
    ├── card.html                      # カードコンポーネント
    ├── button.html                    # ボタンコンポーネント
    └── badge.html                     # バッジコンポーネント
```

#### テンプレート例

##### 1. タイトルスライド（title.html）
```html
<!-- templates/layouts/title.html -->
<div class="slide-container bg-gradient-to-br from-slide-primary to-slide-secondary">
  <div class="text-center">
    <h1 class="text-7xl font-bold text-white mb-8">
      <!-- タイトルをここに入力 -->
      プレゼンテーションタイトル
    </h1>
    <p class="text-3xl text-white/90">
      <!-- サブタイトルをここに入力 -->
      @your_username
    </p>
  </div>
</div>
```

##### 2. 2カラムレイアウト（two-column.html）
```html
<!-- templates/layouts/two-column.html -->
<div class="slide-container">
  <div class="w-full max-w-6xl grid grid-cols-2 gap-12 items-center">
    <!-- 左カラム: テキスト -->
    <div class="space-y-6">
      <h1 class="text-5xl font-bold text-slide-primary">
        見出しをここに
      </h1>
      <div class="text-xl leading-relaxed text-gray-700">
        <p>コンテンツをここに記述します。</p>
        <ul class="list-disc pl-6 mt-4 space-y-2">
          <li>ポイント1</li>
          <li>ポイント2</li>
          <li>ポイント3</li>
        </ul>
      </div>
    </div>

    <!-- 右カラム: 画像 -->
    <div>
      <img
        src="/images/your-image.png"
        alt="説明"
        class="w-full rounded-2xl shadow-2xl border-4 border-slide-secondary"
      >
    </div>
  </div>
</div>
```

##### 3. 3カラムレイアウト（three-column.html）
```html
<!-- templates/layouts/three-column.html -->
<div class="slide-container">
  <h1 class="text-5xl font-bold text-center mb-12 text-slide-primary">
    3つのポイント
  </h1>

  <div class="w-full max-w-6xl grid grid-cols-3 gap-8">
    <!-- カラム1 -->
    <div class="bg-white rounded-xl shadow-lg p-6 border-t-4 border-slide-primary">
      <div class="text-4xl mb-4">🚀</div>
      <h2 class="text-2xl font-bold mb-3 text-gray-800">高速</h2>
      <p class="text-gray-600">説明文をここに記述します。</p>
    </div>

    <!-- カラム2 -->
    <div class="bg-white rounded-xl shadow-lg p-6 border-t-4 border-slide-secondary">
      <div class="text-4xl mb-4">💡</div>
      <h2 class="text-2xl font-bold mb-3 text-gray-800">シンプル</h2>
      <p class="text-gray-600">説明文をここに記述します。</p>
    </div>

    <!-- カラム3 -->
    <div class="bg-white rounded-xl shadow-lg p-6 border-t-4 border-slide-accent">
      <div class="text-4xl mb-4">✨</div>
      <h2 class="text-2xl font-bold mb-3 text-gray-800">強力</h2>
      <p class="text-gray-600">説明文をここに記述します。</p>
    </div>
  </div>
</div>
```

##### 4. グリッドカードレイアウト（grid-2x2.html）
```html
<!-- templates/layouts/grid-2x2.html -->
<div class="slide-container">
  <h1 class="text-5xl font-bold text-center mb-12 text-slide-primary">
    4つの機能
  </h1>

  <div class="w-full max-w-5xl grid grid-cols-2 gap-8">
    <!-- カード1 -->
    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-xl">
      <h2 class="text-3xl font-bold mb-4 text-blue-900">機能1</h2>
      <p class="text-lg text-blue-800">説明をここに記述</p>
    </div>

    <!-- カード2 -->
    <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 shadow-xl">
      <h2 class="text-3xl font-bold mb-4 text-green-900">機能2</h2>
      <p class="text-lg text-green-800">説明をここに記述</p>
    </div>

    <!-- カード3 -->
    <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 shadow-xl">
      <h2 class="text-3xl font-bold mb-4 text-orange-900">機能3</h2>
      <p class="text-lg text-orange-800">説明をここに記述</p>
    </div>

    <!-- カード4 -->
    <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 shadow-xl">
      <h2 class="text-3xl font-bold mb-4 text-purple-900">機能4</h2>
      <p class="text-lg text-purple-800">説明をここに記述</p>
    </div>
  </div>
</div>
```

##### 5. 比率指定2カラム（split-30-70.html）
```html
<!-- templates/layouts/split-30-70.html -->
<div class="slide-container">
  <div class="w-full max-w-6xl grid grid-cols-[3fr_7fr] gap-8 items-start">
    <!-- 左30%: サイドバー -->
    <div class="bg-slide-primary/10 rounded-xl p-6 h-full">
      <h2 class="text-2xl font-bold mb-4 text-slide-primary">目次</h2>
      <ul class="space-y-3 text-lg">
        <li class="flex items-center gap-2">
          <span class="text-slide-secondary">▸</span>
          <span>項目1</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="text-slide-secondary">▸</span>
          <span>項目2</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="text-slide-secondary">▸</span>
          <span>項目3</span>
        </li>
      </ul>
    </div>

    <!-- 右70%: メインコンテンツ -->
    <div class="space-y-6">
      <h1 class="text-5xl font-bold text-slide-primary">
        メインタイトル
      </h1>
      <div class="text-xl leading-relaxed text-gray-700 space-y-4">
        <p>メインコンテンツをここに記述します。</p>
        <p>複数の段落を含めることができます。</p>
      </div>
    </div>
  </div>
</div>
```

##### 6. アイコン付きリスト（list-with-icons.html）
```html
<!-- templates/layouts/list-with-icons.html -->
<div class="slide-container">
  <h1 class="text-5xl font-bold text-center mb-12 text-slide-primary">
    実装ステップ
  </h1>

  <div class="w-full max-w-4xl space-y-6">
    <!-- ステップ1 -->
    <div class="flex items-start gap-6 bg-white rounded-xl p-6 shadow-lg border-l-4 border-slide-primary">
      <div class="flex-shrink-0 w-12 h-12 bg-slide-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
        1
      </div>
      <div>
        <h2 class="text-2xl font-bold mb-2">セットアップ</h2>
        <p class="text-lg text-gray-600">プロジェクトの初期設定を行います。</p>
      </div>
    </div>

    <!-- ステップ2 -->
    <div class="flex items-start gap-6 bg-white rounded-xl p-6 shadow-lg border-l-4 border-slide-secondary">
      <div class="flex-shrink-0 w-12 h-12 bg-slide-secondary text-white rounded-full flex items-center justify-center text-2xl font-bold">
        2
      </div>
      <div>
        <h2 class="text-2xl font-bold mb-2">実装</h2>
        <p class="text-lg text-gray-600">機能を実装していきます。</p>
      </div>
    </div>

    <!-- ステップ3 -->
    <div class="flex items-start gap-6 bg-white rounded-xl p-6 shadow-lg border-l-4 border-slide-accent">
      <div class="flex-shrink-0 w-12 h-12 bg-slide-accent text-white rounded-full flex items-center justify-center text-2xl font-bold">
        3
      </div>
      <div>
        <h2 class="text-2xl font-bold mb-2">デプロイ</h2>
        <p class="text-lg text-gray-600">本番環境にデプロイします。</p>
      </div>
    </div>
  </div>
</div>
```

#### テンプレート使用ガイド（templates/README.md）

```markdown
# Turbo Slide レイアウトテンプレートガイド

## 概要

このディレクトリには、スライド作成を簡単にするための再利用可能なレイアウトテンプレートが含まれています。

## テンプレート一覧

### 基本レイアウト

| テンプレート | 用途 | プレビュー |
|------------|------|-----------|
| `title.html` | タイトルスライド | 中央揃え、大きな見出し |
| `content.html` | 標準コンテンツ | シンプルなテキスト表示 |
| `fullscreen-image.html` | 画像表示 | フルスクリーン画像 |

### カラムレイアウト

| テンプレート | レイアウト | 使用例 |
|------------|----------|--------|
| `two-column.html` | 50% / 50% | テキスト + 画像 |
| `two-column-reverse.html` | 50% / 50% | 画像 + テキスト |
| `three-column.html` | 33% / 33% / 33% | 3つの要素 |
| `split-30-70.html` | 30% / 70% | サイドバー + メイン |
| `split-70-30.html` | 70% / 30% | メイン + サイドバー |

### グリッドレイアウト

| テンプレート | グリッド | 使用例 |
|------------|---------|--------|
| `grid-2x2.html` | 2行×2列 | 4つのカード |
| `grid-3x2.html` | 2行×3列 | 6つのアイテム |

### 特殊レイアウト

| テンプレート | 用途 |
|------------|------|
| `list-with-icons.html` | ステップ表示、箇条書き |
| `code-showcase.html` | コード表示 |
| `quote.html` | 引用スライド |

## 使用方法

1. テンプレートファイルをコピー
2. `slides/slide-XX.html` として保存
3. コメント部分を自分のコンテンツで置き換え

### 例: タイトルスライドの作成

```bash
# テンプレートをコピー
cp templates/layouts/title.html slides/slide-01.html

# エディタで編集
# "プレゼンテーションタイトル" → 実際のタイトルに変更
```

## カスタマイズ

### 色の変更

Tailwindのカラークラスを使用：
- `text-slide-primary` → プライマリカラー（#0d9488）
- `text-slide-secondary` → セカンダリカラー（#06b6d4）
- `text-slide-accent` → アクセントカラー（#f97316）

### サイズの調整

Tailwindのサイズクラスを使用：
- `text-5xl` → `text-6xl` （より大きく）
- `gap-8` → `gap-12` （より広い間隔）
- `p-6` → `p-8` （より広いパディング）

## ヒント

- 🎨 Tailwindクラスは自由に組み合わせ可能
- 📐 レスポンシブ対応は自動（`md:`, `lg:` プレフィックス使用）
- 🔄 テンプレートを組み合わせて独自レイアウトを作成可能
```

---

### Phase C: 既存スライドの移行（オプション）

**優先度**: 中 ★★★☆☆
**工数**: 2-3時間
**効果**: 中

現在の23枚のスライドを、新しいTailwind + テンプレートシステムに徐々に移行。

#### 移行手順

1. 重要なスライドから優先的に移行
2. `<style>`タグ内のCSSをTailwindクラスに変換
3. レイアウトパターンが類似しているスライドをグループ化
4. テンプレートをベースに再構築

#### 移行例

**Before（slide-01.html - CSS直書き）:**
```html
<style>
  .slide-title h1 {
    font-size: 4rem;
    line-height: 1.3;
    margin-bottom: 0.8rem;
  }
  .slide-title .subtitle {
    font-size: 1.8rem;
    opacity: 0.8;
  }
</style>

<div class="slide slide-title">
  <h1>Hotwire に出会って、<br>新しい景色を見つけた話</h1>
  <p class="subtitle">@yujiteshima</p>
</div>
```

**After（Tailwindクラス使用）:**
```html
<div class="slide-container">
  <div class="text-center">
    <h1 class="text-6xl leading-tight mb-3 font-bold">
      Hotwire に出会って、<br>新しい景色を見つけた話
    </h1>
    <p class="text-3xl opacity-80">@yujiteshima</p>
  </div>
</div>
```

**メリット:**
- ✅ `<style>`タグ削除でファイルサイズ削減
- ✅ 統一されたデザインシステム
- ✅ メンテナンス性向上

---

### 期待される効果

このスタイリング・レイアウトシステムの改善により：

✅ **開発効率UP** - スライド作成時間が50-70%削減
✅ **学習コスト低減** - CSS知識がなくてもレイアウト作成可能
✅ **デザイン統一** - 一貫したビジュアルデザイン
✅ **再利用性** - テンプレートで効率的にスライド作成
✅ **拡張性** - 新しいレイアウトパターンを簡単に追加
✅ **保守性** - デザイン変更がconfig一箇所で完結

---

### 実装の優先順位

| 項目 | 優先度 | 工数 | 効果 |
|-----|-------|------|------|
| Tailwind CSS導入 | ★★★★★ | 30分 | 大 |
| 基本テンプレート3種 | ★★★★★ | 1時間 | 大 |
| カラムレイアウト | ★★★★☆ | 30分 | 大 |
| グリッドレイアウト | ★★★☆☆ | 30分 | 中 |
| テンプレートREADME | ★★★★☆ | 30分 | 中 |
| 既存スライド移行 | ★★☆☆☆ | 2-3時間 | 中 |

---

## まとめ

このプランに従うことで、Turbo Slideは：

✅ **初心者にやさしい** - テンプレートとドキュメント充実
✅ **カスタマイズ可能** - config.jsonで簡単設定
✅ **段階的成長** - 必要な機能を段階的に追加
✅ **コミュニティ主導** - オープンソースで成長
✅ **美しいデザイン** - Tailwind CSSで洗練されたUI
✅ **効率的な開発** - レイアウトテンプレートで高速作成

という特徴を持つ、誰でも使えるプレゼンテーションツールになります。

---

**Last Updated**: 2025-11-26
**Version**: 1.1.0
