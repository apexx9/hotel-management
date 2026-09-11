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
import type { Request } from 'express';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';
import { CreateRoomsBulkDto } from './dto/create-rooms-bulk.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('q') query?: string) {
    return this.roomService.findAll(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.findOne(id, req.user.userId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.roomsCreate)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateRoomDto) {
    return this.roomService.create(req.user.userId, dto);
  }

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.roomsCreate)
  createMany(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRoomsBulkDto,
  ) {
    return this.roomService.createMany(req.user.userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.roomsUpdate)
  update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomService.update(id, req.user.userId, dto);
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.roomsStatus)
  updateStatus(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateRoomStatusDto,
  ) {
    return this.roomService.updateStatus(id, req.user.userId, dto);
  }

  @Post(':id/mark-available')
  @RequirePermissions(PERMISSIONS.roomsStatus)
  markAvailable(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.markAvailable(id, req.user.userId);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.roomsDelete)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.remove(id, req.user.userId);
  }
}
