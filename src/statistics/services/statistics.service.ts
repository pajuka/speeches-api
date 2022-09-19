import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import * as _ from 'lodash';
import * as Papa from 'papaparse';
import { firstValueFrom } from 'rxjs';
import { InputModel } from '../models/input.model';
import { StatisticsModel } from '../models/statistics.model';

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

        console.debug("🚀 - StatisticsService - getEvaluation - overallInputData", overallInputData);

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

            console.debug("🚀 - StatisticsService - downloadFile - response.data", response.data);

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
        // Get all items of the year to check
        const allItemsOfYearToCheck = inputData.filter(item => item.Date.getFullYear() === this.yearToCheckForMostSpeeches);
        // Count in that items all by speaker
        const speakerGroupedInYearToCheck: { [key: string]: number } = _.countBy(allItemsOfYearToCheck, (item: InputModel) => item.Speaker);
        // Check if there are multiple speakers with the same max-count of speeches
        if (this.checkIfMaxValueIsUnique(Object.values(speakerGroupedInYearToCheck))) {
            // Get the speaker with the most speeches
            statistic.mostSpeeches = _.maxBy(Object.keys(speakerGroupedInYearToCheck), key => speakerGroupedInYearToCheck[key]);
        }

        console.debug("🚀 - StatisticsService - generateStatistics - speakerGroupedInYearToCheck", speakerGroupedInYearToCheck);

        // Get name of the politican with most speeches on the specified topic
        // Get all items of the topic to check
        const allItemsOfTopicToCheck = inputData.filter(item => item.Topic === this.topicToCount);
        // Count in that items all by speaker
        const speakerGroupedOnTopicToCheck: { [key: string]: number } = _.countBy(allItemsOfTopicToCheck, (item: InputModel) => item.Speaker);
        // Check if there are multiple speakers with the same max-count of speeches
        if (this.checkIfMaxValueIsUnique(Object.values(speakerGroupedOnTopicToCheck))) {
            // Get the speaker with the most speeches in that topic
            statistic.mostSecurity = _.maxBy(Object.keys(speakerGroupedOnTopicToCheck), key => speakerGroupedOnTopicToCheck[key]);
        }

        console.debug("🚀 - StatisticsService - generateStatistics - speakerGroupedOnTopicToCheck", speakerGroupedOnTopicToCheck);

        // Get name of the politican with the fewest words
        // Group all items by speaker
        const speakerGrouped: { [key: string]: InputModel[] } = _.groupBy(inputData, (item: InputModel) => item.Speaker);
        // In the result (key=politican, value=all items of politican), sum up the words for one politican
        const speakerWithTotalWordCounts: { [key: string]: number } = this.getSpeakerWithTotalWordCounts(speakerGrouped);
        // Check if there are multiple speakers with the same min-sum of words
        if (this.checkIfMinValueIsUnique(Object.values(speakerWithTotalWordCounts))) {
            // Get the one with the fewest
            statistic.leastWordy = _.minBy(Object.keys(speakerWithTotalWordCounts), key => speakerWithTotalWordCounts[key]);
        }

        console.debug("🚀 - StatisticsService - generateStatistics - speakerWithTotalWordCounts", speakerWithTotalWordCounts);

        return statistic;
    }

    private checkIfMaxValueIsUnique(values: number[]): boolean {
        if (!values || values.length <= 0) {
            return true;
        }

        const maxValue = _.max(values);
        const foundMaxItems = values.filter(item => item === maxValue);

        return foundMaxItems?.length === 1;
    }

    private checkIfMinValueIsUnique(values: number[]): boolean {
        if (!values || values.length <= 0) {
            return true;
        }

        const minValue = _.min(values);
        const foundMaxItems = values.filter(item => item === minValue);

        return foundMaxItems?.length === 1;
    }

    private getSpeakerWithTotalWordCounts(speakerGrouped: { [key: string]: InputModel[] }): { [key: string]: number } {
        const speakerWithTotalWordCounts: { [key: string]: number } = {};
        Object.keys(speakerGrouped).forEach(key => {
            Object.assign(speakerWithTotalWordCounts, { [key]: _.sumBy(speakerGrouped[key], (item: InputModel) => item.Words) });
        });

        return speakerWithTotalWordCounts;
    }
}
