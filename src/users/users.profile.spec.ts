import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { json } from 'express';
import { Writable } from 'node:stream';
import request = require('supertest');
import { v2 as cloudinary } from 'cloudinary';
import { UserType } from 'generated/prisma';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

// Exercise HTTP routing, DTO validation, service and real base64 decoding.
// Only authentication, database persistence and the Cloudinary network boundary are mocked.
jest.mock('cloudinary', () => ({
  v2: { config: jest.fn(), uploader: { upload_stream: jest.fn() } },
}));

const png =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
const oldProfile = 'https://example.com/old.png';
const uploadedProfile =
  'https://res.cloudinary.com/demo/image/upload/profile.png';

describe.each([
  { route: 'patient', userType: UserType.PATIENT, folder: 'patients' },
  { route: 'medecin', userType: UserType.MEDECIN, folder: 'medecins' },
])('PATCH /users/$route/:id profile', ({ route, userType, folder }) => {
  let app: INestApplication;
  let uploadedBytes: Buffer[];
  let uploadError: string | undefined;
  let uploadResult: { secure_url: string } | undefined;
  let streamError: boolean;
  const uploadStream = cloudinary.uploader.upload_stream as jest.Mock;
  const prisma = { user: { findUnique: jest.fn(), update: jest.fn() } };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ActiveAndVerifiedGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.use(json({ limit: '50mb' }));
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
    uploadedBytes = [];
    uploadError = undefined;
    uploadResult = { secure_url: uploadedProfile };
    streamError = false;
    const existing = {
      userId: 1,
      userType,
      profile: oldProfile,
      firstName: 'Old',
    };
    prisma.user.findUnique.mockResolvedValue(existing);
    prisma.user.update.mockImplementation(({ data }) =>
      Promise.resolve({ ...existing, ...data }),
    );
    uploadStream.mockImplementation(
      (_options, callback) =>
        new Writable({
          write(chunk: Buffer, _encoding, done) {
            uploadedBytes.push(chunk);
            done(streamError ? new Error('Stream failed') : undefined);
          },
          final(done) {
            callback(
              uploadError ? { message: uploadError } : undefined,
              uploadResult,
            );
            done();
          },
        }),
    );
  });

  const patch = (body: object) =>
    request(app.getHttpServer()).patch(`/users/${route}/1`).send(body);

  it.each([
    ['data URL', `data:image/png;base64,${png}`],
    ['raw base64', png],
    ['unpadded base64', png.replace(/=+$/, '')],
    [
      'base64 with whitespace',
      `  data:image/png;base64,${png.slice(0, 20)}\n${png.slice(20)}  `,
    ],
  ])(
    'uploads %s as decoded image bytes and saves the secure URL',
    async (_label, profile) => {
      const response = await patch({ profile, firstName: 'Updated' }).expect(
        200,
      );
      expect(uploadStream).toHaveBeenCalledTimes(1);
      expect(uploadStream).toHaveBeenCalledWith(
        { folder: `${folder}/profiles/1`, resource_type: 'image' },
        expect.any(Function),
      );
      expect(Buffer.concat(uploadedBytes)).toEqual(Buffer.from(png, 'base64'));
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { profile: uploadedProfile, firstName: 'Updated' },
      });
      expect(response.body.profile).toBe(uploadedProfile);
    },
  );

  it('saves an HTTPS URL unchanged without a Cloudinary upload', async () => {
    const profile = 'https://example.com/new.png?version=2';
    const response = await patch({ profile }).expect(200);
    expect(response.body.profile).toBe(profile);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { userId: 1 },
      data: { profile },
    });
    expect(uploadStream).not.toHaveBeenCalled();
  });

  it.each([null, '', '   ', undefined])(
    'preserves the existing photo for profile=%s while updating other fields',
    async (profile) => {
      const response = await patch({ profile, firstName: 'Updated' }).expect(
        200,
      );
      expect(response.body.profile).toBe(oldProfile);
      expect(response.body.firstName).toBe('Updated');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { userId: 1 },
        data: { firstName: 'Updated' },
      });
      expect(uploadStream).not.toHaveBeenCalled();
    },
  );

  it.each([
    'not an image!',
    'data:image/png;base64,%%%invalid',
    'data:image/png;base64,A',
    'data:application/pdf;base64,JVBERi0xLjQ=',
    'https://',
    'http://example.com/image.png',
  ])(
    'rejects invalid profile %s without updating the user',
    async (profile) => {
      await patch({ profile }).expect(400);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(uploadStream).not.toHaveBeenCalled();
    },
  );

  it('does not update the user if Cloudinary rejects the image', async () => {
    uploadError = 'Invalid image file';
    await patch({ profile: `data:image/png;base64,${png}` }).expect(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not update the user if Cloudinary returns no URL', async () => {
    uploadResult = undefined;
    await patch({ profile: png }).expect(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('handles an upload stream error without updating the user', async () => {
    streamError = true;
    await patch({ profile: png }).expect(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not upload when the user is missing', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await patch({ profile: png }).expect(404);
    expect(uploadStream).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
