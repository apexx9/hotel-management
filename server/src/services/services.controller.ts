import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import {
  CreateServiceChargeDto,
  CreateServiceDto,
  UpdateServiceDto,
} from '../shared/dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';
import type { AuthenticatedRequest } from '../common/auth.types';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get('services')
  listServices(@Req() req: AuthenticatedRequest) {
    return this.services.listServices(req.user.userId);
  }

  @Get('services/:id')
  getService(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.services.getService(req.user.userId, id);
  }

  @Post('services')
  @RequirePermissions(PERMISSIONS.servicesManage)
  createService(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateServiceDto,
  ) {
    return this.services.createService(req.user.userId, dto);
  }

  @Patch('services/:id')
  @RequirePermissions(PERMISSIONS.servicesManage)
  updateService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.services.updateService(req.user.userId, id, dto);
  }

  @Delete('services/:id')
  @RequirePermissions(PERMISSIONS.servicesManage)
  deleteService(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.services.deleteService(req.user.userId, id);
  }

  @Get('service-charges')
  listServiceCharges(
    @Req() req: AuthenticatedRequest,
    @Query('stayId') stayId?: string,
  ) {
    return this.services.listServiceCharges(req.user.userId, stayId);
  }

  @Post('service-charges')
  @RequirePermissions(PERMISSIONS.chargesCreate)
  addServiceCharge(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateServiceChargeDto,
  ) {
    return this.services.addServiceCharge(req.user.userId, dto);
  }
}