import { Module } from '@nestjs/common';
import { OperationsService } from './operations.service';
import { OperationsController } from './operations.controller';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { ReceiptsModule } from '../receipts/receipts.module';

@Module({
  imports: [AuthModule, EmailModule, ReceiptsModule],
  controllers: [OperationsController],
  providers: [OperationsService],
})
export class OperationsModule {}
