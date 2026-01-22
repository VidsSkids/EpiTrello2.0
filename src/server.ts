import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import { errorMiddleware } from './middlewares/error.middleware';

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: "/auth/google/callback",
        },
        async (_, __, profile, done) => {
            try {
                const email = profile.emails?.[0].value;

                if (!email) {
                    return done(new Error("No email from Google"), undefined);
                }

                // Store minimal profile data on request for use in controller
                return done(null, profile);
            } catch (err) {
                done(err, undefined);
            }
        }
    )
);


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
    try {
        console.log('Connecting to database...');
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}
