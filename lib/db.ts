import { Pool, PoolConfig } from 'pg';

// Database connection configuration
const config: PoolConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create a single pool instance
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(config);

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });
  }

  return pool;
}

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Close pool (useful for cleanup)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
