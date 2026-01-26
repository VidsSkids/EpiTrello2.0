import { Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new Schema({
    id: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        unique: true,
        sparse: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String,
    },
    provider: {
        type: String,
        required: true,
        enum: ['local', 'google'],
        default: 'local'
    },
    providerId: {
        type: String,
    }
}, { timestamps: true });

const User = model('User', userSchema);

export default User;
