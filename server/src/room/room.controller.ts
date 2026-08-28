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
import type { Request } from 'express';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateRoomStatusDto } from './dto/update-room-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.roomService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.findOne(id, req.user.userId);
  }

  @Post()
  @Roles('admin', 'manager', 'owner')
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateRoomDto) {
    return this.roomService.create(req.user.userId, dto);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'owner', 'front_desk')
  update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomService.update(id, req.user.userId, dto);
  }

  @Patch(':id/status')
  @Roles('admin', 'manager', 'owner', 'front_desk', 'housekeeping')
  updateStatus(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateRoomStatusDto,
  ) {
    return this.roomService.updateStatus(id, req.user.userId, dto);
  }

  @Delete(':id')
  @Roles('admin', 'manager', 'owner')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.roomService.remove(id, req.user.userId);
  }
}
