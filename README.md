# Aluguel de Caçambas Vale - Portal Regional (Vale do Paraíba - SP)

Portal institucional e comercial para intermediação e captação de orçamentos de locação de caçambas estacionárias no Vale do Paraíba e Litoral Norte de São Paulo.

---

## 🚀 Estrutura do Projeto

- **Home (`/`)**: Landing page principal focada em **São José dos Campos - SP**.
- **Diretório (`/cidades-atendidas/`)**: Guia completo regional com as 26 cidades atendidas agrupadas por micro-região (Médio Vale, Fundo do Vale, Alto Vale, Serra da Mantiqueira e Litoral Norte).
- **25 Landing Pages Locais (`/aluguel-de-cacamba-[cidade]/`)**: Páginas SEO hiper-localizadas com conteúdo próprio, bairros reais, interlinkagem de cidades vizinhas, mapas da área de atendimento e FAQ contextual.
- **`data/`**:
  - `cities.json`: Base de dados central com todos os municípios, bairros, metadados de SEO e FAQs.
  - `config.json`: Configurações globais de telefone, links de WhatsApp, horários e textos de conversão.
- **`assets/`**:
  - `css/style.css`: Estilização vanilla com design system responsivo e moderno.
  - `js/main.js`: Lógica de accordion de FAQs, menu mobile responsivo e listeners de conversão.
  - `images/`: Imagens fotográficas otimizadas em formato AVIF (sem marcas comerciais de terceiros) e favicons/logotipo em SVG.
- **`scripts/`**:
  - `build-cities.js`: Gerador estático programático que compila todas as páginas, sitemap e robots.
  - `audit-site.js`: Script de validação automatizada de 15 pontos de conformidade técnica e SEO.
  - `convert-images.js`: Otimizador de imagens para AVIF e gerador de favicons PNG via Sharp.
  - `serve.js`: Servidor local de desenvolvimento com suporte a URLs limpas.

---

## 🛠️ Comandos Principais

### Instalar dependências (apenas Sharp para imagens, se necessário):
```bash
npm install
```

### Compilar todas as páginas e sitemap:
```bash
node scripts/build-cities.js
```

### Executar auditoria de 15 pontos de conformidade:
```bash
node scripts/audit-site.js
```

### Rodar servidor local de desenvolvimento (porta 3000):
```bash
node scripts/serve.js
```

---

## 📋 Tecnologias Utilizadas

- HTML5 Semântico & Schema.org (LocalBusiness, FAQPage, BreadcrumbList)
- CSS3 Vanilla com Design Tokens & Responsividade
- JavaScript ES6+
- Node.js (Geração Estática & Sharp)
