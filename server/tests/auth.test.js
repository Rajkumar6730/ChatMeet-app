/**
 * Authentication API Tests
 * Tests for register, login, logout, and token refresh endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');
const User = require('../models/User');

describe('Authentication Endpoints', () => {
  let app;
  let token;
  let refreshToken;
  let userId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    // Clear database
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    // Uncomment to disconnect after tests
    // await mongoose.disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPassword123!',
          phoneNumber: '+1234567890'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('_id');
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');

      userId = res.body.data.user._id;
      token = res.body.data.token;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject weak password', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'weak', // Too weak
          phoneNumber: '+1234567891'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate email', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/register')
        .send({
          username: 'testuser3',
          email: 'test@example.com', // Already registered
          password: 'TestPassword123!',
          phoneNumber: '+1234567892'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Email already registered');
    });

    it('should reject missing required fields', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/register')
        .send({
          username: 'testuser4'
          // Missing other required fields
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.status).toBe('online');
      
      // Update tokens for subsequent tests
      token = res.body.data.token;
      refreshToken = res.body.data.refreshToken;
    });

    it('should reject invalid email', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should reject wrong password', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing credentials', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: refreshToken
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'invalid_token'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject without token', async () => {
      const res = await request(require('../server.js'))
        .post('/api/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      // First login to get a valid token
      const loginRes = await request(require('../server.js'))
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!'
        });

      const currentToken = loginRes.body.data.token;

      const res = await request(require('../server.js'))
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${currentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('_id');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('should reject without token', async () => {
      const res = await request(require('../server.js'))
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
