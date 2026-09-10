import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { authRouter } from './src/api/auth.js';
import { postsRouter } from './src/api/posts.js';
import { recommendationRouter } from './src/api/recommendation.js';
import { seedRouter } from './src/api/seed.js';
import { trustRouter } from './src/api/trust.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/recommendations', recommendationRouter);
app.use('/api/seed', seedRouter);
app.use('/api/trust', trustRouter);

// API Routes will go here
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Trust-Aware API is running' });
});

// Vite / Static file serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'client')));
    app.use('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'client/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
