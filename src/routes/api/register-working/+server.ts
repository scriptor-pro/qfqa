import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Ultra-simple storage
const users: any[] = [];
let userId = 1;

// Simple validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'qfqa_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('Working register: Starting');
    
    // Parse request
    const { username, email, password, neurotype } = await request.json();
    console.log('Working register: Parsed data', { username, email, neurotype });
    
    // Basic validation
    if (!username || username.length < 3) {
      return json({ message: 'Nom d\'utilisateur invalide (3 car. min)' }, { status: 400 });
    }
    
    if (!email || !isValidEmail(email)) {
      return json({ message: 'Email invalide' }, { status: 400 });
    }
    
    if (!password || password.length < 8) {
      return json({ message: 'Mot de passe invalide (8 car. min)' }, { status: 400 });
    }
    
    if (!['TDAH', 'Autiste', 'Les deux'].includes(neurotype)) {
      return json({ message: 'Neurotype invalide' }, { status: 400 });
    }
    
    console.log('Working register: Validation passed');
    
    // Check existing user
    const existing = users.find(u => u.username === username || u.email === email);
    if (existing) {
      return json({ message: 'Utilisateur déjà existant' }, { status: 409 });
    }
    
    console.log('Working register: No existing user');
    
    // Hash password
    const passwordHash = await hashPassword(password);
    console.log('Working register: Password hashed');
    
    // Create user
    const user = {
      id: userId++,
      username: username.trim(),
      email: email.trim(),
      neurotype,
      subscription_status: 'trial',
      subscription_plan: 'free',
      created_at: new Date().toISOString()
    };
    
    users.push(user);
    console.log('Working register: User created', { id: user.id, username: user.username });
    
    // Return success (no JWT for now)
    return json({
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
    console.error('Working register: Error details', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return json({ 
      message: 'Erreur serveur détaillée',
      error: error.message,
      stack: error.stack?.split('\n')[0] // First line only
    }, { status: 500 });
  }
};