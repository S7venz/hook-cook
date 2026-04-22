/**
 * Optimisation batch des images dans backend/uploads.
 *
 * - Convertit les PNG/JPG > 80 KB en WebP qualité 82
 * - Redimensionne les images trop grandes (max 1600 px)
 * - Garde l'original (la nouvelle version est en .webp à côté)
 * - Skip les fichiers déjà convertis
 *
 * Usage :
 *   cd frontend
 *   node scripts/optimize-uploads.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const UPLOADS_DIR = path.resolve(process.cwd(), '..', 'backend', 'uploads');
const MAX_DIMENSION = 1600;
const QUALITY = 82;
const MIN_SIZE_KB = 80;

async function processOne(file) {
  const ext = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return null;

  const full = path.join(UPLOADS_DIR, file);
  const webpName = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const webpFull = path.join(UPLOADS_DIR, webpName);

  const origStat = await fs.stat(full);
  const origKB = Math.round(origStat.size / 1024);

  // Si le webp existe déjà et est récent, on skip
  try {
    const webpStat = await fs.stat(webpFull);
    if (webpStat.mtimeMs >= origStat.mtimeMs) {
      return { file, skipped: true, origKB };
    }
  } catch {
    /* webp n'existe pas — on continue */
  }

  // Skip les petites images (pas besoin d'optimiser)
  if (origKB < MIN_SIZE_KB) {
    return { file, skipped: true, origKB, reason: 'small' };
  }

  const img = sharp(full, { failOn: 'none' });
  const meta = await img.metadata();
  const needsResize =
    (meta.width && meta.width > MAX_DIMENSION) ||
    (meta.height && meta.height > MAX_DIMENSION);

  let pipeline = img;
  if (needsResize) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  await pipeline.webp({ quality: QUALITY, effort: 6 }).toFile(webpFull);

  const newStat = await fs.stat(webpFull);
  const newKB = Math.round(newStat.size / 1024);
  return {
    file,
    done: true,
    origKB,
    newKB,
    savings: Math.round((1 - newKB / origKB) * 100),
    resized: needsResize,
  };
}

async function main() {
  const files = await fs.readdir(UPLOADS_DIR);
  console.log(`Processing ${files.length} files in ${UPLOADS_DIR}\n`);

  const results = [];
  for (const file of files) {
    try {
      const result = await processOne(file);
      if (result) {
        results.push(result);
        if (result.done) {
          const tag = result.resized ? ' (resized)' : '';
          console.log(
            `  ✓ ${file.padEnd(50)} ${String(result.origKB).padStart(5)} KB → ${String(result.newKB).padStart(5)} KB (-${result.savings}%)${tag}`,
          );
        } else if (result.reason === 'small') {
          // trop petit pour valoir le coup
        } else {
          // skipped mais existait
        }
      }
    } catch (err) {
      console.warn(`  ✗ ${file}: ${err.message}`);
    }
  }

  const done = results.filter((r) => r.done);
  const totalOrig = done.reduce((s, r) => s + r.origKB, 0);
  const totalNew = done.reduce((s, r) => s + r.newKB, 0);
  console.log(
    `\nTotal: ${done.length} files processed, ${totalOrig} KB → ${totalNew} KB (saved ${totalOrig - totalNew} KB)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
