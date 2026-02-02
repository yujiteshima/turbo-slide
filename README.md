
# Turbo Slide

発表用のシンプルなスライドアプリです。

**Turbo Frames** を使ってスライドを切り替えます。

## 特徴

- **Turbo Frames** によるスムーズなスライド遷移
- URLベースのスライド管理（/slide/1, /slide/2...）
- 5分カウントダウンタイマー
- キーボード操作（← / →）
- リロードしても同じスライドを表示
- スライドは個別のHTMLファイルで管理
- **Google Slide PDFインポート機能**

## セットアップ

```bash
npm install
npm start
```

ブラウザで `http://localhost:3000` を開いてください。

**注意**: Node.js v20以上が必要です。

## 使い方

- 画面下の **Next / Prev** ボタンでスライドを切り替え
- キーボードの **← / →** でも操作できます
- 上部に **5分のカウントダウンタイマー** が表示されます

## Google Slideインポート機能

Google SlideからエクスポートしたPDFを自動で画像に変換し、スライドとして表示できます。

### 使い方

1. Google Slideで「ファイル」→「ダウンロード」→「PDF ドキュメント」を選択
2. ダウンロードしたPDFを `slides/imported/` に配置
3. サーバーを起動（`npm start`）→ 自動でPNG画像に変換
4. `http://localhost:3000/deck/<PDF名>` でアクセス

### 例

```
slides/imported/my-presentation.pdf
↓ サーバー起動時に自動変換
slides/imported/my-presentation/
  ├── slide-01.png
  ├── slide-02.png
  └── ...
```

アクセスURL: `http://localhost:3000/deck/my-presentation`

### URL構成

| エンドポイント | 説明 |
|--------------|------|
| `/deck/<name>` | インポートしたスライドを表示 |
| `/deck/<name>/presenter/1` | プレゼンターモード |
| `/deck/<name>/viewer` | ビューアーモード |
| `/deck/<name>/print` | PDF印刷用 |
| `/api/decks` | デッキ一覧API |

### 注意事項

- PDFを更新した場合、対応する画像ディレクトリを削除すると再変換されます
- 初回変換時はPDFのサイズに応じて時間がかかる場合があります

