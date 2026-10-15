import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { OrdonancesController } from './ordonances.controller';
import { OrdonancesService } from './ordonances.service';
import { SuivisController } from '../suivis/suivis.controller';
import { SuivisService } from '../suivis/suivis.service';

// Real HTTP routes, DTO validation, prescription/follow-up services and Expo helper.
// Database and external HTTP calls are simulated; no real patient receives a push.
jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn() } }));

const treatment = (name = 'Traitement fictif A') => ({
  patientId: 20,
  name,
  dosage: 'Dosage de test',
  posologie: 'Posologie de test',
  forme: 'Forme de test',
  voie: 'Voie de test',
  instructions: 'Simulation technique uniquement',
  startDate: '2026-10-15',
  endDate: '2026-10-17',
  frequency: { type: 'daily', timesPerDay: 2 },
  notificationTimes: ['08:00', '20:00'],
  isActive: true,
});
const payload = () => ({
  reservationId: 30,
  medecinId: 10,
  patientId: 20,
  name: 'Ordonnance fictive de simulation',
  traitement: [treatment()],
});

describe('Prescription delivery and automatic follow-up HTTP simulation', () => {
  let app: INestApplication;
  let state: { prescriptions: any[]; followUps: any[]; notifications: any[] };
  let patientToken: string | null;
  let failedTreatment: string | undefined;
  let failNotification: boolean;
  let failCommit: boolean;
  const post = axios.post as jest.Mock;
  const tx = {
    ordonance: { create: jest.fn() },
    suivi: { create: jest.fn() },
  };
  const prisma = {
    user: { findUnique: jest.fn() },
    reservation: { findUnique: jest.fn() },
    ordonance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    suivi: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    notification: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdonancesController, SuivisController],
      providers: [
        OrdonancesService,
        SuivisService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
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
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    state = { prescriptions: [], followUps: [], notifications: [] };
    patientToken = 'ExponentPushToken[patient-simulation]';
    failedTreatment = undefined;
    failNotification = false;
    failCommit = false;
    post.mockResolvedValue({
      data: { data: { status: 'ok', id: 'simulated-ticket' } },
    });
    prisma.user.findUnique.mockImplementation(async ({ where }) => ({
      userId: where.userId,
      firstName: where.userId === 10 ? 'Medecin' : 'Patient',
      lastName: 'Simulation',
      expotoken:
        where.userId === 10
          ? 'ExponentPushToken[doctor-simulation]'
          : patientToken,
    }));
    prisma.reservation.findUnique.mockResolvedValue({
      reservationId: 30,
      medecinId: 10,
      patientId: 20,
    });
    prisma.ordonance.findFirst.mockImplementation(
      async ({ where }) =>
        state.prescriptions.find(
          (ord) => ord.reservationId === where.reservationId,
        ) ?? null,
    );
    prisma.ordonance.create.mockRejectedValue(
      new Error('Prescription write outside transaction'),
    );
    prisma.suivi.create.mockRejectedValue(
      new Error('Follow-up write outside transaction'),
    );
    tx.ordonance.create.mockImplementation(async ({ data }) => {
      const ord = {
        ...data,
        ordonanceId: 40,
        patientId: data.patient.connect.userId,
        medecinId: data.medecin.connect.userId,
        reservationId: data.reservation.connect.reservationId,
      };
      state.prescriptions.push(ord);
      return ord;
    });
    prisma.ordonance.findUnique.mockImplementation(async ({ where }) => {
      const ord = state.prescriptions.find(
        (row) => row.ordonanceId === where.ordonanceId,
      );
      return ord
        ? {
            ...ord,
            Suivi: state.followUps.filter(
              (row) => row.ordonanceId === ord.ordonanceId,
            ),
          }
        : null;
    });
    tx.suivi.create.mockImplementation(async ({ data }) => {
      if (data.name === failedTreatment)
        throw new Error('Simulated follow-up database failure');
      const row = { suiviId: state.followUps.length + 1, ...data };
      state.followUps.push(row);
      return row;
    });
    const filteredFollowUps = (where: {
      patientId?: number;
      ordonanceId?: number;
    }) =>
      state.followUps.filter(
        (row) =>
          (!where.patientId || row.patientId === where.patientId) &&
          (!where.ordonanceId || row.ordonanceId === where.ordonanceId),
      );
    prisma.suivi.findMany.mockImplementation(async ({ where }) =>
      filteredFollowUps(where),
    );
    prisma.suivi.count.mockImplementation(
      async ({ where }) => filteredFollowUps(where).length,
    );
    prisma.notification.create.mockImplementation(async ({ data }) => {
      if (failNotification)
        throw new Error('Simulated notification database failure');
      const row = { notificationId: state.notifications.length + 1, ...data };
      state.notifications.push(row);
      return row;
    });
    prisma.$transaction.mockImplementation(async (operation) => {
      if (Array.isArray(operation)) return Promise.all(operation);
      const snapshot = structuredClone(state);
      try {
        const result = await operation(tx);
        expect(prisma.notification.create).not.toHaveBeenCalled();
        expect(post).not.toHaveBeenCalled();
        if (failCommit) throw new Error('Simulated commit failure');
        return result;
      } catch (error) {
        state = snapshot;
        throw error;
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const create = (body = payload()) =>
    request(app.getHttpServer()).post('/ordonances').send(body);

  it('creates an ordonnance, exposes its follow-up through GET and sends the patient push payload to Expo', async () => {
    const response = await create().expect(201);
    expect(tx.ordonance.create).toHaveBeenCalledTimes(1);
    expect(tx.suivi.create).toHaveBeenCalledTimes(1);
    expect(prisma.ordonance.create).not.toHaveBeenCalled();
    expect(prisma.suivi.create).not.toHaveBeenCalled();
    expect(response.body.ordonanceId).toBe(40);
    const ordonnance = await request(app.getHttpServer())
      .get('/ordonances/40')
      .expect(200);
    expect(ordonnance.body.Suivi).toHaveLength(1);
    const suivis = await request(app.getHttpServer())
      .get('/suivis?patientId=20&ordonanceId=40')
      .expect(200);
    expect(suivis.body.items).toHaveLength(1);
    expect(suivis.body.items[0]).toMatchObject({
      ...treatment(),
      ordonanceId: 40,
      startDate: '2026-10-15T00:00:00.000Z',
      endDate: '2026-10-17T00:00:00.000Z',
    });
    expect(state.notifications.map((row) => row.userId).sort()).toEqual([
      10, 20,
    ]);
    expect(post).toHaveBeenCalledWith(
      'https://exp.host/--/api/v2/push/send',
      expect.objectContaining({
        to: patientToken,
        data: { kind: 'ORDONANCE_NEW', ordonanceId: 40, reservationId: 30 },
      }),
      expect.any(Object),
    );
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('creates one follow-up per active treatment and none for an inactive treatment', async () => {
    await create({
      ...payload(),
      traitement: [
        treatment(),
        treatment('Traitement fictif B'),
        { ...treatment('Inactif'), isActive: false },
      ],
    }).expect(201);
    expect(state.followUps.map((row) => row.name)).toEqual([
      'Traitement fictif A',
      'Traitement fictif B',
    ]);
  });

  it('rejects a duplicate ordonnance without duplicating follow-ups or pushes', async () => {
    await create().expect(201);
    await create().expect(409);
    expect(state.prescriptions).toHaveLength(1);
    expect(state.followUps).toHaveLength(1);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('currently requires patientId inside every treatment despite the top-level patientId', async () => {
    const body: any = payload();
    delete body.traitement[0].patientId;
    const response = await create(body).expect(400);
    expect(response.body.message.join(' ')).toContain('patientId');
    expect(state.prescriptions).toHaveLength(0);
  });

  it.each(['Traitement fictif A', 'Traitement fictif B'])(
    'rolls back the ordonnance and all follow-ups without notifications when %s fails',
    async (name) => {
      failedTreatment = name;
      await create({
        ...payload(),
        traitement: [treatment(), treatment('Traitement fictif B')],
      }).expect(500);
      expect(tx.suivi.create).toHaveBeenCalledTimes(
        name === 'Traitement fictif A' ? 1 : 2,
      );
      expect(state.prescriptions).toHaveLength(0);
      expect(state.followUps).toHaveLength(0);
      expect(state.notifications).toHaveLength(0);
      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(post).not.toHaveBeenCalled();
      await request(app.getHttpServer()).get('/ordonances/40').expect(404);
      const suivis = await request(app.getHttpServer())
        .get('/suivis?patientId=20&ordonanceId=40')
        .expect(200);
      expect(suivis.body.items).toEqual([]);
    },
  );

  it('allows retrying the same reservation after a rolled-back failure', async () => {
    failedTreatment = treatment().name;
    await create().expect(500);
    expect(post).not.toHaveBeenCalled();
    failedTreatment = undefined;
    await create().expect(201);
    expect(state.prescriptions).toHaveLength(1);
    expect(state.followUps).toHaveLength(1);
    expect(state.notifications).toHaveLength(2);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('does not notify before a successful transaction commit', async () => {
    failCommit = true;
    await create().expect(500);
    expect(tx.suivi.create).toHaveBeenCalledTimes(1);
    expect(state.prescriptions).toHaveLength(0);
    expect(state.followUps).toHaveLength(0);
    expect(prisma.notification.create).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it('DIAGNOSTIC: currently returns 201 when the in-app notifications cannot be stored', async () => {
    failNotification = true;
    await create().expect(201);
    expect(state.notifications).toHaveLength(0);
    expect(state.followUps).toHaveLength(1);
  });

  it('DIAGNOSTIC: currently returns 201 even if Expo is unreachable', async () => {
    post.mockRejectedValue(new Error('Simulated Expo timeout'));
    await create().expect(201);
    expect(post).toHaveBeenCalledTimes(2);
    expect(state.followUps).toHaveLength(1);
  });

  it('DIAGNOSTIC: currently returns 201 when Expo rejects the device token in an HTTP 200 response', async () => {
    post.mockResolvedValue({
      data: {
        data: { status: 'error', details: { error: 'DeviceNotRegistered' } },
      },
    });
    await create().expect(201);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('stores the patient notification and follow-up but sends no patient push without a token', async () => {
    patientToken = null;
    await create().expect(201);
    expect(state.notifications.some((row) => row.userId === 20)).toBe(true);
    expect(state.followUps).toHaveLength(1);
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][1].to).toBe(
      'ExponentPushToken[doctor-simulation]',
    );
  });
});
