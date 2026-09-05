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
  UpdateGuestDto,
  UpdateHousekeepingDto,
  UpdateRoomTypeDto,
  UpdateServiceDto,
  UpdateSettingsDto,
  UpdateStaffDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
  };
}

@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles('admin', 'manager', 'owner')
  createRoomType(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateRoomTypeDto,
  ) {
    return this.operations.createRoomType(req.user.userId, dto);
  }

  @Patch('room-types/:id')
  @Roles('admin', 'manager', 'owner')
  updateRoomType(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    return this.operations.updateRoomType(req.user.userId, id, dto);
  }

  @Delete('room-types/:id')
  @Roles('admin', 'manager', 'owner')
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
  @Roles('admin', 'manager', 'front_desk', 'owner')
  createGuest(@Req() req: AuthenticatedRequest, @Body() dto: CreateGuestDto) {
    return this.operations.createGuest(req.user.userId, dto);
  }

  @Patch('guests/:id')
  @Roles('admin', 'manager', 'front_desk', 'owner')
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
  ) {
    return this.operations.listStays(req.user.userId, {
      status,
      guestId,
      roomId,
    });
  }

  @Get('stays/active')
  listActiveStays(@Req() req: AuthenticatedRequest) {
    return this.operations.listStays(req.user.userId, { status: 'checked_in' });
  }

  @Get('stays/arrivals')
  listArrivals(@Req() req: AuthenticatedRequest) {
    return this.operations.listStays(req.user.userId, {
      status: 'pending_arrival',
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
  @Roles('admin', 'manager', 'front_desk', 'owner')
  createBooking(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBookingDto,
  ) {
    return this.operations.createBooking(req.user.userId, dto);
  }

  @Post('check-in')
  @Roles('admin', 'manager', 'front_desk', 'owner')
  checkIn(@Req() req: AuthenticatedRequest, @Body() dto: CheckInDto) {
    return this.operations.checkIn(req.user.userId, dto);
  }

  @Post('check-out')
  @Roles('admin', 'manager', 'front_desk', 'finance', 'owner')
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
  getInvoiceReceipt(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getInvoiceReceipt(req.user.userId, id);
  }

  @Get('invoices/:id/receipt.pdf')
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
  @Roles('admin', 'manager', 'finance', 'owner', 'front_desk')
  recordPayment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.operations.recordPayment(req.user.userId, dto);
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
  @Roles('admin', 'manager', 'owner')
  createService(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateServiceDto,
  ) {
    return this.operations.createService(req.user.userId, dto);
  }

  @Patch('services/:id')
  @Roles('admin', 'manager', 'owner')
  updateService(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.operations.updateService(req.user.userId, id, dto);
  }

  @Delete('services/:id')
  @Roles('admin', 'manager', 'owner')
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
  @Roles('admin', 'manager', 'front_desk', 'service', 'owner')
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
  @Roles('admin', 'manager', 'housekeeping', 'owner')
  createHousekeepingTask(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateHousekeepingTaskDto,
  ) {
    return this.operations.createHousekeepingTask(req.user.userId, dto);
  }

  @Patch('housekeeping')
  @Roles('admin', 'manager', 'housekeeping', 'owner')
  updateHousekeeping(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateHousekeepingDto,
  ) {
    return this.operations.updateHousekeeping(req.user.userId, dto);
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
  @Roles('admin', 'manager', 'owner')
  listStaff(@Req() req: AuthenticatedRequest) {
    return this.operations.listStaff(req.user.userId);
  }

  @Get('staff/:id')
  @Roles('admin', 'manager', 'owner')
  getStaffMember(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.operations.getStaffMember(req.user.userId, id);
  }

  @Post('staff/invite')
  @Roles('admin', 'manager', 'owner')
  inviteStaff(@Req() req: AuthenticatedRequest, @Body() dto: InviteStaffDto) {
    return this.operations.inviteStaff(req.user.userId, dto);
  }

  @Patch('staff/:id')
  @Roles('admin', 'manager', 'owner')
  updateStaff(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.operations.updateStaff(req.user.userId, id, dto);
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  @Get('settings')
  getSettings(@Req() req: AuthenticatedRequest) {
    return this.operations.getSettings(req.user.userId);
  }

  @Patch('settings')
  @Roles('admin', 'manager', 'owner')
  updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.operations.updateSettings(req.user.userId, dto);
  }

  // ==========================================
  // REPORTS
  // ==========================================
  @Get('reports/summary')
  @Roles('admin', 'manager', 'finance', 'owner')
  getReportsSummary(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryReportsDto,
  ) {
    return this.operations.getReportsSummary(req.user.userId, query);
  }
}
