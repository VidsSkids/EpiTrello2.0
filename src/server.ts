import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import { errorMiddleware } from './middlewares/error.middleware';

config();

const app = express();

// export app so tests can import it without starting the real server
export default app;

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Error handling middleware
app.use(errorMiddleware);

// Start the server only when this file is run directly
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

if (require.main === module) {
    startServer();
}
