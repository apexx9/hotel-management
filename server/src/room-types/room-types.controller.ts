import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RoomTypesService } from './room-types.service';
import { CreateRoomTypeDto, UpdateRoomTypeDto } from '../shared/dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';
import type { AuthenticatedRequest } from '../common/auth.types';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly roomTypes: RoomTypesService) {}

  @Get()
  listRoomTypes(@Req() req: AuthenticatedRequest) {
    return this.roomTypes.listRoomTypes(req.user.userId);
  }

  @Get(':id')
  getRoomType(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.roomTypes.getRoomType(req.user.userId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.roomTypesCreate)
  createRoomType(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.roomTypes.createRoomType(req.user.userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.roomTypesUpdate)
  updateRoomType(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.roomTypes.updateRoomType(req.user.userId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.roomTypesDelete)
  deleteRoomType(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.roomTypes.deleteRoomType(req.user.userId, id);
  }
}