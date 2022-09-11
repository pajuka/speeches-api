import { Test, TestingModule } from '@nestjs/testing';
import { Statistics\services\statisticsService } from './statistics\services\statistics.service';

describe('Statistics\services\statisticsService', () => {
  let service: Statistics\services\statisticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Statistics\services\statisticsService],
    }).compile();

    service = module.get<Statistics\services\statisticsService>(Statistics\services\statisticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
