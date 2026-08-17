import { IsEmail } from 'class-validator';

export class RequestVerifyDto {
  @IsEmail()
  email: string;
}
