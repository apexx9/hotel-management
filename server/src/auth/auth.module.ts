import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController, InvitationsController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { MailService } from './mail.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController, InvitationsController],
  providers: [AuthService, JwtStrategy, MailService],
  exports: [AuthService, MailService],
})
export class AuthModule {}
