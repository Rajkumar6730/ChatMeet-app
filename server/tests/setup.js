/**
 * Test Setup
 * Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.CLIENT_URL = 'http://localhost:3000';

const { MongoMemoryServer } = require('mongodb-memory-server');
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
});

afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
});

// Add custom timeout for database operations
jest.setTimeout(10000);

// Mock email service in test environment
jest.mock('../services/emailService', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  verifyTransporter: jest.fn().mockResolvedValue(true)
}));
