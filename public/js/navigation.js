/**
 * Navigation responsive et accessible pour QFQA
 * Respecte les critères WCAG 2.1 AA
 */

class QFQANavigation {
  constructor() {
    this.nav = document.querySelector('.qfqa-nav');
    this.toggle = document.querySelector('.nav-toggle');
    this.menu = document.querySelector('.nav-menu');
    this.overlay = document.querySelector('.nav-overlay');
    this.links = document.querySelectorAll('.nav-link[hx-get]');
    
    this.isOpen = false;
    this.currentPath = window.location.pathname;
    
    this.init();
  }

  init() {
    if (!this.nav) return;
    
    this.setupEventListeners();
    this.setupKeyboardNavigation();
    this.updateActiveState();
    this.setupHTMXIntegration();
    this.setupAccessibilityFeatures();
  }

  setupEventListeners() {
    // Toggle menu mobile
    if (this.toggle) {
      this.toggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMenu();
      });
    }

    // Fermer menu sur overlay
    if (this.overlay) {
      this.overlay.addEventListener('click', () => {
        this.closeMenu();
      });
    }

    // Fermer menu sur Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
        this.toggle?.focus();
      }
    });

    // Fermer menu sur resize
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.isOpen) {
        this.closeMenu();
      }
    });

    // Gestion des clics sur les liens
    this.links.forEach(link => {
      link.addEventListener('click', () => {
        // Fermer le menu mobile si ouvert
        if (this.isOpen) {
          this.closeMenu();
        }
        
        // Marquer comme actif temporairement
        this.setActiveLink(link);
      });
    });
  }

  setupKeyboardNavigation() {
    if (!this.menu) return;

    const focusableElements = this.menu.querySelectorAll(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );

    focusableElements.forEach((element, index) => {
      element.addEventListener('keydown', (e) => {
        const isFirstElement = index === 0;
        const isLastElement = index === focusableElements.length - 1;

        switch (e.key) {
          case 'Tab':
            // Gérer le focus trapping en mode mobile
            if (this.isOpen && window.innerWidth <= 768) {
              if (e.shiftKey && isFirstElement) {
                e.preventDefault();
                focusableElements[focusableElements.length - 1].focus();
              } else if (!e.shiftKey && isLastElement) {
                e.preventDefault();
                focusableElements[0].focus();
              }
            }
            break;

          case 'ArrowDown':
            if (window.innerWidth <= 768) {
              e.preventDefault();
              const nextIndex = isLastElement ? 0 : index + 1;
              focusableElements[nextIndex].focus();
            }
            break;

          case 'ArrowUp':
            if (window.innerWidth <= 768) {
              e.preventDefault();
              const prevIndex = isFirstElement ? focusableElements.length - 1 : index - 1;
              focusableElements[prevIndex].focus();
            }
            break;

          case 'Home':
            if (window.innerWidth <= 768) {
              e.preventDefault();
              focusableElements[0].focus();
            }
            break;

          case 'End':
            if (window.innerWidth <= 768) {
              e.preventDefault();
              focusableElements[focusableElements.length - 1].focus();
            }
            break;
        }
      });
    });
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    if (!this.menu || !this.toggle) return;

    this.isOpen = true;
    
    // Mettre à jour les attributs ARIA
    this.toggle.setAttribute('aria-expanded', 'true');
    this.menu.setAttribute('aria-hidden', 'false');
    
    // Ajouter les classes CSS
    this.menu.classList.add('active');
    this.overlay?.classList.add('active');
    
    // Empêcher le scroll du body
    document.body.classList.add('nav-open');
    
    // Focus sur le premier élément du menu
    setTimeout(() => {
      const firstFocusable = this.menu.querySelector('a, button');
      firstFocusable?.focus();
    }, 100);

    // Annoncer l'ouverture aux lecteurs d'écran
    this.announceToScreenReader('Menu ouvert');
  }

  closeMenu() {
    if (!this.menu || !this.toggle) return;

    this.isOpen = false;
    
    // Mettre à jour les attributs ARIA
    this.toggle.setAttribute('aria-expanded', 'false');
    this.menu.setAttribute('aria-hidden', 'true');
    
    // Retirer les classes CSS
    this.menu.classList.remove('active');
    this.overlay?.classList.remove('active');
    
    // Réactiver le scroll du body
    document.body.classList.remove('nav-open');

    // Annoncer la fermeture aux lecteurs d'écran
    this.announceToScreenReader('Menu fermé');
  }

  updateActiveState() {
    // Retirer tous les états actifs
    this.links.forEach(link => {
      link.removeAttribute('aria-current');
      link.classList.remove('active');
    });

    // Trouver et marquer le lien actuel
    const currentLink = Array.from(this.links).find(link => {
      const href = link.getAttribute('hx-get') || link.getAttribute('href');
      return href && this.pathMatches(href, this.currentPath);
    });

    if (currentLink) {
      this.setActiveLink(currentLink);
    }
  }

  setActiveLink(link) {
    // Retirer l'état actif de tous les liens
    this.links.forEach(l => {
      l.removeAttribute('aria-current');
      l.classList.remove('active');
    });

    // Marquer le lien comme actif
    link.setAttribute('aria-current', 'page');
    link.classList.add('active');
  }

  pathMatches(linkPath, currentPath) {
    // Normaliser les chemins
    const normalizePath = (path) => {
      return path.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    };

    const normalizedLink = normalizePath(linkPath);
    const normalizedCurrent = normalizePath(currentPath);

    return normalizedLink === normalizedCurrent ||
           (normalizedLink === '/' && normalizedCurrent === '/index');
  }

  setupHTMXIntegration() {
    // Écouter les changements d'URL via HTMX
    document.addEventListener('htmx:pushedIntoHistory', (e) => {
      this.currentPath = new URL(e.detail.path, window.location.origin).pathname;
      this.updateActiveState();
    });

    // Gérer les états de chargement
    document.addEventListener('htmx:beforeRequest', (e) => {
      if (e.target.classList.contains('nav-link')) {
        e.target.setAttribute('aria-busy', 'true');
        this.announceToScreenReader('Chargement en cours');
      }
    });

    document.addEventListener('htmx:afterRequest', (e) => {
      if (e.target.classList.contains('nav-link')) {
        e.target.removeAttribute('aria-busy');
        
        if (e.detail.successful) {
          this.announceToScreenReader('Page chargée');
        } else {
          this.announceToScreenReader('Erreur de chargement');
        }
      }
    });
  }

  setupAccessibilityFeatures() {
    // Créer une région live pour les annonces
    if (!document.getElementById('nav-announcements')) {
      const announcer = document.createElement('div');
      announcer.id = 'nav-announcements';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }

    // Améliorer l'accessibilité des icônes
    const icons = this.nav?.querySelectorAll('.nav-icon');
    icons?.forEach(icon => {
      if (!icon.getAttribute('aria-label')) {
        icon.setAttribute('aria-hidden', 'true');
      }
    });

    // Support pour les préférences de mouvement
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.nav?.style.setProperty('--transition-fast', 'none');
      this.nav?.style.setProperty('--transition-medium', 'none');
    }
  }

  announceToScreenReader(message) {
    const announcer = document.getElementById('nav-announcements');
    if (announcer) {
      announcer.textContent = '';
      // Petit délai pour s'assurer que les lecteurs d'écran captent le changement
      setTimeout(() => {
        announcer.textContent = message;
      }, 100);
    }
  }

  // Méthode publique pour mettre à jour l'état d'authentification
  updateAuthState(isAuthenticated, userInfo = null) {
    const guestAuth = document.querySelector('.nav-auth--guest');
    const userAuth = document.querySelector('.nav-auth--user');
    const authItems = document.querySelectorAll('.nav-item--auth');

    if (isAuthenticated) {
      guestAuth?.style.setProperty('display', 'none');
      userAuth?.style.setProperty('display', 'flex');
      authItems.forEach(item => item.style.setProperty('display', 'block'));

      if (userInfo) {
        const userName = document.querySelector('.nav-user-name');
        const energyLevel = document.querySelector('.energy-level-text');
        
        if (userName) userName.textContent = userInfo.name || 'Utilisateur';
        if (energyLevel && userInfo.energy) {
          energyLevel.textContent = `Énergie: ${userInfo.energy}`;
        }
      }
    } else {
      guestAuth?.style.setProperty('display', 'flex');
      userAuth?.style.setProperty('display', 'none');
      authItems.forEach(item => item.style.setProperty('display', 'none'));
    }
  }

  // Méthode publique pour mettre à jour le niveau d'énergie
  updateEnergyLevel(level) {
    const energyText = document.querySelector('.energy-level-text');
    if (energyText) {
      energyText.textContent = `Énergie: ${level}`;
      
      // Annoncer le changement
      this.announceToScreenReader(`Niveau d'énergie mis à jour: ${level}`);
    }
  }

  // Méthode publique pour destruction
  destroy() {
    // Nettoyer les event listeners si nécessaire
    this.closeMenu();
    document.body.classList.remove('nav-open');
    
    const announcer = document.getElementById('nav-announcements');
    announcer?.remove();
  }
}

// Auto-initialisation après le chargement de la navigation
document.addEventListener('navigationLoaded', () => {
  // Détruire l'instance précédente si elle existe
  if (window.qfqaNav) {
    window.qfqaNav.destroy();
  }
  
  // Créer une nouvelle instance
  window.qfqaNav = new QFQANavigation();
});

// Fallback pour le DOM ready si la navigation est déjà présente
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier si la navigation existe déjà
  if (document.querySelector('.qfqa-nav') && !window.qfqaNav) {
    window.qfqaNav = new QFQANavigation();
  }
});

// Réinitialisation après les mises à jour HTMX
document.addEventListener('htmx:afterSwap', (e) => {
  // Si la navigation a été remplacée, réinitialiser
  if (e.target.querySelector('.qfqa-nav') && !window.qfqaNav) {
    window.qfqaNav = new QFQANavigation();
  }
});