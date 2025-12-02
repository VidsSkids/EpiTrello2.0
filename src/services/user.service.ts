import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

import UserModel from '../models/user.model';
import { ConflictError, NotFoundError } from '../errors';

type PlainUser = {
  uuid?: string;
  _id?: { toString: () => string };
  id?: string;
  name?: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function toPlain(user: unknown): PlainUser {
  if (user && typeof user === 'object') {
    const maybe = user as { toObject?: unknown };
    if (typeof maybe.toObject === 'function') {
      return (maybe.toObject as () => PlainUser)();
    }
  }
  return user as PlainUser;
}

export class UserService {
  async createUser(userData: { name: string; password: string }, options: Record<string, unknown> = {}) {
    const { name, password } = userData || {};
    if (!name || !password) throw new Error('Name and password are required');

    const hashed = await bcrypt.hash(password, 10);

    try {
      const user = await UserModel.create({
        uuid: uuidv4(),
        name,
        password: hashed,
        ...options,
      });

      const obj = toPlain(user);
      const publicId = obj.uuid ?? (obj._id ? String(obj._id.toString()) : obj.id ?? '');

      return {
        id: publicId,
        name: obj.name,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
      };
    } catch (err: unknown) {
      const e = err as { code?: number };
      if (e && (e.code === 11000 || e.code === 11001)) {
        throw new ConflictError('Name already taken');
      }
      throw err;
    }
  }

  async validateUser(credentials: { name: string; password: string }) {
    const { name, password } = credentials;
    if (!name || !password) throw new Error('Invalid credentials');

    const user = await UserModel.findOne({ name });
    if (!user) throw new Error('User not found');

    const obj = toPlain(user);
    const storedPassword = obj.password ?? '';
    const match = await bcrypt.compare(password, storedPassword);
    if (!match) throw new Error('Invalid credentials');

    const payload = { id: obj.uuid ?? (obj._id ? String(obj._id.toString()) : obj.id ?? ''), name: obj.name ?? '' };
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    return { token, id: payload.id };
  }

  async deleteUser(id: string) {
    const or: { [k: string]: unknown }[] = [{ uuid: id }];
    if (Types.ObjectId.isValid(id)) or.push({ _id: id });

    const res = await UserModel.findOneAndDelete({ $or: or });
    if (!res) throw new Error('User not found');
  }

  async getUserById(id: string) {
    const or: { [k: string]: unknown }[] = [{ uuid: id }];
    if (Types.ObjectId.isValid(id)) or.push({ _id: id });

    const user = await UserModel.findOne({ $or: or }).select('-password');
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
