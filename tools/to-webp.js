/* Перегоняет картинки из assets/img в WebP и удаляет исходники.
   Нужен один раз: npm i sharp   (в этой же папке tools или глобально)
   Запуск из корня сайта:  node tools/to-webp.js
   Сканы и письма (docs, awards, social) жмём сильнее — там текст, 72 хватает.
   Длинная сторона ограничена 1600 px: больше на сайте нигде не показывается.
   Ссылки в html/js/css после этого правятся вручную или поиском-заменой .jpg → .webp. */
const fs = require("fs"), path = require("path");
let sharp; try { sharp = require("sharp"); } catch (e) { console.error("Нет пакета sharp. Выполните: npm i sharp"); process.exit(1); }

const imgDir = path.join(__dirname, "..", "assets", "img");
const MAX = 1600;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jpe?g|png)$/i.test(e.name)) out.push(p);
  }
  return out;
}

(async () => {
  const files = walk(imgDir);
  let before = 0, after = 0;
  for (const f of files) {
    const rel = path.relative(imgDir, f).replace(/\\/g, "/");
    const outAbs = path.join(imgDir, rel.replace(/\.(jpe?g|png)$/i, ".webp"));
    const meta = await sharp(f).metadata();
    const big = Math.max(meta.width, meta.height) > MAX;
    let pipe = sharp(f);
    if (big) pipe = pipe.resize({ width: meta.width >= meta.height ? MAX : null, height: meta.height > meta.width ? MAX : null, withoutEnlargement: true });
    const isScan = /^(docs|awards|social)\//.test(rel);
    await pipe.webp({ quality: isScan ? 72 : (meta.hasAlpha ? 84 : 80), effort: 6, alphaQuality: 90 }).toFile(outAbs);
    before += fs.statSync(f).size; after += fs.statSync(outAbs).size;
    fs.unlinkSync(f);
    console.log(rel + " → " + path.basename(outAbs));
  }
  console.log(`\nготово: ${files.length} файлов, ${(before / 1048576).toFixed(1)} МБ → ${(after / 1048576).toFixed(1)} МБ`);
})();
