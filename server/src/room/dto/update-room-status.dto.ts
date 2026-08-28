import { IsIn } from 'class-validator';

export class UpdateRoomStatusDto {
  @IsIn([
    'available',
    'occupied',
    'cleaning',
    'inspection',
    'maintenance',
    'out_of_service',
    'reserved',
  ])
  status:
    | 'available'
    | 'occupied'
    | 'cleaning'
    | 'inspection'
    | 'maintenance'
    | 'out_of_service'
    | 'reserved';
}
