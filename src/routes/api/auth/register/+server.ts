import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createToken } from '$lib/simple-jwt';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development-only-not-secure';

// Shared global storage for serverless compatibility
declare global {
  var __qfqa_users: any[];
  var __qfqa_userId: number;
}

// Initialize or access shared storage
const users = globalThis.__qfqa_users || [];
let userId = globalThis.__qfqa_userId || 1;

if (!globalThis.__qfqa_users) {
  globalThis.__qfqa_users = users;
  globalThis.__qfqa_userId = userId;
}

// Utility functions
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeText(text: string, maxLength = 1000): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;'
      };
      return entities[match];
    })
    .trim()
    .substring(0, maxLength);
}

// Password hashing with Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'qfqa_salt_2025_secure');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// JWT token generation using simple JWT
async function generateToken(user: any): Promise<string> {
  const payload = {
    userId: user.id,
    username: user.username,
    subscription_plan: user.subscription_plan
  };
  return await createToken(payload);
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('Register API: Starting registration process');
    
    // Check JWT_SECRET in production
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    
    // Parse request
    const { username, email, password, neurotype } = await request.json();
    console.log('Register API: Request parsed', { username, email, neurotype });
    
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
    
    console.log('Register API: Validation passed');
    
    // Check existing user
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return json({ message: 'Nom d\'utilisateur ou email déjà utilisé' }, { status: 409 });
    }
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeText(username, 50);
    const sanitizedEmail = sanitizeText(email, 320);
    
    // Hash password
    console.log('Register API: Hashing password');
    const passwordHash = await hashPassword(password);
    
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
    console.log('Register API: User created', { id: user.id, username: user.username });
    
    // Generate JWT token
    console.log('Register API: Generating JWT token');
    const token = await generateToken(user);
    console.log('Register API: JWT token generated');
    
    return json({
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        neurotype: user.neurotype,
        subscription_plan: user.subscription_plan
      }
    });
    
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return json({ 
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
};