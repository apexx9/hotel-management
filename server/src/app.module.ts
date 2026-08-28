import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { RoomModule } from './room/room.module';
import { OperationsModule } from './operations/operations.module';

@Module({
  imports: [DatabaseModule, AuthModule, RoomModule, OperationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
