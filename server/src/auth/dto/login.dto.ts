import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // email or phone

  @IsOptional()
  @IsString()
  identifierType?: 'email' | 'phone';

  @IsString()
  @IsNotEmpty()
  password: string;
}
