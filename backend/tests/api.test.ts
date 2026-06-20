import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient globally before importing the app
jest.mock('@prisma/client', () => {
  const mPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    carbonLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    challenge: {
      findMany: jest.fn(),
    },
    userChallenge: {
      findMany: jest.fn(),
    },
    emissionFactor: {
      findMany: jest.fn(),
    }
  };
  return {
    PrismaClient: jest.fn(() => mPrisma),
  };
});

import app from '../src/index';

const prismaMock = new PrismaClient() as any;

describe('API Route and Controller Testing Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    test('should return 200 and system health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('POST /api/auth/register', () => {
    test('should return 400 for missing registration details', async () => {
      const response = await request(app).post('/api/auth/register').send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing registration details.');
    });

    test('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: 'Password123!', firstName: 'Test', lastName: 'User' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid email address format.');
    });

    test('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@ecotrack.ai', password: '123', firstName: 'Test', lastName: 'User' });
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Password must be at least');
    });

    test('should return 409 if user email already exists', async () => {
      // Mock userRepo findByEmail to return an existing user
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'user_1',
        email: 'exists@ecotrack.ai',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'exists@ecotrack.ai', password: 'StrongPassword123!', firstName: 'Test', lastName: 'User' });
      expect(response.status).toBe(409);
      expect(response.body.error).toContain('User with this email already exists.');
    });

    test('should return 201 on successful registration', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.create.mockResolvedValueOnce({
        id: 'new_user_1',
        email: 'new@ecotrack.ai',
        firstName: 'New',
        lastName: 'User',
        role: 'USER',
      });
      prismaMock.auditLog.create.mockResolvedValueOnce({});

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@ecotrack.ai', password: 'StrongPassword123!', firstName: 'New', lastName: 'User' });
      expect(response.status).toBe(201);
      expect(response.body.message).toContain('User registered successfully.');
      expect(response.body.user.email).toBe('new@ecotrack.ai');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should return 400 for missing credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email and password are required.');
    });

    test('should return 401 for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@ecotrack.ai', password: 'Password123!' });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password.');
    });

    test('should return 401 for incorrect password', async () => {
      const hash = await bcrypt.hash('CorrectPassword123!', 10);
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'user_1',
        email: 'user@ecotrack.ai',
        passwordHash: hash,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@ecotrack.ai', password: 'WrongPassword123!' });
      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password.');
    });

    test('should return 200 and issue token pair on successful login', async () => {
      const hash = await bcrypt.hash('CorrectPassword123!', 10);
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'user_1',
        email: 'user@ecotrack.ai',
        passwordHash: hash,
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'USER',
        country: 'USA',
      });
      prismaMock.refreshToken.create.mockResolvedValueOnce({});
      prismaMock.auditLog.create.mockResolvedValueOnce({});

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@ecotrack.ai', password: 'CorrectPassword123!' });
      
      expect(response.status).toBe(200);
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('user@ecotrack.ai');
    });
  });
});
