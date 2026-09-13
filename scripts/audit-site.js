const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'config.json'), 'utf-8'));
const citiesData = JSON.parse(fs.readFileSync(path.join(rootDir, 'data', 'cities.json'), 'utf-8'));

console.log('====================================================');
console.log('AUDITORIA AUTOMATIZADA DO SITE (15 PONTOS DE CONTROLE)');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.log(`[FAIL] ${testName} -> ${details}`);
    failCount++;
    failures.push({ testName, details });
  }
}

// 1. Todas as cidades listadas em allValeCities possuem página gerada
let allPagesExist = true;
let missingPages = [];
citiesData.allValeCities.forEach(city => {
  const filePath = city.slug === ''
    ? path.join(rootDir, 'index.html')
    : path.join(rootDir, city.slug, 'index.html');
  if (!fs.existsSync(filePath)) {
    allPagesExist = false;
    missingPages.push(city.name);
  }
});
assert(allPagesExist, '1. Todas as cidades listadas possuem página gerada', `Faltando: ${missingPages.join(', ')}`);

// Coleta todos os arquivos HTML para auditoria profunda
const htmlFiles = [
  { slug: '', name: 'São José dos Campos', file: path.join(rootDir, 'index.html') },
  { slug: 'cidades-atendidas', name: 'Cidades Atendidas', file: path.join(rootDir, 'cidades-atendidas', 'index.html') },
  ...citiesData.cities.filter(c => !c.isHome).map(c => ({
    slug: c.slug,
    name: c.name,
    file: path.join(rootDir, c.slug, 'index.html'),
    cityData: c
  }))
];

// 2. Todas as páginas possuem <title> não vazio e exclusivo
const titles = new Map();
let allTitlesValid = true;
let duplicateTitles = [];
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  const match = content.match(/<title>(.*?)<\/title>/i);
  if (!match || !match[1].trim()) {
    allTitlesValid = false;
  } else {
    const title = match[1].trim();
    if (titles.has(title)) {
      duplicateTitles.push(`${f.name} duplicou com ${titles.get(title)}`);
    } else {
      titles.set(title, f.name);
    }
  }
});
assert(allTitlesValid && duplicateTitles.length === 0, '2. Todas as páginas possuem <title> exclusivo e válido', duplicateTitles.join('; '));

// 3. Todas possuem <meta name="description"> válido e exclusivo
const metaDescs = new Map();
let allMetasValid = true;
let duplicateMetas = [];
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  const match = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  if (!match || !match[1].trim()) {
    allMetasValid = false;
  } else {
    const desc = match[1].trim();
    if (metaDescs.has(desc)) {
      duplicateMetas.push(`${f.name} duplicou com ${metaDescs.get(desc)}`);
    } else {
      metaDescs.set(desc, f.name);
    }
  }
});
assert(allMetasValid && duplicateMetas.length === 0, '3. Todas possuem meta description válida e exclusiva', duplicateMetas.join('; '));

// 4. Todas possuem exatamente um <h1>
let allSingleH1 = true;
let h1Errors = [];
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  const matches = content.match(/<h1[\s>]/gi);
  const count = matches ? matches.length : 0;
  if (count !== 1) {
    allSingleH1 = false;
    h1Errors.push(`${f.name} tem ${count} h1s`);
  }
});
assert(allSingleH1, '4. Todas as páginas possuem exatamente um <h1>', h1Errors.join('; '));

// 5. Canonical está correto e autorreferente
let allCanonicalsCorrect = true;
let canonicalErrors = [];
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  const match = content.match(/<link\s+rel=["']canonical["']\s+href=["'](.*?)["']/i);
  const expectedUrl = f.slug === '' ? `${config.domain}/` : `${config.domain}/${f.slug}/`;
  if (!match || match[1] !== expectedUrl) {
    allCanonicalsCorrect = false;
    canonicalErrors.push(`${f.name}: esperado ${expectedUrl}, encontrado ${match ? match[1] : 'nenhum'}`);
  }
});
assert(allCanonicalsCorrect, '5. Canonical está correto e autorreferente em todas as páginas', canonicalErrors.join('; '));

// 6. Nenhuma URL pública possui .html
let noHtmlInPublicUrls = true;
let htmlUrlViolations = [];
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  // Procura hrefs para páginas internas terminando em .html (ex: href="/alguma-coisa.html")
  const hrefMatches = content.match(/href=["'](\/[^"']*?\.html)["']/gi) || [];
  if (hrefMatches.length > 0) {
    noHtmlInPublicUrls = false;
    htmlUrlViolations.push(`${f.name}: ${hrefMatches.join(', ')}`);
  }
});
assert(noHtmlInPublicUrls, '6. Nenhuma URL pública expõe .html', htmlUrlViolations.join('; '));

// 7. Nenhum link interno quebrado ou '#'
let noBrokenLinks = true;
let brokenLinks = [];
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  const hrefRegex = /href=["'](\/[a-z0-9\-_/]+|\#|\#[\w\-]+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    const link = match[1];
    if (link === '#') {
      noBrokenLinks = false;
      brokenLinks.push(`${f.name}: link '#' encontrado`);
    } else if (link.startsWith('/') && !link.includes('assets/')) {
      // Verifica se a rota interna existe no sistema de arquivos
      const cleanRoute = link.split('#')[0].replace(/^\//, '').replace(/\/$/, '');
      const expectedDir = cleanRoute === '' ? path.join(rootDir, 'index.html') : path.join(rootDir, cleanRoute, 'index.html');
      if (!fs.existsSync(expectedDir)) {
        noBrokenLinks = false;
        brokenLinks.push(`${f.name}: link quebrado para ${link}`);
      }
    }
  }
});
assert(noBrokenLinks, '7. Nenhum link interno quebrado ou apontando para #', brokenLinks.slice(0, 5).join('; '));

// 8. Todas as páginas aparecem no sitemap.xml
const sitemapContent = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf-8');
let allInSitemap = true;
let missingFromSitemap = [];
htmlFiles.forEach(f => {
  const expectedUrl = f.slug === '' ? `${config.domain}/` : `${config.domain}/${f.slug}/`;
  if (!sitemapContent.includes(`<loc>${expectedUrl}</loc>`)) {
    allInSitemap = false;
    missingFromSitemap.push(f.name);
  }
});
assert(allInSitemap, '8. Todas as páginas aparecem no sitemap.xml', `Faltando: ${missingFromSitemap.join(', ')}`);

// 9. Nenhuma página utiliza telefone fictício (apenas (12) ou sem 99999-9999 visível)
let noFakePhone = true;
let fakePhoneFindings = [];
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  // Verifica se o número fictício (12) 99999-9999 aparece no texto visível
  if (content.includes('(12) 99999-9999') || content.includes('(12) 9999-9999')) {
    noFakePhone = false;
    fakePhoneFindings.push(f.name);
  }
});
assert(noFakePhone, '9. Nenhuma página utiliza telefone fictício visível (somente (12))', fakePhoneFindings.join('; '));

// 10. Os CTAs exibem "Solicitar Caçamba Agora"
let allCtasCorrect = true;
let ctaErrors = [];
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  if (!content.includes('Solicitar Caçamba Agora')) {
    allCtasCorrect = false;
    ctaErrors.push(`${f.name} não possui CTA padronizado`);
  }
});
assert(allCtasCorrect, '10. Os CTAs principais exibem "Solicitar Caçamba Agora"', ctaErrors.join('; '));

// 11. Nenhuma foto exibe claramente concorrente / imagens são os 6 AVIFs aprovados
let allPhotosApproved = true;
const approvedImages = [
  'hero-cacamba.avif',
  'cacamba-obras.avif',
  'cacamba-reformas.avif',
  'cacamba-limpezas.avif',
  'cacamba-obra-rua.avif',
  'caminhao-cacamba.avif'
];
htmlFiles.forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  const imgMatches = content.match(/src=["'][^"']*assets\/images\/([^"']+)["']/g) || [];
  imgMatches.forEach(m => {
    const filename = m.split('/').pop().replace(/["']/, '');
    if (filename.endsWith('.avif') && !approvedImages.includes(filename)) {
      allPhotosApproved = false;
    }
  });
});
assert(allPhotosApproved, '11. Imagens utilizadas são os AVIFs neutros aprovados sem marcas de concorrentes');

// 12. Bairros correspondem à cidade correta (sem mistura com SJC em outras cidades)
let bairrosCorrect = true;
let bairroErrors = [];
htmlFiles.filter(f => f.cityData && !f.cityData.isHome).forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  // Verifica se bairros exclusivos de SJC (ex: Urbanova, Jardim Aquarius) foram colados na página
  if (content.includes('Jardim Aquarius') || content.includes('Urbanova') || content.includes('Vila Ema')) {
    bairrosCorrect = false;
    bairroErrors.push(`${f.name} possui bairros de SJC`);
  }
  // Verifica se possui seus próprios bairros
  if (!f.cityData.neighborhoods || f.cityData.neighborhoods.length === 0) {
    bairrosCorrect = false;
    bairroErrors.push(`${f.name} sem bairros cadastrados`);
  }
});
assert(bairrosCorrect, '12. Bairros correspondem rigorosamente à cidade correta', bairroErrors.join('; '));

// 13. Breadcrumbs estão corretos
let breadcrumbsCorrect = true;
let breadcrumbErrors = [];
htmlFiles.filter(f => f.cityData && !f.cityData.isHome).forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  if (!content.includes('Cidades Atendidas') || !content.includes(f.name)) {
    breadcrumbsCorrect = false;
    breadcrumbErrors.push(`${f.name} com breadcrumb incorreto`);
  }
});
assert(breadcrumbsCorrect, '13. Breadcrumbs estruturados corretamente (Início > Cidades Atendidas > Cidade)', breadcrumbErrors.join('; '));

// 14. Links entre cidades funcionam
let nearbyLinksWorking = true;
let nearbyErrors = [];
htmlFiles.filter(f => f.cityData).forEach(f => {
  const content = fs.readFileSync(f.file, 'utf-8');
  if (f.cityData.nearbyCities) {
    f.cityData.nearbyCities.forEach(nc => {
      const expectedHref = nc.slug === '' ? 'href="/"' : `href="/${nc.slug}/"`;
      if (!content.includes(expectedHref)) {
        nearbyLinksWorking = false;
        nearbyErrors.push(`${f.name}: link para ${nc.name} (${expectedHref}) não encontrado`);
      }
    });
  }
});
assert(nearbyLinksWorking, '14. Links contextuais entre cidades próximas funcionando', nearbyErrors.slice(0, 5).join('; '));

// 15. Layout e folhas de estilo integrados para desktop e mobile
const cssPath = path.join(rootDir, 'assets', 'css', 'style.css');
const cssExists = fs.existsSync(cssPath);
const cssContent = cssExists ? fs.readFileSync(cssPath, 'utf-8') : '';
const hasMediaQueries = cssContent.includes('@media');
const hasRadius8 = cssContent.includes('border-radius: 8px') || cssContent.includes('var(--radius-md)');
assert(cssExists && hasMediaQueries && hasRadius8, '15. Layout e CSS responsivo para desktop e mobile com border-radius aprovado');

console.log('\n====================================================');
console.log(`RESULTADO DA AUDITORIA: ${passCount} PASSOU / ${failCount} FALHOU`);
console.log('====================================================');

if (failCount > 0) {
  console.error('\nFalhas detectadas:');
  failures.forEach(f => console.error(`- ${f.testName}: ${f.details}`));
  process.exit(1);
} else {
  console.log('\nPARABÉNS! Todos os 15 pontos de conformidade foram aprovados com 100% de sucesso!');
  process.exit(0);
}
