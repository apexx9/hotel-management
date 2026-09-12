import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { FinanceService } from './finance.service';
import { CreatePaymentDto, RefundPaymentDto } from '../shared/dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions';
import type { AuthenticatedRequest } from '../common/auth.types';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get('invoices')
  listInvoices(
    @Req() req: AuthenticatedRequest,
    @Query('stayId') stayId?: string,
  ) {
    return this.finance.listInvoices(req.user.userId, stayId);
  }

  @Get('invoices/:id')
  getInvoice(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.finance.getInvoice(req.user.userId, id);
  }

  @Get('invoices/:id/receipt')
  @RequirePermissions(PERMISSIONS.invoicesView)
  getInvoiceReceipt(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.finance.getInvoiceReceipt(req.user.userId, id);
  }

  @Get('invoices/:id/receipt.pdf')
  @RequirePermissions(PERMISSIONS.invoicesView)
  async getInvoiceReceiptPdf(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param('id') id: string,
  ) {
    const result = await this.finance.getInvoiceReceiptPdf(
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
    return this.finance.sendInvoiceReceipt(req.user.userId, id, body?.to);
  }

  @Get('invoices/:id/items')
  getInvoiceItems(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.finance.getInvoiceItems(req.user.userId, id);
  }

  @Get('payments')
  listPayments(
    @Req() req: AuthenticatedRequest,
    @Query('stayId') stayId?: string,
  ) {
    return this.finance.listPayments(req.user.userId, stayId);
  }

  @Get('payments/:id')
  getPayment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.finance.getPayment(req.user.userId, id);
  }

  @Post('payments')
  @RequirePermissions(PERMISSIONS.paymentsCreate)
  recordPayment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.finance.recordPayment(req.user.userId, dto);
  }

  @Post('payments/refund')
  @RequirePermissions(PERMISSIONS.paymentsCreate)
  refund(@Req() req: AuthenticatedRequest, @Body() dto: RefundPaymentDto) {
    return this.finance.recordRefund(req.user.userId, dto);
  }

  @Post('payments/:id/reverse')
  @RequirePermissions(PERMISSIONS.paymentsReverse)
  reversePayment(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.finance.reversePayment(req.user.userId, id);
  }
}