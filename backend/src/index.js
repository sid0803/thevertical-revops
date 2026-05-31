// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route Imports
import { fileURLToPath } from 'url';
import path from 'path';
import authRouter from './routes/auth.js';
import leadsRouter from './routes/leads.js';
import usersRouter from './routes/users.js';
import billingRouter from './routes/billing.js';
import splitRouter from './routes/splitMapping.js';
import dashboardRouter from './routes/dashboard.js';
import proposalsRouter from './routes/proposals.js';
import targetsRouter from './routes/targets.js';
import clientsRouter from './routes/clients.js';
import tasksRouter from './routes/tasks.js';
import filesRouter from './routes/files.js';
import companyProfileRouter from './routes/companyProfile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Routes Mount
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/users', usersRouter);
app.use('/api/billing', billingRouter);
app.use('/api/split', splitRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/proposals', proposalsRouter);
app.use('/api/targets', targetsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/files', filesRouter);
app.use('/api/company-profile', companyProfileRouter);

// Health Check
app.get('/api/health', (req, res) => {
  return res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Express server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
