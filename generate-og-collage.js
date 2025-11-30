/**
 * One-off OG image collage generator.
 * Picks the latest 8 geo-tagged photos (by EXIF DateTimeOriginal)
 * and builds a 1200x630 OpenGraph preview (4x2 grid) using ImageMagick.
 * Requires `magick` (ImageMagick) to be available on PATH.
 */

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const exif = require('fast-exif');
const { execSync } = require('child_process');

async function main() {
  try { execSync('command -v magick'); } catch (e) {
    console.error('ImageMagick `magick` command not found. Install via: brew install imagemagick');
    process.exit(1);
  }

  const IMAGES_DIR = path.resolve('assets/images');
  const OUT_DIR = path.resolve('.tmp-og');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  const files = (await fsp.readdir(IMAGES_DIR))
    .filter(f => /\.(jpe?g|png)$/i.test(f));

  const withDates = [];
  for (const file of files) {
    try {
      const tags = await exif.read(path.join(IMAGES_DIR, file));
      const date = tags?.exif?.DateTimeOriginal ? new Date(tags.exif.DateTimeOriginal) : null;
      if (date) withDates.push({ file, date });
    } catch (_) {}
  }

  if (withDates.length === 0) {
    console.error('No dated EXIF images found.');
    process.exit(1);
  }

  withDates.sort((a, b) => b.date.getTime() - a.date.getTime());
  const pick = withDates.slice(0, 8);

  const cellW = 300, cellH = 315; // 4*300=1200, 2*315=630
  console.log('Selected images for collage:');
  pick.forEach(p => console.log(p.file, p.date.toISOString()));

  const cellPaths = [];
  pick.forEach((p, idx) => {
    const src = path.join(IMAGES_DIR, p.file);
    const out = path.join(OUT_DIR, `cell-${idx}.jpg`);
    const cmd = `magick "${src}" -auto-orient -resize ${cellW}x${cellH}^ -gravity center -extent ${cellW}x${cellH} -quality 85 "${out}"`;
    execSync(cmd);
    cellPaths.push(out);
  });

  const montageCmd = `magick montage ${cellPaths.map(p => '"' + p + '"').join(' ')} -tile 4x2 -geometry ${cellW}x${cellH}+0+0 -background black og-collage.jpg`;
  execSync(montageCmd);

  const annotateCmd = `magick og-collage.jpg -gravity Northwest -fill white -pointsize 32 -annotate +28+24 "lands upon" og.jpg`;
  execSync(annotateCmd);

  if (fs.existsSync('_site')) {
    fs.copyFileSync('og.jpg', path.join('_site', 'og.jpg'));
  }

  console.log('Generated og.jpg');
}

main().catch(err => { console.error(err); process.exit(1); });
