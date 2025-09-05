// Fallback in-memory database for serverless environments where SQLite fails
import type { User } from './types';

// In-memory storage
let users: User[] = [];
let currentId = 1;

export function createUser(userData: {
  username: string;
  email: string;
  password_hash: string;
  neurotype: string;
}): User {
  const user: User = {
    id: currentId++,
    username: userData.username,
    email: userData.email,
    password_hash: userData.password_hash,
    neurotype: userData.neurotype as any,
    subscription_status: 'trial',
    subscription_plan: 'free',
    trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  users.push(user);
  return user;
}

export function findUserByUsernameOrEmail(username: string, email: string): User | null {
  return users.find(u => u.username === username || u.email === email) || null;
}

export function findUserById(id: number): User | null {
  return users.find(u => u.id === id) || null;
}

export function findUserByUsername(username: string): User | null {
  return users.find(u => u.username === username) || null;
}

console.log('Using fallback in-memory database');