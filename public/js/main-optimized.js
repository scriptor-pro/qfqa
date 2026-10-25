// Configuration HTMX et gestion globale optimisée
document.addEventListener('DOMContentLoaded', init);

function init() {
    // Configuration HTMX
    if (typeof htmx !== 'undefined') {
        htmx.config.globalViewTransitions = true;
        htmx.config.defaultSwapStyle = 'outerHTML';
        
        // Gestionnaires d'événements HTMX optimisés
        document.body.addEventListener('htmx:responseError', handleHTMXError);
        document.body.addEventListener('htmx:afterSwap', handleHTMXSwap);
        document.body.addEventListener('htmx:beforeRequest', handleHTMXBefore);
        document.body.addEventListener('htmx:afterRequest', handleHTMXAfter);
    }
    
    // Initialisation
    initializeFormValidation();
    initializeAccessibility();
    initializeButtonHandlers();
}

// Gestion d'erreurs HTMX optimisée
function handleHTMXError(evt) {
    console.error('Erreur HTMX:', evt.detail);
    
    const messages = {
        401: 'Session expirée. Redirection...',
        403: 'Accès non autorisé.',
        404: 'Ressource introuvable.',
        429: 'Trop de requêtes. Patientez.',
        500: 'Erreur serveur.'
    };
    
    const status = evt.detail.xhr.status;
    const message = messages[status] || 'Erreur de connexion.';
    
    showAlert(message, 'error');
    
    if (status === 401) {
        setTimeout(() => htmx.ajax('GET', '/login.html', '#main-content'), 2000);
    }
}

// Gestionnaires HTMX optimisés
function handleHTMXSwap(evt) {
    initializeFormValidation();
    initializeButtonHandlers();
    announceContentChange(evt.target);
}

function handleHTMXBefore(evt) {
    if (evt.target.tagName === 'FORM') {
        const submitBtn = evt.target.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.dataset.originalText = submitBtn.textContent;
            submitBtn.textContent = 'Chargement...';
        }
    }
}

function handleHTMXAfter(evt) {
    if (evt.target.tagName === 'FORM') {
        const submitBtn = evt.target.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            const originalText = submitBtn.dataset.originalText;
            if (originalText) submitBtn.textContent = originalText;
        }
    }
}

// Validation de formulaires simplifiée
function initializeFormValidation() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', e => {
            if (!validateForm(form)) e.preventDefault();
        });
        
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('blur', () => validateField(input));
            input.addEventListener('input', () => clearFieldError(input));
        });
    });
}

function validateForm(form) {
    let isValid = true;
    form.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
        if (!validateField(field)) isValid = false;
    });
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.hasAttribute('required');
    
    let isValid = true;
    let errorMessage = '';
    
    if (required && !value) {
        isValid = false;
        errorMessage = 'Ce champ est obligatoire.';
    } else if (type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        isValid = false;
        errorMessage = 'Email invalide.';
    } else if (field.name === 'password' && value && value.length < 8) {
        isValid = false;
        errorMessage = 'Minimum 8 caractères.';
    } else if (field.name === 'username' && value && !/^[a-zA-Z0-9_-]{3,20}$/.test(value)) {
        isValid = false;
        errorMessage = '3-20 caractères (lettres, chiffres, _ et -).';
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) errorDiv.remove();
}

// Système d'alertes optimisé
function showAlert(message, type = 'info', duration = 5000) {
    const alertsContainer = document.getElementById('alerts') || createAlertContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.setAttribute('role', 'alert');
    alert.setAttribute('aria-live', 'assertive');
    
    alertsContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, duration);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alerts';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:1000;';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
    return container;
}

// Accessibilité optimisée
function initializeAccessibility() {
    // Skip link automatique
    if (!document.querySelector('.skip-link')) {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Aller au contenu principal';
        document.body.insertBefore(skipLink, document.body.firstChild);
    }
    
    // Focus management après navigation
    document.body.addEventListener('htmx:afterSwap', () => {
        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.focus();
    });
    
    // Détection préférences utilisateur
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('reduced-motion');
    }
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
        document.documentElement.classList.add('high-contrast');
    }
}

// Gestionnaires de boutons optimisés
function initializeButtonHandlers() {
    // Bouton mot de passe
    const passwordToggle = document.getElementById('password-toggle-btn');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
    }
    
    // Boutons de navigation étapes
    document.querySelectorAll('[data-step]').forEach(btn => {
        btn.addEventListener('click', function() {
            const stepNumber = parseInt(this.dataset.step);
            if (typeof nextStep === 'function') nextStep(stepNumber);
        });
    });
}

// Fonctions utilitaires optimisées
function togglePasswordVisibility() {
    const passwordField = document.getElementById('password');
    const toggleButton = document.getElementById('password-toggle-btn');
    
    if (!passwordField || !toggleButton) return;
    
    const isVisible = passwordField.type === 'text';
    passwordField.type = isVisible ? 'password' : 'text';
    toggleButton.setAttribute('aria-label', isVisible ? 'Afficher le mot de passe' : 'Masquer le mot de passe');
    toggleButton.textContent = isVisible ? '👁️' : '🙈';
    announceToScreenReader(isVisible ? 'Mot de passe masqué' : 'Mot de passe visible');
}

function announceContentChange(target) {
    const announcement = target.dataset.announcement;
    if (announcement) announceToScreenReader(announcement);
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

// Navigation entre étapes (setup.html)
function nextStep(stepNumber) {
    const currentStep = document.querySelector('.setup-step.active');
    const currentIndicator = document.querySelector('.step-indicator.active');
    
    if (currentStep) currentStep.classList.remove('active');
    if (currentIndicator) {
        currentIndicator.classList.remove('active');
        currentIndicator.setAttribute('aria-selected', 'false');
    }
    
    const newStep = document.getElementById(`step-${stepNumber}`);
    const newIndicator = document.querySelector(`[data-step="${stepNumber}"]`);
    
    if (newStep) newStep.classList.add('active');
    if (newIndicator) {
        newIndicator.classList.add('active');
        newIndicator.setAttribute('aria-selected', 'true');
    }
    
    window.scrollTo(0, 0);
}

function previousStep(stepNumber) {
    nextStep(stepNumber);
}

// Utilitaires pour nettoyage de formulaires
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        form.querySelectorAll('.field-error').forEach(error => error.remove());
        form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
    }
}

// Gestion de l'énergie (simplifié)
function updateEnergyIndicator(level, maxLevel = 5) {
    document.querySelectorAll('.energy-level').forEach((indicator, index) => {
        indicator.classList.toggle('filled', index < level);
        indicator.classList.toggle('medium', level > maxLevel * 0.4 && level <= maxLevel * 0.7);
        indicator.classList.toggle('high', level > maxLevel * 0.7);
    });
}