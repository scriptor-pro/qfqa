import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/database';
import { verifyToken } from '$lib/auth';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ message: 'Token d\'authentification requis' }, { status: 401 });
    }
    
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return json({ message: 'Token invalide' }, { status: 401 });
    }
    
    const user = db.prepare(`
      SELECT id, username, email, neurotype, subscription_status, 
             subscription_plan, subscription_start, subscription_end, 
             trial_end_date, created_at
      FROM users 
      WHERE id = ?
    `).get(payload.userId);
    
    if (!user) {
      return json({ message: 'Utilisateur non trouvé' }, { status: 404 });
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
    
    return json({
      user: {
        ...user,
        subscription_status: subscriptionStatus,
        password_hash: undefined // Remove sensitive data
      }
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    return json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
};