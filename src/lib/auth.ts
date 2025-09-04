import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '$env/static/private';

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
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
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