# TODO

## 修正候補

### server.js - スライド数の動的取得
**問題**: 現在、サーバー起動時に一度だけスライド数を取得しているため、新しいスライドを追加してもサーバー再起動が必要

**現在の実装**:
```javascript
const TOTAL_SLIDES = getSlideCount();
```

**修正案**:
リクエストごとにスライド数を取得するように変更

```javascript
// 修正前
function renderNavButtons(currentIndex) {
  const prevClass = currentIndex === 1 ? 'btn disabled' : 'btn';
  const nextClass = currentIndex === TOTAL_SLIDES ? 'btn disabled' : 'btn';
  // ...
}

// 修正後
function renderNavButtons(currentIndex) {
  const totalSlides = getSlideCount(); // 動的に取得
  const prevClass = currentIndex === 1 ? 'btn disabled' : 'btn';
  const nextClass = currentIndex === totalSlides ? 'btn disabled' : 'btn';
  // ...
}

// スライド表示ルートでも同様に
app.get("/slide/:id", (req, res) => {
  const slideId = parseInt(req.params.id, 10);
  const totalSlides = getSlideCount(); // 動的に取得

  if (isNaN(slideId) || slideId < 1 || slideId > totalSlides) {
    return res.redirect("/slide/1");
  }
  // ...
});
```

**メリット**:
- スライド追加時にサーバー再起動不要
- 開発体験の向上

**デメリット**:
- リクエストごとにファイルシステムを読むため、パフォーマンスがわずかに低下（実用上は問題ないレベル）

---

## その他のタスク

（今後のタスクはここに追加）
