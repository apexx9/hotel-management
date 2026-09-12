import { Module } from '@nestjs/common';
import { HotelContextService } from './hotel-context.service';
import { ActivityService } from './activity.service';
import { EmailDispatchService } from './email-dispatch.service';
import { EmailModule } from '../email/email.module';
import { ReceiptsModule } from '../receipts/receipts.module';

@Module({
  imports: [EmailModule, ReceiptsModule],
  providers: [HotelContextService, ActivityService, EmailDispatchService],
  exports: [HotelContextService, ActivityService, EmailDispatchService],
})
export class CommonModule {}