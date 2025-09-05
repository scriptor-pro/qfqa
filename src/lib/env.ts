// Environment variables server-side only
export const JWT_SECRET = process.env.JWT_SECRET;

// Always use fallback during build - check at runtime in API routes
export const JWT_SECRET_RESOLVED = JWT_SECRET || 'fallback-jwt-secret-key-for-development-only-not-secure';

// Runtime check function for API routes
export function checkJWTSecretInProduction(): void {
  if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: JWT_SECRET must be set in production environment');
  }
}