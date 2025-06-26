import { Pool, PoolConfig, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration from environment variables
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'azure_b2c_auth',
  user: process.env.DB_USER || 'azure_b2c_user',
  password: process.env.DB_PASSWORD || 'secure_password',
  
  // Connection pool settings for performance
  max: 20,                      // Maximum number of connections
  idleTimeoutMillis: 30000,     // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Timeout for new connections
};

// Create connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection on startup
const testConnection = async (): Promise<void> => {
  try {
    const client: PoolClient = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();
  } catch (err) {
    console.error('❌ Error connecting to database:', err);
    process.exit(-1);
  }
};

// Initialize connection test
testConnection();

// Export database interface
export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
  end: () => pool.end(),
}; 