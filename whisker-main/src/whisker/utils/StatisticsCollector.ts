/*
 * Copyright (C) 2020 Whisker contributors
 *
 * This file is part of the Whisker test generator for Scratch.
 *
 * Whisker is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Whisker is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Whisker. If not, see http://www.gnu.org/licenses/.
 *
 */

import {FitnessFunction} from "../search/FitnessFunction";
import {Chromosome} from "../search/Chromosome";
import {NetworkChromosome} from "../whiskerNet/Networks/NetworkChromosome";

/**
 * Singleton class to collect statistics from search runs
 *
 */
export class StatisticsCollector {

    private static _instance: StatisticsCollector;

    private _projectName: string;
    private _configName: string;
    private _fitnessFunctionCount: number;
    private _iterationCount: number;
    private _coveredFitnessFunctionsCount: number; // fitness value == 0 means covered
    private _bestCoverage: number;
    private _eventsCount: number; //executed events
    private _testEventCount: number; //events in final test suite
    private _bestTestSuiteSize: number;
    private _numberFitnessEvaluations: number;
    private _executedTests: number
    private _createdTestsToReachFullCoverage: number;
    private _startTime: number;
    private _averageTestExecutionTime: number;
    private _averageTestExecutionCount: number;
    private _timeToReachFullCoverage: number;
    private readonly _covOverTime: Map<number, number>;
    private readonly coveredFitnessFunctions: FitnessFunction<Chromosome>[];

    // Neuroevolution
    private _highestNetworkFitness: number;
    private _highestScore: number;
    private _highestPlayTime: number;
    private readonly _fitnessOverTime: Map<number, [number, number, number, number]>;

    // Dynamic Suite
    private _testName: string;
    private readonly _networks: NetworkChromosome[];
    private _surpriseAdequacy: number;
    private _surpriseNodeAdequacy: number;

    private readonly _unknownProject = "(unknown)";
    private readonly _unknownConfig = "(unknown)"

    /**
     * Private constructor to avoid instantiation
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    private constructor() {
        this._projectName = this._unknownProject;
        this._configName = this._unknownConfig;
        this._fitnessFunctionCount = 0;
        this._iterationCount = 0;
        this._coveredFitnessFunctionsCount = 0;
        this._eventsCount = 0;
        this._bestTestSuiteSize = 0;
        this._bestCoverage = 0;
        this._startTime = 0;
        this._executedTests = 0;
        this._averageTestExecutionTime = 0;
        this._averageTestExecutionCount = 0;
        this._testEventCount = 0;
        this._numberFitnessEvaluations = 0;
        this._highestNetworkFitness = 0;
        this._covOverTime = new Map<number, number>();
        // Values are [coverage, fitness, score, survive]
        this._fitnessOverTime = new Map<number, [number, number, number, number]>();
        this.coveredFitnessFunctions = [];
        this._highestScore = 0;
        this._highestPlayTime = 0;
        this._networks = [];
        this._surpriseAdequacy = 0;
        this._surpriseNodeAdequacy = 0;
    }

    public static getInstance(): StatisticsCollector {
        if (!StatisticsCollector._instance) {
            StatisticsCollector._instance = new StatisticsCollector();
        }

        return StatisticsCollector._instance;
    }

    get projectName(): string {
        return this._projectName;
    }

    set projectName(value: string) {
        this._projectName = value;
    }

    get configName(): string {
        return this._configName;
    }

    set configName(value: string) {
        this._configName = value;
    }

    get fitnessFunctionCount(): number {
        return this._fitnessFunctionCount;
    }

    set fitnessFunctionCount(value: number) {
        this._fitnessFunctionCount = value;
    }

    get iterationCount(): number {
        return this._iterationCount;
    }

    set iterationCount(value: number) {
        this._iterationCount = value;
    }

    /**
     * Increments the number of iterations by one
     */
    public incrementIterationCount(): void {
        this._iterationCount++;
    }

    get coveredFitnessFunctionsCount(): number {
        return this._coveredFitnessFunctionsCount;
    }

    set coveredFitnessFunctionsCount(value: number) {
        this._coveredFitnessFunctionsCount = value;
    }

    /**
     * Increments the number of covered fitness functions by one
     */
    public incrementCoveredFitnessFunctionCount(coveredFitnessFunction: FitnessFunction<Chromosome>): void {
        if (!this.coveredFitnessFunctions.includes(coveredFitnessFunction)) {
            this.coveredFitnessFunctions.push(coveredFitnessFunction);
            this._coveredFitnessFunctionsCount++;
            const timeStamp = Date.now() - this._startTime;
            this._covOverTime.set(timeStamp, this._coveredFitnessFunctionsCount);
        }
    }

    public updateHighestNetworkFitness(networkFitness: number): void {
        if (networkFitness > this._highestNetworkFitness) {
            this._highestNetworkFitness = networkFitness;
        }
    }

    public updateAverageTestExecutionTime(newValue: number): void {
        this._averageTestExecutionCount++;
        this._averageTestExecutionTime = this._averageTestExecutionTime + (
            (newValue - this._averageTestExecutionTime) / this._averageTestExecutionCount);
    }

    public updateHighestScore(value: number): void {
        if (value > this.highestScore) {
            this._highestScore = value;
        }
    }

    public updateHighestPlaytime(value: number): void {
        if (value > this.highestPlayTime) {
            this._highestPlayTime = value;
        }
    }

    public updateFitnessOverTime(timeStamp: number, value: [number, number, number, number]): void {
        this._fitnessOverTime.set(timeStamp, value);
    }

    public incrementExecutedTests(): void {
        this._executedTests++;
    }

    get bestCoverage(): number {
        return this._bestCoverage;
    }

    set bestCoverage(value: number) {
        this._bestCoverage = value;
    }

    get eventsCount(): number {
        return this._eventsCount;
    }

    set eventsCount(value: number) {
        this._eventsCount = value;
    }

    /**
     * Increments the number executed events by one
     */
    public incrementEventsCount(): void {
        this._eventsCount++;
    }

    get bestTestSuiteSize(): number {
        return this._bestTestSuiteSize;
    }

    set bestTestSuiteSize(value: number) {
        this._bestTestSuiteSize = value;
    }

    get testEventCount(): number {
        return this._testEventCount;
    }

    set testEventCount(value: number) {
        this._testEventCount = value;
    }

    get numberFitnessEvaluations(): number {
        return this._numberFitnessEvaluations;
    }

    set numberFitnessEvaluations(value: number) {
        this._numberFitnessEvaluations = value;
    }

    get createdTestsToReachFullCoverage(): number {
        return this._createdTestsToReachFullCoverage;
    }

    set createdTestsToReachFullCoverage(value: number) {
        this._createdTestsToReachFullCoverage = value;
    }

    get startTime(): number {
        return this._startTime;
    }

    set startTime(value: number) {
        this._startTime = value;
    }

    get timeToReachFullCoverage(): number {
        return this._timeToReachFullCoverage;
    }

    set timeToReachFullCoverage(value: number) {
        this._timeToReachFullCoverage = value;
    }

    set testName(value: string) {
        this._testName = value;
    }

    get networks(): NetworkChromosome[] {
        return this._networks;
    }

    get surpriseAdequacy(): number {
        return this._surpriseAdequacy;
    }

    set surpriseAdequacy(value: number) {
        this._surpriseAdequacy = value;
    }

    get surpriseNodeAdequacy(): number {
        return this._surpriseNodeAdequacy;
    }

    set surpriseNodeAdequacy(value: number) {
        this._surpriseNodeAdequacy = value;
    }

    get highestScore(): number {
        return this._highestScore;
    }

    get highestPlayTime(): number {
        return this._highestPlayTime;
    }

    /**
     * Outputs a CSV string that summarizes statistics about the search. Among others, this includes a so-called
     * fitness timeline, which reports the achieved coverage over time. In some cases, it might be desirable to
     * truncate this timeline. The optional parameter `numberOfCoverageValues` can be used to specify how many entries
     * this timeline should consist of. If no value or `undefined` is given, all entries are included.
     *
     * @param numberOfCoverageValues the number of entries in the fitness timeline (optional)
     */
    public asCsv(numberOfCoverageValues?: number): string {
        // Extract timestamps, sorted in ascending order, and the corresponding coverage values.
        const coverageStatsMap = this._adjustCoverageOverTime();
        const timestamps = [...coverageStatsMap.keys()].sort((a, b) => a - b);
        const coverages = timestamps.map((ts) => coverageStatsMap.get(ts));

        let header = timestamps;
        let values = coverages;

        // Truncate the fitness timeline to the given numberOfCoverageValues if necessary.
        const truncateFitnessTimeline = numberOfCoverageValues != undefined && 0 <= numberOfCoverageValues;

        // If the search stops before the maximum time has passed, then the CSV file will only include columns up to
        // that time, and not until the final time. As a result, experiment data becomes difficult to merge. Therefore,
        // the number of columns should be padded in this case so that the number of columns is always identical.
        if (truncateFitnessTimeline) {
            const nextTimeStamp = timestamps[timestamps.length - 1] + 1000;
            const nextCoverageValue = coverages[coverages.length - 1];

            const lengthDiff = Math.abs(numberOfCoverageValues - timestamps.length);

            const range: (until: number) => number[] = (until) => [...Array(until).keys()];
            const headerPadding = range(lengthDiff).map(x => nextTimeStamp + x * 1000)
            const valuePadding = Array(lengthDiff).fill(nextCoverageValue);

            header = [...header, ...headerPadding].slice(0, numberOfCoverageValues);
            values = [...values, ...valuePadding].slice(0, numberOfCoverageValues);
        }

        const coveragesHeaders = header.join(",");
        const coverageValues = values.join(",");

        const headers = ["projectName", "configName", "fitnessFunctionCount", "iterationCount", "coveredFitnessFunctionCount",
            "bestCoverage", "testsuiteEventCount", "executedEventsCount", "executedTests", "averageTestExecutionTime",
            "bestTestSuiteSize", "numberFitnessEvaluations", "createdTestsToReachFullCoverage",
            "timeToReachFullCoverage"];
        const headerRow = headers.join(",").concat(",", coveragesHeaders);
        const data = [this._projectName, this._configName, this._fitnessFunctionCount, this._iterationCount,
            this._coveredFitnessFunctionsCount, this._bestCoverage, this._testEventCount, this._eventsCount,
            this._executedTests, this._averageTestExecutionTime, this._bestTestSuiteSize,
            this._numberFitnessEvaluations, this._createdTestsToReachFullCoverage, this._timeToReachFullCoverage];
        const dataRow = data.join(",").concat(",", coverageValues);
        return [headerRow, dataRow].join("\n");
    }

    public asCsvNeuroevolution(sampleDistance?: number, maxTimeStamp?: number): string {
        let fitnessHeaders: string;
        let fitnessValues: string;

        if (sampleDistance && maxTimeStamp) {
            const fitnessTimeline = this._adjustFitnessOverEvaluations(sampleDistance);
            const header = [...fitnessTimeline.keys()];

            const values: string[] = []
            for (const value of fitnessTimeline.values()) {
                values.push(value.join('|'));
            }

            // Extend the header and corresponding values up to the maxTimeStamp.
            let latestKey = header[header.length - 1];
            while (latestKey < maxTimeStamp) {
                latestKey += sampleDistance;
                header.push(latestKey);
                values.push(values[values.length - 1]);
            }

            fitnessHeaders = header.join(",");
            fitnessValues = values.join(",");
        }

        // Default header and data arrays
        const headers = ["projectName", "configName", "fitnessFunctionCount", "iterationCount", "coveredFitnessFunctionCount",
            "bestCoverage", "numberFitnessEvaluations", "timeToReachFullCoverage", "highestNetworkFitness", 'score', 'playTime'];
        const data = [this._projectName, this._configName, this._fitnessFunctionCount, this._iterationCount,
            this._coveredFitnessFunctionsCount, this._bestCoverage, this._numberFitnessEvaluations,
            this._timeToReachFullCoverage, this._highestNetworkFitness, this._highestScore, this._highestPlayTime];

        // Combine the header and data arrays
        const header = fitnessHeaders === undefined ? headers.join(',') : headers.join(",").concat(",", fitnessHeaders);
        const body = fitnessValues === undefined ? data.join(',') : data.join(",").concat(",", fitnessValues);
        return [header, body].join("\n");
    }

    public asCsvNetworkSuite(): string {
        let csv = "projectName,testName,network,fitnessFunctionCount,totalCoveredFitnessFunctionCount,score," +
            "playTime,surpriseStepAdequacy,surpriseNodeAdequacy,surpriseCounterNormalised,zScore\n";

        this.networks.sort((a, b) => b.fitness - a.fitness);
        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i];
            const data = [this._projectName, this._testName, i, this._fitnessFunctionCount,
                this._coveredFitnessFunctionsCount, network.score, network.playTime, network.surpriseAdequacyStep,
                network.surpriseAdequacyNodes, network.surpriseCounterNormalised, network.zScore];
            const dataRow = data.join(",").concat("\n");
            csv = csv.concat(dataRow);
        }
        return csv;
    }

    private _adjustFitnessOverEvaluations(sampleDistance: number): Map<number, [number, number, number, number]> {
        const adjusted: Map<number, [number, number, number, number]> = new Map();
        let maxEvaluations = 0;
        for (const evaluationSample of this._fitnessOverTime.keys()) {
            const rounded = Math.round(evaluationSample / sampleDistance) * sampleDistance;
            adjusted.set(rounded, this._fitnessOverTime.get(evaluationSample));
            if (rounded > maxEvaluations) {
                maxEvaluations = rounded;
            }

        }
        let maxCov: [number, number, number, number] = [0, 0, 0, 0];
        for (let i = 0; i <= maxEvaluations; i = i + sampleDistance) {
            if (adjusted.has(i)) {
                maxCov = adjusted.get(i);
            } else {
                adjusted.set(i, maxCov);
            }
        }

        return adjusted;
    }

    private _adjustCoverageOverTime() {
        const adjusted: Map<number, number> = new Map();
        let maxTime = 0;
        for (const timestamp of this._covOverTime.keys()) {
            const rounded = Math.round(timestamp / 1000) * 1000;
            adjusted.set(rounded, this._covOverTime.get(timestamp));
            if (rounded > maxTime) {
                maxTime = rounded;
            }

        }
        let maxCov = 0;
        for (let i = 0; i <= maxTime; i = i + 1000) {
            if (adjusted.has(i)) {
                maxCov = adjusted.get(i);
            } else {
                adjusted.set(i, maxCov);
            }
        }


        return adjusted;
    }

    public reset(): void {
        this._fitnessFunctionCount = 0;
        this._iterationCount = 0;
        this._coveredFitnessFunctionsCount = 0;
        this._eventsCount = 0;
        this._bestTestSuiteSize = 0;
        this._bestCoverage = 0;
        this._startTime = Date.now();
        this._projectName = this._unknownProject;
        this._configName = this._unknownConfig;
    }
}
