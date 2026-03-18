import { Pool, PoolConfig } from 'pg';
import { Connector, IpAddressTypes, AuthTypes } from '@google-cloud/cloud-sql-connector';
import { GoogleAuth } from 'google-auth-library';

let globalPool: Pool | undefined;
let connector: Connector | undefined;

/**
 * Creates a pg Pool connected to Cloud SQL using IAM auth via GCP service account,
 * or falls back to DATABASE_URL for local development.
 */
async function createPool(): Promise<Pool> {
  // Fallback: if DATABASE_URL is set, use direct connection (local dev or direct Railway config)
  if (process.env.DATABASE_URL) {
    console.log('Connecting to database via DATABASE_URL');
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
  }

  // Production: use Cloud SQL Connector with service account credentials
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
  const gcpCredsJson = process.env.GCP_SERVICE_ACCOUNT;
  const dbName = process.env.DB_NAME || 'postgres';

  if (!instanceConnectionName || !gcpCredsJson) {
    console.warn('DB Config Missing: Provide DATABASE_URL or both INSTANCE_CONNECTION_NAME and GCP_SERVICE_ACCOUNT');
    throw new Error(
      'Missing required env vars: INSTANCE_CONNECTION_NAME and GCP_SERVICE_ACCOUNT must be set, ' +
      'or provide DATABASE_URL for direct connection.'
    );
  }

  console.log('Attempting Cloud SQL IAM connection with Connector');
  const credentials = JSON.parse(gcpCredsJson);

  // Create a GoogleAuth instance using the service account credentials
  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/sqlservice.admin'],
  });

  connector = new Connector({ auth });

  const clientOpts = await connector.getOptions({
    instanceConnectionName,
    ipType: IpAddressTypes.PUBLIC,
    authType: AuthTypes.IAM,
  });

  // Cloud SQL IAM users use email without .gserviceaccount.com suffix
  const iamUser = credentials.client_email.replace('.gserviceaccount.com', '');
  console.log(`Using Cloud SQL IAM username: ${iamUser}`);

  const poolConfig: PoolConfig = {
    ...clientOpts,
    user: iamUser,
    database: dbName,
    max: 10,
  };

  try {
    const pool = new Pool(poolConfig);
    // Fast check if it works
    await pool.query('SELECT 1');
    return pool;
  } catch (err: any) {
    console.error('Failed to initialize DB pool:', err.message);
    throw err;
  }
}

export async function getDbPool(): Promise<Pool> {
  if (!globalPool) {
    globalPool = await createPool();
  }
  return globalPool;
}

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const pool = await getDbPool();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}

/**
 * Gracefully close the pool and connector on shutdown.
 */
export async function closeDb() {
  if (globalPool) {
    await globalPool.end();
    globalPool = undefined;
  }
  if (connector) {
    connector.close();
    connector = undefined;
  }
}
