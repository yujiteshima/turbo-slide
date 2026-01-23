// src/server.js
import { createApp } from "./app.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  const { app, config, services, initialize } = createApp();

  // インポートデッキの初期化
  await initialize();

  app.listen(PORT, () => {
    const totalSlides = services.slideService.getSlideCount();
    const importedDecks = services.deckService.getImportedDecks();

    console.log(`🚀 ${config.title} running at http://localhost:${PORT}`);
    console.log(`   Slides directory: ${config.slidesDir}`);
    console.log(`   Total slides: ${totalSlides}`);
    console.log(`   Timer: ${config.timer} seconds`);

    if (importedDecks.length > 0) {
      console.log(`\n📁 Imported decks:`);
      importedDecks.forEach(deck => {
        const count = services.deckService.getImportedSlideCount(deck);
        console.log(`   - ${deck}: ${count} slides → http://localhost:${PORT}/deck/${deck}`);
      });
    }

    if (totalSlides === 0 && importedDecks.length === 0) {
      console.log(`\n⚠️  No slides found. Create slides in ${config.slidesDir}/`);
      console.log(`   Example: slide-01.html, slide-02.html, ...`);
      console.log(`\n📁 Sample slides available in samples/hotwire-lt/`);
      console.log(`\n💡 Or import Google Slides:`);
      console.log(`   1. Export from Google Slide as PDF`);
      console.log(`   2. Place PDF in ${config.slidesDir}/imported/`);
      console.log(`   3. Restart server`);
    }
  });
}

startServer();
