import { HttpService } from '@nestjs/axios';
import { Injectable, StreamableFile } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { firstValueFrom, from, groupBy } from 'rxjs';
import { InputModel } from '../models/input.model';
import { StatisticsModel } from '../models/statistics.model';
import * as Papa from 'papaparse';
import * as _ from 'lodash';

@Injectable()
export class StatisticsService {
    private csvParserOptions = {
        header: true,
        skipEmptyLines: true,
        delimiter: ',',
        transformHeader: (header) => header.trim(),
        transform: (value, column) => {
            const stringValue = value.trim()

            if (column === 'Date') {
                return new Date(stringValue);
            } else if (column === 'Words') {
                return +stringValue;
            }

            return stringValue;
        }
    };

    private readonly yearToCheckForMostSpeeches = 2013;
    private readonly topicToCount = 'Internal Security';

    constructor(private httpService: HttpService) { }

    public async getEvaluation(...urls: string[]): Promise<StatisticsModel> {
        if (urls && urls.length <= 0) {
            console.warn('There where no urls specified.');
            return;
        }

        let overallInputData: InputModel[] = [];

        for (const url of urls) {
            const content = await this.downloadFile(url);
            const result: InputModel[] = this.parseFileContent(content);
            overallInputData.push(...result);
        }

        // console.debug("🚀 - StatisticsService - getEvaluation - overallInputData", overallInputData);

        return this.generateStatistics(overallInputData);
    }

    private async downloadFile(url: string): Promise<string> {
        if (!url) {
            return;
        }

        try {
            let response: AxiosResponse = await firstValueFrom(this.httpService.get(url));

            if (!response?.data) {
                console.warn(`Content of downloaded file from [${url}] is empty.`);
                return;
            }

            // console.debug("🚀 - StatisticsService - downloadFile - response.data", response.data);

            return response.data;
        } catch (error) {
            console.warn(`Error while downloading file from [${url}].`, error);
        }
    }

    private parseFileContent(content: string): InputModel[] {
        if (!content) {
            return;
        }

        let result: InputModel[];
        try {
            const parseResult = Papa.parse(content, this.csvParserOptions);

            result = parseResult?.data as InputModel[];

            if (!result || result.length <= 0) {
                console.warn(`Empty result after parsing content [${content}].`);
            }

            return result;
        } catch (error) {
            console.warn(`Error while parsing content [${content}].`, error);
        }
    }

    private async generateStatistics(inputData: InputModel[]): Promise<StatisticsModel> {
        const statistic: StatisticsModel = {
            mostSpeeches: null,
            mostSecurity: null,
            leastWordy: null
        }

        if (!inputData || inputData.length <= 0) {
            return statistic;
        }

        // Get name of the politican with most speeches in the specified year
        // Group all items by year
        const yearGrouped = _.groupBy(inputData, (item: InputModel) => item.Date.getFullYear());
        // Get all items of the year to check
        const allItemsOfYearToCheck = yearGrouped[this.yearToCheckForMostSpeeches];
        // Count in that items all by speaker
        const speakerGroupedInYearToCheck = _.countBy(allItemsOfYearToCheck, (item: InputModel) => item.Speaker);
        // Get the speaker with the most speeches
        statistic.mostSpeeches = _.maxBy(Object.keys(speakerGroupedInYearToCheck), key => speakerGroupedInYearToCheck[key]);

        // console.debug("🚀 - StatisticsService - generateStatistics - speakerGroupedInYearToCheck", speakerGroupedInYearToCheck);

        // Get name of the politican with most speeches on the specified topic
        // Group all items by topic
        const topicGrouped = _.groupBy(inputData, (item: InputModel) => item.Topic);
        // Get all items of the topic to check
        const allItemsOfTopicToCheck = topicGrouped[this.topicToCount];
        // Count in that items all by speaker
        const speakerGroupedOnTopicToCheck = _.countBy(allItemsOfTopicToCheck, (item: InputModel) => item.Speaker);
        // Get the speaker with the most speeches in that topic
        statistic.mostSecurity = _.maxBy(Object.keys(speakerGroupedOnTopicToCheck), key => speakerGroupedOnTopicToCheck[key]);

        // console.debug("🚀 - StatisticsService - generateStatistics - speakerGroupedOnTopicToCheck", speakerGroupedOnTopicToCheck);

        // Get name of the politican with the fewest words
        // Group all items by speaker
        const speakerGrouped = _.groupBy(inputData, (item: InputModel) => item.Speaker);
        // In the result (key=politican, value=all items of politican), sum up the words for one politican
        // and get the one with the fewest
        statistic.leastWordy = _.minBy(Object.keys(speakerGrouped), key => _.sumBy(speakerGrouped[key], (item: InputModel) => item.Words));

        // console.debug("🚀 - StatisticsService - generateStatistics - speakerGrouped", speakerGrouped);

        return statistic;
    }
}
