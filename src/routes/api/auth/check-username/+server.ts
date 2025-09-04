import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/database';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username } = await request.json();
    
    if (!username) {
      return json({ available: false, message: 'Nom d\'utilisateur requis' }, { status: 400 });
    }
    
    if (username.length < 3) {
      return json({ available: false, message: 'Le nom doit faire au moins 3 caractères' }, { status: 400 });
    }
    
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    
    return json({
      available: !existingUser,
      message: existingUser ? 'Nom d\'utilisateur déjà pris' : 'Nom d\'utilisateur disponible'
    });
    
  } catch (error) {
    console.error('Check username error:', error);
    return json({ available: false, message: 'Erreur du serveur' }, { status: 500 });
  }
};