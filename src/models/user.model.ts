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
        index: true
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

const User = model('User', userSchema);

export default User;
