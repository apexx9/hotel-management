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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { Request } from 'express';
import { OperationsService } from './operations.service';
import {
  CheckInDto,
  CheckOutDto,
  CreateBookingDto,
  CreateGuestDto,
  CreateHousekeepingTaskDto,
  CreatePaymentDto,
  CreateRoomTypeDto,
  CreateServiceChargeDto,
  CreateServiceDto,
  InviteStaffDto,
  QueryReportsDto,
  UpdateBookingDto,
  UpdateGuestDto,
  UpdateHousekeepingDto,
  UpdateRoomTypeDto,
  UpdateServiceDto,
  UpdateSettingsDto,
  UpdateStaffDto,
  TransferRoomDto,
} from './dto';
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
@Controller()
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  // ==========================================
  // DASHBOARD
  // ==========================================
  @Get('dashboard')
  dashboard(@Req() req: AuthenticatedRequest) {
    return this.operations.dashboard(req.user.userId);
  }

  // ==========================================
  // ROOM TYPES
  // ==========================================
  @Get('room-types')
  listRoomTypes(@Req() req: AuthenticatedRequest) {
    return this.operations.listRoomTypes(req.user.userId);
  }

  @Get('room-types/:id')
  getRoomType(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getRoomType(req.user.userId, id);
  }

  @Post('room-types')
  @RequirePermissions(PERMISSIONS.roomTypesCreate)
  createRoomType(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.operations.createRoomType(req.user.userId, dto);
  }

  @Patch('room-types/:id')
  @RequirePermissions(PERMISSIONS.roomTypesUpdate)
  updateRoomType(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.operations.updateRoomType(req.user.userId, id, dto);
  }

  @Delete('room-types/:id')
  @RequirePermissions(PERMISSIONS.roomTypesDelete)
  deleteRoomType(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.deleteRoomType(req.user.userId, id);
  }

  // ==========================================
  // GUESTS
  // ==========================================
  @Get('guests')
  listGuests(@Req() req: AuthenticatedRequest, @Query('q') query?: string) {
    return this.operations.listGuests(req.user.userId, query);
  }

  @Get('guests/:id')
  getGuest(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getGuest(req.user.userId, id);
  }

  @Post('guests')
  @RequirePermissions(PERMISSIONS.guestsCreate)
  createGuest(@Req() req: AuthenticatedRequest, @Body() dto: CreateGuestDto) {
    return this.operations.createGuest(req.user.userId, dto);
  }

  @Patch('guests/:id')
  @RequirePermissions(PERMISSIONS.guestsUpdate)
  updateGuest(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateGuestDto,
  ) {
    return this.operations.updateGuest(req.user.userId, id, dto);
  }

  // ==========================================
  // STAYS & BOOKINGS
  // ==========================================
  @Get('stays')
  listStays(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string,
    @Query('guestId') guestId?: string,
    @Query('roomId') roomId?: string,
    @Query('q') q?: string,
  ) {
    return this.operations.listStays(req.user.userId, {
      status,
      guestId,
      roomId,
      q,
    });
  }

  @Get('stays/active')
  listActiveStays(@Req() req: AuthenticatedRequest) {
    return this.operations.listStays(req.user.userId, { status: 'checked_in' });
  }

  @Get('stays/arrivals')
  listArrivals(@Req() req: AuthenticatedRequest) {
    return this.operations.listStays(req.user.userId, {
      status: ['pending_arrival', 'reserved'],
    });
  }

  @Get('stays/departures')
  listDepartures(@Req() req: AuthenticatedRequest) {
    return this.operations.listStays(req.user.userId, { status: 'checked_in' });
  }

  @Get('stays/guest/:guestId')
  listStaysByGuest(
    @Req() req: AuthenticatedRequest,
    @Param('guestId') guestId: string,
  ) {
    return this.operations.getStaysByGuest(req.user.userId, guestId);
  }

  @Get('stays/:id')
  getStay(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getStay(req.user.userId, id);
  }

  @Post('bookings')
  @RequirePermissions(PERMISSIONS.reservationsCreate)
  createBooking(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBookingDto,
  ) {
    return this.operations.createBooking(req.user.userId, dto);
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
  ) {
    return this.operations.getBookingAvailability(req.user.userId, {
      roomTypeId,
      roomId,
      checkIn: checkIn ?? '',
      nights: nights ?? '',
      guests,
      checkInNow,
    });
  }

  @Patch('bookings/:id')
  @RequirePermissions(PERMISSIONS.reservationsUpdate)
  updateBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.operations.updateBooking(req.user.userId, id, dto);
  }

  @Post('bookings/:id/cancel')
  @RequirePermissions(PERMISSIONS.reservationsCancel)
  cancelBooking(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.cancelBooking(req.user.userId, id);
  }

  @Post('bookings/:id/send-confirmation')
  @RequirePermissions(PERMISSIONS.reservationsUpdate)
  sendConfirmation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.sendReservationConfirmation(req.user.userId, id);
  }

  @Patch('stays/:id/room')
  @RequirePermissions(PERMISSIONS.transfersManage)
  transferRoom(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: TransferRoomDto,
  ) {
    return this.operations.transferRoom(req.user.userId, {
      stayId: id,
      roomId: dto.roomId,
    });
  }

  @Post('check-in')
  @RequirePermissions(PERMISSIONS.checkinsCreate)
  checkIn(@Req() req: AuthenticatedRequest, @Body() dto: CheckInDto) {
    return this.operations.checkIn(req.user.userId, dto);
  }

  @Post('check-out')
  @RequirePermissions(PERMISSIONS.checkoutsCreate)
  checkOut(@Req() req: AuthenticatedRequest, @Body() dto: CheckOutDto) {
    return this.operations.checkOut(req.user.userId, dto);
  }

  // ==========================================
  // INVOICES & PAYMENTS
  // ==========================================
  @Get('invoices')
  listInvoices(
    @Req() req: AuthenticatedRequest,
    @Query('stayId') stayId?: string,
  ) {
    return this.operations.listInvoices(req.user.userId, stayId);
  }

  @Get('invoices/:id')
  getInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getInvoice(req.user.userId, id);
  }

  @Get('invoices/:id/receipt')
  @RequirePermissions(PERMISSIONS.invoicesView)
  getInvoiceReceipt(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getInvoiceReceipt(req.user.userId, id);
  }

  @Get('invoices/:id/receipt.pdf')
  @RequirePermissions(PERMISSIONS.invoicesView)
  async getInvoiceReceiptPdf(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const result = await this.operations.getInvoiceReceiptPdf(
      req.user.userId,
      id,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.pdf);
  }

  @Post('invoices/:id/send-receipt')
  @RequirePermissions(PERMISSIONS.invoicesSend)
  sendInvoiceReceipt(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body?: { to?: string },
  ) {
    return this.operations.sendInvoiceReceipt(req.user.userId, id, body?.to);
  }

  @Get('invoices/:id/items')
  getInvoiceItems(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getInvoiceItems(req.user.userId, id);
  }

  @Get('payments')
  listPayments(
    @Req() req: AuthenticatedRequest,
    @Query('stayId') stayId?: string,
  ) {
    return this.operations.listPayments(req.user.userId, stayId);
  }

  @Get('payments/:id')
  getPayment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getPayment(req.user.userId, id);
  }

  @Post('payments')
  @RequirePermissions(PERMISSIONS.paymentsCreate)
  recordPayment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.operations.recordPayment(req.user.userId, dto);
  }

  @Post('payments/:id/reverse')
  @RequirePermissions(PERMISSIONS.paymentsReverse)
  reversePayment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.reversePayment(req.user.userId, id);
  }

  // ==========================================
  // SERVICES & SERVICE CHARGES
  // ==========================================
  @Get('services')
  listServices(@Req() req: AuthenticatedRequest) {
    return this.operations.listServices(req.user.userId);
  }

  @Get('services/:id')
  getService(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getService(req.user.userId, id);
  }

  @Post('services')
  @RequirePermissions(PERMISSIONS.servicesManage)
  createService(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateServiceDto,
  ) {
    return this.operations.createService(req.user.userId, dto);
  }

  @Patch('services/:id')
  @RequirePermissions(PERMISSIONS.servicesManage)
  updateService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.operations.updateService(req.user.userId, id, dto);
  }

  @Delete('services/:id')
  @RequirePermissions(PERMISSIONS.servicesManage)
  deleteService(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.deleteService(req.user.userId, id);
  }

  @Get('service-charges')
  listServiceCharges(
    @Req() req: AuthenticatedRequest,
    @Query('stayId') stayId?: string,
  ) {
    return this.operations.listServiceCharges(req.user.userId, stayId);
  }

  @Post('service-charges')
  @RequirePermissions(PERMISSIONS.chargesCreate)
  addServiceCharge(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateServiceChargeDto,
  ) {
    return this.operations.addServiceCharge(req.user.userId, dto);
  }

  // ==========================================
  // HOUSEKEEPING
  // ==========================================
  @Get('housekeeping')
  listHousekeeping(@Req() req: AuthenticatedRequest) {
    return this.operations.listHousekeeping(req.user.userId);
  }

  @Get('housekeeping/:id')
  getHousekeeping(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getHousekeeping(req.user.userId, id);
  }

  @Post('housekeeping')
  @RequirePermissions(PERMISSIONS.housekeepingCreate)
  createHousekeepingTask(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateHousekeepingTaskDto,
  ) {
    return this.operations.createHousekeepingTask(req.user.userId, dto);
  }

  @Patch('housekeeping')
  @RequirePermissions(PERMISSIONS.housekeepingUpdate)
  updateHousekeeping(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateHousekeepingDto,
  ) {
    return this.operations.updateHousekeeping(req.user.userId, dto);
  }

  // ==========================================
  // SEARCH
  // ==========================================
  @Get('search')
  globalSearch(@Req() req: AuthenticatedRequest, @Query('q') q?: string) {
    return this.operations.globalSearch(req.user.userId, q);
  }

  // ==========================================
  // ACTIVITY & NOTIFICATIONS
  // ==========================================
  @Get('activity')
  listActivity(@Req() req: AuthenticatedRequest) {
    return this.operations.listActivity(req.user.userId);
  }

  @Get('activity/:id')
  getActivity(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getActivity(req.user.userId, id);
  }

  @Get('notifications')
  listNotifications(@Req() req: AuthenticatedRequest) {
    return this.operations.listNotifications(req.user.userId);
  }

  @Patch('notifications/:id/read')
  markNotificationRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.operations.markNotificationRead(req.user.userId, id);
  }

  @Post('notifications/mark-all-read')
  markAllNotificationsRead(@Req() req: AuthenticatedRequest) {
    return this.operations.markAllNotificationsRead(req.user.userId);
  }

  // ==========================================
  // STAFF MANAGEMENT
  // ==========================================
  @Get('staff')
  @RequirePermissions(PERMISSIONS.staffRead)
  listStaff(@Req() req: AuthenticatedRequest) {
    return this.operations.listStaff(req.user.userId);
  }

  @Get('staff/:id')
  @RequirePermissions(PERMISSIONS.staffRead)
  getStaffMember(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getStaffMember(req.user.userId, id);
  }

  @Post('staff/invite')
  @RequirePermissions(PERMISSIONS.staffInvite)
  inviteStaff(@Req() req: AuthenticatedRequest, @Body() dto: InviteStaffDto) {
    return this.operations.inviteStaff(req.user.userId, dto);
  }

  @Delete('staff/invitations/:id')
  @RequirePermissions(PERMISSIONS.staffInvite)
  revokeInvitation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.revokeInvitation(req.user.userId, id);
  }

  @Post('staff/invitations/:id/resend')
  @RequirePermissions(PERMISSIONS.staffInvite)
  resendInvitation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.resendInvitation(req.user.userId, id);
  }

  @Patch('staff/:id')
  @RequirePermissions(PERMISSIONS.staffUpdate)
  updateStaff(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.operations.updateStaff(req.user.userId, id, dto);
  }

  @Delete('staff/:id')
  @RequirePermissions(PERMISSIONS.staffUpdate)
  deleteStaff(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.deleteStaff(req.user.userId, id);
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  @Get('settings')
  getSettings(@Req() req: AuthenticatedRequest) {
    return this.operations.getSettings(req.user.userId);
  }

  @Patch('settings')
  @RequirePermissions(PERMISSIONS.settingsUpdate)
  updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.operations.updateSettings(req.user.userId, dto);
  }

  @Post('settings/test-email')
  @RequirePermissions(PERMISSIONS.settingsUpdate)
  testEmailSend(
    @Req() req: AuthenticatedRequest,
    @Body() body: { to?: string },
  ) {
    return this.operations.testEmailSend(req.user.userId, body?.to);
  }

  // ==========================================
  // REPORTS
  // ==========================================
  @Get('reports/summary')
  @RequirePermissions(PERMISSIONS.reportsView)
  getReportsSummary(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryReportsDto,
  ) {
    return this.operations.getReportsSummary(req.user.userId, query);
  }
}
