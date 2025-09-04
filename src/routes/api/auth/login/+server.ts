import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/database';
import { comparePassword, generateToken } from '$lib/auth';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username, password } = await request.json();
    
    // Validation
    if (!username || !password) {
      return json({ message: 'Nom d\'utilisateur et mot de passe requis' }, { status: 400 });
    }
    
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' }, { status: 401 });
    }
    
    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' }, { status: 401 });
    }
    
    // Check subscription status
    const now = new Date();
    const subscriptionEnd = user.subscription_end ? new Date(user.subscription_end) : null;
    const trialEnd = user.trial_end_date ? new Date(user.trial_end_date) : null;
    
    let subscriptionStatus = user.subscription_status;
    
    if (subscriptionStatus === 'trial' && trialEnd && now > trialEnd) {
      subscriptionStatus = 'expired';
      db.prepare('UPDATE users SET subscription_status = ? WHERE id = ?').run('expired', user.id);
    } else if (subscriptionStatus === 'active' && subscriptionEnd && now > subscriptionEnd) {
      subscriptionStatus = 'expired';
      db.prepare('UPDATE users SET subscription_status = ? WHERE id = ?').run('expired', user.id);
    }
    
    // Generate JWT token
    const token = generateToken({
      ...user,
      subscription_status: subscriptionStatus
    });
    
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