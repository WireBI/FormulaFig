import { query, closeDb } from './src/lib/db';
import dotenv from 'dotenv';
dotenv.config();

async function inspectData() {
  try {
    const target = '2026-03-20';
    const r = await query(\`
      SELECT 
        description, 
        is_service, 
        line_total_amount, 
        location_id,
        site_id
      FROM vw_mbo_purchase_line_items 
      WHERE CAST(sale_date AS DATE) = $1
      LIMIT 5
    \`, [target]);
    console.log('---RECORDS_START---');
    console.log(JSON.stringify(r.rows, null, 2));
    console.log('---RECORDS_END---');
  } catch(e) {
    console.error(e);
  } finally {
    await closeDb();
  }
}
inspectData();
