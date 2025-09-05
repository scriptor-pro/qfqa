// Simple JWT implementation using Web Crypto API for serverless compatibility

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret-key-for-development-only-not-secure';

// Base64 URL encoding (without padding) - Node.js compatible
function base64urlEncode(str: string): string {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlDecode(str: string): string {
  // Add padding if needed
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return Buffer.from(base64, 'base64').toString('utf8');
}

// HMAC-SHA256 signature
async function createSignature(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureArray = new Uint8Array(signature);
  const signatureBase64 = Buffer.from(signatureArray).toString('base64');
  
  return signatureBase64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Create JWT token
export async function createToken(payload: any): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Add expiration (7 days from now)
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (7 * 24 * 60 * 60); // 7 days
  
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: exp
  };
  
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(tokenPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await createSignature(data);
  
  return `${data}.${signature}`;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<any | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signatureB64) {
      return null;
    }
    
    // Verify signature
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = await createSignature(data);
    
    if (signatureB64 !== expectedSignature) {
      return null;
    }
    
    // Parse payload
    const payload = JSON.parse(base64urlDecode(payloadB64));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}