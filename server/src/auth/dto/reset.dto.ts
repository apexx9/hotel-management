import { IsString } from 'class-validator';

export class ResetDto {
  @IsString()
  token: string;

  @IsString()
  password: string;
}
