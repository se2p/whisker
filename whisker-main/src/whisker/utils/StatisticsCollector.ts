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

import {StatementFitnessFunction} from "../testcase/fitness/StatementFitnessFunction";
import {Container} from "./Container";
import {BranchCoverageFitnessFunction} from "../testcase/fitness/BranchCoverageFitnessFunction";
import Arrays from "./Arrays";
import {IllegalArgumentException} from "../core/exceptions/IllegalArgumentException";
import {modelCsvHeader, ModelResult, modelResultToCsvData} from "../../test-runner/model-result";
import {TestCase} from "../core/TestCase";


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
    private _eventsCount: number; //executed events
    private _testEventCount: number; //events in the final test suite
    private _bestTestSuiteSize: number;
    private _minimizedTests: number;
    private _minimizedEvents: number;
    private _evaluations: number;
    private _executedTests: number
    private _createdTestsToReachFullCoverage: number;
    private _startTime: number;
    private _averageTestExecutionTime: number;
    private _averageTestExecutionCount: number;
    private _timeToReachFullCoverage: number;
    private _statements: Map<StatementFitnessFunction, number>;
    private _branches: Map<BranchCoverageFitnessFunction, number>;
    private _statementCoverage: number;
    private _branchCoverage: number;
    private _winningStates: Record<string, string>;
    private _seed: number
    private readonly _networkSuiteResults: AgentSuiteResults[];
    private readonly _coverageOverTime: Map<number, CoverageOverTime>;

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
        this._eventsCount = 0;
        this._bestTestSuiteSize = 0;
        this._minimizedTests = 0;
        this._minimizedEvents = 0;
        this._startTime = 0;
        this._executedTests = 0;
        this._averageTestExecutionTime = 0;
        this._averageTestExecutionCount = 0;
        this._testEventCount = 0;
        this._evaluations = 0;
        this._coverageOverTime = new Map<number, CoverageOverTime>();
        this._networkSuiteResults = [];
        this._statementCoverage = 0;
        this._branchCoverage = 0;
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

    set configName(value: string) {
        this._configName = value;
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

    get statementCoverage(): number {
        return this._statementCoverage;
    }

    get branchCoverage(): number {
        return this._branchCoverage;
    }

    set statements(value: Map<StatementFitnessFunction, number>) {
        this._statements = value;
    }

    set branches(value: Map<BranchCoverageFitnessFunction, number>) {
        this._branches = value;
    }

    get branches(): Map<BranchCoverageFitnessFunction, number> {
        return this._branches;
    }

    /**
     * Increments the number of iterations by one
     */
    public incrementIterationCount(): void {
        this._iterationCount++;
    }

    public updateAverageTestExecutionTime(newValue: number): void {
        this._averageTestExecutionCount++;
        this._averageTestExecutionTime = this._averageTestExecutionTime + (
            (newValue - this._averageTestExecutionTime) / this._averageTestExecutionCount);
    }


    public updateHighestStatementCoverage(value: number): void {
        if (value > this._statementCoverage) {
            this._statementCoverage = value;
        }
    }

    public updateHighestBranchCoverage(value: number): void {
        if (value > this._branchCoverage) {
            this._branchCoverage = value;
        }
    }

    public updateCoverageOverTime(timeStamp: number, value: CoverageOverTime): void {
        this._coverageOverTime.set(timeStamp, value);
    }

    set averageTestExecutionTime(value: number) {
        this._averageTestExecutionTime = value;
    }

    public incrementExecutedTests(): void {
        this._executedTests++;
    }

    set executedTests(value: number) {
        this._executedTests = value;
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

    set bestTestSuiteSize(value: number) {
        this._bestTestSuiteSize = value;
    }

    get testEventCount(): number {
        return this._testEventCount;
    }

    set testEventCount(value: number) {
        this._testEventCount = value;
    }

    get evaluations(): number {
        return this._evaluations;
    }

    set evaluations(value: number) {
        this._evaluations = value;
    }

    set minimizedTests(value: number) {
        this._minimizedTests = value;
    }

    addMinimizedEvents(minimizationCount: number): void {
        this._minimizedEvents += minimizationCount;
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

    set timeToReachFullCoverage(value: number) {
        this._timeToReachFullCoverage = value;
    }

    public addAgentSuiteResults(results: AgentSuiteResults): void {
        this._networkSuiteResults.push(results);
    }

    set seed(value: number) {
        this._seed = value;
    }

    /**
     * Outputs a CSV string that summarises statistics about the search.
     * Among others, this includes a coverage timeline, which reports the achieved coverage over time.
     * @param sampleStepSize the step size for sampling coverage values.
     * @param maxTimeStep defines at which point the coverage timeline will be truncated.
     * @returns Formatted csv string containing the results of the search algorithm.
     */
    public asCsv(sampleStepSize = 10000, maxTimeStep?: number): string {
        const [header, values] = this._getPaddedTimeLineData(sampleStepSize, this._adjustCoverageOverTime(sampleStepSize), maxTimeStep);

        const coverageHeaders = header.join(",");
        const coverageValues = values.join(",");

        const headers = ["projectName", "configName", "fitnessFunctionCount", "statements",
            "statementCoverage", "branches", "branchCoverage", "won", "iterationCount", "testsuiteEventCount",
            "executedEventsCount", "executedTests", "minimizedTests", "minimizedEvents", "averageTestExecutionTime",
            "bestTestSuiteSize", "fitnessEvaluations", "generatedTestsForFullCoverage", "searchTimeForFullCoverage"];
        const headerRow = headers.join(",").concat(",", coverageHeaders);
        const data = [this._projectName, this._configName, this._fitnessFunctionCount,
            this._statements.size, this._statementCoverage, this._branches.size, this._branchCoverage,
            this._isWinningStateCovered(), this._iterationCount, this._testEventCount, this._eventsCount,
            this._executedTests, this._minimizedTests, this._minimizedEvents, this._averageTestExecutionTime,
            this._bestTestSuiteSize, this._evaluations, this._createdTestsToReachFullCoverage,
            this._timeToReachFullCoverage];
        const dataRow = data.join(",").concat(",", coverageValues);
        return [headerRow, dataRow].join("\n");
    }

    /**
     * Outputs a CSV string that summarises statistics about the Reinforcement Learning optimization.
     * This includes a {@link CoverageOverTime} timeline, which reports the achieved coverage over time.
     * @param sampleStepSize the step size for sampling coverage values.
     * @param maxTimeStep defines at which point the coverage timeline will be truncated.
     * @returns Formatted csv string containing the results of the Reinforcement Learning algorithm.
     */
    public asCSVAgentTraining(sampleStepSize: number, maxTimeStep: number): string {
        const valuesOverTime = this._adjustCoverageOverTime(sampleStepSize);
        const [header, values] = this._getPaddedTimeLineData(sampleStepSize, valuesOverTime, maxTimeStep);

        const fitnessHeaders = header.join(",");
        const fitnessValues = values.join(",");

        const headers = ["projectName", "configName", "seed", "statements", "statementCoverage", "branches",
            "branchCoverage", 'timeToFullCoverage', "won", "iterations", "evaluations"];
        const data = [this._projectName, this._configName, this._seed, this._statements.size,
            this._statementCoverage, this._branches.size, this._branchCoverage, this._timeToReachFullCoverage,
            this._isWinningStateCovered(), this._iterationCount, this._evaluations];

        // Combine the header and data arrays
        const headerCombined = headers.join(",").concat(",", fitnessHeaders);
        const body = data.join(",").concat(",", fitnessValues);
        return [headerCombined, body].join("\n");
    }

    public asCSVAgentSuite(): string {
        let csv = "projectName,testName,id,seed," +
            "totalStatements,testStatementCoverage,suiteStatementCoverage," +
            "totalBranches,testBranchCoverage,suiteBranchCoverage," +
            "testWon,suiteWon,score,playTime,isMutant" +
            modelCsvHeader + "\n";

        for (const testResult of this._networkSuiteResults) {
            const data = [testResult.projectName, testResult.agentName, testResult.agentID, testResult.seed,
                testResult.statements, testResult.statementCoverageAgent, testResult.statementCoverageSuite,
                testResult.branches, testResult.branchCoverageAgent, testResult.branchCoverageSuite,
                testResult.wonAgent, testResult.wonSuite,
                testResult.score, testResult.playTime, testResult.isMutant,
                ...modelResultToCsvData(testResult.modelResult)
            ];
            const dataRow = data.join(",").concat("\n");
            csv = csv.concat(dataRow);
        }
        return csv;
    }

    /**
     * Format and pad timeline data.
     * @param sampleStepSize the step size for sampling coverage values.
     * @param timelineData the map containing timeline data.
     * @param maxTimeStep defines at which point the coverage timeline will be truncated.
     * @return Array containing the formatted header and body of the coverage timeline for the respective csv row.
     */
    private _getPaddedTimeLineData(sampleStepSize: number, timelineData: Map<number, CoverageOverTime>,
                                   maxTimeStep?: number): [number[], string[]] {
        // Extract timestamps, sorted in ascending order, and the corresponding coverage values.
        const timestamps = [...timelineData.keys()].sort((a, b) => a - b);
        const timelineValues = timestamps.map((ts) => Object.values(timelineData.get(ts)).join('|'));

        let header = timestamps;
        let values = timelineValues;

        // Truncate the fitness timeline to the given numberOfCoverageValues if necessary.
        const truncateTimeline = maxTimeStep !== undefined && 0 <= maxTimeStep;

        // If the search stops before the maximum time has passed, then the CSV file will only include columns up to
        // that time and not until the final time.
        // Therefore, the number of columns should be padded so that the number of columns is always identical.
        if (truncateTimeline) {
            const nextTimeStamp = timestamps[timestamps.length - 1] + sampleStepSize;
            const nextTimelineData = timelineValues[timelineValues.length - 1];

            const lengthDiff = Math.ceil(Math.abs(maxTimeStep - timestamps[timestamps.length - 1]) / sampleStepSize);
            const headerPadding = Arrays.range(0, lengthDiff).map(x => nextTimeStamp + x * sampleStepSize);
            const valuePadding = Array(lengthDiff).fill(nextTimelineData);

            // Plus one since we start at timestamp 0.
            const numHeaderCols = Math.ceil(maxTimeStep / sampleStepSize) + 1;
            header = [...header, ...headerPadding].slice(0, numHeaderCols);
            values = [...values, ...valuePadding].slice(0, numHeaderCols);
        }

        return [header, values];
    }


    private _adjustCoverageOverTime(sampleDistance: number): Map<number, CoverageOverTime> {
        const adjusted: Map<number, CoverageOverTime> = new Map();
        let maxTime = 0;
        for (const timeSample of this._coverageOverTime.keys()) {
            const rounded = Math.round(timeSample / sampleDistance) * sampleDistance;
            adjusted.set(rounded, this._coverageOverTime.get(timeSample));
            if (rounded > maxTime) {
                maxTime = rounded;
            }
        }

        let max: CoverageOverTime = {
            statementCoverage: 0,
            branchCoverage: 0
        };
        for (let i = 0; i <= maxTime; i = i + sampleDistance) {
            if (adjusted.has(i)) {
                max = adjusted.get(i);
            } else {
                adjusted.set(i, max);
            }
        }

        return adjusted;
    }

    public async updateStatementCoverage(solution: TestCase): Promise<void> {
        const stableCount = Container.config.getCoverageStableCount();
        for (const [statement, coverCount] of this._statements.entries()) {
            if (this._statements.get(statement) >= stableCount) {
                continue;
            }
            if (await statement.isCovered(solution)) {
                this._statements.set(statement, coverCount + 1);
            }
        }
    }

    public async updateBranchCoverage(solution: TestCase): Promise<void> {
        const stableCount = Container.config.getCoverageStableCount();
        for (const [branch, coverCount] of this._branches.entries()) {
            if (this._branches.get(branch) >= stableCount) {
                continue;
            }
            if (await branch.isCovered(solution)) {
                this._branches.set(branch, coverCount + 1);
            }
        }
    }

    public computeStatementCoverage(): void {
        let covered = 0;
        const stableCount = Container.config.getCoverageStableCount();
        for (const [st, coverCount] of this._statements.entries()) {
            if (coverCount < stableCount) {
                this._statements.set(st, 0);
            } else {
                covered++;
            }
        }
        this.updateHighestStatementCoverage(covered / this._statements.size);
    }

    public computeBranchCoverage(): void {
        let covered = 0;
        const stableCount = Container.config.getCoverageStableCount();
        for (const [dec, coverCount] of this._branches.entries()) {
            if (coverCount < stableCount) {
                this._branches.set(dec, 0);
            } else {
                covered++;
            }
        }
        this.updateHighestBranchCoverage(covered / this._branches.size);
    }

    public getCoveredStatements(): Set<StatementFitnessFunction> {
        const stableCount = Container.config.getCoverageStableCount();
        return new Set(
            [...this._statements.entries()]
                .filter(([, coverCount]) => coverCount >= stableCount)
                .map(([st]) => st)
        );
    }

    private _isWinningStateCovered(): string {
        const coveredStatements = this.getCoveredStatements();
        const winningState = this.getWinningStateForProject(this._projectName);
        if (!winningState) {
            return "NA";
        }
        const won = [...coveredStatements]
            .some(stat => stat.getNodeId().includes(winningState));
        return `${won}`;
    }

    public parseWinningStates(winningStates: string): void {
        try {
            this._winningStates = JSON.parse(winningStates);
        } catch (e) {
            throw new IllegalArgumentException("Invalid winning states JSON: " + e);
        }
    }

    public getWinningStateForProject(projectName: string): string | null {
        if (!this._winningStates) {
            return null;
        }
        return this._winningStates[projectName.replace(".sb3", "")];
    }

    public reset(): void {
        this._fitnessFunctionCount = 0;
        this._iterationCount = 0;
        this._eventsCount = 0;
        this._bestTestSuiteSize = 0;
        this._startTime = Date.now();
        this._projectName = this._unknownProject;
        this._configName = this._unknownConfig;
    }
}

export interface AgentSuiteResults {
    projectName: string,
    agentName: string,
    agentID: number,
    seed: string,
    statements: number,
    statementCoverageAgent: number,
    statementCoverageSuite: number,
    branches: number,
    branchCoverageAgent: number,
    branchCoverageSuite: number,
    wonAgent: boolean,
    wonSuite: boolean,
    score?: number,
    playTime?: number,
    isMutant?: boolean,
    modelResult?: ModelResult,
}

export interface CoverageOverTime {
    statementCoverage: number,
    branchCoverage: number
}
