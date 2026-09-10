import { Pool } from 'pg';
import { config } from '../config/index.js';

export const pool = new Pool({
  host: config.pg.host,
  port: config.pg.port,
  database: config.pg.database,
  user: config.pg.user,
  password: config.pg.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err.message);
});

export const db = {
  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      if (process.env.NODE_ENV === 'development' && duration > 200) {
        console.log('[PostgreSQL Slow Query]', { text, duration, rows: res.rowCount });
      }
      return res;
    } catch (err: any) {
      console.error('[PostgreSQL Query Error]', { text, error: err.message });
      throw err;
    }
  },
  pool,
};

// Also keep inMemoryStore for instant caching and fallback if needed
export const inMemoryStore: {
  [key: string]: any[];
} = {
  users: [],
  documentTypes: [],
  documentPackages: [],
  documentRequests: [],
  packageWhitelist: [],
};