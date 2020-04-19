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
import { assert } from '../test-runner/assert';

export class Search {

    createTestSuite(projectFile: string, testSuiteFile: string): void {
        const scratchProject = new ScratchProject(projectFile);

        // TODO: Probably need to instantiate ScratchVM as well here?

        const testGenerator = this._selectTestGenerator();
        const testSuite = testGenerator.generateTests(scratchProject);

        const testSuiteWriter = new TestSuiteWriter();
        testSuiteWriter.writeTests(testSuiteFile, testSuite);
    }

    _selectTestGenerator(): TestGenerator {
        // TODO: Select RandomTestGenerator, IterativeSearchBasedTestGenerator, or MOGenerator
        throw new NotYetImplementedException();
    }

    public run(vm, project, config): void {
        console.log("Whisker-Main: Starting Search based algorithm");

        const util = new WhiskerUtil(vm, project);

        async function init() {
            await util.prepare(30);
            util.start();
            const t: TestDriver = util.getTestDriver({});
            await t.runForSteps(5);
            const boat = t.getSprites(sprite => sprite.name.includes('Boot'))[0];
            assert.ok(boat.visible, 'boat must be visible');
            assert.ok(boat.currentCostume === 0, 'boat must have the right costume');
            t.end();

        }

        init();
    }
}


