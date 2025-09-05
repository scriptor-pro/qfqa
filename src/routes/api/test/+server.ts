import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  try {
    console.log('Test endpoint called');
    
    return json({ 
      message: 'API fonctionnel',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return json({ message: 'Erreur test', error: error.message }, { status: 500 });
  }
};