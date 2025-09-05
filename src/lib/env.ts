// Environment variables server-side only
export const JWT_SECRET = process.env.JWT_SECRET;

// Validate required environment variables
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: JWT_SECRET must be set in production environment');
  } else {
    console.warn('WARNING: JWT_SECRET not set, using fallback for development');
  }
}

// Use fallback only in development
export const JWT_SECRET_RESOLVED = JWT_SECRET || 'fallback-jwt-secret-key-for-development-only-not-secure';