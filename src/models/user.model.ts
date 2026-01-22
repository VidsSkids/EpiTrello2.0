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
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: false
    },
    provider: {
        type: String,
        required: true,
        enum: ['local', 'google'],
        default: 'local'
    },
    providerId: {
        type: String,
        required: false
    }
}, { timestamps: true });

const User = model('User', userSchema);

export default User;
