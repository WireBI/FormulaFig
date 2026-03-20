const { query, closeDb } = require('./dist/lib/db');
require('dotenv').config();

async function inspectData() {
  try {
    const target = '2026-03-20';
    console.log('Inspecting for:', target);
    
    // Check if we can find any records first
    const countRes = await query('SELECT COUNT(*) FROM vw_mbo_purchase_line_items WHERE CAST(sale_date AS DATE) = $1', [target]);
    console.log('Record count for today:', countRes.rows[0].count);

    if (parseInt(countRes.rows[0].count) > 0) {
      const r = await query(`
        SELECT 
          description, 
          is_service, 
          line_total_amount, 
          location_id,
          site_id
        FROM vw_mbo_purchase_line_items 
        WHERE CAST(sale_date AS DATE) = $1
        LIMIT 5
      `, [target]);
      console.log('---RECORDS_START---');
      console.log(JSON.stringify(r.rows, null, 2));
      console.log('---RECORDS_END---');
    }

    const locs = await query('SELECT location_id, name FROM mbo_locations LIMIT 10');
    console.log('---LOCATIONS_START---');
    console.log(JSON.stringify(locs.rows, null, 2));
    console.log('---LOCATIONS_END---');

  } catch(e) {
    console.error('FAILED:', e.message);
  } finally {
    await closeDb();
  }
}
inspectData();
