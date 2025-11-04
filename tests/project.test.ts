import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../src/server';
import { UserService } from '../src/services/user.service';
import ProjectModel from '../src/models/project.model';
import UserModel from '../src/models/user.model';

describe('Projects API', () => {
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
    await UserModel.deleteMany({});
  });

  test('create project -> owner is set', async () => {
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
  });

  test('invite by name and accept invitation', async () => {
    const ownerPayload = { name: 'owner2', password: 'pw' };
    const inviteePayload = { name: 'invitee', password: 'pw2' };

    await service.createUser(ownerPayload);
    const invitee = await service.createUser(inviteePayload);

    const { token: ownerToken } = await service.validateUser(ownerPayload);
    const { token: inviteeToken } = await service.validateUser(inviteePayload);

    // create project
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Project Invite' })
      .expect(201);

    const projectId = createRes.body.project.id;

    // invite by name
    const inviteRes = await request(app)
      .post(`/api/projects/${projectId}/invite`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: invitee.name })
      .expect(200);

    expect(inviteRes.body).toHaveProperty('message', 'Invitation sent');

    // accept invitation as invitee
    const acceptRes = await request(app)
      .post(`/api/projects/${projectId}/accept`)
      .set('Authorization', `Bearer ${inviteeToken}`)
      .expect(200);

    expect(acceptRes.body).toHaveProperty('message', 'Invitation accepted');

    // fetch project and assert member exists with Reader role
    const getRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const members = getRes.body.project.members as Array<{ userId: string; role: string }>;
    const found = members.find(m => m.userId === invitee.id);
    expect(found).toBeDefined();
    expect(found!.role).toBe('Reader');
  });

  test('owner can change role to Administrator and admin cannot demote another admin', async () => {
    const ownerPayload = { name: 'owner3', password: 'pw' };
    const aPayload = { name: 'alice', password: 'pwA' };
    const bPayload = { name: 'bob', password: 'pwB' };

    await service.createUser(ownerPayload);
    const alice = await service.createUser(aPayload);
    const bob = await service.createUser(bPayload);

    const { token: ownerToken } = await service.validateUser(ownerPayload);
    const { token: aliceToken } = await service.validateUser(aPayload);
    const { token: bobToken } = await service.validateUser(bPayload);

    // owner creates project
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Project Roles' })
      .expect(201);

    const projectId = createRes.body.project.id;

    // invite and accept alice and bob
    await request(app).post(`/api/projects/${projectId}/invite`).set('Authorization', `Bearer ${ownerToken}`).send({ name: alice.name }).expect(200);
    await request(app).post(`/api/projects/${projectId}/invite`).set('Authorization', `Bearer ${ownerToken}`).send({ name: bob.name }).expect(200);

    await request(app).post(`/api/projects/${projectId}/accept`).set('Authorization', `Bearer ${aliceToken}`).expect(200);
    await request(app).post(`/api/projects/${projectId}/accept`).set('Authorization', `Bearer ${bobToken}`).expect(200);

    // owner promotes both to Administrator
    await request(app)
      .patch(`/api/projects/${projectId}/members/${alice.id}/role`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'Administrator' })
      .expect(200);

    await request(app)
      .patch(`/api/projects/${projectId}/members/${bob.id}/role`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ role: 'Administrator' })
      .expect(200);

    // alice (administrator) attempts to demote bob -> should be forbidden
    await request(app)
      .patch(`/api/projects/${projectId}/members/${bob.id}/role`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ role: 'Reader' })
      .expect(403);
  });

  test('deleting a project removes it from the database', async () => {
    const ownerPayload = { name: 'owner4', password: 'pw' };
    await service.createUser(ownerPayload);
    const { token: ownerToken } = await service.validateUser(ownerPayload);
    // owner creates project
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Project To Delete' })
      .expect(201);

    const projectId = createRes.body.project.id;
    // delete project
    await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    // verify project no longer exists
    const found = await ProjectModel.findOne({ uuid: projectId });
    expect(found).toBeNull();
  });

  test('getting all projects for a user', async () => {
    const ownerPayload = { name: 'owner5', password: 'pw' };
    await service.createUser(ownerPayload);
    const { token: ownerToken } = await service.validateUser(ownerPayload);
    // owner creates multiple projects
    const projectNames = ['Project A', 'Project B', 'Project C'];
    for (const name of projectNames) {
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name })
        .expect(201);
    }
    // get all projects
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('projects');
    expect(res.body.projects.length).toBe(3);
    const returnedNames = res.body.projects.map((p: any) => p.name);
    expect(returnedNames).toEqual(expect.arrayContaining(projectNames));
  });

  test('non-owner cannot delete project', async () => {
    const ownerPayload = { name: 'owner6', password: 'pw' };
    const otherPayload = { name: 'otherUser', password: 'pw2' };
    await service.createUser(ownerPayload);
    const otherUser = await service.createUser(otherPayload);
    const { token: ownerToken } = await service.validateUser(ownerPayload);
    const { token: otherToken } = await service.validateUser(otherPayload);
    // owner creates project
    const createRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Project Not Deletable' })
      .expect(201);

    // add otherUser as member
    await request(app)
      .post(`/api/projects/${createRes.body.project.id}/invite`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: otherUser.name })
      .expect(200);
    await request(app)
      .post(`/api/projects/${createRes.body.project.id}/accept`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);

    const projectId = createRes.body.project.id;
    // other user attempts to delete project
    await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
    // verify project still exists
    const found = await ProjectModel.findOne({ uuid: projectId });
    expect(found).toBeDefined();
  });

  describe('Project Members', () => {
    test('add member to project', async () => {
      const ownerPayload = { name: 'owner9', password: 'pw' };
      const inviteePayload = { name: 'invitee9', password: 'pw2' };
      await service.createUser(ownerPayload);
      const invitee = await service.createUser(inviteePayload);
      const { token: ownerToken } = await service.validateUser(ownerPayload);
      const { token: inviteeToken } = await service.validateUser(inviteePayload);
      // owner creates project
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Project Members' })
        .expect(201);
      const projectId = createRes.body.project.id;
      // owner invites invitee
      await request(app)
        .post(`/api/projects/${projectId}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: invitee.name })
        .expect(200);
      // invitee accepts invitation
      await request(app)
        .post(`/api/projects/${projectId}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);
      // verify invitee is a member of the project
      const getRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      const members = getRes.body.project.members as Array<{ userId: string; role: string }>;
      const found = members.find(m => m.userId === invitee.id);
      expect(found).toBeDefined();
    });

    test('get invitations for a user', async () => {
      const ownerPayload = { name: 'owner7', password: 'pw' };
      const inviteePayload = { name: 'invitee7', password: 'pw2' };
      await service.createUser(ownerPayload);
      const invitee = await service.createUser(inviteePayload);
      const { token: ownerToken } = await service.validateUser(ownerPayload);
      const { token: inviteeToken } = await service.validateUser(inviteePayload);
      // owner creates project
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Project Invitations' })
        .expect(201);
      const projectId = createRes.body.project.id;
      // owner invites invitee
      await request(app)
        .post(`/api/projects/${projectId}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: invitee.name })
        .expect(200);
      // invitee fetches invitations
      const res = await request(app)
        .get('/api/projects/invitations')
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('invitations');
      expect(res.body.invitations.length).toBe(1);
      expect(res.body.invitations[0]).toHaveProperty('projectId', projectId);
    });

    test("get sent invitations by owner", async () => {
      const ownerPayload = { name: 'owner13', password: 'pw' };
      const inviteePayload = { name: 'invitee13', password: 'pw2' };
      await service.createUser(ownerPayload);
      const invitee = await service.createUser(inviteePayload);
      const { token: ownerToken } = await service.validateUser(ownerPayload);
      await service.validateUser(inviteePayload);
      // owner creates project
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Project Sent Invitations' })
        .expect(201);
      const projectId = createRes.body.project.id;
      // owner invites invitee
      await request(app)
        .post(`/api/projects/${projectId}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: invitee.name })
        .expect(200);
      // owner fetches sent invitations
      const res = await request(app)
        .get('/api/projects/sent')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(res.body).toHaveProperty('invitations');
      expect(res.body.invitations.length).toBe(1);
      expect(res.body.invitations[0]).toHaveProperty('projectId', projectId);
    });

    test('remove member from project', async () => {
      const ownerPayload = { name: 'owner10', password: 'pw' };
      const memberPayload = { name: 'member10', password: 'pw2' };
      await service.createUser(ownerPayload);
      const member = await service.createUser(memberPayload);
      const { token: ownerToken } = await service.validateUser(ownerPayload);
      const { token: memberToken } = await service.validateUser(memberPayload);
      // owner creates project
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Project Remove Member' })
        .expect(201);
      const projectId = createRes.body.project.id;
      // owner invites member
      await request(app)
        .post(`/api/projects/${projectId}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: member.name })
        .expect(200);
      // member accepts invitation
      await request(app)
        .post(`/api/projects/${projectId}/accept`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);
      // owner removes member
      await request(app)
        .post(`/api/projects/${projectId}/remove/${member.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      // verify member is no longer part of the project
      const getRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      const members = getRes.body.project.members as Array<{ userId: string; role: string }>;
      const found = members.find(m => m.userId === member.id);
      expect(found).toBeUndefined();
    });

    test('invited user can decline invitation', async () => {
      const ownerPayload = { name: 'owner8', password: 'pw' };
      const inviteePayload = { name: 'invitee8', password: 'pw2' };
      await service.createUser(ownerPayload);
      const invitee = await service.createUser(inviteePayload);
      const { token: ownerToken } = await service.validateUser(ownerPayload);
      const { token: inviteeToken } = await service.validateUser(inviteePayload);
      // owner creates project
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Project Decline' })
        .expect(201);
      const projectId = createRes.body.project.id;
      // owner invites invitee
      await request(app)
        .post(`/api/projects/${projectId}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: invitee.name })
        .expect(200);

      // invitee declines invitation
      const declineRes = await request(app)
        .post(`/api/projects/${projectId}/decline`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);
      expect(declineRes.body).toHaveProperty('message', 'Invitation declined');

      // verify invitee is not a member of the project
      const getRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      const members = getRes.body.project.members as Array<{ userId: string; role: string }>;
      const found = members.find(m => m.userId === invitee.id);
      expect(found).toBeUndefined();
    });

    test('owner can revoke invitation', async () => {
      const ownerPayload = { name: 'owner11', password: 'pw' };
      const inviteePayload = { name: 'invitee11', password: 'pw2' };
      await service.createUser(ownerPayload);
      const invitee = await service.createUser(inviteePayload);
      const { token: ownerToken } = await service.validateUser(ownerPayload);
      const { token: inviteeToken } = await service.validateUser(inviteePayload);
      // owner creates project
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Project Revoke Invitation' })
        .expect(201);
      const projectId = createRes.body.project.id;
      // owner invites invitee
      await request(app)
        .post(`/api/projects/${projectId}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: invitee.name })
        .expect(200);
      // owner revokes invitation
      const revokeRes = await request(app)
        .post(`/api/projects/${projectId}/revokeInvitation`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: invitee.name })
        .expect(200);
      expect(revokeRes.body).toHaveProperty('message', 'Invitation revoked');
      // invitee attempts to accept invitation -> should fail
      const acceptRes = await request(app)
        .post(`/api/projects/${projectId}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(404);
      expect(acceptRes.body).toHaveProperty('message', 'Invitation not found');
    });

    test('member can leave project', async () => {
      const ownerPayload = { name: 'owner12', password: 'pw' };
      const memberPayload = { name: 'member12', password: 'pw2' };
      await service.createUser(ownerPayload);
      const member = await service.createUser(memberPayload);
      const { token: ownerToken } = await service.validateUser(ownerPayload);
      const { token: memberToken } = await service.validateUser(memberPayload);

      // owner creates project
      const createRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Project Leave' })
        .expect(201);
      const projectId = createRes.body.project.id;
      // owner invites member
      await request(app)
        .post(`/api/projects/${projectId}/invite`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: member.name })
        .expect(200);

      // member accepts invitation
      await request(app)
        .post(`/api/projects/${projectId}/accept`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      // member leaves project
      const leaveRes = await request(app)
        .post(`/api/projects/${projectId}/leave`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);
      expect(leaveRes.body).toHaveProperty('message', 'Left the project');
      // verify member is no longer part of the project
      const getRes = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      const members = getRes.body.project.members as Array<{ userId: string; role: string }>;
      const found = members.find(m => m.userId === member.id);
      expect(found).toBeUndefined();
    });
  });
});
