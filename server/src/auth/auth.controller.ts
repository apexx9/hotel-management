import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestVerifyDto } from './dto/request-verify.dto';
import { VerifyDto } from './dto/verify.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetDto } from './dto/reset.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 * 60 } })
  async register(@Body() body: RegisterDto) {
    return this.authService.registerHotel(body);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 * 15 } })
  async login(
    @Req() req: Request,
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body);
    if (!result?.ok) return result;
    const userId = result.user!.id;
    // create refresh token and set cookie
    const refresh = await this.authService.createRefreshToken(userId);
    res.cookie('refresh_token', refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    return result;
  }

  @Post('request-verify')
  @Throttle({ default: { limit: 5, ttl: 60_000 * 15 } })
  async requestVerify(@Body() body: RequestVerifyDto) {
    return this.authService.requestVerification(body.email);
  }

  @Post('verify')
  @Throttle({ default: { limit: 10, ttl: 60_000 * 15 } })
  async verifyAccount(@Body() body: VerifyDto) {
    return this.authService.verifyAccount(body.token);
  }

  @Post('validate-token')
  @Throttle({ default: { limit: 10, ttl: 60_000 * 15 } })
  async validateToken(@Body() body: { token: string }) {
    return this.authService.validateToken(body.token);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req: Request) {
    const userId = (req as any).user?.userId as string;
    return this.authService.deleteAccount(userId);
  }

  @Post('request-reset')
  @Throttle({ default: { limit: 5, ttl: 60_000 * 15 } })
  async requestReset(@Body() body: RequestResetDto) {
    return this.authService.requestPasswordReset(body.identifier);
  }

  @Post('reset')
  @Throttle({ default: { limit: 10, ttl: 60_000 * 15 } })
  async resetPassword(@Body() body: ResetDto) {
    return this.authService.resetPassword(body.token, body.password);
  }

  // auth.controller.ts
  @Get('me')
  async me(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { ok: false, message: 'Unauthorized' };
    }

    const token = authHeader.split(' ')[1];
    const user = await this.authService.getUserFromAccessToken(token);

    if (!user) return { ok: false, message: 'Invalid token' };

    return { ok: true, user };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refresh_token;
    if (!token) return { ok: false, message: 'No token' };
    const rec = await this.authService.validateRefreshToken(token);
    if (!rec) return { ok: false, message: 'Invalid refresh token' };
    // Fix: use camelCase property from Drizzle schema
    const userId = rec.userId;
    // rotate refresh token
    await this.authService.revokeRefreshToken(token);
    const newRefresh = await this.authService.createRefreshToken(userId);
    res.cookie('refresh_token', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    const access = await this.authService.issueAccessTokenForUser(userId);
    return { ok: true, token: access };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token;
    if (token) {
      await this.authService.revokeRefreshToken(token);
    }
    res.clearCookie('refresh_token', { path: '/' });
    return { ok: true };
  }
}

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly authService: AuthService) {}

  @Get(':token')
  async getInvitation(@Param('token') token: string) {
    return this.authService.getInvitation(token);
  }

  @Post(':token/accept')
  async acceptInvitation(
    @Param('token') token: string,
    @Body() body: AcceptInviteDto,
  ) {
    return this.authService.acceptInvitation(token, body);
  }
}
