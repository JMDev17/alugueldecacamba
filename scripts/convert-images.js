const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const imagesDir = path.resolve(__dirname, '..', 'assets', 'images');

async function convertToAvif() {
  console.log('=== Conversão JPG → AVIF ===\n');

  const jpgFiles = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg'));

  if (jpgFiles.length === 0) {
    console.log('Nenhum arquivo .jpg encontrado em assets/images/');
    return;
  }

  for (const file of jpgFiles) {
    const inputPath = path.join(imagesDir, file);
    const outputName = file.replace('.jpg', '.avif');
    const outputPath = path.join(imagesDir, outputName);

    const stats = fs.statSync(inputPath);
    const originalKb = (stats.size / 1024).toFixed(1);

    await sharp(inputPath)
      .avif({ quality: 65, effort: 6 })  // quality 65 = bom equilíbrio visual/tamanho
      .toFile(outputPath);

    const newStats = fs.statSync(outputPath);
    const newKb = (newStats.size / 1024).toFixed(1);
    const savings = ((1 - newStats.size / stats.size) * 100).toFixed(0);

    console.log(`✔ ${file} (${originalKb} KB) → ${outputName} (${newKb} KB) [−${savings}%]`);
  }

  console.log('\n=== Geração de Favicon PNG ===\n');

  // Gerar favicon.png a partir do SVG
  const faviconSvg = path.join(imagesDir, 'favicon.svg');
  if (fs.existsSync(faviconSvg)) {
    const svgBuffer = fs.readFileSync(faviconSvg);

    // 32x32
    await sharp(svgBuffer, { density: 300 })
      .resize(32, 32)
      .png()
      .toFile(path.join(imagesDir, 'favicon-32.png'));
    console.log('✔ favicon-32.png gerado');

    // 48x48
    await sharp(svgBuffer, { density: 300 })
      .resize(48, 48)
      .png()
      .toFile(path.join(imagesDir, 'favicon-48.png'));
    console.log('✔ favicon-48.png gerado');

    // 180x180 (Apple Touch Icon)
    await sharp(svgBuffer, { density: 300 })
      .resize(180, 180)
      .png()
      .toFile(path.join(imagesDir, 'apple-touch-icon.png'));
    console.log('✔ apple-touch-icon.png gerado (180x180)');

    // 192x192 (PWA)
    await sharp(svgBuffer, { density: 300 })
      .resize(192, 192)
      .png()
      .toFile(path.join(imagesDir, 'icon-192.png'));
    console.log('✔ icon-192.png gerado (192x192)');

    // 512x512 (PWA)
    await sharp(svgBuffer, { density: 300 })
      .resize(512, 512)
      .png()
      .toFile(path.join(imagesDir, 'icon-512.png'));
    console.log('✔ icon-512.png gerado (512x512)');
  }

  // Gerar logo AVIF a partir do SVG
  const logoSvg = path.join(imagesDir, 'logo.svg');
  if (fs.existsSync(logoSvg)) {
    const svgBuffer = fs.readFileSync(logoSvg);
    
    // Logo PNG (fallback)
    await sharp(svgBuffer, { density: 300 })
      .resize(320, 72)
      .png()
      .toFile(path.join(imagesDir, 'logo.png'));
    console.log('✔ logo.png gerado (320x72)');
  }

  console.log('\n✅ Conversão completa!');
}

convertToAvif().catch(err => {
  console.error('Erro na conversão:', err);
  process.exit(1);
});
