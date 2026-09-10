import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import routes from './routes/index.js';
import { pool } from './database/db.js';

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Health check
app.get(['/api/health', '/edocs/api/health'], async (_req, res) => {
  let dbStatus = 'disconnected';
  try {
    const dbRes = await pool.query('SELECT NOW()');
    if (dbRes.rows.length > 0) dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = 'error: ' + err.message;
  }

  res.json({
    status: 'ok',
    system: 'KU CSC e-Document Request System API',
    version: '1.0.0',
    timestamp: new Date(),
    database: {
      host: config.pg.host,
      database: config.pg.database,
      status: dbStatus,
    },
  });
});

// API Routes (support both /api and /edocs/api)
app.use(['/api', '/edocs/api'], routes);

// Serve Frontend Static Bundle if dist exists
const possibleDistPaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'dist/frontend'),
];
const frontendDist = possibleDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (frontendDist) {
  console.log(`[Static] Serving frontend from: ${frontendDist}`);
  app.use('/edocs', express.static(frontendDist));
  app.get(['/edocs', '/edocs/*'], (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  app.get('/', (_req, res) => res.redirect('/edocs/'));
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    message: err.message || 'เกิดข้อผิดพลาดภายในระบบเซิร์ฟเวอร์',
  });
});

app.listen(config.port, () => {
  console.log(`
  ================================================================
  🌿 KU CSC e-Doc REST API Service
  🚀 Server running on: http://localhost:${config.port}
  🗄️  PostgreSQL Host:  ${config.pg.host}:${config.pg.port} (${config.pg.database})
  🎓 Campus API Base:  ${config.cscApi.baseUrl}
  ================================================================
  `);
});