import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsNotEmpty()
  floor: string;

  @IsUUID()
  @IsNotEmpty()
  roomTypeId: string;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
