import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { and, eq, inArray, lt, or } from 'drizzle-orm';
import type { Database } from '../database/database.types';
import { InjectDatabase } from '../database/database.decorator';
import {
  hotels,
  users,
  invitations,
  authTokens,
  refreshTokens,
  hotelSettings,
} from '../database/schema';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectDatabase() private readonly db: Database,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Resolve hotel branding + sender override for account emails.
   * Falls back to global (environment) defaults when the account has
   * no hotel or hotel_settings row.
   */
  private async resolveAccountEmailContext(user: { hotelId?: string | null }) {
    if (!user.hotelId)
      return { branding: {}, sender: undefined as any, replyTo: undefined };

    const [settings] = await this.db
      .select()
      .from(hotelSettings)
      .where(eq(hotelSettings.hotelId, user.hotelId))
      .limit(1);

    if (!settings)
      return { branding: {}, sender: undefined as any, replyTo: undefined };

    return {
      branding: {
        hotelName: settings.name ?? null,
        hotelAddress: settings.address ?? null,
        hotelPhone: settings.phone ?? null,
        hotelEmail: settings.email ?? null,
        logoUrl: settings.logoUrl ?? null,
        primaryColor: settings.primaryColor ?? null,
        accentColor: settings.accentColor ?? null,
      },
      sender: {
        name: settings.emailFromName ?? settings.name ?? null,
      },
      replyTo: settings.emailFrom ?? settings.email ?? null,
    };
  }

  /** Hash a token before storing it in the database. */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Generate a fresh 6-digit code that is unique across auth tokens. */
  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const code = crypto
        .randomInt(0, 1_000_000)
        .toString()
        .padStart(6, '0');

      const [existing] = await this.db
        .select({ id: authTokens.id })
        .from(authTokens)
        .where(eq(authTokens.token, code))
        .limit(1);

      if (!existing) return code;
    }

    throw new InternalServerErrorException(
      'Could not generate a unique verification code.',
    );
  }

  /** Generate a JWT access token. */
  private signAccessToken(user: {
    id: string;
    role: string;
    hotelId: string | null;
  }): string {
    return this.jwtService.sign({
      sub: user.id,
      role: user.role,
      hotelId: user.hotelId,
    });
  }

  /** Register a new hotel and its owner. */
  async registerHotel(payload: any) {
    const { hotel, owner } = payload;

    if (!hotel?.name || !owner?.email || !owner?.password || !owner?.fullName) {
      return { ok: false, message: 'Hotel and owner details are required.' };
    }

    const normalizedEmail = String(owner.email).trim().toLowerCase();

    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      // Do not reveal that the account already exists; treat it as success
      // so the caller is redirected to the (non-functional for them) verify
      // step instead of learning the email is taken.
      return { ok: true };
    }

    const result = await this.db.transaction(async (tx) => {
      // Create hotel
      const [createdHotel] = await tx
        .insert(hotels)
        .values({
          name: String(hotel.name).trim(),
          email: hotel.email
            ? String(hotel.email).trim().toLowerCase()
            : undefined,
          phone: hotel.phone ? String(hotel.phone).trim() : undefined,
          address: hotel.address ? String(hotel.address).trim() : undefined,
        })
        .returning();

      // Hash owner password
      const passwordHash = await bcrypt.hash(String(owner.password), 12);

      // Create owner account
      const [createdUser] = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          phone: owner.phone ? String(owner.phone).trim() : undefined,
          passwordHash,
          fullName: String(owner.fullName).trim(),
          hotelId: createdHotel.id,
          role: 'owner',
          isVerified: false,
        })
        .returning();

      // Create email verification code
      const verificationToken = await this.generateUniqueCode();
      await tx.insert(authTokens).values({
        token: verificationToken,
        userId: createdUser.id,
        type: 'verify',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: false,
      });

      return { createdHotel, createdUser, verificationToken };
    });

    // Send verification email after transaction succeeds
    await this.emailService.sendVerification(
      normalizedEmail,
      result.verificationToken,
    );

    return {
      ok: true,
      hotel: result.createdHotel,
      user: {
        id: result.createdUser.id,
        email: result.createdUser.email,
        role: result.createdUser.role,
        name: result.createdUser.fullName,
        hotelId: result.createdUser.hotelId,
      },
    };
  }

  // auth.service.ts
  async getUserFromAccessToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.fullName,
        hotelId: user.hotelId,
      };
    } catch {
      return null;
    }
  }

  /** Login using email or phone. */
  async login(body: any) {
    const identifier = String(body?.identifier ?? '').trim();
    const password = String(body?.password ?? '');
    const identifierType = body?.identifierType;

    if (!identifier || !password) {
      return { ok: false, message: 'Credentials are required.' };
    }

    let account;

    // Explicit email login
    if (identifierType === 'email') {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, identifier.toLowerCase()))
        .limit(1);
      account = user;
    }
    // Explicit phone login
    else if (identifierType === 'phone') {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.phone, identifier))
        .limit(1);
      account = user;
    }
    // No identifier type supplied: try email first, then phone
    else {
      const [emailUser] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, identifier.toLowerCase()))
        .limit(1);

      if (emailUser) {
        account = emailUser;
      } else {
        const [phoneUser] = await this.db
          .select()
          .from(users)
          .where(eq(users.phone, identifier))
          .limit(1);
        account = phoneUser;
      }
    }

    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      return { ok: false, message: 'Invalid credentials.' };
    }

    // Respect email verification requirement when enabled
    if (
      !account.isVerified &&
      process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
    ) {
      return {
        ok: false,
        message: 'Please verify your account before signing in.',
      };
    }

    const accessToken = this.signAccessToken(account);
    const refreshToken = await this.createRefreshToken(account.id);

    return {
      ok: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        name: account.fullName,
        hotelId: account.hotelId,
      },
    };
  }

  /** Get invitation details. */
  async getInvitation(token: string) {
    const [invitation] = await this.db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (
      !invitation ||
      invitation.status !== 'pending' ||
      (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now())
    ) {
      return { ok: false, message: 'Invitation is invalid or expired.' };
    }

    const [hotel] = await this.db
      .select({ name: hotels.name })
      .from(hotels)
      .where(eq(hotels.id, invitation.hotelId))
      .limit(1);

    return {
      ok: true,
      invitation: {
        hotelId: invitation.hotelId,
        hotelName: hotel?.name || null,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    };
  }

  /** Accept a staff invitation. */
  async acceptInvitation(token: string, body: any) {
    const [invitation] = await this.db
      .select()
      .from(invitations)
      .where(eq(invitations.token, token))
      .limit(1);

    if (
      !invitation ||
      invitation.status !== 'pending' ||
      (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now())
    ) {
      return { ok: false, message: 'Invitation is invalid or expired.' };
    }

    const normalizedEmail = invitation.email.trim().toLowerCase();

    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return { ok: false, message: 'A user with this email already exists.' };
    }

    if (!body?.password || !body?.fullName) {
      return { ok: false, message: 'Full name and password are required.' };
    }

    const passwordHash = await bcrypt.hash(String(body.password), 12);

    const result = await this.db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          phone: body.phone ? String(body.phone).trim() : undefined,
          fullName: String(body.fullName).trim(),
          passwordHash,
          hotelId: invitation.hotelId,
          role: invitation.role,
          isVerified: true,
        })
        .returning();

      await tx
        .update(invitations)
        .set({
          status: 'accepted',
          acceptedAt: new Date(),
        })
        .where(eq(invitations.id, invitation.id));

      return createdUser;
    });

    const accessToken = this.signAccessToken(result);
    const refreshToken = await this.createRefreshToken(result.id);

    return {
      ok: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        id: result.id,
        email: result.email,
        role: result.role,
        name: result.fullName,
        hotelId: result.hotelId,
      },
    };
  }

  /** Create a one-time 6-digit verification code. */
  async createTokenForUser(
    userId: string,
    type: string,
    ttlMs = 60 * 60 * 1000,
  ): Promise<string> {
    // Clear stale codes for this user + type so they don't pile up.
    await this.db
      .delete(authTokens)
      .where(
        and(
          eq(authTokens.userId, userId),
          eq(authTokens.type, type),
          or(eq(authTokens.used, true), lt(authTokens.expiresAt, new Date())),
        ),
      );

    const code = await this.generateUniqueCode();

    await this.db.insert(authTokens).values({
      token: code,
      userId,
      type,
      expiresAt: new Date(Date.now() + ttlMs),
      used: false,
    });

    return code;
  }

  /** Request email verification. */
  async requestVerification(email: string) {
    const normalizedEmail = String(email).trim().toLowerCase();

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    // Do not reveal whether an account exists
    if (!user) {
      return { ok: true };
    }

    const token = await this.createTokenForUser(
      user.id,
      'verify',
      24 * 60 * 60 * 1000,
    );

    const { branding, sender, replyTo } =
      await this.resolveAccountEmailContext(user);

    await this.emailService.sendVerification(
      user.email,
      token,
      branding,
      sender,
      replyTo,
    );

    return { ok: true };
  }

  /** Verify a user account. */
  async verifyAccount(token: string) {
    const [authToken] = await this.db
      .select()
      .from(authTokens)
      .where(and(eq(authTokens.token, token), eq(authTokens.type, 'verify')))
      .limit(1);

    if (!authToken || authToken.used || authToken.expiresAt < new Date()) {
      return { ok: false, message: 'Invalid or expired token.' };
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ isVerified: true })
        .where(eq(users.id, authToken.userId));

      await tx
        .update(authTokens)
        .set({ used: true })
        .where(eq(authTokens.id, authToken.id));
    });

    return { ok: true };
  }

  /** Delete the owner's master account and its hotel (permanent). */
  async deleteAccount(userId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new NotFoundException('Account not found.');

    if (!user.hotelId) {
      throw new BadRequestException('No hotel is linked to this account.');
    }

    if (user.role !== 'owner') {
      throw new ForbiddenException(
        'Only the hotel owner can delete the master account.',
      );
    }

    await this.db.transaction(async (tx) => {
      // Withdraw pending staff invitations for the hotel.
      await tx
        .delete(invitations)
        .where(eq(invitations.hotelId, user.hotelId!));

      // Delete every account in the hotel (owner + staff).
      // Their auth/refresh tokens cascade; other references are set to null.
      const hotelUsers = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.hotelId, user.hotelId!));

      const userIds = hotelUsers.map((u) => u.id);
      if (userIds.length > 0) {
        await tx.delete(users).where(inArray(users.id, userIds));
      }

      // Deleting the hotel cascades rooms, guests, stays, invoices,
      // payments, bookings, notifications, activity logs, settings etc.
      await tx.delete(hotels).where(eq(hotels.id, user.hotelId!));
    });

    return { ok: true };
  }

  /** Request password reset (email or phone). */
  async requestPasswordReset(identifier: string) {
    const normalizedIdentifier = String(identifier).trim();

    const [emailUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedIdentifier.toLowerCase()))
      .limit(1);

    const account =
      emailUser ??
      (
        await this.db
          .select()
          .from(users)
          .where(eq(users.phone, normalizedIdentifier))
          .limit(1)
      )[0];

    // Do not reveal whether the account exists
    if (!account) {
      return { ok: true };
    }

    const token = await this.createTokenForUser(
      account.id,
      'password_reset',
      20 * 60 * 1000,
    );

    const { branding, sender, replyTo } =
      await this.resolveAccountEmailContext(account);

    await this.emailService.sendPasswordReset(
      account.email,
      token,
      branding,
      sender,
      replyTo,
    );

    return { ok: true };
  }

  /** Reset a user's password. */
  async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      return {
        ok: false,
        message: 'Password must be at least 8 characters long.',
      };
    }

    const [authToken] = await this.db
      .select()
      .from(authTokens)
      .where(
        and(eq(authTokens.token, token), eq(authTokens.type, 'password_reset')),
      )
      .limit(1);

    if (!authToken || authToken.used || authToken.expiresAt < new Date()) {
      return { ok: false, message: 'Invalid or expired token.' };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, authToken.userId));

      await tx
        .update(authTokens)
        .set({ used: true })
        .where(eq(authTokens.id, authToken.id));

      await tx
        .update(refreshTokens)
        .set({ revoked: true })
        .where(eq(refreshTokens.userId, authToken.userId));
    });

    return { ok: true };
  }

  /** Validate a one-time authentication token. */
  async validateToken(token: string) {
    const [authToken] = await this.db
      .select()
      .from(authTokens)
      .where(eq(authTokens.token, token))
      .limit(1);

    if (!authToken || authToken.used || authToken.expiresAt < new Date()) {
      return { ok: false, message: 'Invalid or expired token.' };
    }

    return {
      ok: true,
      type: authToken.type,
    };
  }

  /** Create a refresh token (only hash stored in database). */
  async createRefreshToken(
    userId: string,
    ttlMs = 30 * 24 * 60 * 60 * 1000,
  ): Promise<string> {
    const token = crypto.randomBytes(48).toString('hex');
    await this.db.insert(refreshTokens).values({
      tokenHash: this.hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + ttlMs),
      revoked: false,
    });
    return token;
  }

  /** Validate a refresh token. */
  async validateRefreshToken(token: string) {
    const [record] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, this.hashToken(token)))
      .limit(1);

    if (!record || record.revoked || record.expiresAt < new Date()) {
      return null;
    }

    return record;
  }

  /** Revoke a refresh token. */
  async revokeRefreshToken(token: string) {
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.tokenHash, this.hashToken(token)));

    return { ok: true };
  }

  /** Issue a new access token for a user. */
  async issueAccessTokenForUser(userId: string): Promise<string> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return this.signAccessToken(user);
  }
}
