import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createToken } from '$lib/simple-jwt';

// Environment variables (consistent with register)
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development-only-not-secure';

// Shared users array (same as register endpoint)
declare global {
  var __qfqa_users: any[];
  var __qfqa_userId: number;
}

// Access shared storage
const users = globalThis.__qfqa_users || [];
if (!globalThis.__qfqa_users) {
  globalThis.__qfqa_users = users;
  globalThis.__qfqa_userId = 1;
}

// Password verification with Web Crypto API
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'qfqa_salt_2025_secure');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return computedHash === hash;
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
    console.log('Login API: Starting login process');
    
    // Check JWT_SECRET in production
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production');
    }
    
    // Parse request
    const { username, password } = await request.json();
    console.log('Login API: Request parsed', { username });
    
    // Validation
    if (!username || !password) {
      return json({ message: 'Nom d\'utilisateur et mot de passe requis' }, { status: 400 });
    }
    
    // Find user in memory storage
    const user = users.find(u => u.username === username);
    
    if (!user) {
      console.log('Login API: User not found');
      return json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' }, { status: 401 });
    }
    
    // Verify password
    console.log('Login API: Verifying password');
    const validPassword = await verifyPassword(password, user.password_hash);
    
    if (!validPassword) {
      console.log('Login API: Invalid password');
      return json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' }, { status: 401 });
    }
    
    console.log('Login API: Login successful');
    
    // Check subscription status (simplified for memory storage)
    const now = new Date();
    const trialEnd = user.trial_end_date ? new Date(user.trial_end_date) : null;
    
    if (user.subscription_status === 'trial' && trialEnd && now > trialEnd) {
      user.subscription_status = 'expired';
    }
    
    // Generate JWT token
    console.log('Login API: Generating JWT token');
    const token = await generateToken(user);
    console.log('Login API: JWT token generated');
    
    return json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        neurotype: user.neurotype,
        subscription_plan: user.subscription_plan,
        subscription_status: subscriptionStatus
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
};