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
import { AdminService } from './admin.service';
import {
  InviteStaffDto,
  QueryReportsDto,
  UpdateSettingsDto,
  UpdateStaffDto,
} from '../shared/dto';
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
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  // ==========================================
  // DASHBOARD
  // ==========================================
  @Get('dashboard')
  dashboard(@Req() req: AuthenticatedRequest) {
    return this.admin.dashboard(req.user.userId);
  }

  // ==========================================
  // SEARCH
  // ==========================================
  @Get('search')
  globalSearch(@Req() req: AuthenticatedRequest, @Query('q') q?: string) {
    return this.admin.globalSearch(req.user.userId, q);
  }

  // ==========================================
  // ACTIVITY & NOTIFICATIONS
  // ==========================================
  @Get('activity')
  listActivity(@Req() req: AuthenticatedRequest) {
    return this.admin.listActivity(req.user.userId);
  }

  @Get('activity/:id')
  getActivity(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.admin.getActivity(req.user.userId, id);
  }

  @Get('notifications')
  listNotifications(@Req() req: AuthenticatedRequest) {
    return this.admin.listNotifications(req.user.userId);
  }

  @Patch('notifications/:id/read')
  markNotificationRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.admin.markNotificationRead(req.user.userId, id);
  }

  @Post('notifications/mark-all-read')
  markAllNotificationsRead(@Req() req: AuthenticatedRequest) {
    return this.admin.markAllNotificationsRead(req.user.userId);
  }

  // ==========================================
  // STAFF MANAGEMENT
  // ==========================================
  @Get('staff')
  @RequirePermissions(PERMISSIONS.staffRead)
  listStaff(@Req() req: AuthenticatedRequest) {
    return this.admin.listStaff(req.user.userId);
  }

  @Get('staff/:id')
  @RequirePermissions(PERMISSIONS.staffRead)
  getStaffMember(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.admin.getStaffMember(req.user.userId, id);
  }

  @Post('staff/invite')
  @RequirePermissions(PERMISSIONS.staffInvite)
  inviteStaff(@Req() req: AuthenticatedRequest, @Body() dto: InviteStaffDto) {
    return this.admin.inviteStaff(req.user.userId, dto);
  }

  @Delete('staff/invitations/:id')
  @RequirePermissions(PERMISSIONS.staffInvite)
  revokeInvitation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.admin.revokeInvitation(req.user.userId, id);
  }

  @Post('staff/invitations/:id/resend')
  @RequirePermissions(PERMISSIONS.staffInvite)
  resendInvitation(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.admin.resendInvitation(req.user.userId, id);
  }

  @Patch('staff/:id')
  @RequirePermissions(PERMISSIONS.staffUpdate)
  updateStaff(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.admin.updateStaff(req.user.userId, id, dto);
  }

  @Delete('staff/:id')
  @RequirePermissions(PERMISSIONS.staffUpdate)
  deleteStaff(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.admin.deleteStaff(req.user.userId, id);
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  @Get('settings')
  getSettings(@Req() req: AuthenticatedRequest) {
    return this.admin.getSettings(req.user.userId);
  }

  @Patch('settings')
  @RequirePermissions(PERMISSIONS.settingsUpdate)
  updateSettings(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.admin.updateSettings(req.user.userId, dto);
  }

  @Post('settings/test-email')
  @RequirePermissions(PERMISSIONS.settingsUpdate)
  testEmailSend(
    @Req() req: AuthenticatedRequest,
    @Body() body: { to?: string },
  ) {
    return this.admin.testEmailSend(req.user.userId, body?.to);
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
    return this.admin.getReportsSummary(req.user.userId, query);
  }
}