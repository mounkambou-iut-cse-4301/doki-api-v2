import { Test, TestingModule } from '@nestjs/testing';
import { FichesController } from './fiches.controller';
import { FichesService } from './fiches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveAndVerifiedGuard } from '../auth/guards/active-verified.guard';

describe('FichesController', () => {
  let controller: FichesController;
  let svc: Record<string, jest.Mock>;

  beforeEach(async () => {
    svc = { createFiche: jest.fn(), listFiches: jest.fn(), getFiche: jest.fn(), updateFiche: jest.fn(), deleteFiche: jest.fn(), submitResponse: jest.fn(), getResponses: jest.fn(), getResponseById: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FichesController],
      providers: [
        { provide: FichesService, useValue: svc },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ActiveAndVerifiedGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();
    controller = module.get(FichesController);
  });

  it('should delegate create', async () => {
    svc.createFiche.mockResolvedValue({ ficheId: 1 });
    await controller.create({} as any);
    expect(svc.createFiche).toHaveBeenCalled();
  });
  it('should delegate list', async () => {
    svc.listFiches.mockResolvedValue({ items: [] });
    await controller.list({});
    expect(svc.listFiches).toHaveBeenCalled();
  });
  it('should delegate get', async () => {
    svc.getFiche.mockResolvedValue({ ficheId: 1 });
    await controller.get('1');
    expect(svc.getFiche).toHaveBeenCalledWith(1);
  });
  it('should delegate update', async () => {
    svc.updateFiche.mockResolvedValue({ ficheId: 1 });
    await controller.update('1', {} as any);
    expect(svc.updateFiche).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate remove', async () => {
    svc.deleteFiche.mockResolvedValue({ message: 'deleted' });
    await controller.remove('1');
    expect(svc.deleteFiche).toHaveBeenCalledWith(1);
  });
  it('should delegate submitResponse', async () => {
    svc.submitResponse.mockResolvedValue({ id: 'x' });
    await controller.submitResponse('1', {} as any);
    expect(svc.submitResponse).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate getResponses', async () => {
    svc.getResponses.mockResolvedValue({ items: [] });
    await controller.getResponses('1', {} as any);
    expect(svc.getResponses).toHaveBeenCalledWith(1, {} as any);
  });
  it('should delegate getResponseById', async () => {
    svc.getResponseById.mockResolvedValue({ id: 'x' });
    await controller.getResponseById('1', 'abc');
    expect(svc.getResponseById).toHaveBeenCalledWith(1, 'abc');
  });
});
