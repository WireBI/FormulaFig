import { getFigBarPerformance } from './src/lib/reports/figBar';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const date = '2024-03-18'; // Using a sample date
    console.log(`Testing Fig Bar Performance API for date: ${date}`);
    const metrics = await getFigBarPerformance(date);
    console.log('Metrics retrieved successfully:');
    console.log(JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error('API Test Failed:', error);
  }
}

test();
