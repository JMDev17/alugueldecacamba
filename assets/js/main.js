/**
 * ALUGUEL DE CAÇAMBAS VALE DO PARAÍBA - JAVASCRIPT PRINCIPAL
 * Interações leves, acessíveis e focadas em conversão
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initAccordions();
  initWhatsAppLinks();
});

/**
 * Menu Mobile
 */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (toggleBtn && mainNav) {
    toggleBtn.addEventListener('click', () => {
      mainNav.classList.toggle('active');
      const isExpanded = mainNav.classList.contains('active');
      toggleBtn.setAttribute('aria-expanded', isExpanded);
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
      if (!toggleBtn.contains(e.target) && !mainNav.contains(e.target) && mainNav.classList.contains('active')) {
        mainNav.classList.remove('active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

/**
 * Accordion (FAQ e Listas Sanfonadas)
 */
function initAccordions() {
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      if (!item) return;

      const isActive = item.classList.contains('active');

      // Se quiser fechar os outros do mesmo container
      const container = item.closest('.accordion');
      if (container && !container.hasAttribute('data-multi-expand')) {
        container.querySelectorAll('.accordion-item').forEach((sibling) => {
          if (sibling !== item) {
            sibling.classList.remove('active');
            const siblingBtn = sibling.querySelector('.accordion-header');
            if (siblingBtn) siblingBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }

      // Alterna o atual
      if (isActive) {
        item.classList.remove('active');
        header.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/**
 * Padronização de links do WhatsApp
 */
function initWhatsAppLinks() {
  const waButtons = document.querySelectorAll('[data-wa-city]');

  waButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const city = btn.getAttribute('data-wa-city') || 'sua região';
      const phone = btn.getAttribute('data-wa-phone') || '5512999999999';
      const customMsg = btn.getAttribute('data-wa-msg');

      let message = customMsg;
      if (!message) {
        message = `Olá! Gostaria de solicitar um orçamento para aluguel de caçamba em ${city}.`;
      }

      const encodedMsg = encodeURIComponent(message);
      const url = `https://wa.me/${phone}?text=${encodedMsg}`;
      
      btn.setAttribute('href', url);
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
    });
  });
}
