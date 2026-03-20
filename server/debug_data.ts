import { query, closeDb } from './src/lib/db';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function debugData() {
  try {
    console.log('--- DB DEBUG START ---');
    
    // 1. Check a sample of dates and locations in the view
    const statsRes = await query(`
      SELECT 
        CAST(sale_date AS DATE) as sale_date,
        location_id,
        COUNT(*) as record_count,
        SUM(line_total_amount) as total_rev
      FROM vw_mbo_purchase_line_items
      GROUP BY 1, 2
      ORDER BY 1 DESC
      LIMIT 20
    `);
    
    // 2. Check if memberships exist
    const memberRes = await query(`
      SELECT description, COUNT(*) 
      FROM vw_mbo_purchase_line_items 
      WHERE LOWER(description) LIKE '%membership%' 
      GROUP BY 1 LIMIT 10
    `);

    // 3. Check locations
    const locRes = await query('SELECT location_id, name FROM mbo_locations');

    const debugResult = {
      recent_data: statsRes.rows,
      membership_samples: memberRes.rows,
      locations: locRes.rows
    };
    
    fs.writeFileSync('debug_db_data.json', JSON.stringify(debugResult, null, 2));
    console.log('Debug data written to debug_db_data.json');
  } catch(e) {
    console.error('Debug failed:', e);
  } finally {
    await closeDb();
  }
}
debugData();
