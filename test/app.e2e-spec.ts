import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { UserType } from 'generated/prisma';

const prismaMock = {
  speciality: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  role: { findMany: jest.fn() },
  permission: { findMany: jest.fn() },
  $transaction: jest.fn((arg: any) => {
    if (typeof arg === 'function') return arg(prismaMock);
    return Promise.all(arg);
  }),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

describe('Doki API (integration)', () => {
  let app: INestApplication<App>;
  const rawPassword = 'secret123';
  let passwordHash = '';

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(rawPassword, 10);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('base module wiring', () => {
    it('boots the whole application graph', () => {
      expect(app).toBeDefined();
    });
  });

  describe('GET /specialities', () => {
    it('returns a paginated list (200)', async () => {
      prismaMock.speciality.findMany.mockResolvedValue([]);
      prismaMock.speciality.count.mockResolvedValue(0);

      const res = await request(app.getHttpServer())
        .get('/specialities')
        .expect(200);

      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toMatchObject({
        total: 0,
        page: 1,
        limit: 10,
        lastPage: 0,
      });
    });

    it('rejects an invalid page with 400 (validation pipe)', async () => {
      await request(app.getHttpServer())
        .get('/specialities?page=0')
        .expect(400);
    });
  });

  describe('GET /specialities/:id', () => {
    it('returns 404 when the speciality does not exist', async () => {
      prismaMock.speciality.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/specialities/999')
        .expect(404);
    });

    it('rejects a non-numeric id with 400 (ParseIntPipe)', async () => {
      await request(app.getHttpServer())
        .get('/specialities/abc')
        .expect(400);
    });
  });

  describe('POST /specialities', () => {
    const validBody = {
      name: 'Cardiologie',
      consultationPrice: 5000,
      consultationDuration: 30,
      planMonthAmount: 10000,
      numberOfTimePlanReservation: 4,
    };

    it('creates a speciality (201)', async () => {
      prismaMock.speciality.findFirst.mockResolvedValue(null);
      prismaMock.speciality.create.mockImplementation(({ data }: any) => ({
        specialityId: 1,
        ...data,
      }));

      const res = await request(app.getHttpServer())
        .post('/specialities')
        .send(validBody)
        .expect(201);

      expect(res.body).toMatchObject({ specialityId: 1, name: 'Cardiologie' });
      expect(prismaMock.speciality.create).toHaveBeenCalledTimes(1);
    });

    it('returns 409 when the name already exists', async () => {
      prismaMock.speciality.findFirst.mockResolvedValue({
        specialityId: 1,
        name: 'Cardiologie',
      });

      await request(app.getHttpServer())
        .post('/specialities')
        .send(validBody)
        .expect(409);
    });

    it('returns 400 for an invalid payload (validation pipe)', async () => {
      await request(app.getHttpServer())
        .post('/specialities')
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('rejects an invalid payload with 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: '' })
        .expect(400);
    });

    it('returns 401 for unknown credentials', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          phone: '+237600000000',
          password: rawPassword,
          userType: UserType.PATIENT,
        })
        .expect(401);
    });

    it('returns a JWT and a sanitized user on success (201)', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        userId: 1,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+237600000000',
        email: 'john@test.com',
        password: passwordHash,
        userType: UserType.PATIENT,
        isBlock: false,
        isVerified: true,
        roles: [],
      });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          phone: '+237600000000',
          password: rawPassword,
          userType: UserType.PATIENT,
        })
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.roles).toEqual([]);
    });
  });

  describe('guarded routes', () => {
    it('rejects PATCH /auth/change-password without a JWT (401)', async () => {
      await request(app.getHttpServer())
        .patch('/auth/change-password')
        .send({ oldPassword: rawPassword, newPassword: 'newsecret123' })
        .expect(401);
    });
  });
});
