// Environment variables server-side only
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development-only-not-secure';

// Validate required environment variables
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: JWT_SECRET not set in production environment');
}