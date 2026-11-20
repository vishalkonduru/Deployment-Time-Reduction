const request = require('supertest');
const { createApp } = require('../src/app');

async function login(app, username, password) {
  const agent = request.agent(app);
  const response = await agent.post('/api/login').send({ username, password });
  return { agent, response };
}

describe('Authentication and access control', () => {
  test('admin and student can log in with their own credentials', async () => {
    const app = createApp();
    const admin = await login(app, 'admin', 'admin123');
    const student = await login(app, 'student', 'student123');
    expect(admin.response.status).toBe(200);
    expect(admin.response.body.redirect).toBe('/admin');
    expect(student.response.status).toBe(200);
    expect(student.response.body.redirect).toBe('/student');
  });

  test.each([['admin', 'wrong'], ['student', 'admin123'], ['unknown', 'password'], ['', '']])(
    'rejects invalid credentials', async (username, password) => {
      const response = await request(createApp()).post('/api/login').send({ username, password });
      expect(response.status).toBe(401);
    }
  );

  test('unauthenticated users cannot access student APIs', async () => {
    const response = await request(createApp()).get('/api/student/profile');
    expect(response.status).toBe(401);
  });

  test('student cannot access admin APIs', async () => {
    const { agent } = await login(createApp(), 'student', 'student123');
    expect((await agent.get('/api/admin/requests')).status).toBe(403);
  });

  test('admin cannot access student APIs', async () => {
    const { agent } = await login(createApp(), 'admin', 'admin123');
    expect((await agent.get('/api/student/profile')).status).toBe(403);
  });
});

describe('Student and admin request workflow', () => {
  test('student submits a request and admin accepts it with a message', async () => {
    const app = createApp();
    const student = await login(app, 'student', 'student123');
    const admin = await login(app, 'admin', 'admin123');

    const profile = await student.agent.get('/api/student/profile');
    expect(profile.status).toBe(200);
    expect(profile.body.marks.length).toBeGreaterThan(0);
    expect(profile.body.attendance.length).toBeGreaterThan(0);

    const created = await student.agent.post('/api/student/requests').send({
      subject: 'Cloud Computing', reason: 'Please review my marks.',
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('pending');

    const adminList = await admin.agent.get('/api/admin/requests');
    expect(adminList.body).toHaveLength(1);

    const response = await admin.agent.post(`/api/admin/requests/${created.body.id}/respond`).send({
      status: 'accepted', message: 'Your marks have been reviewed.',
    });
    expect(response.status).toBe(200);

    const studentRequests = await student.agent.get('/api/student/requests');
    expect(studentRequests.body[0].status).toBe('accepted');
    expect(studentRequests.body[0].adminMessage).toBe('Your marks have been reviewed.');
  });

  test('admin can reject a request', async () => {
    const app = createApp();
    const student = await login(app, 'student', 'student123');
    const admin = await login(app, 'admin', 'admin123');
    const created = await student.agent.post('/api/student/requests').send({
      subject: 'Web Technology', reason: 'Please recheck my marks.',
    });
    const response = await admin.agent.post(`/api/admin/requests/${created.body.id}/respond`).send({
      status: 'rejected', message: 'The recorded marks are correct.',
    });
    expect(response.body.status).toBe('rejected');
  });
});

test('health endpoint reports the app is ready', async () => {
  const response = await request(createApp()).get('/health');
  expect(response.status).toBe(200);
  expect(response.body.status).toBe('ok');
});
