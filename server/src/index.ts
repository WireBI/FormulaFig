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
    res.status(500).json({ error: error.message });
  }
});

// Pivot Data Endpoint (Aggregated for Performance - Option 2)
app.get('/api/reports/pivot-data', verifyGoogleToken, async (req, res) => {
  try {
    const sql = `
      SELECT 
        CAST(sale_date AS DATE) as date,
        location_id,
        category_id,
        description,
        is_service,
        returned,
        SUM(quantity) as quantity,
        SUM(line_total_amount) as amount
      FROM vw_mbo_purchase_line_items
      GROUP BY 1, 2, 3, 4, 5, 6
      ORDER BY 1 DESC
      LIMIT 15000;
    `;
    
    const result = await query(sql);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Pivot Data API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', version: '1.0.8-pivot' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing DB pool...');
  await closeDb();
  process.exit(0);
});
