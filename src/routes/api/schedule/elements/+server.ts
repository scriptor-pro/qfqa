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
    
    const elements = db.prepare(`
      SELECT * FROM schedule_elements 
      WHERE user_id = ? AND date = ? 
      ORDER BY start_time
    `).all(payload.userId, date);
    
    return json({ elements });
    
  } catch (error) {
    console.error('Schedule elements fetch error:', error);
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
    
    const { 
      title, 
      date, 
      start_time, 
      end_time, 
      location, 
      is_external, 
      travel_energy_cost, 
      energy_cost, 
      description 
    } = await request.json();
    
    // Validation
    if (!title || !date || !start_time || !end_time || energy_cost === undefined) {
      return json({ message: 'Champs requis manquants' }, { status: 400 });
    }
    
    if (energy_cost < 1 || energy_cost > 12) {
      return json({ message: 'Le coût d\'énergie doit être entre 1 et 12' }, { status: 400 });
    }
    
    if (travel_energy_cost && (travel_energy_cost < 0 || travel_energy_cost > 12)) {
      return json({ message: 'Le coût d\'énergie de trajet doit être entre 0 et 12' }, { status: 400 });
    }
    
    const insertElement = db.prepare(`
      INSERT INTO schedule_elements (
        user_id, title, date, start_time, end_time, location, 
        is_external, travel_energy_cost, energy_cost, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertElement.run(
      payload.userId, 
      title, 
      date, 
      start_time, 
      end_time, 
      location || null, 
      is_external || false, 
      travel_energy_cost || 0, 
      energy_cost, 
      description || null
    );
    
    const element = db.prepare('SELECT * FROM schedule_elements WHERE id = ?').get(result.lastInsertRowid);
    
    return json({ message: 'Élément ajouté avec succès', element }, { status: 201 });
    
  } catch (error) {
    console.error('Schedule element creation error:', error);
    return json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
};