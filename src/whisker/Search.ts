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

import {ScratchProject} from './scratch/ScratchProject';
import {TestSuiteWriter} from './testgenerator/TestSuiteWriter';
import {TestGenerator} from "./testgenerator/TestGenerator";
import {NotYetImplementedException} from "./core/exceptions/NotYetImplementedException";
import WhiskerUtil from "../test/whisker-util.js";
import TestDriver from "../test/test-driver.js";
import {assert} from '../test-runner/assert';
import {RandomTestGenerator} from "./testgenerator/RandomTestGenerator";
import {WhiskerTest} from "./testgenerator/WhiskerTest";
import {List} from "./utils/List";
import VirtualMachine from "scratch-vm/src/virtual-machine"
import {TestExecutor} from "./testcase/TestExecutor";
import {SearchAlgorithmProperties} from "./search/SearchAlgorithmProperties";
import {TestChromosomeGenerator} from "./testcase/TestChromosomeGenerator";

export class Search {

    public vm: VirtualMachine;
    constructor(vm: VirtualMachine) {
        this.vm = vm;
    }

    createTestSuite(projectFile: string, testSuiteFile: string): List<WhiskerTest> {
//        const scratchProject = new ScratchProject(projectFile);

        // TODO: Probably need to instantiate ScratchVM as well here?

        const testGenerator = this._selectTestGenerator();
        const testSuite = testGenerator.generateTests(null);

        const testSuiteWriter = new TestSuiteWriter();
        testSuiteWriter.writeTests(testSuiteFile, testSuite);

        return testSuite;
    }

    _selectTestGenerator(): TestGenerator {
        // TODO: Select RandomTestGenerator, IterativeSearchBasedTestGenerator, or MOGenerator
//        throw new NotYetImplementedException();
        return new RandomTestGenerator();
    }

    execDummyTest() {
        console.log("Whisker-Main: Exec Dummy")
        // TODO: Need properties for how many tests, and how long
        const searchAlgorithmProperties = new SearchAlgorithmProperties(0, 0, 0);
        searchAlgorithmProperties.setChromosomeLength(10);
        const testGenerator = new TestChromosomeGenerator(searchAlgorithmProperties);

        // TODO: Repeat X times, as configured
        const testChromosome = testGenerator.get();

        console.log("Chromosome: " + testChromosome)
        const executor = new TestExecutor(this.getVirtualMachine())
        executor.execute(testChromosome);
    }

    public getVirtualMachine() {
        if (this.vm == null) {
            throw new Error("Not Initialized");
        }
        return this.vm;
    }

    public run(vm, project, config): void {
        console.log("Whisker-Main: Starting Search based algorithm");

        const util = new WhiskerUtil(vm, project);
        const search: Search = new Search(vm);

        async function init() {
            await util.prepare(30);
            util.start();
            search.execDummyTest();
        }

        init();
    }
}


