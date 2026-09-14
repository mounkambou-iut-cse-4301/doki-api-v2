import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserType } from 'generated/prisma';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from './guards/active-verified.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = {
      login: jest.fn().mockResolvedValue({ token: 'jwt' }),
      changePassword: jest.fn().mockResolvedValue({ message: 'ok' }),
      requestReset: jest.fn().mockResolvedValue({ message: 'ok' }),
      confirmReset: jest.fn().mockResolvedValue({ message: 'ok' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: svc }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call auth.login with dto', async () => {
      const dto = {
        phone: '+212600000000',
        password: 'pass',
        userType: UserType.PATIENT,
      };

      const result = await controller.login(dto as any);

      expect(svc.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ token: 'jwt' });
    });
  });

  describe('changePassword', () => {
    it('should call auth.changePassword with req.user.sub', async () => {
      const req = { user: { sub: 42 } };
      const dto = { oldPassword: 'old', newPassword: 'newNew1234' };

      const result = await controller.changePassword(req as any, dto as any);

      expect(svc.changePassword).toHaveBeenCalledWith(42, dto);
      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('requestReset', () => {
    it('should call auth.requestReset with dto', async () => {
      const dto = { email: 'a@b.com', userType: UserType.PATIENT };

      const result = await controller.requestReset(dto as any);

      expect(svc.requestReset).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('confirmReset', () => {
    it('should call auth.confirmReset with dto', async () => {
      const dto = {
        email: 'a@b.com',
        userType: UserType.PATIENT,
        otp: '123456',
        newPassword: 'newPass123',
      };

      const result = await controller.confirmReset(dto as any);

      expect(svc.confirmReset).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'ok' });
    });
  });
});
