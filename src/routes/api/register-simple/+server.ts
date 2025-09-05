import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Simple in-memory storage for testing
const users: any[] = [];
let userId = 1;

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('Simple register: Starting');
    
    const body = await request.json();
    console.log('Simple register: Body parsed', body);
    
    const { username, email, password, neurotype } = body;
    
    // Basic validation
    if (!username || !email || !password || !neurotype) {
      return json({ message: 'Tous les champs sont requis' }, { status: 400 });
    }
    
    // Check existing user
    const existing = users.find(u => u.username === username || u.email === email);
    if (existing) {
      return json({ message: 'Utilisateur existe déjà' }, { status: 409 });
    }
    
    // Create user (without bcrypt for testing)
    const user = {
      id: userId++,
      username,
      email,
      neurotype,
      created_at: new Date().toISOString()
    };
    
    users.push(user);
    console.log('Simple register: User created', user);
    
    return json({
      message: 'Compte créé avec succès (mode test)',
      user: { id: user.id, username: user.username, email: user.email }
    });
    
  } catch (error) {
    console.error('Simple register error:', error);
    return json({ 
      message: 'Erreur simple',
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
};