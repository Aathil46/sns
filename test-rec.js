import { createClient } from '@libsql/client';
import { db } from './dist/client/db/index.js'; 
// wait, can't easily import db from server because it needs env setup and paths are complicated
// I will just use curl with standard login flow
