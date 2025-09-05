import Database from 'better-sqlite3';
import { dev } from '$app/environment';
import { writeFileSync, existsSync } from 'fs';

// Database path for different environments
const dbPath = dev ? 'qfqa.db' : '/tmp/qfqa.db';

// Ensure directory exists in serverless environment
if (!dev && !existsSync('/tmp')) {
  try {
    writeFileSync('/tmp/.keep', '');
  } catch (error) {
    console.warn('Could not create /tmp directory');
  }
}

let db: Database.Database;

try {
  db = new Database(dbPath);
  console.log(`Database initialized at: ${dbPath}`);
  
  // Test database connection
  db.exec('SELECT 1');
  console.log('Database connection test successful');
} catch (error) {
  console.error('Database initialization failed:', error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  
  // Fallback to in-memory database
  try {
    db = new Database(':memory:');
    console.log('Using in-memory database as fallback');
  } catch (fallbackError) {
    console.error('Even in-memory database failed:', fallbackError);
    throw new Error('Unable to initialize any database');
  }
}

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    neurotype TEXT NOT NULL CHECK (neurotype IN ('TDAH', 'Autiste', 'Les deux')),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'inactive', 'expired')),
    subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium')),
    subscription_start DATE,
    subscription_end DATE,
    trial_end_date DATE DEFAULT (date('now', '+7 days')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subscription_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    max_tasks INTEGER DEFAULT -1,
    max_schedules INTEGER DEFAULT -1,
    features_json TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    stripe_payment_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS schedule_elements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    is_external BOOLEAN DEFAULT 0,
    travel_energy_cost INTEGER DEFAULT 0 CHECK (travel_energy_cost BETWEEN 0 AND 12),
    energy_cost INTEGER NOT NULL CHECK (energy_cost BETWEEN 1 AND 12),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS floating_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    estimated_duration INTEGER NOT NULL,
    energy_cost INTEGER NOT NULL CHECK (energy_cost BETWEEN 1 AND 12),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    completed BOOLEAN DEFAULT 0,
    scheduled_date DATE,
    scheduled_time TIME,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS energy_levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    morning_energy INTEGER CHECK (morning_energy BETWEEN 1 AND 12),
    current_energy INTEGER CHECK (current_energy BETWEEN 1 AND 12),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

// Insert default subscription plans
const insertPlan = db.prepare(`
  INSERT OR IGNORE INTO subscription_plans (name, price, billing_cycle, max_tasks, max_schedules, features_json)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertPlan.run('free', 0, 'monthly', 10, 5, JSON.stringify({ themes: false, export: false }));
insertPlan.run('basic', 5.99, 'monthly', 50, 20, JSON.stringify({ themes: true, export: true, priority: false }));
insertPlan.run('premium', 12.99, 'monthly', -1, -1, JSON.stringify({ themes: true, export: true, priority: true, analytics: true }));

export default db;