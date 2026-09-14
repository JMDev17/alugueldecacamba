const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const configPath = path.join(rootDir, 'data', 'config.json');
const citiesPath = path.join(rootDir, 'data', 'cities.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const citiesData = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));

// Função para gerar breadcrumbs HTML
function renderBreadcrumbs(items) {
  return `
  <nav class="breadcrumbs" aria-label="Navegação Estrutural">
    <div class="container">
      <ol itemscope itemtype="https://schema.org/BreadcrumbList">
        ${items.map((item, idx) => `
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            ${idx === items.length - 1 
              ? `<span itemprop="name">${item.name}</span>`
              : `<a itemprop="item" href="${config.domain}${item.url}"><span itemprop="name">${item.name}</span></a>`}
            <meta itemprop="position" content="${idx + 1}" />
          </li>
        `).join('')}
      </ol>
    </div>
  </nav>`;
}

// Função para gerar FAQ Schema
function renderFaqSchema(faqList) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqList.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

// Função para renderizar FAQ HTML
function renderFaqHtml(faqList) {
  return `
  <div class="accordion">
    ${faqList.map((item, index) => `
      <div class="accordion-item ${index === 0 ? 'active' : ''}">
        <button type="button" class="accordion-header" aria-expanded="${index === 0 ? 'true' : 'false'}">
          <span>${item.question}</span>
          <span class="accordion-icon" aria-hidden="true">+</span>
        </button>
        <div class="accordion-content">
          <p>${item.answer}</p>
        </div>
      </div>
    `).join('')}
  </div>`;
}

// FAQ Padrão Condicional e Neutro
function getCompleteFaq(city) {
  const baseFaq = [
    {
      question: `Como funciona a solicitação de caçamba em ${city.name}?`,
      answer: `O processo é prático e direto: você nos envia uma mensagem pelo WhatsApp informando seu bairro ou rua em ${city.name}, o tipo de material a ser descartado e a data desejada. O orçamento completo com valores e condições é enviado diretamente a você.`
    },
    {
      question: `Qual é o período de permanência da caçamba em ${city.name}?`,
      answer: `O período de permanência da caçamba pode variar conforme a empresa responsável pelo atendimento, disponibilidade e condições definidas no orçamento.`
    },
    {
      question: `Quais tipos de materiais podem ser descartados?`,
      answer: `Os materiais aceitos podem variar conforme o tipo de resíduo e as regras da empresa responsável pelo atendimento. De modo geral, são aceitos resíduos de alvenaria, concreto, pisos, argamassa, madeiras e restos de reformas ou podas.`
    },
    {
      question: `O que NÃO pode ser colocado na caçamba?`,
      answer: `Não é permitido o descarte de materiais perigosos como tintas líquidas, solventes, óleos, baterias, produtos químicos, lixo hospitalar ou lixo orgânico doméstico comum.`
    },
    {
      question: `Qual é o limite de carga e peso da caçamba?`,
      answer: `Por normas de segurança no trânsito e transporte de carga, os resíduos nunca devem ultrapassar o limite da borda superior da caçamba. Consulte as especificações de peso no momento da cotação.`
    },
    {
      question: `Posso solicitar a colocação em final de semana ou feriado em ${city.name}?`,
      answer: `Consulte disponibilidade no momento da solicitação. O atendimento e a escala de entregas podem variar de acordo com o calendário e a logística local.`
    },
    {
      question: `Como funciona o pagamento do aluguel?`,
      answer: `Formas e condições de pagamento são informadas durante o orçamento.`
    },
    {
      question: `A caçamba pode ser colocada na rua ou calçada?`,
      answer: `O ideal é posicionar a caçamba no recuo ou dentro do terreno/garagem da obra. Quando posicionada na via pública, deve obedecer às regras municipais de trânsito e estacionamento sem obstruir bueiros, vagas preferenciais ou travessias.`
    }
  ];

  // Mescla com perguntas específicas da cidade, sem duplicar tópicos comuns
  if (city.localFaq && city.localFaq.length > 0) {
    const localKeywords = city.localFaq.map(f => f.question.toLowerCase());
    const filteredBase = baseFaq.filter(bf => {
      const bText = bf.question.toLowerCase();
      if (bText.includes('permanência') && localKeywords.some(k => k.includes('permanência') || k.includes('prazo') || k.includes('tempo'))) {
        return false;
      }
      if (bText.includes('como funciona a solicitação') && localKeywords.some(k => k.includes('como funciona') || k.includes('como solicitar') || k.includes('como pedir') || k.includes('como alugar'))) {
        return false;
      }
      return true;
    });
    return [...city.localFaq, ...filteredBase];
  }
  return baseFaq;
}

// Template Geral das Páginas (Home e Cidades)
function generatePageHtml(city, allCities) {
  const isHome = !!city.isHome;
  const pageUrl = isHome ? `${config.domain}/` : `${config.domain}/${city.slug}/`;
  const relativeRoot = isHome ? './' : '../';

  const breadcrumbsData = isHome 
    ? [{ name: 'Início', url: '/' }, { name: 'São José dos Campos', url: '/' }]
    : [
        { name: 'Início', url: '/' },
        { name: 'Cidades Atendidas', url: '/cidades-atendidas/' },
        { name: city.name, url: `/${city.slug}/` }
      ];

  const fullFaq = getCompleteFaq(city);

  // Cidades próximas para interlinkagem geográfica
  const nearbyListHtml = (city.nearbyCities && city.nearbyCities.length > 0)
    ? city.nearbyCities.map(nc => {
        const targetUrl = nc.slug === '' ? '/' : `/${nc.slug}/`;
        return `<a href="${targetUrl}" class="city-link-item">${nc.name}</a>`;
      }).join('\n            ')
    : `
            <a href="/" class="city-link-item">São José dos Campos</a>
            <a href="/aluguel-de-cacamba-taubate/" class="city-link-item">Taubaté</a>
            <a href="/aluguel-de-cacamba-jacarei/" class="city-link-item">Jacareí</a>
            <a href="/aluguel-de-cacamba-pindamonhangaba/" class="city-link-item">Pindamonhangaba</a>
            <a href="/aluguel-de-cacamba-cacapava/" class="city-link-item">Caçapava</a>
            <a href="/aluguel-de-cacamba-guaratingueta/" class="city-link-item">Guaratinguetá</a>
            <a href="/aluguel-de-cacamba-lorena/" class="city-link-item">Lorena</a>
    `;

  const nearbyContextText = isHome
    ? `Intermediamos cotações de caçambas estacionárias nas principais cidades do Vale do Paraíba e Litoral Norte. Clique na sua cidade para consultar informações locais:`
    : `Também consulte atendimento em ${(city.nearbyCities || []).map(nc => `<a href="${nc.slug === '' ? '/' : `/${nc.slug}/`}"><strong>${nc.name}</strong></a>`).join(', ')} e em outras cidades do Vale do Paraíba.`;

  // Links do menu (âncoras sempre locais: cada página de cidade tem suas próprias seções)
  const linkComoFunciona = '#como-funciona';
  const linkTiposCacamba = '#tipos-cacamba';
  const linkFaq = '#faq';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${city.seoTitle}</title>
  <meta name="description" content="${city.metaDescription}" />
  <link rel="canonical" href="${pageUrl}" />
  <meta name="robots" content="index, follow" />
  <meta name="author" content="${config.metaAuthor}" />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="${relativeRoot}assets/images/favicon.svg" />
  <link rel="icon" type="image/png" sizes="32x32" href="${relativeRoot}assets/images/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="48x48" href="${relativeRoot}assets/images/favicon-48.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="${relativeRoot}assets/images/apple-touch-icon.png" />

  <!-- Open Graph / Facebook -->
  <meta property="og:locale" content="pt_BR" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${city.seoTitle}" />
  <meta property="og:description" content="${city.metaDescription}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="${config.brandName}" />
  <meta property="og:image" content="${config.domain}/assets/images/hero-cacamba.avif" />

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${city.seoTitle}" />
  <meta name="twitter:description" content="${city.metaDescription}" />
  <meta name="twitter:image" content="${config.domain}/assets/images/hero-cacamba.avif" />

  <!-- Schema.org Data -->
  ${renderFaqSchema(fullFaq)}
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "${config.brandName} - ${city.name}",
    "url": "${pageUrl}",
    "telephone": "${config.phoneDisplay}",
    "openingHours": "Mo-Sa 07:00-18:00",
    "priceRange": "$$",
    "image": "${config.domain}/assets/images/hero-cacamba.avif",
    "areaServed": {
      "@type": "City",
      "name": "${city.name}",
      "addressRegion": "SP",
      "addressCountry": "BR"
    },
    "description": "${city.metaDescription}"
  }
  </script>

  <!-- Estilos -->
  <link rel="stylesheet" href="${relativeRoot}assets/css/style.css" />
</head>
<body>

  <!-- Top Bar -->
  <div class="top-bar">
    <div class="container top-bar-inner">
      <div class="top-bar-info">
        <span>Atendimento: ${city.name} e Vale do Paraíba</span>
        <span>${config.operatingHours}</span>
      </div>
      <div>
        <span>Orçamentos: <a href="tel:${config.phoneRaw}">${config.phoneDisplay}</a></span>
      </div>
    </div>
  </div>

  <!-- Header -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo" title="Ir para a página inicial">
        <img src="${relativeRoot}assets/images/logo.svg" alt="Caçambas Vale - Aluguel de Caçambas" width="220" height="50" class="logo-img" />
      </a>

      <button class="mobile-toggle" aria-label="Abrir Menu de Navegação" aria-expanded="false">
        ☰
      </button>

      <!-- Menu Principal Corrigido -->
      <nav class="main-nav" aria-label="Navegação Principal">
        <ul>
          <li><a href="/" class="${isHome ? 'active' : ''}">Início</a></li>
          <li><a href="${linkComoFunciona}">Como Funciona</a></li>
          <li><a href="${linkTiposCacamba}">Tipos de Caçamba</a></li>
          <li><a href="/cidades-atendidas/" class="${!isHome && city.slug === 'cidades-atendidas' ? 'active' : ''}">Cidades Atendidas</a></li>
          <li><a href="${linkFaq}">FAQ</a></li>
        </ul>
      </nav>

      <div class="header-cta">
        <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent(config.whatsappMessageTemplate.replace('{cidade}', city.name))}" 
           class="btn btn-whatsapp btn-sm" 
           data-wa-city="${city.name}" 
           data-wa-phone="${config.phoneRaw}"
           target="_blank" rel="noopener noreferrer">
          Solicitar Caçamba Agora
        </a>
      </div>
    </div>
  </header>

  <!-- Breadcrumbs -->
  ${renderBreadcrumbs(breadcrumbsData)}

  <!-- HERO SECTION COM FOTO GRANDE (50% Conteúdo | 50% Fotografia) -->
  <section class="hero-section">
    <div class="container">
      <div class="hero-grid">
        <div class="hero-content">
          <h1 class="hero-title">Aluguel de Caçamba em ${city.name} - SP</h1>
          <p class="hero-subtitle">${city.intro || `Precisa retirar entulho de uma obra, reforma ou limpeza? Solicite um orçamento para aluguel de caçamba em ${city.name} e consulte disponibilidade para seu endereço.`}</p>
          <div class="hero-actions">
            <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent(config.whatsappMessageTemplate.replace('{cidade}', city.name))}" 
               class="btn btn-whatsapp btn-lg" 
               data-wa-city="${city.name}" 
               data-wa-phone="${config.phoneRaw}"
               target="_blank" rel="noopener noreferrer">
              Solicitar Caçamba Agora
            </a>
          </div>
          <small class="hero-disclaimer-note">Consulte disponibilidade e condições para seu bairro no momento do orçamento.</small>
        </div>
        <div class="hero-media">
          <img src="${relativeRoot}assets/images/hero-cacamba.avif" 
               alt="Caçamba estacionária de entulho posicionada em obra residencial em ${city.name}" 
               width="800" height="600" 
               fetchpriority="high" />
        </div>
      </div>
    </div>
  </section>

  <!-- COMO FUNCIONA (Linha Horizontal Simples de 4 Passos) -->
  <section id="como-funciona" class="steps-section">
    <div class="container">
      <div class="steps-header">
        <h2 class="steps-title">Como funciona o aluguel de caçambas em ${city.name}</h2>
        <p class="steps-subtitle">Processo simples e direto para sua obra ou reforma:</p>
      </div>

      <div class="steps-timeline">
        <div class="timeline-step">
          <span class="step-number">01</span>
          <h3 class="step-heading">Envie sua solicitação</h3>
          <p class="step-desc">Informe a localização do imóvel em ${city.name} e o tipo aproximado de material a ser descartado.</p>
        </div>

        <div class="timeline-step">
          <span class="step-number">02</span>
          <h3 class="step-heading">Consulte as opções</h3>
          <p class="step-desc">Verifique as opções de caçamba adequadas para a capacidade e o volume do seu entulho.</p>
        </div>

        <div class="timeline-step">
          <span class="step-number">03</span>
          <h3 class="step-heading">Combine a entrega</h3>
          <p class="step-desc">Agende a data e o melhor local para o posicionamento seguro da caçamba estacionária.</p>
        </div>

        <div class="timeline-step">
          <span class="step-number">04</span>
          <h3 class="step-heading">Combine a retirada</h3>
          <p class="step-desc">Ao término do período combinado na contratação, a caçamba é recolhida com os resíduos.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- SEÇÃO 1: FOTO GRANDE | TEXTO SEO (Quebra de Rítmo) -->
  <section class="section-editorial">
    <div class="container">
      <div class="editorial-grid">
        <div class="editorial-media">
          <img src="${relativeRoot}assets/images/cacamba-obra-rua.avif" 
               alt="Caçamba estacionária para entulho na rua em frente a reforma em ${city.name}" 
               width="800" height="600" 
               loading="lazy" />
        </div>
        <div class="editorial-content">
          <h2>Aluguel de Caçamba de Entulho para Obras e Reformas em ${city.name}</h2>
          <p>A locação de caçamba estacionária é a forma recomendada para manter o canteiro de obras limpo, seguro e dentro das normas municipais de convivência urbana. Seja em pequenas demolições, ampliações ou reformas estruturais, a caçamba evita o acúmulo desordenado de entulho em calçadas e vias públicas.</p>
          <ul class="checklist-simple">
            <li>Facilidade na Solicitação: cotação direta pelo WhatsApp informando cidade e endereço</li>
            <li>Organização para obras residenciais, prediais e estabelecimentos comerciais</li>
            <li>Orientações gerais sobre regras de descarte e capacidade limite da caçamba</li>
          </ul>
          <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent(config.whatsappMessageTemplate.replace('{cidade}', city.name))}" 
             class="btn btn-whatsapp" 
             data-wa-city="${city.name}" 
             data-wa-phone="${config.phoneRaw}"
             target="_blank" rel="noopener noreferrer">
            Solicitar Caçamba Agora
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- SEÇÃO 2: CARDS DE SERVIÇOS COM FOTOS (16:9) -->
  <section id="tipos-cacamba" class="services-section">
    <div class="container">
      <div class="section-intro">
        <h2>Tipos de caçamba para sua necessidade em ${city.name}</h2>
        <p>Soluções práticas para diferentes demandas de remoção de resíduos e entulhos:</p>
      </div>

      <div class="services-grid">
        <!-- Card 1: Obras -->
        <div class="service-card">
          <div class="service-card-media">
            <img src="${relativeRoot}assets/images/cacamba-obras.avif" 
                 alt="Caçamba com entulho pesado de concreto e tijolos em ${city.name}" 
                 width="600" height="338" 
                 loading="lazy" />
          </div>
          <div class="service-card-body">
            <h3 class="service-card-title">Caçamba para Obras</h3>
            <p class="service-card-desc">Solução para retirada de resíduos pesados provenientes de obras e construções, como concreto, tijolos, alvenaria, terra e pedriscos.</p>
            <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent(`Olá! Gostaria de orçamento de caçamba para obras em ${city.name}.`)}" 
               class="service-card-cta" 
               data-wa-city="${city.name}" 
               data-wa-phone="${config.phoneRaw}"
               target="_blank" rel="noopener noreferrer">
              Solicitar Caçamba Agora &rarr;
            </a>
          </div>
        </div>

        <!-- Card 2: Reformas -->
        <div class="service-card">
          <div class="service-card-media">
            <img src="${relativeRoot}assets/images/cacamba-reformas.avif" 
                 alt="Caçamba em frente a casa residencial em reforma em ${city.name}" 
                 width="600" height="338" 
                 loading="lazy" />
          </div>
          <div class="service-card-body">
            <h3 class="service-card-title">Caçamba para Reformas</h3>
            <p class="service-card-desc">Indicada para reformas residenciais e comerciais, troca de pisos, azulejos, forros, sobras de gesso e materiais mistos de acabamento.</p>
            <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent(`Olá! Gostaria de orçamento de caçamba para reformas em ${city.name}.`)}" 
               class="service-card-cta" 
               data-wa-city="${city.name}" 
               data-wa-phone="${config.phoneRaw}"
               target="_blank" rel="noopener noreferrer">
              Solicitar Caçamba Agora &rarr;
            </a>
          </div>
        </div>

        <!-- Card 3: Limpezas -->
        <div class="service-card">
          <div class="service-card-media">
            <img src="${relativeRoot}assets/images/cacamba-limpezas.avif" 
                 alt="Caçamba para limpeza de terrenos e descarte de materiais volumosos em ${city.name}" 
                 width="600" height="338" 
                 loading="lazy" />
          </div>
          <div class="service-card-body">
            <h3 class="service-card-title">Caçamba para Limpezas</h3>
            <p class="service-card-desc">Ideal para limpeza de terrenos, descarte de galhos secos, podas de árvores, restos de materiais e faxinas pesadas de galpões.</p>
            <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent(`Olá! Gostaria de orçamento de caçamba para limpeza em ${city.name}.`)}" 
               class="service-card-cta" 
               data-wa-city="${city.name}" 
               data-wa-phone="${config.phoneRaw}"
               target="_blank" rel="noopener noreferrer">
              Solicitar Caçamba Agora &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SEÇÃO 3: TEXTO | FOTO GRANDE (Invertida) -->
  <section class="section-editorial section-editorial-alt">
    <div class="container">
      <div class="editorial-grid">
        <div class="editorial-content">
          <h2>Agilidade e praticidade no descarte de resíduos em ${city.name}</h2>
          <p>${city.localContext}</p>
          <p>O transporte e posicionamento da caçamba são realizados com caminhões poliguindaste apropriados. Ao solicitar seu orçamento, informe as condições de acesso da sua rua e se a caçamba ficará dentro da propriedade ou na via pública.</p>
          <ul class="checklist-simple">
            <li>Consulte opções de capacidade conforme o volume estimado da sua reforma</li>
            <li>Informações claras sobre regras de permanência definidas no orçamento</li>
            <li>Atendimento para pessoas físicas, empresas, condomínios e construtoras</li>
          </ul>
          <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent(config.whatsappMessageTemplate.replace('{cidade}', city.name))}" 
             class="btn btn-whatsapp" 
             data-wa-city="${city.name}" 
             data-wa-phone="${config.phoneRaw}"
             target="_blank" rel="noopener noreferrer">
            Solicitar Caçamba Agora
          </a>
        </div>
        <div class="editorial-media">
          <img src="${relativeRoot}assets/images/caminhao-cacamba.avif" 
               alt="Caminhão poliguindaste transportando caçamba estacionária de entulho em ${city.name}" 
               width="800" height="600" 
               loading="lazy" />
        </div>
      </div>
    </div>
  </section>

  <!-- SEÇÃO 4: CIDADES PRÓXIMAS / ATENDIMENTO REGIONAL -->
  <section class="cities-section">
    <div class="container">
      <div class="cities-grid">
        <div class="cities-list-box">
          <h2>${isHome ? 'Cidades atendidas no Vale do Paraíba' : `Cidades próximas a ${city.name}`}</h2>
          <p>${nearbyContextText}</p>
          <div class="cities-links-simple">
            ${nearbyListHtml}
          </div>
          <a href="/cidades-atendidas/" class="btn btn-primary btn-sm">
            Ver todas as cidades atendidas &rarr;
          </a>
        </div>
        <div class="cities-side-media">
          <img src="${relativeRoot}assets/images/hero-cacamba.avif" 
               alt="Atendimento regional de caçambas em ${city.name} e cidades vizinhas" 
               width="800" height="500" 
               loading="lazy" />
        </div>
      </div>
    </div>
  </section>

  <!-- SEÇÃO 5: ÁREA ATENDIDA EM [CIDADE] COM BAIRROS & MAPA -->
  <section class="area-section">
    <div class="container">
      <div class="section-intro">
        <h2>Área atendida em ${city.name}</h2>
        <p>${city.serviceAreaText}</p>
      </div>

      <div class="area-grid">
        <div class="map-box">
          <iframe 
            loading="lazy" 
            title="Mapa geográfico de ${city.name}, SP"
            src="https://maps.google.com/maps?q=${encodeURIComponent(`${city.name} - SP`)}&t=m&z=12&output=embed&iwloc=near">
          </iframe>
        </div>

        <div class="bairros-box">
          <h3>Bairros em Destaque em ${city.name}</h3>
          <p>Exemplos de bairros com solicitações frequentes de caçambas estacionárias no município:</p>
          <div class="bairros-tags">
            ${city.neighborhoods.map(nb => `<span class="bairro-tag">${nb}</span>`).join('')}
          </div>
          <small style="color: var(--color-text-muted); font-size: 0.8rem; display: block;">
            * A viabilidade de entrega depende das condições de acesso e disponibilidade de vaga no endereço.
          </small>
        </div>
      </div>
    </div>
  </section>

  <!-- SEÇÃO 6: FAQ (PERGUNTAS FREQUENTES) -->
  <section id="faq" class="faq-section">
    <div class="container">
      <div class="faq-header">
        <h2>Perguntas frequentes sobre aluguel de caçamba em ${city.name}</h2>
        <p>Tire suas dúvidas sobre prazos, materiais aceitos e condições de locação:</p>
      </div>

      ${renderFaqHtml(fullFaq)}
    </div>
  </section>

  <!-- SEÇÃO 7: CTA FINAL COM BLOCO COMERCIAL -->
  <section class="cta-final-section">
    <div class="container cta-final-inner">
      <div class="cta-final-text">
        <h2>Precisa alugar uma caçamba em ${city.name}?</h2>
        <p>Solicite uma cotação e consulte disponibilidade para sua região diretamente pelo WhatsApp.</p>
      </div>
      <div>
        <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent(config.whatsappMessageTemplate.replace('{cidade}', city.name))}" 
           class="btn btn-whatsapp btn-lg" 
           data-wa-city="${city.name}" 
           data-wa-phone="${config.phoneRaw}"
           target="_blank" rel="noopener noreferrer">
          Solicitar Caçamba Agora
        </a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <h4>${config.brandName}</h4>
          <p>Portal regional especializado na intermediação de orçamentos para locação de caçambas estacionárias em São José dos Campos e no Vale do Paraíba.</p>
          <p><strong>Horário:</strong> ${config.operatingHours}</p>
        </div>

        <div class="footer-col">
          <h4>Navegação</h4>
          <ul class="footer-links">
            <li><a href="/">Início</a></li>
            <li><a href="${linkComoFunciona}">Como Funciona</a></li>
            <li><a href="${linkTiposCacamba}">Tipos de Caçamba</a></li>
            <li><a href="/cidades-atendidas/">Cidades Atendidas</a></li>
            <li><a href="${linkFaq}">Dúvidas Frequentes</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Cidades Polo</h4>
          <ul class="footer-links">
            <li><a href="/">São José dos Campos</a></li>
            <li><a href="/aluguel-de-cacamba-taubate/">Taubaté</a></li>
            <li><a href="/aluguel-de-cacamba-jacarei/">Jacareí</a></li>
            <li><a href="/aluguel-de-cacamba-pindamonhangaba/">Pindamonhangaba</a></li>
            <li><a href="/aluguel-de-cacamba-cacapava/">Caçapava</a></li>
            <li><a href="/aluguel-de-cacamba-guaratingueta/">Guaratinguetá</a></li>
            <li><a href="/aluguel-de-cacamba-lorena/">Lorena</a></li>
            <li><a href="/aluguel-de-cacamba-caraguatatuba/">Caraguatatuba</a></li>
            <li><a href="/cidades-atendidas/">Ver todas as 26 cidades &rarr;</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Orçamentos & Contato</h4>
          <p>Solicite seu orçamento diretamente através do nosso canal de atendimento no WhatsApp:</p>
          <p><a href="tel:${config.phoneRaw}" style="color: #fff; font-weight: bold; font-size: 1.1rem;">${config.phoneDisplay}</a></p>
          <p style="margin-top: 0.5rem;">Atendimento para pessoas físicas, condomínios, construtoras e reformas em geral.</p>
        </div>
      </div>

      <div class="footer-disclaimer-box">
        <strong>Aviso Legal (Disclaimer):</strong> ${config.disclaimer}
      </div>

      <div class="footer-bottom">
        <div>&copy; ${new Date().getFullYear()} ${config.brandName}. Todos os direitos reservados.</div>
        <div>Vale do Paraíba - Estado de São Paulo</div>
      </div>
    </div>
  </footer>

  <!-- WhatsApp Floating Widget -->
  <div class="whatsapp-float-widget">
    <div class="whatsapp-float-tooltip">
      Orçamento em ${city.name}?
    </div>
    <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent(config.whatsappMessageTemplate.replace('{cidade}', city.name))}" 
       class="whatsapp-float-btn" 
       title="Falar no WhatsApp"
       data-wa-city="${city.name}"
       data-wa-phone="${config.phoneRaw}"
       target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
    </a>
  </div>

  <script src="${relativeRoot}assets/js/main.js"></script>
</body>
</html>`;
}

// Template da Página de Diretório Cidades Atendidas (/cidades-atendidas/)
function generateDirectoryHtml(allCities) {
  const pageUrl = `${config.domain}/cidades-atendidas/`;
  const relativeRoot = '../';

  const breadcrumbsData = [
    { name: 'Início', url: '/' },
    { name: 'Cidades Atendidas', url: '/cidades-atendidas/' }
  ];

  const regions = {};
  allCities.forEach(city => {
    const region = city.region || 'Vale do Paraíba';
    if (!regions[region]) regions[region] = [];
    regions[region].push(city);
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cidades Atendidas para Aluguel de Caçamba no Vale do Paraíba, SP</title>
  <meta name="description" content="Confira todas as cidades atendidas para aluguel de caçambas de entulho em São José dos Campos e região do Vale do Paraíba. Solicite cotação via WhatsApp." />
  <link rel="canonical" href="${pageUrl}" />
  <meta name="robots" content="index, follow" />
  <meta name="author" content="${config.metaAuthor}" />

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="${relativeRoot}assets/images/favicon.svg" />
  <link rel="icon" type="image/png" sizes="32x32" href="${relativeRoot}assets/images/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="48x48" href="${relativeRoot}assets/images/favicon-48.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="${relativeRoot}assets/images/apple-touch-icon.png" />

  <meta property="og:locale" content="pt_BR" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Cidades Atendidas para Aluguel de Caçamba no Vale do Paraíba, SP" />
  <meta property="og:description" content="Confira todas as cidades atendidas para aluguel de caçambas de entulho em São José dos Campos e região do Vale do Paraíba." />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:site_name" content="${config.brandName}" />

  <link rel="stylesheet" href="${relativeRoot}assets/css/style.css" />
</head>
<body>

  <!-- Top Bar -->
  <div class="top-bar">
    <div class="container top-bar-inner">
      <div class="top-bar-info">
        <span>Atendimento: Vale do Paraíba e Litoral Norte</span>
        <span>${config.operatingHours}</span>
      </div>
      <div>
        <span>Orçamentos: <a href="tel:${config.phoneRaw}">${config.phoneDisplay}</a></span>
      </div>
    </div>
  </div>

  <!-- Header -->
  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo" title="Ir para a página inicial">
        <img src="${relativeRoot}assets/images/logo.svg" alt="Caçambas Vale - Aluguel de Caçambas" width="220" height="50" class="logo-img" />
      </a>

      <button class="mobile-toggle" aria-label="Abrir Menu de Navegação" aria-expanded="false">
        ☰
      </button>

      <nav class="main-nav" aria-label="Navegação Principal">
        <ul>
          <li><a href="/">Início</a></li>
          <li><a href="/#como-funciona">Como Funciona</a></li>
          <li><a href="/#tipos-cacamba">Tipos de Caçamba</a></li>
          <li><a href="/cidades-atendidas/" class="active">Cidades Atendidas</a></li>
          <li><a href="/#faq">FAQ</a></li>
        </ul>
      </nav>

      <div class="header-cta">
        <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent('Olá! Gostaria de saber se atendem a minha cidade no Vale do Paraíba.')}" 
           class="btn btn-whatsapp btn-sm" 
           target="_blank" rel="noopener noreferrer">
          Solicitar Caçamba Agora
        </a>
      </div>
    </div>
  </header>

  <!-- Breadcrumbs -->
  ${renderBreadcrumbs(breadcrumbsData)}

  <!-- Hero Section -->
  <section class="hero-section">
    <div class="container">
      <div class="hero-grid">
        <div class="hero-content">
          <h1 class="hero-title">Cidades Atendidas no Vale do Paraíba</h1>
          <p class="hero-subtitle">Intermediamos serviços de aluguel de caçambas estacionárias em São José dos Campos e nas principais cidades da Região Metropolitana do Vale do Paraíba e Litoral Norte. Selecione sua cidade abaixo para cotar com rapidez.</p>
          <div class="hero-actions">
            <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent('Olá! Gostaria de cotar aluguel de caçamba no Vale do Paraíba.')}" 
               class="btn btn-whatsapp btn-lg" target="_blank" rel="noopener noreferrer">
              Consultar minha cidade no WhatsApp
            </a>
          </div>
        </div>
        <div class="hero-media">
          <img src="${relativeRoot}assets/images/caminhao-cacamba.avif" 
               alt="Caminhão poliguindaste de caçambas no Vale do Paraíba" 
               width="800" height="600" 
               fetchpriority="high" />
        </div>
      </div>
    </div>
  </section>

  <!-- Diretório de Cidades por Região -->
  <section class="section-editorial">
    <div class="container">
      <div class="section-intro">
        <h2>Encontre sua localidade para locação de caçamba</h2>
        <p>Selecione o seu município para ver as informações de atendimento, bairros em destaque e orientações para sua obra ou reforma:</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;">
        ${Object.keys(regions).map(regName => `
          <div style="border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 1.25rem; background-color: #ffffff;">
            <h3 style="font-size: 1.1rem; color: var(--color-primary); margin-bottom: 0.75rem; border-bottom: 2px solid var(--color-secondary); padding-bottom: 0.35rem;">
              ${regName}
            </h3>
            <ul style="list-style: none;">
              ${regions[regName].map(c => {
                const url = c.slug === '' ? '/' : (c.slug === 'cidades-atendidas' ? '/cidades-atendidas/' : `/${c.slug}/`);
                return `<li style="margin-bottom: 0.4rem;"><a href="${url}" style="font-weight: 600; font-size: 0.92rem;">&rarr; Aluguel de caçamba em ${c.name}</a></li>`;
              }).join('')}
            </ul>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 2.5rem; background-color: var(--color-bg-light); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: var(--radius-sm);">
        <h3 style="color: var(--color-primary); margin-bottom: 0.5rem; font-size: 1.15rem;">Não encontrou sua localidade na lista?</h3>
        <p style="color: var(--color-text-muted); margin-bottom: 1rem; font-size: 0.92rem;">
          Mesmo que seu bairro, condomínio ou município vizinho não esteja listado explicitamente, envie uma mensagem informando sua localização. Muitas empresas parceiras operam rotas flexíveis de entrega no Vale do Paraíba.
        </p>
        <a href="https://wa.me/${config.phoneRaw}?text=${encodeURIComponent('Olá! Gostaria de consultar se vocês atendem a minha localidade no Vale do Paraíba.')}" 
           class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener noreferrer">
          Consultar Disponibilidade no WhatsApp
        </a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <h4>${config.brandName}</h4>
          <p>Portal regional especializado na intermediação de orçamentos para locação de caçambas estacionárias em São José dos Campos e no Vale do Paraíba.</p>
          <p><strong>Horário:</strong> ${config.operatingHours}</p>
        </div>

        <div class="footer-col">
          <h4>Navegação</h4>
          <ul class="footer-links">
            <li><a href="/">Início</a></li>
            <li><a href="/#como-funciona">Como Funciona</a></li>
            <li><a href="/#tipos-cacamba">Tipos de Caçamba</a></li>
            <li><a href="/cidades-atendidas/">Cidades Atendidas</a></li>
            <li><a href="/#faq">Dúvidas Frequentes</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Cidades Polo</h4>
          <ul class="footer-links">
            <li><a href="/">São José dos Campos</a></li>
            <li><a href="/aluguel-de-cacamba-taubate/">Taubaté</a></li>
            <li><a href="/aluguel-de-cacamba-jacarei/">Jacareí</a></li>
            <li><a href="/aluguel-de-cacamba-pindamonhangaba/">Pindamonhangaba</a></li>
            <li><a href="/aluguel-de-cacamba-cacapava/">Caçapava</a></li>
            <li><a href="/aluguel-de-cacamba-guaratingueta/">Guaratinguetá</a></li>
            <li><a href="/aluguel-de-cacamba-lorena/">Lorena</a></li>
            <li><a href="/aluguel-de-cacamba-caraguatatuba/">Caraguatatuba</a></li>
            <li><a href="/cidades-atendidas/">Ver todas as 26 cidades &rarr;</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Orçamentos & Contato</h4>
          <p>Solicite seu orçamento diretamente através do nosso canal de atendimento no WhatsApp:</p>
          <p><a href="tel:${config.phoneRaw}" style="color: #fff; font-weight: bold; font-size: 1.1rem;">${config.phoneDisplay}</a></p>
        </div>
      </div>

      <div class="footer-disclaimer-box">
        <strong>Aviso Legal (Disclaimer):</strong> ${config.disclaimer}
      </div>

      <div class="footer-bottom">
        <div>&copy; ${new Date().getFullYear()} ${config.brandName}. Todos os direitos reservados.</div>
        <div>Vale do Paraíba - Estado de São Paulo</div>
      </div>
    </div>
  </footer>

  <script src="${relativeRoot}assets/js/main.js"></script>
</body>
</html>`;
}

// Execução da Geração
function build() {
  console.log('Iniciando compilação da nova interface fotográfica e comercial...');

  // 1. Gera Home (São José dos Campos - /index.html)
  const homeCity = citiesData.cities.find(c => c.isHome);
  if (!homeCity) {
    throw new Error('Nenhuma cidade marcada como isHome: true encontrada.');
  }

  const homeHtml = generatePageHtml(homeCity, citiesData.allValeCities);
  fs.writeFileSync(path.join(rootDir, 'index.html'), homeHtml, 'utf-8');
  console.log('✔ Home fotográfica gerada: index.html (São José dos Campos)');

  // 2. Gera Diretório de Cidades Atendidas (/cidades-atendidas/index.html)
  const dirFolder = path.join(rootDir, 'cidades-atendidas');
  if (!fs.existsSync(dirFolder)) fs.mkdirSync(dirFolder, { recursive: true });
  const directoryHtml = generateDirectoryHtml(citiesData.allValeCities);
  fs.writeFileSync(path.join(dirFolder, 'index.html'), directoryHtml, 'utf-8');
  console.log('✔ Diretório gerado: cidades-atendidas/index.html');

  // 3. Gera Landing Pages locais com URLs limpas (/aluguel-de-cacamba-[cidade]/index.html)
  const localCities = citiesData.cities.filter(c => !c.isHome);
  localCities.forEach(city => {
    const cityFolder = path.join(rootDir, city.slug);
    if (!fs.existsSync(cityFolder)) fs.mkdirSync(cityFolder, { recursive: true });
    
    const cityHtml = generatePageHtml(city, citiesData.allValeCities);
    fs.writeFileSync(path.join(cityFolder, 'index.html'), cityHtml, 'utf-8');
    console.log(`✔ Landing page gerada: ${city.slug}/index.html (${city.name})`);
  });

  // 4. Gera sitemap.xml
  const urls = [
    `${config.domain}/`,
    `${config.domain}/cidades-atendidas/`,
    ...localCities.map(c => `${config.domain}/${c.slug}/`)
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url === `${config.domain}/` ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  console.log('✔ sitemap.xml atualizado');

  // 5. Gera robots.txt
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${config.domain}/sitemap.xml
`;
  fs.writeFileSync(path.join(rootDir, 'robots.txt'), robotsTxt, 'utf-8');
  console.log('✔ robots.txt atualizado');

  console.log('\nProcesso de compilação fotográfica concluído com sucesso!');
}

build();
