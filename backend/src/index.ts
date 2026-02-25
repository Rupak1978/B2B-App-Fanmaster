import express from 'express';
import cors from 'cors';
import path from 'path';
import { initializeDatabase } from './db/schema';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', routes);

// Serve frontend build in production
const frontendBuildPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendBuildPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// Initialize database and start server
initializeDatabase();

app.listen(PORT, () => {
  console.log(`CricLive server running on http://localhost:${PORT}`);
});

export default app;
