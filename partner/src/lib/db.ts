import { Pool } from 'pg';

// Create a connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'kyb_case',
  user: process.env.POSTGRES_USER || 'kyb',
  password: process.env.POSTGRES_PASSWORD || 'kyb_password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
});

export default pool;

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    console.log('🔍 Executing database query:', {
      query: text.substring(0, 100),
      params: params?.map((p) => (typeof p === 'string' ? p.substring(0, 50) : p)),
    });
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('✅ Query executed successfully', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Database query error:', {
      query: text.substring(0, 100),
      params,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

// Helper function to get a client from the pool for transactions
export async function getClient() {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);

  // Monkey patch the query method to keep track of the last query executed
  client.query = ((...args: any[]) => {
    (client as any).lastQuery = args;
    return query.apply(client, args as any);
  }) as any;

  client.release = () => {
    clearTimeout(timeout);
    // Set the methods back to their old un-monkey-patched version
    client.query = query;
    client.release = release;
    return release();
  };

  return client;
}
