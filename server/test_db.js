
const { Client } = require('pg');

const connectionString = 'postgresql://WireBIAPP:*l-F[-H(rE+Ht&3@34.130.96.185:5432/postgres?sslmode=require';

async function testConnection() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');
    
    const res = await client.query('SELECT current_user, current_database(), version()');
    console.log('Query Result:', res.rows[0]);
    
    await client.end();
    console.log('Connection closed.');
  } catch (err) {
    console.error('Connection failed:');
    console.error(err.message);
    if (err.detail) console.error('Detail:', err.detail);
    if (err.code) console.error('Code:', err.code);
    process.exit(1);
  }
}

testConnection();
