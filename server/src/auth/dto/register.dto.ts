import { IsEmail, IsNotEmpty, IsObject, IsString } from 'class-validator';

class HotelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  address: string;
}

class OwnerDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RegisterDto {
  @IsObject()
  hotel: HotelDto;

  @IsObject()
  owner: OwnerDto;
}
