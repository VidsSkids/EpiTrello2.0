import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/server';
import { UserService } from '../src/services/user.service';
import { ProjectTagModel } from '../src/models/tag.model';

describe('Project Tags API', () => {
  let mongoServer: MongoMemoryServer;
  let service: UserService;
  let projectId: string; // <── store project ID here
  let token: string;
  let cardId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {});
    service = new UserService();

    // create user
    const userPayload = { name: 'projOwner', password: 'pw' };
    await service.createUser(userPayload);
    const res = await service.validateUser(userPayload);
    token = res.token;

    // create a project
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project' })
      .expect(201);
    projectId = projectRes.body.project.id; // <── store project ID for all tests

    const columRes = await request(app)
      .post(`/api/projects/${projectId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Do' })
      .expect(201);
    const columnId = columRes.body.column._id;

    // create a card to test tag removal from cards
    const cardRes = await request(app)
      .post(`/api/projects/${projectId}/columns/${columnId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Card for Tags', description: 'Testing tags on this card' })
      .expect(201);
    cardId = cardRes.body.newCard._id;
  }, 20000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('create, list, update and delete tag (protected)', async () => {

    // create tag
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/tags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'urgent', color: '#ff0000' })
      .expect(201);

    const tag = createRes.body.newTag;

    expect(tag).toHaveProperty('_id');
    expect(tag.name).toBe('urgent');
    expect(tag.color).toBe('#ff0000');

    // update tag
    const updateRes = await request(app)
      .patch(`/api/projects/${projectId}/tags/${tag._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'not-urgent', color: '#00ff00' })
      .expect(200);

    expect(updateRes.body.updatedTag.name).toBe('not-urgent');
    expect(updateRes.body.updatedTag.color).toBe('#00ff00');

    // delete tag
    await request(app)
      .delete(`/api/projects/${projectId}/tags/${tag._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const found = await ProjectTagModel.findOne({ _id: tag._id });
    expect(found).toBeNull();
  });

  test('creating duplicate tag name should conflict (if enforced)', async () => {
    // create first tag
    await request(app)
      .post(`/api/projects/${projectId}/tags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'dup', color: '#000' })
      .expect(201);

    // duplicate name
    const res = await request(app)
      .post(`/api/projects/${projectId}/tags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'dup', color: '#111' });

    // should be conflict or bad request
    expect([400, 409]).toContain(res.status);
  });

  test('deleting a tag removes it from cards', async () => {
    // create tag
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/tags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'card-tag', color: '#123456' })
      .expect(201);
    const tag = createRes.body.newTag;

    // assign tag to card
    await request(app)
      .post(`/api/projects/${projectId}/tags/attach/${tag._id}/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // delete tag
    await request(app)
      .delete(`/api/projects/${projectId}/tags/${tag._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    // fetch project and verify tag removed from card
    const projectRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const project = projectRes.body.project;
    let tagFoundOnCard = false;
    for (const column of project.columns) {
      for (const card of column.cards || []) {
        if (card._id === cardId) {
          if (card.tagIds.includes(tag._id)) {
            tagFoundOnCard = true;
          }
        }
      }
    }
    expect(tagFoundOnCard).toBe(false);
  });

  test('assign and remove tag from card', async () => {
    // create tag
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/tags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'temp-tag', color: '#654321' })
      .expect(201);
    const tag = createRes.body.newTag;
    // assign tag to card
    await request(app)
      .post(`/api/projects/${projectId}/tags/attach/${tag._id}/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    // remove tag from card
    await request(app)
      .post(`/api/projects/${projectId}/tags/detach/${tag._id}/${cardId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // fetch project and verify tag removed from card
    const projectRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const project = projectRes.body.project;
    let tagFoundOnCard = false;
    for (const column of project.columns) {
      for (const card of column.cards || []) {
        if (card._id === cardId) {
          if (card.tagIds.includes(tag._id)) {
            tagFoundOnCard = true;
          }
        }
      }
    }
    expect(tagFoundOnCard).toBe(false);
  });
});
