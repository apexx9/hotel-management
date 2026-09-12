import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import { hotelSettings, users } from '../database/schema';
import { eq } from 'drizzle-orm';
import { money } from './pricing.util';

export type UserContext = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  hotelId: string | null;
};

@Injectable()
export class HotelContextService {
  constructor(@InjectDatabase() private readonly db: Database) {}

  async getUserContext(userId: string): Promise<UserContext> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return user;
  }

  async getDefaultHotelId(userId: string): Promise<string | null> {
    const user = await this.getUserContext(userId);
    return user.hotelId ?? null;
  }

  async getRequiredHotelId(userId: string): Promise<string> {
    const hotelId = await this.getDefaultHotelId(userId);
    if (!hotelId) {
      throw new BadRequestException('Hotel context not found');
    }
    return hotelId;
  }

  getCurrentUser(userId: string) {
    return this.getUserContext(userId);
  }

  async getHotelBranding(hotelId: string) {
    const [settings] = await this.db
      .select()
      .from(hotelSettings)
      .where(eq(hotelSettings.hotelId, hotelId))
      .limit(1);

    return {
      settings,
      currency: settings?.currency || 'GHS',
      branding: {
        hotelName: settings?.name ?? null,
        hotelAddress: settings?.address ?? null,
        hotelPhone: settings?.phone ?? null,
        hotelEmail: settings?.email ?? null,
        logoUrl: settings?.logoUrl ?? null,
        primaryColor: settings?.primaryColor ?? null,
        accentColor: settings?.accentColor ?? null,
      },
      sender: {
        name: settings?.emailFromName ?? settings?.name ?? null,
      },
      replyTo: settings?.emailFrom ?? settings?.email ?? null,
    };
  }

  async getHotelPricingDefaults(hotelId: string) {
    const [settings] = await this.db
      .select()
      .from(hotelSettings)
      .where(eq(hotelSettings.hotelId, hotelId))
      .limit(1);

    return {
      taxType: settings?.defaultTaxType ?? 'value',
      taxValue: money(settings?.defaultTaxValue ?? 0),
      discountType: settings?.defaultDiscountType ?? 'value',
      discountValue: money(settings?.defaultDiscountValue ?? 0),
    };
  }

  async isHousekeepingEnabled(hotelId: string): Promise<boolean> {
    const [settings] = await this.db
      .select({ systemPrefs: hotelSettings.systemPrefs })
      .from(hotelSettings)
      .where(eq(hotelSettings.hotelId, hotelId))
      .limit(1);

    if (!settings?.systemPrefs) return true;

    try {
      const prefs = JSON.parse(settings.systemPrefs) as {
        housekeepingEnabled?: boolean;
      };
      return prefs.housekeepingEnabled !== false;
    } catch {
      return true;
    }
  }
}