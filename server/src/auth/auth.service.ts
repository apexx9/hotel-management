import { Inject, Injectable } from '@nestjs/common';
import type { Database } from '../database/database.types';
import { InjectDatabase } from '../database/database.decorator';
import {
  hotels,
  users,
  invitations,
  auth_tokens,
  refresh_tokens,
} from '../database/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectDatabase() private db: Database,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async registerHotel(payload: any) {
    const { hotel, owner } = payload;

    const createdHotel = await this.db
      .insert(hotels)
      .values({
        name: hotel.name,
        email: hotel.email,
        phone: hotel.phone,
        address: hotel.address,
      })
      .returning();

    const hotelId = createdHotel[0]?.id;

    const passwordHash = await bcrypt.hash(owner.password, 10);

    const createdUser = await this.db
      .insert(users)
      .values({
        email: owner.email,
        phone: owner.phone,
        password_hash: passwordHash,
        full_name: owner.fullName,
        hotel_id: hotelId,
        role: 'owner',
        is_verified: false,
      })
      .returning();

    // create verification token
    const userId = createdUser[0]?.id;
    const vtoken = crypto.randomBytes(24).toString('hex');
    await this.db.insert(auth_tokens).values({
      token: vtoken,
      user_id: userId,
      type: 'verify',
      expires_at: String(Date.now() + 1000 * 60 * 60 * 24), // 24h
      used: false,
    });

    // send verification email (best-effort)
    await this.mailService.sendMail(
      owner.email,
      'Verify your Hotel account',
      `Your verification code is: ${vtoken}`,
    );

    return {
      hotel: createdHotel[0],
      user: { id: userId, email: owner.email },
      verificationToken: vtoken,
    };
  }

  async login(body: any) {
    const { identifier, password } = body; // identifier can be email or phone

    const user = await this.db
      .select()
      .from(users)
      .where(eq(users.email, identifier))
      .limit(1);

    if (!user || user.length === 0) {
      // try phone
      const userPhone = await this.db
        .select()
        .from(users)
        .where(eq(users.phone, identifier))
        .limit(1);
      if (!userPhone || userPhone.length === 0)
        return { ok: false, message: 'Invalid credentials' };
      // set user
      // @ts-ignore
      const u = userPhone[0];
      const match = await bcrypt.compare(password, u.password_hash);
      if (!match) return { ok: false, message: 'Invalid credentials' };
      const jwtToken = this.jwtService.sign({ sub: u.id, role: u.role });
      return {
        ok: true,
        token: jwtToken,
        user: { id: u.id, email: u.email, role: u.role },
      };
    }

    // @ts-ignore
    const u = user[0];
    const match = await bcrypt.compare(password, u.password_hash);
    if (!match) return { ok: false, message: 'Invalid credentials' };

    const jwtToken = this.jwtService.sign({ sub: u.id, role: u.role });
    return {
      ok: true,
      token: jwtToken,
      user: { id: u.id, email: u.email, role: u.role },
    };
  }

  async getInvitation(token: string) {
    const inv = await this.db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);
    if (!inv || inv.length === 0)
      return { ok: false, message: 'Invitation not found' };
    // @ts-ignore
    const i = inv[0];
    return {
      ok: true,
      invitation: {
        hotelId: i.hotel_id,
        email: i.email,
        role: i.role,
        expiresAt: i.expires_at,
      },
    };
  }

  async acceptInvitation(token: string, body: any) {
    const inv = await this.db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);
    if (!inv || inv.length === 0)
      return { ok: false, message: 'Invitation not found' };
    // @ts-ignore
    const i = inv[0];

    const passwordHash = await bcrypt.hash(body.password, 10);

    const createdUser = await this.db
      .insert(users)
      .values({
        email: i.email,
        full_name: body.fullName,
        password_hash: passwordHash,
        hotel_id: i.hotel_id,
        role: i.role,
        is_verified: true,
      })
      .returning();

    await this.db
      .update(invitations)
      .set({ accepted: 'yes' })
      .where(eq(invitations.id, i.id));

    const u = createdUser[0];
    const jwtToken = this.jwtService.sign({ sub: u.id, role: u.role });
    return { ok: true, token: jwtToken, user: u };
  }

  async createTokenForUser(
    userId: string,
    type: string,
    ttlMs = 1000 * 60 * 60,
  ) {
    const token = crypto.randomBytes(24).toString('hex');
    await this.db.insert(auth_tokens).values({
      token,
      user_id: userId,
      type,
      expires_at: String(Date.now() + ttlMs),
      used: false,
    });
    return token;
  }

  async requestVerification(email: string) {
    const found = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!found || found.length === 0) return { ok: false };
    // @ts-ignore
    const u = found[0];
    const token = await this.createTokenForUser(
      u.id,
      'verify',
      1000 * 60 * 60 * 24,
    );
    await this.mailService.sendMail(
      u.email,
      'Verify your account',
      `Your verification code: ${token}`,
    );
    return { ok: true, token };
  }

  async verifyAccount(token: string) {
    const rec = await this.db
      .select()
      .from(auth_tokens)
      .where(eq(auth_tokens.token, token))
      .limit(1);
    if (!rec || rec.length === 0)
      return { ok: false, message: 'Invalid token' };
    // @ts-ignore
    const t = rec[0];
    if (t.used) return { ok: false, message: 'Token used' };
    if (Number(t.expires_at) < Date.now())
      return { ok: false, message: 'Expired' };
    await this.db
      .update(users)
      .set({ is_verified: true })
      .where(eq(users.id, t.user_id));
    await this.db
      .update(auth_tokens)
      .set({ used: true })
      .where(eq(auth_tokens.id, t.id));
    return { ok: true };
  }

  async requestPasswordReset(identifier: string) {
    const found = await this.db
      .select()
      .from(users)
      .where(eq(users.email, identifier))
      .limit(1);
    if (!found || found.length === 0) {
      const foundPhone = await this.db
        .select()
        .from(users)
        .where(eq(users.phone, identifier))
        .limit(1);
      if (!foundPhone || foundPhone.length === 0) return { ok: false };
      // @ts-ignore
      const u = foundPhone[0];
      const token = await this.createTokenForUser(
        u.id,
        'password_reset',
        1000 * 60 * 20,
      );
      await this.mailService.sendMail(
        u.email,
        'Reset your password',
        `Your password reset code: ${token}`,
      );
      return { ok: true, token };
    }
    // @ts-ignore
    const u = found[0];
    const token = await this.createTokenForUser(
      u.id,
      'password_reset',
      1000 * 60 * 20,
    );
    await this.mailService.sendMail(
      u.email,
      'Reset your password',
      `Your password reset code: ${token}`,
    );
    return { ok: true, token };
  }

  // Refresh token helpers
  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createRefreshToken(userId: string, ttlMs = 1000 * 60 * 60 * 24 * 30) {
    const token = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + ttlMs);
    await this.db.insert(refresh_tokens).values({
      token_hash: tokenHash,
      user_id: userId,
      expires_at: expiresAt,
      revoked: false,
    });
    return token;
  }

  async validateRefreshToken(token: string) {
    const hash = this.hashToken(token);
    const rec = await this.db
      .select()
      .from(refresh_tokens)
      .where(eq(refresh_tokens.token_hash, hash))
      .limit(1);
    if (!rec || rec.length === 0) return null;
    // @ts-ignore
    const r = rec[0];
    if (r.revoked) return null;
    if (new Date(r.expires_at) < new Date()) return null;
    return r;
  }

  async revokeRefreshToken(token: string) {
    const hash = this.hashToken(token);
    await this.db
      .update(refresh_tokens)
      .set({ revoked: true })
      .where(eq(refresh_tokens.token_hash, hash));
    return true;
  }

  async resetPassword(token: string, newPassword: string) {
    const rec = await this.db
      .select()
      .from(auth_tokens)
      .where(eq(auth_tokens.token, token))
      .limit(1);
    if (!rec || rec.length === 0)
      return { ok: false, message: 'Invalid token' };
    // @ts-ignore
    const t = rec[0];
    if (t.used) return { ok: false, message: 'Token used' };
    if (Number(t.expires_at) < Date.now())
      return { ok: false, message: 'Expired' };
    const hash = await bcrypt.hash(newPassword, 10);
    await this.db
      .update(users)
      .set({ password_hash: hash })
      .where(eq(users.id, t.user_id));
    await this.db
      .update(auth_tokens)
      .set({ used: true })
      .where(eq(auth_tokens.id, t.id));
    return { ok: true };
  }

  async validateToken(token: string) {
    const rec = await this.db
      .select()
      .from(auth_tokens)
      .where(eq(auth_tokens.token, token))
      .limit(1);
    if (!rec || rec.length === 0)
      return { ok: false, message: 'Invalid token' };
    // @ts-ignore
    const t = rec[0];
    if (t.used) return { ok: false, message: 'Token used' };
    if (Number(t.expires_at) < Date.now())
      return { ok: false, message: 'Expired' };
    return { ok: true, type: t.type, userId: t.user_id };
  }
}
