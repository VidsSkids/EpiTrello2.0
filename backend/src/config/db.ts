import mongoose from 'mongoose';

const connectDB = async () => {
    const dbURI = process.env.DATABASE_URL;
    if (!dbURI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }
    try {
        await mongoose.connect(dbURI, {
            serverSelectionTimeoutMS: 1000,
        } as mongoose.ConnectOptions);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

export default connectDB;
