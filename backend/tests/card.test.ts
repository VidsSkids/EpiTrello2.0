import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/server';
import { UserService } from '../src/services/user.service';
import ProjectModel from '../src/models/project.model';
import { ProjectColumnModel } from '../src/models/column.model';
import { ProjectCardModel } from '../src/models/card.model';
import UserModel from '../src/models/user.model';

describe('Cards API', () => {
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

  test('create, read, update and delete a card', async () => {
    const userPayload = { name: 'cardOwner', password: 'pw' };
    await service.createUser(userPayload);
    const { token } = await service.validateUser(userPayload);

    // create project
    const pRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Card Project' })
      .expect(201);

    const projectId = pRes.body.project.id;

    // create column
    const cRes = await request(app)
      .post(`/api/projects/${projectId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Do' })
      .expect(201);

    const columnId = cRes.body.column._id;

    // create card
    const cardPayload = { title: 'My Card', description: 'Card desc' };
    const createCardRes = await request(app)
      .post(`/api/projects/${projectId}/columns/${columnId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send(cardPayload)
      .expect(201);

    expect(createCardRes.body).toHaveProperty('newCard');
    const card = createCardRes.body.newCard;
    expect(card.title).toBe(cardPayload.title);

    // fetch card
    const getRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(getRes.body.project.columns[0].cards.length).toBe(1);
    expect(getRes.body.project.columns[0].cards[0].title).toBe(cardPayload.title);

    // update card
    const updatedRes = await request(app)
      .patch(`/api/projects/${projectId}/columns/${columnId}/cards/${card._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Card', description: 'Updated' })
      .expect(200);
    expect(updatedRes.body.updatedCard.title).toBe('Updated Card');

    // delete card
    await request(app)
      .delete(`/api/projects/${projectId}/columns/${columnId}/cards/${card._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const found = await ProjectCardModel.findOne({ _id: card._id });
    expect(found).toBeNull();
  });
});
