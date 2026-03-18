"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbPool = getDbPool;
exports.query = query;
exports.closeDb = closeDb;
const pg_1 = require("pg");
const cloud_sql_connector_1 = require("@google-cloud/cloud-sql-connector");
const google_auth_library_1 = require("google-auth-library");
let globalPool;
let connector;
/**
 * Creates a pg Pool connected to Cloud SQL using IAM auth via GCP service account,
 * or falls back to DATABASE_URL for local development.
 */
async function createPool() {
    // Fallback: if DATABASE_URL is set, use direct connection (local dev)
    if (process.env.DATABASE_URL) {
        return new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        });
    }
    // Production: use Cloud SQL Connector with service account credentials
    const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
    const gcpCredsJson = process.env.GCP_SERVICE_ACCOUNT;
    const dbName = process.env.DB_NAME || 'postgres';
    if (!instanceConnectionName || !gcpCredsJson) {
        throw new Error('Missing required env vars: INSTANCE_CONNECTION_NAME and GCP_SERVICE_ACCOUNT must be set, ' +
            'or provide DATABASE_URL for direct connection.');
    }
    const credentials = JSON.parse(gcpCredsJson);
    // Create a GoogleAuth instance using the service account credentials
    const auth = new google_auth_library_1.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/sqlservice.admin'],
    });
    connector = new cloud_sql_connector_1.Connector({ auth });
    const clientOpts = await connector.getOptions({
        instanceConnectionName,
        ipType: cloud_sql_connector_1.IpAddressTypes.PUBLIC,
        authType: cloud_sql_connector_1.AuthTypes.IAM,
    });
    // Cloud SQL IAM users use email without .gserviceaccount.com suffix
    const iamUser = credentials.client_email.replace('.gserviceaccount.com', '');
    const poolConfig = {
        ...clientOpts,
        user: iamUser,
        database: dbName,
        max: 10,
    };
    return new pg_1.Pool(poolConfig);
}
async function getDbPool() {
    if (!globalPool) {
        globalPool = await createPool();
    }
    return globalPool;
}
async function query(text, params) {
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
async function closeDb() {
    if (globalPool) {
        await globalPool.end();
        globalPool = undefined;
    }
    if (connector) {
        connector.close();
        connector = undefined;
    }
}
