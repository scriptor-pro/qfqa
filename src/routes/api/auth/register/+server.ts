import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/database';
import { hashPassword, generateToken } from '$lib/auth';
import { validateFields, validateUsername, validateEmail, validatePassword, validateNeurotype, sanitizeText } from '$lib/validation';
import type { User } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, email, password, neurotype } = await request.json();
    
    // Comprehensive validation
    const validation = validateFields(
      { username, email, password, neurotype },
      {
        username: validateUsername,
        email: validateEmail,
        password: validatePassword,
        neurotype: validateNeurotype
      }
    );
    
    if (!validation.valid) {
      return json({ message: validation.errors.join(', ') }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    
    if (existingUser) {
      return json({ message: 'Nom d\'utilisateur ou email déjà utilisé' }, { status: 409 });
    }
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeText(username, 50);
    const sanitizedEmail = sanitizeText(email, 320);
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, neurotype)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = insertUser.run(sanitizedUsername, sanitizedEmail, passwordHash, neurotype);
    const userId = result.lastInsertRowid;
    
    // Get created user
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    // Generate JWT token
    const token = generateToken(user as User);
    
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