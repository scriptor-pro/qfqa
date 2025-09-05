import jwt from 'jsonwebtoken';
import { JWT_SECRET_RESOLVED } from './env';

// Simple password hashing for serverless compatibility
async function simpleHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_qfqa_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function simpleCompare(password: string, hash: string): Promise<boolean> {
  const newHash = await simpleHash(password);
  return newHash === hash;
}

export interface User {
  id: number;
  username: string;
  email: string;
  neurotype: string;
  subscription_status: string;
  subscription_plan: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
  subscription_plan: string;
}

export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    subscription_plan: user.subscription_plan
  };
  
  return jwt.sign(payload, JWT_SECRET_RESOLVED, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET_RESOLVED) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  try {
    // Try bcrypt first (for development)
    const bcrypt = await import('bcryptjs');
    return bcrypt.default.hash(password, 12);
  } catch (error) {
    console.log('bcrypt not available, using simple hash');
    return simpleHash(password);
  }
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    // Try bcrypt first (for development)  
    const bcrypt = await import('bcryptjs');
    return bcrypt.default.compare(password, hash);
  } catch (error) {
    console.log('bcrypt not available, using simple compare');
    return simpleCompare(password, hash);
  }
}

export function validatePasswordStrength(password: string): { 
  score: number; 
  crackTime: string;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];
  
  if (password.length >= 8) score += 1;
  else feedback.push('Au moins 8 caractères requis');
  
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Ajouter des minuscules');
  
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Ajouter des majuscules');
  
  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Ajouter des chiffres');
  
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Ajouter des caractères spéciaux');
  
  const crackTimes = [
    'Instantané',
    'Quelques secondes', 
    'Quelques minutes',
    'Quelques heures',
    'Quelques jours',
    'Plusieurs années'
  ];
  
  return {
    score,
    crackTime: crackTimes[score] || 'Instantané',
    feedback
  };
}