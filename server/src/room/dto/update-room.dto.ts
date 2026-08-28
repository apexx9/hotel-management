import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomDto } from './create-room.dto';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateRoomDto extends PartialType(CreateRoomDto) {
  @IsOptional()
  @IsIn([
    'available',
    'occupied',
    'cleaning',
    'inspection',
    'maintenance',
    'out_of_service',
    'reserved',
  ])
  status?:
    | 'available'
    | 'occupied'
    | 'cleaning'
    | 'inspection'
    | 'maintenance'
    | 'out_of_service'
    | 'reserved';
}
