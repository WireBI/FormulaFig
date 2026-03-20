import { query, closeDb } from './src/lib/db';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function checkDate() {
  try {
    const r = await query('SELECT MAX(sale_date) as last_date FROM vw_mbo_purchase_line_items');
    const locations = await query('SELECT location_id, name FROM mbo_locations LIMIT 50');
    
    const result = {
      last_date: r.rows[0].last_date,
      locations: locations.rows
    };
    
    fs.writeFileSync('db_check_result.json', JSON.stringify(result, null, 2));
    console.log('Results written to db_check_result.json');
  } catch(e) {
    console.error(e);
  } finally {
    await closeDb();
  }
}
checkDate();
