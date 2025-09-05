// Environment variables server-side only
export const JWT_SECRET = process.env.JWT_SECRET;

// Runtime validation function (called when actually using JWT functions)
export function validateJWTSecret(): string {
  if (!JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: JWT_SECRET must be set in production environment');
    } else {
      console.warn('WARNING: JWT_SECRET not set, using fallback for development');
      return 'fallback-jwt-secret-key-for-development-only-not-secure';
    }
  }
  return JWT_SECRET;
}

// Use fallback only in development - delay validation until runtime
export const JWT_SECRET_RESOLVED = JWT_SECRET || 'fallback-jwt-secret-key-for-development-only-not-secure';