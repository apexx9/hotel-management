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
import { StaysService } from './stays.service';
import {
  CheckInDto,
  CheckOutDto,
  CreateBookingDto,
  TransferRoomDto,
  UpdateBookingDto,
} from '../shared/dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';
import type { AuthenticatedRequest } from '../common/auth.types';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class StaysController {
  constructor(private readonly stays: StaysService) {}

  @Get('stays')
  listStays(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('guestId') guestId?: string,
    @Query('roomId') roomId?: string,
    @Query('q') q?: string,
  ) {
    return this.stays.listStays(req.user.userId, {
      status,
      guestId,
      roomId,
      q,
    });
  }

  @Get('stays/active')
  listActiveStays(@Req() req: AuthenticatedRequest) {
    return this.stays.listStays(req.user.userId, { status: 'checked_in' });
  }

  @Get('stays/arrivals')
  listArrivals(@Req() req: AuthenticatedRequest) {
    return this.stays.listStays(req.user.userId, {
      status: ['pending_arrival', 'reserved'],
    });
  }

  @Get('stays/departures')
  listDepartures(@Req() req: AuthenticatedRequest) {
    return this.stays.listStays(req.user.userId, { status: 'checked_in' });
  }

  @Get('stays/guest/:guestId')
  listStaysByGuest(
    @Req() req: AuthenticatedRequest,
    @Param('guestId') guestId: string,
  ) {
    return this.stays.getStaysByGuest(req.user.userId, guestId);
  }

  @Get('stays/:id')
  getStay(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.stays.getStay(req.user.userId, id);
  }

  @Post('bookings')
  @RequirePermissions(PERMISSIONS.reservationsCreate)
  createBooking(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBookingDto,
  ) {
    return this.stays.createBooking(req.user.userId, dto);
  }

  @Get('bookings/availability')
  getBookingAvailability(
    @Req() req: AuthenticatedRequest,
    @Query('roomTypeId') roomTypeId?: string,
    @Query('roomId') roomId?: string,
    @Query('checkIn') checkIn?: string,
    @Query('nights') nights?: string,
    @Query('guests') guests?: string,
    @Query('checkInNow') checkInNow?: string,
    @Query('excludeStayId') excludeStayId?: string,
  ) {
    return this.stays.getBookingAvailability(req.user.userId, {
      roomTypeId,
      roomId,
      checkIn: checkIn ?? '',
      nights: nights ?? '',
      guests,
      checkInNow,
      excludeStayId,
    });
  }

  @Patch('bookings/:id')
  @RequirePermissions(PERMISSIONS.reservationsUpdate)
  updateBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.stays.updateBooking(req.user.userId, id, dto);
  }

  @Post('bookings/:id/cancel')
  @RequirePermissions(PERMISSIONS.reservationsCancel)
  cancelBooking(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.stays.cancelBooking(req.user.userId, id);
  }

  @Post('bookings/:id/send-confirmation')
  @RequirePermissions(PERMISSIONS.reservationsUpdate)
  sendConfirmation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.stays.sendReservationConfirmation(req.user.userId, id);
  }

  @Patch('stays/:id/room')
  @RequirePermissions(PERMISSIONS.transfersManage)
  transferRoom(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: TransferRoomDto,
  ) {
    return this.stays.transferRoom(req.user.userId, {
      stayId: id,
      roomId: dto.roomId,
    });
  }

  @Post('check-in')
  @RequirePermissions(PERMISSIONS.checkinsCreate)
  checkIn(@Req() req: AuthenticatedRequest, @Body() dto: CheckInDto) {
    return this.stays.checkIn(req.user.userId, dto);
  }

  @Post('check-out')
  @RequirePermissions(PERMISSIONS.checkoutsCreate)
  checkOut(@Req() req: AuthenticatedRequest, @Body() dto: CheckOutDto) {
    return this.stays.checkOut(req.user.userId, dto);
  }
}
