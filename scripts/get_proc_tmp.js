import pg from 'pg';
const { Client } = pg;

const regions = [
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'sa-east-1'
];

async function tryRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  console.log(`Trying region ${region} (${host})...`);
  const client = new Client({
    host: host,
    port: 6543,
    user: 'postgres.drvkrpoojyncodfytftn',
    password: 'UelVelura@123',
    database: 'postgres',
    connectionTimeoutMillis: 5000
  });
  
  try {
    await client.connect();
    console.log(`SUCCESS connected to region: ${region}`);
    await client.end();
    return true;
  } catch (err) {
    if (err.message && err.message.includes('not found')) {
      console.log(`  Region ${region}: Tenant not found`);
    } else {
      console.log(`  Region ${region} connected/auth error:`, err.message);
      // If it is another error (like password incorrect or SSL required), it means the tenant WAS found!
      await client.end().catch(() => {});
      return true;
    }
  }
  return false;
}

async function run() {
  for (const region of regions) {
    const ok = await tryRegion(region);
    if (ok) {
      console.log(`Found candidate region: ${region}`);
      break;
    }
  }
}

run().catch(console.error);
