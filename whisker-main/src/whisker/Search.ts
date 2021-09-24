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
import {List} from "./utils/List";
import VirtualMachine from "scratch-vm/src/virtual-machine"
import {WhiskerSearchConfiguration} from "./utils/WhiskerSearchConfiguration";
import {Container} from "./utils/Container";
import {StatisticsCollector} from "./utils/StatisticsCollector";
import {Randomness} from "./utils/Randomness";
import {JavaScriptConverter} from "./testcase/JavaScriptConverter";
import {TestChromosome} from "./testcase/TestChromosome";
import {ExecutionTrace} from "./testcase/ExecutionTrace";
import {ScratchEvent} from "./testcase/events/ScratchEvent";
import {WaitEvent} from "./testcase/events/WaitEvent";
import {WhiskerTestListWithSummary} from "./testgenerator/WhiskerTestListWithSummary";
import {FixedTimeStoppingCondition} from "./search/stoppingconditions/FixedTimeStoppingCondition";
import {OneOfStoppingCondition} from "./search/stoppingconditions/OneOfStoppingCondition";
import {ScratchEventExtractor} from "./testcase/ScratchEventExtractor";
import {NeuroevolutionTestGenerator} from "./testgenerator/NeuroevolutionTestGenerator";
import {StoppingCondition} from "./search/StoppingCondition";
import {Chromosome} from "./search/Chromosome";
import {ScratchProject} from "./scratch/ScratchProject";

export class Search {

    public vm: VirtualMachine;

    constructor(vm: VirtualMachine) {
        this.vm = vm;
    }

    private async execute(project: ScratchProject, config: WhiskerSearchConfiguration): Promise<WhiskerTestListWithSummary> {
        console.log("Whisker-Main: test generation");

        const testGenerator: TestGenerator = config.getTestGenerator();
        return await testGenerator.generateTests(project);
    }

    private printTests(tests: List<WhiskerTest>): void {
        let i = 0;
        console.log("Total number of tests: "+tests.size());
        for (const test of tests) {
            console.log("Test "+i+": \n" + test.toString());
            i++;
        }
    }

    private testsToString(tests: List<WhiskerTest>): string {
        const converter = new JavaScriptConverter();
        return converter.getSuiteText(tests);
    }

    private handleEmptyProject(): Array<string> {
        console.log("Cannot find any suitable events for this project, not starting search.")
        const stats = StatisticsCollector.getInstance();

        let hasBlocks = false;
        for (const target of this.vm.runtime.targets) {
            if (target.hasOwnProperty('blocks')) {
                if (target.blocks._blocks) {
                    hasBlocks = true;
                    break;
                }
            }
        }
        if (!hasBlocks) {
            console.log("Project contains no code")
            stats.bestCoverage = 1.0;
        }

        const csvString: string = stats.asCsv();
        console.log(csvString);

        const tests = new List<WhiskerTest>();
        const dummyTest = new TestChromosome(new List<number>(), null, null);
        const events = new List<[ScratchEvent, number[]]>();
        events.add([new WaitEvent(), [0]]);
        dummyTest.trace = new ExecutionTrace([] as unknown as [any], events);

        tests.add(new WhiskerTest(dummyTest));
        const javaScriptText = this.testsToString(tests);
        return [javaScriptText, 'empty project'];
    }

    private outputCSV(config: WhiskerSearchConfiguration): string {
        /*
         * When a FixedTimeStoppingCondition is used, the search is allowed to run for at most n seconds. The CSV output
         * contains a fitness timeline, which tells the achieved coverage over time. In our case, we would expect the
         * timeline to contain at most n entries. However, for certain projects, this number might actually be exceeded.
         * For example, if a project contains a "wait 60 seconds" block, we might get n+60 entries. This is
         * inconvenient as it makes data analysis more complicated. Therefore, we truncate the timeline to n entries.
         */
        let stoppingCondition : StoppingCondition<Chromosome>;
        if (config.getTestGenerator() instanceof NeuroevolutionTestGenerator){
            stoppingCondition = config.neuroevolutionProperties.stoppingCondition;
        }
        else {
            stoppingCondition = config.searchAlgorithmProperties.getStoppingCondition();
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
            // We want one coverage value per second (+ 1 because the timeline starts at 0 seconds.)
            const numberOfCoverageValues = Math.floor(maxTime / 1000) + 1;
            csvString = StatisticsCollector.getInstance().asCsv(numberOfCoverageValues);
        } else {
            csvString = StatisticsCollector.getInstance().asCsv();
        }
        console.log(csvString);
        return csvString;
    }

    /*
     * Main entry point -- called from whisker-web
     */
    public async run(vm: VirtualMachine, project: ScratchProject, projectName: string, configRaw: string,
                     configName: string, accelerationFactor: number, seedString: string): Promise<Array<string>> {
        console.log("Whisker-Main: Starting Search based algorithm");

        const util = new WhiskerUtil(vm, project);
        const configJson = JSON.parse(configRaw);
        const config = new WhiskerSearchConfiguration(configJson);

        Container.config = config;
        Container.vm = vm;
        Container.vmWrapper = util.getVMWrapper();
        Container.testDriver = util.getTestDriver({});
        Container.acceleration = accelerationFactor;
        if (!ScratchEventExtractor.hasEvents(this.vm)) {
            return this.handleEmptyProject();
        }
        console.log(this.vm)

        await util.prepare(accelerationFactor || 1);
        util.start();

        // Specify seed
        const configSeed = config.getRandomSeed();
        let seed: number;
        // Prioritize seed set by CLI
        if (seedString !== 'undefined') {
            seed = parseInt(seedString);
            if (configSeed) {
                console.warn(`Replacing seed ${configSeed} defined within configuration file with seed\
${seed} specified via command line options`)
            }
        }
        // If no seed was set by CLI check if the configuration file specifies a seed.
        else if (configSeed) {
            seed = configSeed;
        }
        // Ultimately, use Date.now() if no seed has been set via the CLI or the configuration file
        else {
            seed = Date.now();
        }
        Randomness.setInitialSeed(seed);
        StatisticsCollector.getInstance().reset();
        StatisticsCollector.getInstance().projectName = projectName;
        StatisticsCollector.getInstance().configName = configName;
        const testListWithSummary = await this.execute(project, config);
        const tests = testListWithSummary.testList;
        this.printTests(tests);
        const csvOutput = this.outputCSV(config);

        const javaScriptText = this.testsToString(tests);
        return [javaScriptText, testListWithSummary.summary, csvOutput];
    }
}
