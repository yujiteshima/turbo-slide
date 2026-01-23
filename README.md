
# Turbo Slide

発表用のシンプルなスライドアプリです。

**Turbo Frames** を使ってスライドを切り替えます。

## 特徴

- **Turbo Frames** によるスムーズなスライド遷移
- URLベースのスライド管理（/slide/1, /slide/2...）
- 10分カウントダウンタイマー
- キーボード操作（← / →）
- リロードしても同じスライドを表示
- スライドは個別のHTMLファイルで管理
- **Google SlideからPDFインポート対応**

## 必要環境

- Node.js v20以上

## セットアップ

```bash
npm install
npm start
```

ブラウザで `http://localhost:3000` を開いてください。

## 使い方

- 画面下の **Next / Prev** ボタンでスライドを切り替え
- キーボードの **← / →** でも操作できます
- 上部に **10分のカウントダウンタイマー** が表示されます

## Google Slideからのインポート

Google SlideのプレゼンテーションをPDFでダウンロードし、自動で画像に変換してスライドとして表示できます。

### 手順

1. Google Slideで「ファイル」→「ダウンロード」→「PDF ドキュメント (.pdf)」を選択
2. ダウンロードしたPDFを `slides/imported/` ディレクトリに配置
   ```
   slides/imported/my-presentation.pdf
   ```
3. サーバーを起動（`npm start`）
   - 起動時に自動でPDFを画像に変換
4. ブラウザでアクセス
   ```
   http://localhost:3000/deck/my-presentation
   ```

### インポートデッキのURL

| URL | 説明 |
|-----|------|
| `/deck/<deck-name>` | スライド表示 |
| `/deck/<deck-name>/presenter/1` | プレゼンターモード |
| `/deck/<deck-name>/viewer` | ビューアーモード |
| `/deck/<deck-name>/print` | PDF出力 |

### デッキ一覧API

```bash
curl http://localhost:3000/api/decks
```

### 注意事項

- PDFファイル名がデッキ名になります（例: `my-presentation.pdf` → `/deck/my-presentation`）
- PDFを更新した場合、対応する画像フォルダを削除すると再変換されます
- 初回変換時は時間がかかる場合があります
