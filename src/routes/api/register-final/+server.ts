import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Shared global storage
declare global {
  var __qfqa_users: any[];
  var __qfqa_userId: number;
}

const users = globalThis.__qfqa_users || [];
if (!globalThis.__qfqa_users) {
  globalThis.__qfqa_users = users;
  globalThis.__qfqa_userId = 1;
}

// Simple validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeText(text: string, maxLength = 1000): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>&"']/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;'
      };
      return entities[match];
    })
    .trim()
    .substring(0, maxLength);
}

// Password hashing
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'qfqa_salt_2025_secure');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('Register final: Starting');
    
    // Parse request
    const { username, email, password, neurotype } = await request.json();
    console.log('Register final: Parsed', { username, email, neurotype });
    
    // Validation
    if (!username || username.length < 3 || username.length > 50) {
      return json({ message: 'Nom d\'utilisateur invalide (3-50 caractères)' }, { status: 400 });
    }
    
    if (!email || !isValidEmail(email) || email.length > 320) {
      return json({ message: 'Email invalide' }, { status: 400 });
    }
    
    if (!password || password.length < 8 || password.length > 128) {
      return json({ message: 'Mot de passe invalide (8-128 caractères)' }, { status: 400 });
    }
    
    if (!['TDAH', 'Autiste', 'Les deux'].includes(neurotype)) {
      return json({ message: 'Neurotype invalide' }, { status: 400 });
    }
    
    console.log('Register final: Validation OK');
    
    // Check existing
    const existing = users.find(u => u.username === username || u.email === email);
    if (existing) {
      return json({ message: 'Utilisateur déjà existant' }, { status: 409 });
    }
    
    console.log('Register final: No duplicate user');
    
    // Sanitize
    const sanitizedUsername = sanitizeText(username, 50);
    const sanitizedEmail = sanitizeText(email, 320);
    
    console.log('Register final: Sanitized inputs');
    
    // Hash password
    const passwordHash = await hashPassword(password);
    console.log('Register final: Password hashed');
    
    // Create user
    const user = {
      id: ++globalThis.__qfqa_userId,
      username: sanitizedUsername,
      email: sanitizedEmail,
      password_hash: passwordHash,
      neurotype,
      subscription_status: 'trial',
      subscription_plan: 'free',
      trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    users.push(user);
    console.log('Register final: User created', { id: user.id, username: user.username });
    
    // Return success (no JWT to test)
    return json({
      success: true,
      message: 'Compte créé avec succès!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        neurotype: user.neurotype,
        subscription_plan: user.subscription_plan
      }
    });
    
  } catch (error) {
    console.error('Register final: Error', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return json({ 
      success: false,
      message: 'Erreur serveur',
      error: error.message,
      stack: error.stack?.split('\n')[0]
    }, { status: 500 });
  }
};