// Input validation and sanitization utilities

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Email validation with regex
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email requis');
  } else if (email.length > 320) {
    errors.push('Email trop long (320 caractères max)');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Format email invalide');
  }
  
  return { valid: errors.length === 0, errors };
}

// Username validation
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];
  
  if (!username) {
    errors.push('Nom d\'utilisateur requis');
  } else if (username.length < 3) {
    errors.push('Nom d\'utilisateur trop court (3 caractères min)');
  } else if (username.length > 50) {
    errors.push('Nom d\'utilisateur trop long (50 caractères max)');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Nom d\'utilisateur doit contenir uniquement lettres, chiffres, _ et -');
  }
  
  return { valid: errors.length === 0, errors };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Mot de passe requis');
  } else if (password.length < 8) {
    errors.push('Mot de passe trop court (8 caractères min)');
  } else if (password.length > 128) {
    errors.push('Mot de passe trop long (128 caractères max)');
  }
  
  return { valid: errors.length === 0, errors };
}

// Neurotype validation
export function validateNeurotype(neurotype: string): ValidationResult {
  const validTypes = ['TDAH', 'Autiste', 'Les deux'];
  const errors: string[] = [];
  
  if (!neurotype) {
    errors.push('Neurotype requis');
  } else if (!validTypes.includes(neurotype)) {
    errors.push('Neurotype invalide');
  }
  
  return { valid: errors.length === 0, errors };
}

// Energy level validation
export function validateEnergyLevel(energy: any): ValidationResult {
  const errors: string[] = [];
  
  if (energy === undefined || energy === null) {
    errors.push('Niveau d\'énergie requis');
  } else {
    const level = Number(energy);
    if (isNaN(level) || !Number.isInteger(level) || level < 1 || level > 12) {
      errors.push('Niveau d\'énergie doit être un entier entre 1 et 12');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// Date validation
export function validateDate(dateString: string): ValidationResult {
  const errors: string[] = [];
  
  if (!dateString) {
    errors.push('Date requise');
  } else {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      errors.push('Format de date invalide');
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// Time validation (HH:MM format)
export function validateTime(timeString: string): ValidationResult {
  const errors: string[] = [];
  
  if (!timeString) {
    errors.push('Heure requise');
  } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
    errors.push('Format d\'heure invalide (HH:MM attendu)');
  }
  
  return { valid: errors.length === 0, errors };
}

// Text sanitization (remove HTML, limit length)
export function sanitizeText(text: string, maxLength = 1000): string {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, (match) => { // Escape HTML entities
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return entities[match];
    })
    .trim()
    .substring(0, maxLength);
}

// Validate multiple fields at once
export function validateFields(fields: { [key: string]: any }, validators: { [key: string]: (value: any) => ValidationResult }): ValidationResult {
  const allErrors: string[] = [];
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const validator = validators[fieldName];
    if (validator) {
      const result = validator(value);
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
    }
  }
  
  return { valid: allErrors.length === 0, errors: allErrors };
}