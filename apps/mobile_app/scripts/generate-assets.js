const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'src', 'assets', 'images');
fs.mkdirSync(outDir, { recursive: true });

const kitBase = path.join(__dirname, '..', '..', '..', 'EduLyfe_4B_Logo_Kit');
if (fs.existsSync(kitBase)) {
  const iconSrc = path.join(
    kitBase,
    'More_Sizes_and_Android',
    '06_App_Icon_Tile',
    'color',
    'EduLyfe_icon_color_1024.png',
  );
  const adaptiveSrc = path.join(
    kitBase,
    'More_Sizes_and_Android',
    '07_Symbol',
    'color',
    'EduLyfe_symbol_color_1024h.png',
  );
  const splashSrc = path.join(
    kitBase,
    'More_Sizes_and_Android',
    '03_Logo_Stacked',
    'reversed',
    'EduLyfe_logo-stacked_reversed_1600w.png',
  );
  const faviconSrc = path.join(
    kitBase,
    'More_Sizes_and_Android',
    '06_App_Icon_Tile',
    'color',
    'EduLyfe_icon_color_48.png',
  );

  if (fs.existsSync(iconSrc)) fs.copyFileSync(iconSrc, path.join(outDir, 'icon.png'));
  if (fs.existsSync(adaptiveSrc))
    fs.copyFileSync(adaptiveSrc, path.join(outDir, 'adaptive-icon.png'));
  if (fs.existsSync(splashSrc)) fs.copyFileSync(splashSrc, path.join(outDir, 'splash.png'));
  if (fs.existsSync(faviconSrc)) fs.copyFileSync(faviconSrc, path.join(outDir, 'favicon.png'));
  console.log('Successfully copied EduLyfe branding assets to src/assets/images!');
} else {
  console.log('Logo kit not found; preserving existing assets.');
}
