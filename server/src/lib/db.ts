import { Pool } from 'pg';

let globalPool: Pool | undefined;

export function getDbPool() {
  if (!globalPool) {
    globalPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // For Railway, we typically need ssl in production
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalPool;
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const pool = getDbPool();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}
