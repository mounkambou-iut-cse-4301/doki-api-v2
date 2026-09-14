import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionsController } from './role-permissions.controller';
import { RolePermissionsService } from './role-permissions.service';

describe('RolePermissionsController', () => {
  let controller: RolePermissionsController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { assign: jest.fn(), remove: jest.fn(), listByRole: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolePermissionsController],
      providers: [{ provide: RolePermissionsService, useValue: svc }],
    }).compile();
    controller = module.get(RolePermissionsController);
  });

  it('should delegate assign', async () => {
    svc.assign.mockResolvedValue({ roleId: 1, permissions: [] });
    await controller.assign({ roleId: 1, permissionIds: [1] });
    expect(svc.assign).toHaveBeenCalled();
  });

  it('should delegate remove', async () => {
    svc.remove.mockResolvedValue({ roleId: 1, permissions: [] });
    await controller.remove({ roleId: 1, permissionIds: [1] });
    expect(svc.remove).toHaveBeenCalled();
  });

  it('should delegate listByRole', async () => {
    svc.listByRole.mockResolvedValue({ roleId: 1, permissions: [] });
    await controller.listByRole('1');
    expect(svc.listByRole).toHaveBeenCalledWith(1);
  });
});
