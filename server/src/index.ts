import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { buildQuery } from './lib/queryBuilder';
import { query, closeDb } from './lib/db';
import { verifyGoogleToken } from './middleware/auth';
import { getFigBarPerformance } from './lib/reports/figBar';

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
        CAST(v.sale_date AS DATE) as date,
        TO_CHAR(v.sale_date, 'YYYY-MM') as year_month,
        EXTRACT(YEAR FROM v.sale_date) as year,
        EXTRACT(MONTH FROM v.sale_date) as month,
        COALESCE(l.name, 'Unknown Location') as location,
        COALESCE(c.category_name, 'Unknown Category') as category,
        v.description,
        CASE WHEN v.is_service THEN 'True' ELSE 'False' END as is_service,
        v.returned,
        SUM(v.quantity) as quantity,
        SUM(v.line_total_amount) as amount
      FROM vw_mbo_purchase_line_items v
      LEFT JOIN mbo_locations l ON v.location_id = l.location_id AND v.site_id = l.site_id
      LEFT JOIN mbo_site_categories c ON v.category_id = c.category_id AND v.site_id = c.site_id
      GROUP BY 1, 2, 3, 4, 5, 6, 7, 8, 9
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

// Fig Bar Daily Performance Endpoint
app.get('/api/reports/fig-bar-performance', verifyGoogleToken, async (req, res) => {
  try {
    const date = req.query.date as string;
    const locationId = req.query.locationId as string;
    const metrics = await getFigBarPerformance(date, locationId);
    res.json(metrics);
  } catch (error: any) {
    console.error('Fig Bar API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Locations Endpoint
app.get('/api/locations', verifyGoogleToken, async (req, res) => {
  try {
    const result = await query('SELECT location_id, name FROM mbo_locations ORDER BY name ASC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Locations API Error:', error);
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
