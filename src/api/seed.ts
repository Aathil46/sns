import express from 'express';
import { ensureSchema, seedDatabase } from '../db/init.js';

export const seedRouter = express.Router();

seedRouter.post('/run', async (req, res) => {
  try {
    await ensureSchema();
    await seedDatabase();
    res.json({ success: true, message: 'Database seeded with behavioral scenario and scores calculated.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
