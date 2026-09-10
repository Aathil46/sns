import { calculateUserScores } from './dist/server.js';
// wait, server.js exports nothing. I'll just check the DB logic with a small script
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './dist/client/db/schema.js'; // wait, no.
