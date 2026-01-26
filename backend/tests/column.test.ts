import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserService } from '../src/services/user.service';
import request from 'supertest';
import app from '../src/server'; // ensure server.ts now exports the Express app
import UserModel from '../src/models/user.model';

describe('Column / Project integration', () => {
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

  // Try column creation test
  test('creates a new column in a project', async () => {
        const payload = { name: 'owner1', password: 'pass1234' };
        const created = await service.createUser(payload);
        const { token } = await service.validateUser(payload);

        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'My Project' })
            .expect(201);

        expect(res.body).toHaveProperty('project');
        expect(res.body.project).toHaveProperty('id');
        expect(res.body.project.ownerId).toBe(created.id);

        const projectId = res.body.project.id;
        const columnRes = await request(app)
            .post(`/api/projects/${projectId}/columns`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'To Do' })
            .expect(201);
        expect(columnRes.body).toHaveProperty('column');
        expect(columnRes.body.column).toHaveProperty('name', 'To Do');
    });

    test('renames an existing column in a project', async () => {
        const payload = { name: 'owner2', password: 'pass5678' };
        await service.createUser(payload);
        const { token } = await service.validateUser(payload);
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Another Project' })
            .expect(201);
        const projectId = res.body.project.id;
        const columnRes = await request(app)
            .post(`/api/projects/${projectId}/columns`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'In Progress' })
            .expect(201);
        const columnId = columnRes.body.column._id;
        const renameRes = await request(app)
            .patch(`/api/projects/${projectId}/columns/${columnId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Ongoing' })
            .expect(200);
        expect(renameRes.body).toHaveProperty('name', 'Ongoing');
    });

    test('deletes a column from a project', async () => {
        const payload = { name: 'owner3', password: 'pass91011' };
        await service.createUser(payload);
        const { token } = await service.validateUser(payload);
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Third Project' })
            .expect(201);
        const projectId = res.body.project.id;
        const columnRes = await request(app)
            .post(`/api/projects/${projectId}/columns`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Done' })
            .expect(201);
        const columnId = columnRes.body.column._id;
        await request(app)
            .delete(`/api/projects/${projectId}/columns/${columnId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        // Verify deletion by trying to rename the deleted column by getting the project and checking columns
        const projectRes = await request(app)
            .get(`/api/projects/${projectId}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(projectRes.body.project.columns.find((col: any) => col._id === columnId)).toBeUndefined();
    });

    test('reorders columns in a project', async () => {
        const payload = { name: 'owner4', password: 'pass1213' };
        await service.createUser(payload);
        const { token } = await service.validateUser(payload);
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Fourth Project' })
            .expect(201);
        const projectId = res.body.project.id;
        const col1Res = await request(app)
            .post(`/api/projects/${projectId}/columns`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Backlog' })
            .expect(201);
        const col2Res = await request(app)
            .post(`/api/projects/${projectId}/columns`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Sprint' })
            .expect(201);
        const col1Id = col1Res.body.column._id;
        const col2Id = col2Res.body.column._id;
        const reorderRes = await request(app)
            .patch(`/api/projects/${projectId}/columns/${col2Id}/reorder`)
            .set('Authorization', `Bearer ${token}`)
            .send({ newIndex: 0 })
            .expect(200);
        expect(reorderRes.body).toHaveProperty('reorderedColumn');
        expect(reorderRes.body.reorderedColumn[0]._id).toBe(col2Id);
        expect(reorderRes.body.reorderedColumn[1]._id).toBe(col1Id);
    });
});
