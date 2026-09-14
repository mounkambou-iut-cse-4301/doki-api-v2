import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = {
      signupPatient: jest.fn(),
      signupMedecin: jest.fn(),
      updatePatient: jest.fn(),
      updateMedecin: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      signupAdmin: jest.fn(),
      addRoleToAdmin: jest.fn(),
      removeRoleFromAdmin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(UsersController);
  });

  describe('signupPatient', () => {
    it('should delegate to svc.signupPatient', async () => {
      const dto = { firstName: 'John', email: 'j@test.com' };
      svc.signupPatient.mockResolvedValue({ userId: 1 });

      const result = await controller.signupPatient(dto as any);

      expect(svc.signupPatient).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ userId: 1 });
    });
  });

  describe('signupMedecin', () => {
    it('should delegate to svc.signupMedecin', async () => {
      const dto = { firstName: 'Dr', email: 'd@test.com' };
      svc.signupMedecin.mockResolvedValue({ userId: 2 });

      const result = await controller.signupMedecin(dto as any);

      expect(svc.signupMedecin).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ userId: 2 });
    });
  });

  describe('updatePatient', () => {
    it('should delegate to svc.updatePatient with id and dto', async () => {
      const dto = { firstName: 'Updated' };
      svc.updatePatient.mockResolvedValue({ userId: 1, ...dto });

      const result = await controller.updatePatient(1, dto as any);

      expect(svc.updatePatient).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual({ userId: 1, firstName: 'Updated' });
    });
  });

  describe('updateMedecin', () => {
    it('should delegate to svc.updateMedecin with id and dto', async () => {
      const dto = { firstName: 'Dr New' };
      svc.updateMedecin.mockResolvedValue({ userId: 2, ...dto });

      const result = await controller.updateMedecin(2, dto as any);

      expect(svc.updateMedecin).toHaveBeenCalledWith(2, dto);
      expect(result).toEqual({ userId: 2, firstName: 'Dr New' });
    });
  });

  describe('findAll', () => {
    it('should delegate to svc.findAll with query', async () => {
      const query = { page: 1, limit: 10 };
      svc.findAll.mockResolvedValue({
        items1: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          lastPage: 0,
          sortedByRating: false,
        },
      });

      const result = await controller.findAll(query as any);

      expect(svc.findAll).toHaveBeenCalledWith(query);
      expect(result).toHaveProperty('items1');
    });
  });

  describe('findOne', () => {
    it('should delegate to svc.findOne with id', async () => {
      svc.findOne.mockResolvedValue({ userId: 1, firstName: 'John' });

      const result = await controller.findOne(1);

      expect(svc.findOne).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('userId', 1);
    });
  });

  describe('signupAdmin', () => {
    it('should delegate to svc.signupAdmin', async () => {
      const dto = { firstName: 'Admin', email: 'a@test.com', roleIds: [1] };
      svc.signupAdmin.mockResolvedValue({ userId: 3 });

      const result = await controller.signupAdmin(dto as any);

      expect(svc.signupAdmin).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ userId: 3 });
    });
  });

  describe('addRoleToAdmin', () => {
    it('should delegate to svc.addRoleToAdmin with id and roleId from dto', async () => {
      const dto = { roleId: 5 };
      svc.addRoleToAdmin.mockResolvedValue({
        message: 'Rôle attribué.',
        userId: 3,
        roleId: 5,
      });

      const result = await controller.addRoleToAdmin(3, dto as any);

      expect(svc.addRoleToAdmin).toHaveBeenCalledWith(3, 5);
      expect(result).toEqual({
        message: 'Rôle attribué.',
        userId: 3,
        roleId: 5,
      });
    });
  });

  describe('removeRoleFromAdmin', () => {
    it('should delegate to svc.removeRoleFromAdmin with id and roleId from dto', async () => {
      const dto = { roleId: 5 };
      svc.removeRoleFromAdmin.mockResolvedValue({
        message: 'Rôle retiré.',
        userId: 3,
        roleId: 5,
      });

      const result = await controller.removeRoleFromAdmin(3, dto as any);

      expect(svc.removeRoleFromAdmin).toHaveBeenCalledWith(3, 5);
      expect(result).toEqual({ message: 'Rôle retiré.', userId: 3, roleId: 5 });
    });
  });
});
