import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { StatisticsController } from './controllers/statistics.controller';
import { StatisticsService } from './services/statistics.service';

@Module({
    imports: [HttpModule],
    providers: [StatisticsService],
    controllers: [StatisticsController]
})
export class StatisticsModule { }
