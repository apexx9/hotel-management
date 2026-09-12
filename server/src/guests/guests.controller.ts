import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GuestsService } from './guests.service';
import { CreateGuestDto, UpdateGuestDto } from '../shared/dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';
import type { AuthenticatedRequest } from '../common/auth.types';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('guests')
export class GuestsController {
  constructor(private readonly guests: GuestsService) {}

  @Get()
  listGuests(@Req() req: AuthenticatedRequest, @Query('q') query?: string) {
    return this.guests.listGuests(req.user.userId, query);
  }

  @Get(':id')
  getGuest(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.guests.getGuest(req.user.userId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.guestsCreate)
  createGuest(@Req() req: AuthenticatedRequest, @Body() dto: CreateGuestDto) {
    return this.guests.createGuest(req.user.userId, dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.guestsUpdate)
  updateGuest(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateGuestDto,
  ) {
    return this.guests.updateGuest(req.user.userId, id, dto);
  }
}