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

/* eslint-disable no-console */

import {TestGenerator} from "./testgenerator/TestGenerator";
import WhiskerUtil from "../test/whisker-util.js";
import {WhiskerTest} from "./testgenerator/WhiskerTest";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {WhiskerSearchConfiguration} from "./utils/WhiskerSearchConfiguration";
import {Container} from "./utils/Container";
import {StatisticsCollector} from "./utils/StatisticsCollector";
import {Randomness} from "./utils/Randomness";
import {JavaScriptConverter} from "./testcase/JavaScriptConverter";
import {toBlockBasedTests} from "./testcase/BlockBasedTestingConverter";
import {TestChromosome} from "./testcase/TestChromosome";
import {EventAndParameters, ExecutionTrace} from "./testcase/ExecutionTrace";
import {WaitEvent} from "./testcase/events/WaitEvent";
import {WhiskerTestListWithSummary} from "./testgenerator/WhiskerTestListWithSummary";
import {FixedTimeStoppingCondition} from "./search/stoppingconditions/FixedTimeStoppingCondition";
import {OneOfStoppingCondition} from "./search/stoppingconditions/OneOfStoppingCondition";
import {ScratchEventExtractor} from "./testcase/ScratchEventExtractor";
import {StoppingCondition} from "./search/StoppingCondition";
import {Chromosome} from "./search/Chromosome";
import {ScratchProject} from "./scratch/ScratchProject";
import logger from "../util/logger";
import {SearchResult} from "../types/SearchResult";
import {BasicNeuroevolutionParameter} from "./agentTraining/neuroevolution/hyperparameter/BasicNeuroevolutionParameter";
import {RLTestSuite} from "./agentTraining/reinforcementLearning/misc/RLTestSuite";

export class Search {

    public vm: VirtualMachine;

    constructor(vm: VirtualMachine) {
        this.vm = vm;
    }

    private async execute(project: ScratchProject, config: WhiskerSearchConfiguration): Promise<WhiskerTestListWithSummary | RLTestSuite> {
        logger.info("test generation");

        const testGenerator: TestGenerator = config.getTestGenerator();
        TestGenerator.initializeCoverageMappings();
        return await testGenerator.generateTests(project);
    }

    private testsToString(tests: WhiskerTest[]): string {
        const converter = new JavaScriptConverter();
        return converter.getSuiteText(tests);
    }

    private handleEmptyProject(): string {
        logger.warn("Cannot find any suitable events for this project, not starting search.");
        const stats = StatisticsCollector.getInstance();
        TestGenerator.initializeCoverageMappings();

        let hasBlocks = false;
        for (const target of this.vm.runtime.targets) {
            if ('blocks' in target) {
                if (target.blocks._blocks) {
                    hasBlocks = true;
                    break;
                }
            }
        }
        if (!hasBlocks) {
            logger.warn("Project contains no code");
        }

        const csvString: string = stats.asCsv();
        logger.info(csvString);

        const tests: WhiskerTest[] = [];
        const dummyTest = new TestChromosome([], null, null);
        const events: EventAndParameters[] = [];
        events.push(new EventAndParameters(new WaitEvent(), [0]));
        dummyTest.trace = new ExecutionTrace(null, events);

        tests.push(new WhiskerTest(dummyTest));

        return this.testsToString(tests);
    }

    private outputCSV(config: WhiskerSearchConfiguration): string {
        /*
         * When a FixedTimeStoppingCondition is used, the search is allowed to run for at most n seconds. The CSV output
         * contains a fitness timeline, which tells the achieved coverage over time. In our case, we would expect the
         * timeline to contain at most n entries. However, for certain projects, this number might actually be exceeded.
         * For example, if a project contains a "wait 60 seconds" block, we might get n+60 entries. This is
         * inconvenient as it makes data analysis more complicated. Therefore, we truncate the timeline to n entries.
         */
        let stoppingCondition: StoppingCondition<Chromosome>;
        if (config.searchAlgorithmProperties instanceof BasicNeuroevolutionParameter ||
            config.getAlgorithm() === 'dql') {
            let upperBound: number = undefined;
            stoppingCondition = config.neuroevolutionProperties.stoppingCondition;
            if (stoppingCondition instanceof FixedTimeStoppingCondition) {
                upperBound = stoppingCondition.maxTime;
            } else if (stoppingCondition instanceof OneOfStoppingCondition) {
                for (const d of stoppingCondition.conditions) {
                    if (d instanceof FixedTimeStoppingCondition) {
                        upperBound = d.maxTime;
                    }
                }
            }
            // Sample every minute
            const csvOutput = StatisticsCollector.getInstance().asCSVAgentTraining(60000, upperBound);
            logger.info(csvOutput);
            return csvOutput;
        } else {
            stoppingCondition = config.searchAlgorithmProperties.stoppingCondition;
        }

        // Retrieve the time limit (in milliseconds) of the search, if any.
        let maxTime: number = undefined;
        if (stoppingCondition instanceof FixedTimeStoppingCondition) {
            maxTime = stoppingCondition.maxTime;
        } else if (stoppingCondition instanceof OneOfStoppingCondition) {
            for (const d of stoppingCondition.conditions) {
                if (d instanceof FixedTimeStoppingCondition) {
                    if (maxTime == undefined || maxTime > d.maxTime) { // take the minimum
                        maxTime = d.maxTime;
                    }
                }
            }
        }

        const truncateFitnessTimeline = maxTime != undefined;
        let csvString: string;
        if (truncateFitnessTimeline) {
            // Sample every 10 seconds.
            csvString = StatisticsCollector.getInstance().asCsv(10000, maxTime);
        } else {
            csvString = StatisticsCollector.getInstance().asCsv();
        }
        logger.info(csvString);
        return csvString;
    }

    /*
     * Main entry point -- called from whisker-web
     */
    public async run(vm: VirtualMachine, project: ScratchProject, projectName: string, configRaw: string,
                     configName: string, accelerationFactor: number, seedString: string, generateBBTs: boolean,
                     groundTruth?: string, winningStates?: string, generateBBTsAddComment?: boolean):
        Promise<SearchResult> {

        logger.info("Starting Search based algorithm");
        const util = new WhiskerUtil(vm, project);
        Container.vm = vm;
        Container.vmWrapper = util.getVMWrapper();
        Container.testDriver = util.getTestDriver({});
        Container.acceleration = accelerationFactor;

        const configJson = JSON.parse(configRaw);
        const config = new WhiskerSearchConfiguration(configJson);
        Container.config = config;

        vm.setInterrogativeDebuggerSupported(false);
        if (!ScratchEventExtractor.hasEvents(this.vm)) {
            return {
                javaScriptText: this.handleEmptyProject(),
                summary: 'empty project',
                csvOutput: '',
                blockBasedTests: []
            };
        }
        config.setReservedCodons(vm);
        logger.info(this.vm);

        await util.prepare(accelerationFactor || 1);
        await util.start();

        // Specify seed
        const configSeed = config.getRandomSeed();
        if (seedString !== 'undefined' && seedString !== "") {
            // Prioritize seed set by CLI
            if (configSeed) {
                logger.warn(`You have specified two seeds! Using seed ${seedString} from the CLI and ignoring \
seed ${configSeed} defined within the config files.`);
            }
            Randomness.setInitialSeeds(seedString);
        } else if (configSeed) {
            Randomness.setInitialSeeds(configSeed);
        } else {
            Randomness.setInitialSeeds(Date.now());
        }

        // Check presence of groundTruth for Neatest + backpropagation.
        if (groundTruth) {
            Container.backpropagationData = JSON.parse(groundTruth);
        }

        if (winningStates) {
            StatisticsCollector.getInstance().parseWinningStates(winningStates);
        }

        StatisticsCollector.getInstance().reset();
        StatisticsCollector.getInstance().projectName = projectName;
        StatisticsCollector.getInstance().configName = configName;
        const testListWithSummary = await this.execute(project, config);

        const csvOutput = this.outputCSV(config);
        if (testListWithSummary instanceof RLTestSuite) {
            return {
                javaScriptText: "",
                summary: "uncovered",   // Keyword for the servant to start test download and close page.
                csvOutput: csvOutput,
                blockBasedTests: [],
                agentTests: testListWithSummary.testCases
            };
        }

        const tests = testListWithSummary.testList;
        const javaScriptText = this.testsToString(tests);

        let blockBasedTests = [];
        if (generateBBTs) {
            blockBasedTests = toBlockBasedTests(tests, generateBBTsAddComment);
        }

        return {
            javaScriptText: javaScriptText,
            summary: testListWithSummary.summary,
            csvOutput: csvOutput,
            blockBasedTests: blockBasedTests
        };
    }
}
