import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import { users } from '../database/schema';
import { PERMISSIONS_KEY } from './permissions.decorator';
import {
  normalizeRole,
  PERMISSIONS_BY_ROLE,
  type CanonicalRole,
} from './permissions';

interface AuthenticatedRequest {
  user?: {
    userId?: string;
    role?: string;
    roleName?: CanonicalRole;
    hotelId?: string | null;
  };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDatabase() private readonly db: Database,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }

    const canonicalRole: CanonicalRole = normalizeRole(user.role);
    const granted = PERMISSIONS_BY_ROLE[canonicalRole] ?? [];
    const allowed =
      granted.includes('*') ||
      required.every((permission) => granted.includes(permission));

    request.user = {
      ...request.user,
      userId: user.id,
      role: user.role,
      roleName: canonicalRole,
      hotelId: user.hotelId ?? null,
    };

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
