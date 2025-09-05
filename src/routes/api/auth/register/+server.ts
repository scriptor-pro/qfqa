import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { hashPassword, generateToken } from '$lib/auth';
import { validateFields, validateUsername, validateEmail, validatePassword, validateNeurotype, sanitizeText } from '$lib/validation';
import { checkJWTSecretInProduction } from '$lib/env';
import type { User } from '$lib/types';

// Database initialization function
async function initDatabase() {
  try {
    const dbModule = await import('$lib/database');
    console.log('Using SQLite database');
    return { useDatabase: true, db: dbModule.default, fallback: null };
  } catch (error) {
    console.log('SQLite failed, using fallback:', error.message);
    const fallback = await import('$lib/database-fallback');
    return { useDatabase: false, db: null, fallback };
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('Register API: Starting registration process');
    
    // Initialize database
    const dbConfig = await initDatabase();
    const { useDatabase, db, fallback } = dbConfig;
    
    // Check JWT_SECRET at runtime in production
    checkJWTSecretInProduction();
    console.log('Register API: JWT_SECRET validation passed');
    
    const { username, email, password, neurotype } = await request.json();
    console.log('Register API: Request data parsed', { username, email, neurotype });
    
    // Comprehensive validation
    const validation = validateFields(
      { username, email, password, neurotype },
      {
        username: validateUsername,
        email: validateEmail,
        password: validatePassword,
        neurotype: validateNeurotype
      }
    );
    
    if (!validation.valid) {
      console.log('Register API: Validation failed', validation.errors);
      return json({ message: validation.errors.join(', ') }, { status: 400 });
    }
    console.log('Register API: Validation passed');
    
    // Check if user already exists
    console.log('Register API: Checking existing user');
    let existingUser;
    
    if (useDatabase) {
      existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    } else {
      existingUser = fallback.findUserByUsernameOrEmail(username, email);
    }
    console.log('Register API: Existing user check completed');
    
    if (existingUser) {
      return json({ message: 'Nom d\'utilisateur ou email déjà utilisé' }, { status: 409 });
    }
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeText(username, 50);
    const sanitizedEmail = sanitizeText(email, 320);
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    let user;
    
    if (useDatabase) {
      const insertUser = db.prepare(`
        INSERT INTO users (username, email, password_hash, neurotype)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = insertUser.run(sanitizedUsername, sanitizedEmail, passwordHash, neurotype);
      const userId = result.lastInsertRowid;
      
      // Get created user
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    } else {
      // Use fallback storage
      user = fallback.createUser({
        username: sanitizedUsername,
        email: sanitizedEmail,
        password_hash: passwordHash,
        neurotype
      });
    }
    
    // Generate JWT token
    const token = generateToken(user as User);
    
    return json({
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        neurotype: user.neurotype,
        subscription_plan: user.subscription_plan
      }
    });
    
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return json({ 
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
};