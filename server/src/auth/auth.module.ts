import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController, InvitationsController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '1h' },
    }),
    EmailModule,
  ],
  controllers: [AuthController, InvitationsController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, EmailModule],
})
export class AuthModule {}
