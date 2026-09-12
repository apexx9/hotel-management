import { Module } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { CommonModule } from '../common/common.module';
import { ReceiptsModule } from '../receipts/receipts.module';

@Module({
  imports: [CommonModule, ReceiptsModule],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}