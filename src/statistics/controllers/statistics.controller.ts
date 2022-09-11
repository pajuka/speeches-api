import { Controller, Get, Param, Query } from '@nestjs/common';
import { url } from 'inspector';
import { StatisticsModel } from '../models/statistics.model';
import { StatisticsService } from '../services/statistics.service';

@Controller('statistics')
export class StatisticsController {
    private readonly UrlQueryParamPrefix = 'url';

    constructor(private statisticsService: StatisticsService) { }

    @Get('evaluation')
    public async getEvaluation(@Query('url') url: string[]): Promise<StatisticsModel> {
        return await this.statisticsService.getEvaluation(...url);
    }
}
