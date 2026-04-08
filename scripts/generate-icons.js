const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images');
const SVG_PATH = path.join(__dirname, '..', 'logosvg.svg');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(SVG_PATH);

  await sharp(svgBuffer)
    .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'icon.png'));

  await sharp(svgBuffer)
    .resize(1240, 1240, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'splash-icon.png'));

  await sharp(svgBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'favicon.png'));

  const foregroundSvg = `<svg width="1024" height="1024" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g fill="#8B0000" transform="translate(50,50) scale(1.08) translate(-50,-50)">
    <path d="M38 22C35.7909 22 34 23.7909 34 26V74C34 76.2091 35.7909 78 38 78H62C64.2091 78 66 76.2091 66 74V26C66 23.7909 64.2091 22 62 22H38ZM37 26H63V71H37V26ZM46 73H54V75H46V73Z" />
    <g transform="rotate(-15, 50, 50)">
      <path d="M38 42C38 39.7909 39.7909 38 42 38H65C67.2091 38 69 39.7909 69 42V56C69 58.2091 67.2091 60 65 60H42C39.7909 60 38 58.2091 38 56V42Z" stroke="white" stroke-width="2" />
      <circle cx="46" cy="45" r="2.5" fill="white" />
      <rect x="44" y="53" width="12" height="2" transform="rotate(-45, 44, 53)" fill="white" />
      <circle cx="58" cy="53" r="2.5" fill="white" />
    </g>
    <path d="M72 32L73.5 35.5L77 37L73.5 38.5L72 42L70.5 38.5L67 37L70.5 35.5L72 32Z" fill="#8B0000" />
  </g>
</svg>`;

  await sharp(Buffer.from(foregroundSvg))
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'android-icon-foreground.png'));

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'android-icon-background.png'));

  const monochromeSvg = `<svg width="1024" height="1024" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g fill="#000000" transform="translate(50,50) scale(1.08) translate(-50,-50)">
    <path d="M38 22C35.7909 22 34 23.7909 34 26V74C34 76.2091 35.7909 78 38 78H62C64.2091 78 66 76.2091 66 74V26C66 23.7909 64.2091 22 62 22H38ZM37 26H63V71H37V26ZM46 73H54V75H46V73Z" />
    <g transform="rotate(-15, 50, 50)">
      <path d="M38 42C38 39.7909 39.7909 38 42 38H65C67.2091 38 69 39.7909 69 42V56C69 58.2091 67.2091 60 65 60H42C39.7909 60 38 58.2091 38 56V42Z" stroke="white" stroke-width="2" />
      <circle cx="46" cy="45" r="2.5" fill="white" />
      <rect x="44" y="53" width="12" height="2" transform="rotate(-45, 44, 53)" fill="white" />
      <circle cx="58" cy="53" r="2.5" fill="white" />
    </g>
    <path d="M72 32L73.5 35.5L77 37L73.5 38.5L72 42L70.5 38.5L67 37L70.5 35.5L72 32Z" fill="#000000" />
  </g>
</svg>`;

  await sharp(Buffer.from(monochromeSvg))
    .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'android-icon-monochrome.png'));

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);