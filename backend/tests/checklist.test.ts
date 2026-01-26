import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/server';
import { UserService } from '../src/services/user.service';
import ProjectModel from '../src/models/project.model';
import { ProjectColumnModel } from '../src/models/column.model';
import { ProjectCardModel } from '../src/models/card.model';
import UserModel from '../src/models/user.model';

describe('Checklists API', () => {
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
    await ProjectModel.deleteMany({});
    await ProjectColumnModel.deleteMany({});
    await ProjectCardModel.deleteMany({});
    await UserModel.deleteMany({});
  });

  test('create checklist, add item, toggle item and remove checklist', async () => {
    const userPayload = { name: 'checkOwner', password: 'pw' };
    await service.createUser(userPayload);
    const { token } = await service.validateUser(userPayload);

    // create project and column and card
    const pRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Checklist Project' })
      .expect(201);
    const projectId = pRes.body.project.id;

    const cRes = await request(app)
      .post(`/api/projects/${projectId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Backlog' })
      .expect(201);
    const columnId = cRes.body.column._id;

    const cardRes = await request(app)
      .post(`/api/projects/${projectId}/columns/${columnId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Card for checklist' })
      .expect(201);
    const cardId = cardRes.body.newCard._id;

    // create checklist
    const checklistRes = await request(app)
      .post(`/api/projects/${projectId}/columns/${columnId}/cards/${cardId}/checklists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Steps' })
      .expect(201);
    const checklist = checklistRes.body.newChecklist;
    expect(checklist.title).toBe('Steps');

    // add item
    const addItemRes = await request(app)
      .post(`/api/projects/${projectId}/columns/${columnId}/cards/${cardId}/checklists/${checklist._id}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Do something' })
      .expect(201);
    const item = addItemRes.body.newItem;
    expect(item.content).toBe('Do something');
    expect(item.isChecked).toBe(false);

    // toggle item
    const toggleRes = await request(app)
      .patch(`/api/projects/${projectId}/columns/${columnId}/cards/${cardId}/checklists/${checklist._id}/items/${item._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isChecked: true })
      .expect(200);
    expect(toggleRes.body.updatedItem.isChecked).toBe(true);

    // remove checklist
    await request(app)
      .delete(`/api/projects/${projectId}/columns/${columnId}/cards/${cardId}/checklists/${checklist._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });
});
