const path = require('path');
const express = require('express');
const session = require('express-session');
const { USERS, createStore } = require('./data');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MAX_TEXT_LENGTH = 500;

function createApp() {
  const app = express();
  const store = createStore();

  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-only-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    })
  );

  const requireRole = (role) => (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in' });
    }
    if (req.session.user.role !== role) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };

  const sendPage = (role, file) => (req, res) => {
    const user = req.session.user;
    if (!user || user.role !== role) {
      return res.redirect('/');
    }
    res.sendFile(path.join(PUBLIC_DIR, 'pages', file));
  };

  const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

  app.use('/assets', express.static(path.join(PUBLIC_DIR, 'assets')));

  app.get('/', (req, res) => {
    const user = req.session.user;
    if (user) {
      return res.redirect(user.role === 'admin' ? '/admin' : '/student');
    }
    res.sendFile(path.join(PUBLIC_DIR, 'pages', 'login.html'));
  });

  app.get('/student', sendPage('student', 'student.html'));
  app.get('/admin', sendPage('admin', 'admin.html'));
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.post('/api/login', (req, res) => {
    const username = cleanText(req.body.username);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = USERS.find((u) => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not start session' });
      }
      req.session.user = { username: user.username, role: user.role, name: user.name };
      res.json({ role: user.role, redirect: user.role === 'admin' ? '/admin' : '/student' });
    });
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get('/api/me', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Please log in' });
    }
    res.json(req.session.user);
  });

  app.get('/api/student/profile', requireRole('student'), (req, res) => {
    const { username, name } = req.session.user;
    const data = store.students[username];
    res.json({ name, marks: data.marks, attendance: data.attendance });
  });

  app.get('/api/student/requests', requireRole('student'), (req, res) => {
    const mine = store.requests.filter((r) => r.student === req.session.user.username);
    res.json(mine.slice().reverse());
  });

  app.post('/api/student/requests', requireRole('student'), (req, res) => {
    const { username } = req.session.user;
    const subject = cleanText(req.body.subject);
    const reason = cleanText(req.body.reason);
    const knownSubjects = store.students[username].marks.map((m) => m.subject);

    if (!knownSubjects.includes(subject)) {
      return res.status(400).json({ error: 'Please choose a valid subject' });
    }
    if (!reason || reason.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: `Reason is required (max ${MAX_TEXT_LENGTH} characters)` });
    }

    const newRequest = {
      id: store.nextRequestId++,
      student: username,
      studentName: req.session.user.name,
      subject,
      reason,
      status: 'pending',
      adminMessage: '',
      createdAt: new Date().toISOString(),
      respondedAt: null,
    };
    store.requests.push(newRequest);
    res.status(201).json(newRequest);
  });

  app.get('/api/admin/requests', requireRole('admin'), (req, res) => {
    res.json(store.requests.slice().reverse());
  });

  app.post('/api/admin/requests/:id/respond', requireRole('admin'), (req, res) => {
    const target = store.requests.find((r) => r.id === Number(req.params.id));
    if (!target) {
      return res.status(404).json({ error: 'Request not found' });
    }
    if (target.status !== 'pending') {
      return res.status(409).json({ error: 'Request has already been answered' });
    }

    const status = req.body.status;
    const message = cleanText(req.body.message);
    if (status !== 'accepted' && status !== 'rejected') {
      return res.status(400).json({ error: 'Status must be accepted or rejected' });
    }
    if (message.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({ error: `Message is too long (max ${MAX_TEXT_LENGTH} characters)` });
    }

    target.status = status;
    target.adminMessage = message;
    target.respondedAt = new Date().toISOString();
    res.json(target);
  });

  return app;
}

module.exports = { createApp };
