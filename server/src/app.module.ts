import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';
import { GuestsModule } from './guests/guests.module';
import { StaysModule } from './stays/stays.module';
import { FinanceModule } from './finance/finance.module';
import { RoomTypesModule } from './room-types/room-types.module';
import { ServicesModule } from './services/services.module';
import { HousekeepingModule } from './housekeeping/housekeeping.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 300),
      },
    ]),
    DatabaseModule,
    AuthModule,
    RoomModule,
    GuestsModule,
    StaysModule,
    FinanceModule,
    RoomTypesModule,
    ServicesModule,
    HousekeepingModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
