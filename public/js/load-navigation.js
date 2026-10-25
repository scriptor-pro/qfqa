/**
 * Chargement de la navigation QFQA
 * Ce script charge la navigation depuis le composant externe
 */

(function() {
  'use strict';

  // Charger la navigation dès que le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavigation);
  } else {
    loadNavigation();
  }

  function loadNavigation() {
    const placeholder = document.getElementById('navigation-placeholder');
    if (!placeholder) return;

    // Fetch du composant navigation
    fetch('/components/navigation.html')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then(html => {
        placeholder.innerHTML = html;
        
        // Déclencher l'événement pour que navigation.js puisse s'initialiser
        const event = new CustomEvent('navigationLoaded');
        document.dispatchEvent(event);
      })
      .catch(error => {
        console.warn('Impossible de charger la navigation:', error);
        
        // Fallback: navigation minimaliste
        placeholder.innerHTML = `
          <nav class="qfqa-nav" role="navigation" aria-label="Navigation principale">
            <div class="nav-container">
              <div class="nav-brand">
                <a href="/" class="nav-logo">
                  <span class="logo-icon">🧠</span>
                  <span class="logo-text">QFQA</span>
                </a>
              </div>
              <div class="nav-menu">
                <ul class="nav-list">
                  <li class="nav-item">
                    <a href="/" class="nav-link">
                      <span class="nav-icon">🏠</span>
                      <span class="nav-text">Accueil</span>
                    </a>
                  </li>
                  <li class="nav-item">
                    <a href="/schedule-optimized.html" class="nav-link">
                      <span class="nav-icon">📅</span>
                      <span class="nav-text">Emploi du temps</span>
                    </a>
                  </li>
                  <li class="nav-item">
                    <a href="/login.html" class="nav-link">
                      <span class="nav-icon">🔑</span>
                      <span class="nav-text">Connexion</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        `;
        
        document.dispatchEvent(new CustomEvent('navigationLoaded'));
      });
  }
})();