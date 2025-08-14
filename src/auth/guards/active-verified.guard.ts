import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ActiveAndVerifiedGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userPayload = req.user as { sub: number } | undefined;
    if (!userPayload) return false; // JwtAuthGuard doit passer avant

    const user = await this.prisma.user.findUnique({ where: { userId: userPayload.sub } });
    if (!user) return false;

    if (user.isBlock) {
      throw new ForbiddenException({
        message: 'Votre compte est bloqué.',
        messageE: 'Your account is blocked.',
      });
    }
    if (!user.isVerified) {
      throw new ForbiddenException({
        message: 'Votre compte n\'est pas vérifié.',
        messageE: 'Your account is not verified.',
      });
    }
    return true;
  }
}