import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserService } from '../src/services/user.service';
import request from 'supertest';
import app from '../src/server'; // ensure server.ts now exports the Express app
import UserModel from '../src/models/user.model';
import { ConflictError } from '../src/errors';

describe('Auth / UserService integration', () => {
  let mongoServer: MongoMemoryServer;
  let service: UserService;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {});

    service = new UserService();
  }, 20000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // clear users
    await UserModel.deleteMany({});
  });

  test('registers a new user', async () => {
    const payload = { name: 'alice', password: 'secret123' };
    const user = await service.createUser(payload);

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.name).toBe(payload.name);
    // ensure password is not exposed by the service DTO
    // @ts-ignore
    expect(user.password).toBeUndefined();
  });

  test('enforces unique name (duplicate registration fails)', async () => {
    const payload = { name: 'bob', password: 'password' };
    await service.createUser(payload);

    await expect(service.createUser(payload)).rejects.toBeInstanceOf(ConflictError);
  });

  test('validates user login (correct credentials)', async () => {
    const payload = { name: 'carol', password: 'mypassword' };
    const created = await service.createUser(payload);

    const result = await service.validateUser(payload);
    expect(result).toBeDefined();
    const token = result.token;
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(token as string, secret) as any;
    expect(decoded.name).toBe(payload.name);
    expect(decoded.id).toBe(created.id);
  });

  test('delete user by id removes the user', async () => {
    const payload = { name: 'dave', password: 'pass1234' };
    const created = await service.createUser(payload);

    if (!created.id) throw new Error('Created user has no id');

    await service.deleteUser(created.id);
    const found = await UserModel.findOne({ $or: [{ uuid: created.id }, { _id: created.id }, { id: created.id }] });
    expect(found).toBeNull();
  });

  test('ping protected route returns pong and user info', async () => {
    const payload = { name: 'eve', password: 'strongpass' };
    const created = await service.createUser(payload);

    // get JWT from service (validateUser returns { token, id })
    const { token } = await service.validateUser(payload);
    expect(typeof token).toBe('string');

    const res = await request(app)
      .get('/api/auth/ping')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('message', 'pong');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ id: created.id, name: payload.name });
  });
});
