import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsModel } from '../models/statistics.model';
import { StatisticsService } from '../services/statistics.service';

@Controller('statistics')
export class StatisticsController {
    constructor(private statisticsService: StatisticsService) { }

    @Get('evaluation')
    public async getEvaluation(@Query('url') url: string[]): Promise<StatisticsModel> {
        return await this.statisticsService.getEvaluation(...url);
    }
}
