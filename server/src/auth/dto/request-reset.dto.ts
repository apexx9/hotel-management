import { IsString } from 'class-validator';

export class RequestResetDto {
  @IsString()
  identifier: string; // email or phone
}
