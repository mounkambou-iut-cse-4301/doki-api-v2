import { Test, TestingModule } from '@nestjs/testing';
import { CandidatureController } from './candidature.controller';
import { CandidatureService } from './candidature.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('CandidatureController', () => {
  let controller: CandidatureController;
  let service: Record<string, jest.Mock>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      cancelMany: jest.fn(),
      accept: jest.fn(),
      reject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatureController],
      providers: [{ provide: CandidatureService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .compile();

    controller = module.get(CandidatureController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate to service.create', async () => {
      const dto = { medecinId: 1, hopitalIds: [10], description: 'test' };
      const expected = { message: 'ok', data: [] };
      service.create.mockResolvedValue(expected);

      const result = await controller.create(dto as any);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('findAll', () => {
    it('should delegate to service.findAll', async () => {
      const query = { page: 1, limit: 20 };
      const expected = { data: [], meta: { total: 0 } };
      service.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query as any);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });
  });

  describe('cancelMany', () => {
    it('should delegate to service.cancelMany', async () => {
      const dto = { candidatureIds: [1, 2] };
      const expected = { cancelledIds: [1, 2], skippedIds: [] };
      service.cancelMany.mockResolvedValue(expected);

      const result = await controller.cancelMany(dto as any);

      expect(service.cancelMany).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne', async () => {
      const expected = { data: { candidatureId: 1 } };
      service.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('update', () => {
    it('should delegate to service.update', async () => {
      const dto = { description: 'updated' };
      const expected = { message: 'ok' };
      service.update.mockResolvedValue(expected);

      const result = await controller.update(1, dto as any);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(expected);
    });
  });

  describe('delete', () => {
    it('should delegate to service.delete', async () => {
      const expected = { message: 'ok' };
      service.delete.mockResolvedValue(expected);

      const result = await controller.delete(1);

      expect(service.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('accept', () => {
    it('should delegate to service.accept', async () => {
      const expected = { message: 'ok', data: {} };
      service.accept.mockResolvedValue(expected);

      const result = await controller.accept(1);

      expect(service.accept).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe('reject', () => {
    it('should delegate to service.reject', async () => {
      const expected = { message: 'ok' };
      service.reject.mockResolvedValue(expected);

      const result = await controller.reject(1);

      expect(service.reject).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });
});
