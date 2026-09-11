import { Test, TestingModule } from '@nestjs/testing';
import { DATABASE } from '../database/database.provider';
import { RoomService } from './room.service';

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomService, { provide: DATABASE, useValue: {} }],
    }).compile();

    service = module.get<RoomService>(RoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
