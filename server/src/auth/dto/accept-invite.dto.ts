import { IsString } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  fullName: string;

  @IsString()
  password: string;
}
