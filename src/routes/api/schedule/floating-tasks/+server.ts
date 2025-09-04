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
    
    let query = 'SELECT * FROM floating_tasks WHERE user_id = ?';
    let params: any[] = [payload.userId];
    
    if (date) {
      query += ' AND (scheduled_date = ? OR scheduled_date IS NULL)';
      params.push(date);
    }
    
    query += ' ORDER BY priority DESC, created_at DESC';
    
    const tasks = db.prepare(query).all(...params);
    
    return json({ tasks });
    
  } catch (error) {
    console.error('Floating tasks fetch error:', error);
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
      estimated_duration, 
      energy_cost, 
      priority, 
      scheduled_date,
      scheduled_time,
      description 
    } = await request.json();
    
    // Validation
    if (!title || !estimated_duration || energy_cost === undefined) {
      return json({ message: 'Champs requis manquants' }, { status: 400 });
    }
    
    if (energy_cost < 1 || energy_cost > 12) {
      return json({ message: 'Le coût d\'énergie doit être entre 1 et 12' }, { status: 400 });
    }
    
    if (priority && (priority < 1 || priority > 10)) {
      return json({ message: 'La priorité doit être entre 1 et 10' }, { status: 400 });
    }
    
    if (estimated_duration < 1) {
      return json({ message: 'La durée doit être positive' }, { status: 400 });
    }
    
    const insertTask = db.prepare(`
      INSERT INTO floating_tasks (
        user_id, title, estimated_duration, energy_cost, priority, 
        scheduled_date, scheduled_time, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertTask.run(
      payload.userId, 
      title, 
      estimated_duration, 
      energy_cost, 
      priority || 5,
      scheduled_date || null,
      scheduled_time || null,
      description || null
    );
    
    const task = db.prepare('SELECT * FROM floating_tasks WHERE id = ?').get(result.lastInsertRowid);
    
    return json({ message: 'Tâche ajoutée avec succès', task }, { status: 201 });
    
  } catch (error) {
    console.error('Floating task creation error:', error);
    return json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
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
    
    const { id, scheduled_date, scheduled_time, completed } = await request.json();
    
    if (!id) {
      return json({ message: 'ID de tâche requis' }, { status: 400 });
    }
    
    // Verify task belongs to user
    const task = db.prepare('SELECT * FROM floating_tasks WHERE id = ? AND user_id = ?').get(id, payload.userId);
    
    if (!task) {
      return json({ message: 'Tâche non trouvée' }, { status: 404 });
    }
    
    const updateTask = db.prepare(`
      UPDATE floating_tasks 
      SET scheduled_date = ?, scheduled_time = ?, completed = ?
      WHERE id = ? AND user_id = ?
    `);
    
    updateTask.run(
      scheduled_date || null,
      scheduled_time || null,
      completed !== undefined ? completed : task.completed,
      id,
      payload.userId
    );
    
    const updatedTask = db.prepare('SELECT * FROM floating_tasks WHERE id = ?').get(id);
    
    return json({ message: 'Tâche mise à jour', task: updatedTask });
    
  } catch (error) {
    console.error('Floating task update error:', error);
    return json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
};