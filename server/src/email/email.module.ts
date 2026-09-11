import { Module } from '@nestjs/common';
import { EmailConfig } from './email.config';
import { EmailService } from './email.service';

@Module({
  providers: [EmailConfig, EmailService],
  exports: [EmailService, EmailConfig],
})
export class EmailModule {}
