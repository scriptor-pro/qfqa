import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import db from '$lib/database';
import { verifyToken } from '$lib/auth';

export const GET: RequestHandler = async ({ request, url }) => {
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
    
    const date = url.searchParams.get('date');
    
    if (!date) {
      return json({ message: 'Date requise' }, { status: 400 });
    }
    
    const energy = db.prepare(`
      SELECT * FROM energy_levels 
      WHERE user_id = ? AND date = ?
    `).get(payload.userId, date);
    
    return json({ energy });
    
  } catch (error) {
    console.error('Energy fetch error:', error);
    return json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
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
    
    const { date, morning_energy, current_energy, notes } = await request.json();
    
    // Validation
    if (!date) {
      return json({ message: 'Date requise' }, { status: 400 });
    }
    
    if (morning_energy && (morning_energy < 1 || morning_energy > 12)) {
      return json({ message: 'L\'énergie du matin doit être entre 1 et 12' }, { status: 400 });
    }
    
    if (current_energy && (current_energy < 1 || current_energy > 12)) {
      return json({ message: 'L\'énergie actuelle doit être entre 1 et 12' }, { status: 400 });
    }
    
    // Use INSERT OR REPLACE to handle updates
    const upsertEnergy = db.prepare(`
      INSERT OR REPLACE INTO energy_levels (user_id, date, morning_energy, current_energy, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    upsertEnergy.run(
      payload.userId,
      date,
      morning_energy || null,
      current_energy || null,
      notes || null
    );
    
    const energy = db.prepare(`
      SELECT * FROM energy_levels 
      WHERE user_id = ? AND date = ?
    `).get(payload.userId, date);
    
    return json({ message: 'Niveau d\'énergie mis à jour', energy });
    
  } catch (error) {
    console.error('Energy update error:', error);
    return json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
};