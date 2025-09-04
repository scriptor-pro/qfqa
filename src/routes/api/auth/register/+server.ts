import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/database';
import { hashPassword, generateToken } from '$lib/auth';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, email, password, neurotype } = await request.json();
    
    // Validation
    if (!username || !email || !password || !neurotype) {
      return json({ message: 'Tous les champs sont requis' }, { status: 400 });
    }
    
    if (username.length < 3) {
      return json({ message: 'Le nom d\'utilisateur doit faire au moins 3 caractères' }, { status: 400 });
    }
    
    if (password.length < 8) {
      return json({ message: 'Le mot de passe doit faire au moins 8 caractères' }, { status: 400 });
    }
    
    if (!['TDAH', 'Autiste', 'Les deux'].includes(neurotype)) {
      return json({ message: 'Neurotype invalide' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    
    if (existingUser) {
      return json({ message: 'Nom d\'utilisateur ou email déjà utilisé' }, { status: 409 });
    }
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, neurotype)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = insertUser.run(username, email, passwordHash, neurotype);
    const userId = result.lastInsertRowid;
    
    // Get created user
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    // Generate JWT token
    const token = generateToken(user as any);
    
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
    console.error('Registration error:', error);
    return json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
};