// Configuration HTMX et gestion des événements
document.addEventListener('DOMContentLoaded', function() {
    // Configuration HTMX
    htmx.config.globalViewTransitions = true;
    htmx.config.defaultSwapStyle = 'outerHTML';
    
    // Gestionnaire d'erreurs HTMX amélioré
    document.body.addEventListener('htmx:responseError', function(evt) {
        console.error('Erreur HTMX:', evt.detail);
        
        const status = evt.detail.xhr.status;
        let message = 'Une erreur est survenue. Veuillez réessayer.';
        
        switch(status) {
            case 401:
                message = 'Session expirée. Veuillez vous reconnecter.';
                // Redirection vers login après 2 secondes
                setTimeout(() => {
                    htmx.ajax('GET', '/login.html', '#main-content');
                }, 2000);
                break;
            case 403:
                message = 'Accès non autorisé.';
                break;
            case 404:
                message = 'Ressource introuvable.';
                break;
            case 429:
                message = 'Trop de requêtes. Veuillez patienter.';
                break;
            case 500:
                message = 'Erreur serveur. Nos équipes sont notifiées.';
                break;
        }
        
        showAlert(message, 'error');
    });
    
    // Gestionnaire de succès HTMX
    document.body.addEventListener('htmx:afterSwap', function(evt) {
        // Réinitialiser les événements après un swap HTMX
        initializeFormValidation();
        initializeDragAndDrop();
        initializeButtonHandlers();
        
        // Annoncer les changements pour les lecteurs d'écran
        announceContentChange(evt.target);
    });
    
    // Gestionnaire de début de requête (loading)
    document.body.addEventListener('htmx:beforeRequest', function(evt) {
        const target = evt.target;
        if (target.tagName === 'FORM') {
            const submitBtn = target.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Chargement...';
            }
        }
    });
    
    // Gestionnaire de fin de requête
    document.body.addEventListener('htmx:afterRequest', function(evt) {
        const target = evt.target;
        if (target.tagName === 'FORM') {
            const submitBtn = target.querySelector('[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                // Restaurer le texte original (stocké dans data-original-text)
                const originalText = submitBtn.dataset.originalText;
                if (originalText) {
                    submitBtn.textContent = originalText;
                }
            }
        }
    });
    
    // Initialisation
    initializeFormValidation();
    initializeDragAndDrop();
    initializeAccessibility();
    initializeButtonHandlers();
});

// Validation de formulaires accessible
function initializeFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(form)) {
                e.preventDefault();
                return false;
            }
        });
        
        // Validation en temps réel
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(input);
            });
            
            input.addEventListener('input', function() {
                clearFieldError(input);
            });
        });
    });
}

// Validation d'un champ individuel
function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.hasAttribute('required');
    
    let isValid = true;
    let errorMessage = '';
    
    // Validation requise
    if (required && !value) {
        isValid = false;
        errorMessage = 'Ce champ est obligatoire.';
    }
    
    // Validation email
    else if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Veuillez saisir une adresse email valide.';
        }
    }
    
    // Validation mot de passe
    else if (field.name === 'password' && value) {
        if (value.length < 8) {
            isValid = false;
            errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
        }
    }
    
    // Validation nom d'utilisateur
    else if (field.name === 'username' && value) {
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        if (!usernameRegex.test(value)) {
            isValid = false;
            errorMessage = 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères (lettres, chiffres, _ et - uniquement).';
        }
    }
    
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

// Validation complète du formulaire
function validateForm(form) {
    const fields = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isFormValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isFormValid = false;
        }
    });
    
    return isFormValid;
}

// Affichage d'erreur sur un champ
function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('form-input--error');
    field.setAttribute('aria-invalid', 'true');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error';
    errorElement.id = field.id + '-error';
    errorElement.textContent = message;
    errorElement.setAttribute('role', 'alert');
    
    field.setAttribute('aria-describedby', errorElement.id);
    field.parentNode.appendChild(errorElement);
}

// Suppression d'erreur sur un champ
function clearFieldError(field) {
    field.classList.remove('form-input--error');
    field.setAttribute('aria-invalid', 'false');
    
    const existingError = document.getElementById(field.id + '-error');
    if (existingError) {
        existingError.remove();
        field.removeAttribute('aria-describedby');
    }
}

// Drag and Drop pour les éléments flottants
function initializeDragAndDrop() {
    const draggableElements = document.querySelectorAll('.schedule-element.floating');
    const dropZones = document.querySelectorAll('.drop-zone');
    
    draggableElements.forEach(element => {
        element.draggable = true;
        
        element.addEventListener('dragstart', function(e) {
            this.classList.add('dragging');
            e.dataTransfer.setData('text/plain', this.id);
            e.dataTransfer.effectAllowed = 'move';
            
            // Support clavier
            this.setAttribute('aria-grabbed', 'true');
        });
        
        element.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            this.setAttribute('aria-grabbed', 'false');
        });
        
        // Support clavier pour le drag & drop
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Space' || e.key === 'Enter') {
                e.preventDefault();
                startKeyboardDrag(this);
            }
        });
    });
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('active');
            e.dataTransfer.dropEffect = 'move';
        });
        
        zone.addEventListener('dragleave', function() {
            this.classList.remove('active');
        });
        
        zone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('active');
            
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggedElement = document.getElementById(draggedId);
            
            if (draggedElement && this.dataset.timeSlot) {
                moveElementToTimeSlot(draggedElement, this.dataset.timeSlot);
            }
        });
    });
}

// Drag & drop au clavier (accessibilité)
function startKeyboardDrag(element) {
    const dropZones = document.querySelectorAll('.drop-zone');
    let currentZoneIndex = 0;
    
    // Highlighting de la première zone
    if (dropZones.length > 0) {
        dropZones[currentZoneIndex].classList.add('keyboard-target');
        
        const keyboardHandler = function(e) {
            switch(e.key) {
                case 'ArrowDown':
                case 'ArrowRight':
                    e.preventDefault();
                    dropZones[currentZoneIndex].classList.remove('keyboard-target');
                    currentZoneIndex = (currentZoneIndex + 1) % dropZones.length;
                    dropZones[currentZoneIndex].classList.add('keyboard-target');
                    break;
                    
                case 'ArrowUp':
                case 'ArrowLeft':
                    e.preventDefault();
                    dropZones[currentZoneIndex].classList.remove('keyboard-target');
                    currentZoneIndex = currentZoneIndex === 0 ? dropZones.length - 1 : currentZoneIndex - 1;
                    dropZones[currentZoneIndex].classList.add('keyboard-target');
                    break;
                    
                case 'Enter':
                case 'Space':
                    e.preventDefault();
                    moveElementToTimeSlot(element, dropZones[currentZoneIndex].dataset.timeSlot);
                    endKeyboardDrag();
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    endKeyboardDrag();
                    break;
            }
        };
        
        const endKeyboardDrag = function() {
            dropZones.forEach(zone => zone.classList.remove('keyboard-target'));
            document.removeEventListener('keydown', keyboardHandler);
            element.focus();
        };
        
        document.addEventListener('keydown', keyboardHandler);
    }
}

// Déplacement d'un élément vers un créneau horaire
function moveElementToTimeSlot(element, timeSlot) {
    // Ici on ferait un appel HTMX vers le backend
    // Pour l'instant, simulation locale
    
    showAlert(`Élément "${element.textContent.trim()}" déplacé vers ${timeSlot}`, 'success');
    
    // Animation visuelle
    element.style.transform = 'scale(0.95)';
    setTimeout(() => {
        element.style.transform = '';
    }, 200);
}

// Gestion des alertes
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alerts') || createAlertContainer();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.setAttribute('role', 'alert');
    alert.setAttribute('aria-live', 'polite');
    alert.textContent = message;
    
    // Bouton de fermeture
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'alert-close';
    closeBtn.setAttribute('aria-label', 'Fermer l\'alerte');
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => {
        alert.remove();
    });
    
    alert.appendChild(closeBtn);
    alertContainer.appendChild(alert);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Création du conteneur d'alertes si nécessaire
function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'alerts';
    container.className = 'alerts-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '1000';
    container.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(container);
    return container;
}

// Amélioration de l'accessibilité
function initializeAccessibility() {
    // Skip link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Aller au contenu principal';
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Gestion du focus après navigation HTMX
    document.body.addEventListener('htmx:afterSwap', function() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.focus();
        }
    });
    
    // Détection des préférences d'accessibilité
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('reduced-motion');
    }
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
        document.documentElement.classList.add('high-contrast');
    }
}

// Gestionnaires d'événements pour remplacer les onclick
function initializeButtonHandlers() {
    // Gestionnaire pour le bouton de visibilité du mot de passe
    const passwordToggle = document.getElementById('password-toggle-btn');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
    }
    
    // Gestionnaires pour les boutons de navigation des étapes
    document.querySelectorAll('[data-step]').forEach(btn => {
        btn.addEventListener('click', function() {
            const stepNumber = parseInt(this.dataset.step);
            nextStep(stepNumber);
        });
    });
    
    // Gestionnaires pour les boutons d'effacement de formulaire
    document.querySelectorAll('[data-clear-form]').forEach(btn => {
        btn.addEventListener('click', function() {
            const formId = this.dataset.clearForm;
            clearForm(formId);
        });
    });
}

// Fonction de basculement de visibilité du mot de passe
function togglePasswordVisibility() {
    const passwordField = document.getElementById('password');
    const toggleButton = document.getElementById('password-toggle-btn');
    
    if (!passwordField || !toggleButton) return;
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleButton.setAttribute('aria-label', 'Masquer le mot de passe');
        toggleButton.textContent = '🙈';
        announceToScreenReader('Mot de passe visible');
    } else {
        passwordField.type = 'password';
        toggleButton.setAttribute('aria-label', 'Afficher le mot de passe');
        toggleButton.textContent = '👁️';
        announceToScreenReader('Mot de passe masqué');
    }
}

// Fonction pour annoncer les changements aux lecteurs d'écran
function announceContentChange(target) {
    const announcement = target.dataset.announcement;
    if (announcement) {
        announceToScreenReader(announcement);
    }
}

// Utilitaire pour les annonces aux lecteurs d'écran
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Nettoyer après un délai
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Gestion du focus trap dans les modales
function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
        
        if (e.key === 'Escape') {
            closeModal(modal);
        }
    });
}

// Utilitaires pour la gestion de l'énergie
function updateEnergyIndicator(level, maxLevel = 5) {
    const indicators = document.querySelectorAll('.energy-level');
    
    indicators.forEach((indicator, index) => {
        indicator.classList.remove('filled', 'low', 'medium');
        
        if (index < level) {
            if (level <= maxLevel * 0.3) {
                indicator.classList.add('filled', 'low');
            } else if (level <= maxLevel * 0.7) {
                indicator.classList.add('filled', 'medium');
            } else {
                indicator.classList.add('filled');
            }
        }
    });
}

// Calcul de la force du mot de passe
function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('Au moins 8 caractères');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Au moins une minuscule');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Au moins une majuscule');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Au moins un chiffre');
    
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Au moins un caractère spécial');
    
    // Estimation du temps de crack (simplifiée)
    const timeEstimates = [
        'Instantané',
        'Quelques secondes',
        'Quelques minutes',
        'Quelques heures',
        'Quelques jours',
        'Plusieurs années'
    ];
    
    return {
        score: score,
        percentage: (score / 5) * 100,
        timeToBreak: timeEstimates[score] || 'Très long',
        feedback: feedback
    };
}