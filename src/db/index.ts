import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve db file path.
// In development, the root is the current directory.
// In production, __dirname is dist/ (since this is compiled to dist/server.js).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, '../local.db')
  : path.resolve(process.cwd(), 'local.db');

export const sqlite = createClient({ url: `file:${dbPath}` });
export const db = drizzle(sqlite, { schema });
