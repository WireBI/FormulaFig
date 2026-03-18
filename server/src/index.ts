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
      metadata: { executedSql: sql } // Optional for debugging
    });
  } catch (error: any) {
    console.error('Self-Service API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error?.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
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
