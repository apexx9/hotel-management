import { Injectable } from '@nestjs/common';
import { InjectDatabase } from '../database/database.decorator';
import type { Database } from '../database/database.types';
import { activityLogs, notifications, notificationTypeEnum } from '../database/schema';
import { and, eq } from 'drizzle-orm';

type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

@Injectable()
export class ActivityService {
  constructor(@InjectDatabase() private readonly db: Database) {}

  async writeActivity(
    hotelId: string,
    actorUserId: string | null,
    actorName: string | null,
    event: string,
    description: string,
    referenceType?: string,
    referenceId?: string,
  ) {
    await this.db.insert(activityLogs).values({
      hotelId,
      actorUserId,
      actorName,
      event,
      description,
      referenceType,
      referenceId,
    });
  }

  async writeNotification(
    hotelId: string,
    type: NotificationType,
    title: string,
    message: string,
    referenceType?: string,
    referenceId?: string,
  ) {
    await this.db.insert(notifications).values({
      hotelId,
      type,
      title,
      message,
      referenceType,
      referenceId,
    });
  }

  async markNotificationRead(id: string, hotelId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.hotelId, hotelId)));
  }

  async markAllNotificationsRead(hotelId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.hotelId, hotelId));
  }
}