import { Module } from '@nestjs/common';
import { StaysService } from './stays.service';
import { StaysController } from './stays.controller';
import { CommonModule } from '../common/common.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [CommonModule, EmailModule],
  controllers: [StaysController],
  providers: [StaysService],
})
export class StaysModule {}