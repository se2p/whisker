/*
 * Copyright (C) 2025 Whisker contributors
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

import {WhiskerTest} from "../testgenerator/WhiskerTest";
import uid from "scratch-vm/src/util/uid";

import {BlockBasedTest} from "../../types/BlockBasedTest";
import {ScratchScriptSnippet} from "../../types/ScratchScriptSnippet";
import {ScratchVMBlock} from "../../types/ScratchVMBlock";

/**
 * Default timeout value for Block-Based Tests.
 */
const DEFAULT_TIMEOUT = 60;

/**
 * Counter used to give unique names and positions to Block-Based Tests.
 */
let counter = 0;

/**
 * Converts a Whisker test to a Block-Based Test.
 *
 * @param test the Whisker test to convert
 * @param addDescriptionAsComment whether a comment should be appended to the BBT test hat,
 * containing the natural language textual description
 */
function toBlockBasedTest(test: WhiskerTest, addDescriptionAsComment = false): BlockBasedTest {
    const testName = "Generated Test " + (++counter);

    let blockBasedTestSnippets: Array<ScratchScriptSnippet> = [];

    // All BBTs start with a hat block, a set-timeout block and a trigger-green-flag block.
    // The trigger-green-flag block is necessary due to Whisker's VM Wrapper containing a
    // this.vm.greenFlag() call in its start() function.
    blockBasedTestSnippets.push(generateBBTHatBlock(testName));
    blockBasedTestSnippets.push(generateBBTSetTimeout(DEFAULT_TIMEOUT));
    blockBasedTestSnippets.push(generateBBTTriggerGreenFlagBlock());

    // convert events and assertions
    for (let i = 0; i < test.chromosome.trace.events.length; i++) {
        const {event} = test.chromosome.trace.events[i];
        blockBasedTestSnippets.push(event.toScratchBlocks());

        for (const assertion of test.getAssertionsAt(i)) {
            blockBasedTestSnippets.push(assertion.toScratchBlocks());
        }
    }

    // all BBTs end with a restore-state-block
    blockBasedTestSnippets.push(generateBBTRestoreStateBlock());

    // filter out null values (not all events/assertions can be represented as blocks)
    blockBasedTestSnippets = blockBasedTestSnippets.filter(snippet => snippet !== null);

    // link the snippets' first and last blocks to form a script
    for (let i = 0; i < blockBasedTestSnippets.length; i++) {
        if (i > 0) {
            blockBasedTestSnippets[i].first.parent = blockBasedTestSnippets[i - 1].last.id;
        }
        if (i < blockBasedTestSnippets.length - 1) {
            blockBasedTestSnippets[i].last.next = blockBasedTestSnippets[i + 1].first.id;
        }
    }

    return {
        title: testName,
        blocks: blockBasedTestSnippets.flatMap(snippet => snippet.blocks),
        // add the natural language textual representation of the Whisker test as comment
        comment: addDescriptionAsComment ? test.toString() : null
    };
}

/**
 * Converts a list of Whisker tests to Block-Based Tests.
 *
 * @param tests the Whisker tests to convert
 * @param addDescriptionAsComment whether a comment should be appended to the BBT test hat,
 * containing the natural language textual description
 */
function toBlockBasedTests(tests: WhiskerTest[], addDescriptionAsComment = false): BlockBasedTest[] {
    return tests.map(whiskerTest => {
        return whiskerTest.toBlockBasedTest(addDescriptionAsComment);
    });
}

function generateBBTHatBlock(testName: string): ScratchScriptSnippet {
    const hatBlockId = uid();
    const testNameInputBlockId = uid();

    const hatBlock: ScratchVMBlock =
        {
            "id": hatBlockId,
            "opcode": "bbt_testHat",
            "inputs": {
                "testName": {
                    "name": "testName",
                    "block": testNameInputBlockId,
                    "shadow": testNameInputBlockId
                }
            },
            "fields": {},
            "next": null,
            "topLevel": true,
            "parent": null,
            "shadow": false,
            "x": 400 * counter,
            "y": 200 * counter,
            "breakpoint": false
        };

    const inputBlock: ScratchVMBlock =
        {
            "id": testNameInputBlockId,
            "opcode": "text",
            "inputs": {},
            "fields": {
                "TEXT": {
                    "name": "TEXT",
                    "value": testName
                }
            },
            "next": null,
            "topLevel": false,
            "parent": hatBlockId,
            "shadow": true,
            "breakpoint": false
        };

    return {blocks: [hatBlock, inputBlock], first: hatBlock, last: hatBlock};
}

function generateBBTSetTimeout(timeoutInSecs: number): ScratchScriptSnippet {
    const timeoutBlockId = uid();
    const timeoutTimeInputBlockId = uid();

    const timeoutBlock: ScratchVMBlock =
        {
            "id": timeoutBlockId,
            "opcode": "bbt_setTimeoutTo",
            "inputs": {
                "TIMEOUT": {
                    "name": "TIMEOUT",
                    "block": timeoutTimeInputBlockId,
                    "shadow": timeoutTimeInputBlockId
                }
            },
            "fields": {},
            "next": null,
            "topLevel": false,
            "parent": null,
            "shadow": false,
            "breakpoint": false
        };

    const inputBlock: ScratchVMBlock =
        {
            "id": timeoutTimeInputBlockId,
            "opcode": "math_number",
            "inputs": {},
            "fields": {
                "NUM": {
                    "name": "NUM",
                    "value": timeoutInSecs.toString()
                }
            },
            "next": null,
            "topLevel": false,
            "parent": timeoutBlockId,
            "shadow": true,
            "breakpoint": false
        };

    return {blocks: [timeoutBlock, inputBlock], first: timeoutBlock, last: timeoutBlock};
}

function generateBBTTriggerGreenFlagBlock(): ScratchScriptSnippet {
    const block: ScratchVMBlock = {
        "id": uid(),
        "opcode": "bbt_triggerGreenFlag",
        "inputs": {},
        "fields": {},
        "next": null,
        "topLevel": false,
        "parent": null,
        "shadow": false,
        "breakpoint": false
    };

    return {blocks: [block], first: block, last: block};
}

function generateBBTRestoreStateBlock(): ScratchScriptSnippet {
    const restoreBlock: ScratchVMBlock = {
        "id": uid(),
        "opcode": "bbt_testEnd",
        "inputs": {},
        "fields": {},
        "next": null,
        "topLevel": false,
        "parent": null,
        "shadow": false,
        "breakpoint": false
    };

    return {blocks: [restoreBlock], first: restoreBlock, last: restoreBlock};
}


export {
    toBlockBasedTest,
    toBlockBasedTests
};
