import { IsOptional, IsString } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  password: string;
}
