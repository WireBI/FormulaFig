import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { buildQuery } from './lib/queryBuilder';
import { query, closeDb } from './lib/db';
import { verifyGoogleToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

// Log DB connection attempt (masking password)
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`Connecting to Host: ${url.hostname}, Port: ${url.port}, DB: ${url.pathname.substring(1)}, User: ${url.username}`);
  } catch (e) {
    console.log('Error parsing DATABASE_URL for logging');
  }
  const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log('Database URL configured:', maskedUrl);
} else {
  console.log('No DATABASE_URL found, using Cloud SQL IAM');
}

// Main Self-Service Reporting Endpoint (Protected)
app.post('/api/reports/self-service', verifyGoogleToken, async (req, res) => {
  try {
    const config = req.body;

    if (!config || !config.tableName || !config.dimensions) {
      return res.status(400).json({ error: 'Missing required query configuration fields.' });
    }

    const { sql, params } = buildQuery(config);
    const result = await query(sql, params);

    res.json({
      data: result.rows,
      rowCount: result.rowCount,
      metadata: { executedSql: sql }
    });
  } catch (error: any) {
    console.error('Self-Service API Error:', error);
    // Return the real error message so we can diagnose issues
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error?.message,
      detail: error?.detail || error?.code || undefined
    });
  }
});

// DB Debug Endpoint (Public temporarily for debugging)
app.get('/api/debug/db', async (req, res) => {
  try {
    const result = await query('SELECT current_user, current_database(), version() as pg_version, NOW() as server_time');
    const databases = await query('SELECT datname FROM pg_database WHERE datistemplate = false');
    const tables = await query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    res.json({
      status: 'connected',
      info: result.rows[0],
      databases: databases.rows.map(r => r.datname),
      tables: tables.rows.map(r => r.table_name),
      env: {
        version: '1.0.6-db-list',
        dbTarget: process.env.DATABASE_URL ? (new URL(process.env.DATABASE_URL).hostname + ' / ' + new URL(process.env.DATABASE_URL).pathname.substring(1)) : 'none',
        hasInstanceConnectionName: !!process.env.INSTANCE_CONNECTION_NAME,
        hasGcpServiceAccount: !!process.env.GCP_SERVICE_ACCOUNT,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        corsOrigin: process.env.CORS_ORIGIN,
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
      }
    });
  } catch (error: any) {
    console.error('DB Debug Error:', error);
    res.status(500).json({
      status: 'error',
      message: error?.message,
      code: error?.code,
      env: {
        version: '1.0.6-db-list',
        dbTarget: process.env.DATABASE_URL ? (new URL(process.env.DATABASE_URL).hostname + ' / ' + new URL(process.env.DATABASE_URL).pathname.substring(1)) : 'none',
        hasInstanceConnectionName: !!process.env.INSTANCE_CONNECTION_NAME,
        hasGcpServiceAccount: !!process.env.GCP_SERVICE_ACCOUNT,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        corsOrigin: process.env.CORS_ORIGIN,
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
      }
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', version: '1.0.6-db-list' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await closeDb();
  process.exit(0);
});
