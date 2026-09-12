import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HousekeepingService } from './housekeeping.service';
import {
  CreateHousekeepingTaskDto,
  UpdateHousekeepingDto,
} from '../shared/dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';
import type { AuthenticatedRequest } from '../common/auth.types';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('housekeeping')
export class HousekeepingController {
  constructor(private readonly housekeeping: HousekeepingService) {}

  @Get()
  listHousekeeping(@Req() req: AuthenticatedRequest) {
    return this.housekeeping.listHousekeeping(req.user.userId);
  }

  @Get(':id')
  getHousekeeping(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.housekeeping.getHousekeeping(req.user.userId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.housekeepingCreate)
  createHousekeepingTask(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateHousekeepingTaskDto,
  ) {
    return this.housekeeping.createHousekeepingTask(req.user.userId, dto);
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.housekeepingUpdate)
  updateHousekeeping(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateHousekeepingDto,
  ) {
    return this.housekeeping.updateHousekeeping(req.user.userId, dto);
  }
}