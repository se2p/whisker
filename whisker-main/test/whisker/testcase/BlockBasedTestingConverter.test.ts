import {toBlockBasedTest} from "../../../src/whisker/testcase/BlockBasedTestingConverter";
import {WhiskerTest} from "../../../src/whisker/testgenerator/WhiskerTest";
import {WhiskerAssertion} from "../../../src/whisker/testgenerator/assertions/WhiskerAssertion";
import {EventAndParameters} from "../../../src/whisker/testcase/ExecutionTrace";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";

describe("BlockBasedTestingConverter: Whisker test to BBT conversion", () => {

    test("Convert WaitEvents Test", () => {

        const whiskerTest: WhiskerTest = {
            "assertions": new Map<number, WhiskerAssertion[]>(),
            "chromosome": {
                "trace": {
                    "events": [
                        new EventAndParameters(new WaitEvent(50), [250]),
                        new EventAndParameters(new WaitEvent(1), [])
                    ]
                }
            },
            "getAssertionsAt": jest.fn(() => [])
        } as unknown as WhiskerTest;

        const expectedBBT = {
            "title": "Generated Test 1",
            "blocks": [
                {
                    "id": expect.any(String),
                    "opcode": "bbt_testHat",
                    "inputs": {
                        "testName": {
                            "name": "testName",
                            "block": expect.any(String),
                            "shadow": expect.any(String),
                        }
                    },
                    "fields": {},
                    "next": expect.any(String),
                    "topLevel": true,
                    "parent": null,
                    "shadow": false,
                    "x": 400,
                    "y": 200,
                    "breakpoint": false
                },
                {
                    "id": expect.any(String),
                    "opcode": "text",
                    "inputs": {},
                    "fields": {
                        "TEXT": {
                            "name": "TEXT",
                            "value": "Generated Test 1"
                        }
                    },
                    "next": null,
                    "topLevel": false,
                    "parent": expect.any(String),
                    "shadow": true,
                    "breakpoint": false
                },
                {
                    "id": expect.any(String),
                    "opcode": "bbt_setTimeoutTo",
                    "inputs": {
                        "TIMEOUT": {
                            "name": "TIMEOUT",
                            "block": expect.any(String),
                            "shadow": expect.any(String),
                        }
                    },
                    "fields": {},
                    "next": expect.any(String),
                    "topLevel": false,
                    "parent": expect.any(String),
                    "shadow": false,
                    "breakpoint": false
                },
                {
                    "id": expect.any(String),
                    "opcode": "math_number",
                    "inputs": {},
                    "fields": {
                        "NUM": {
                            "name": "NUM",
                            "value": "60"
                        }
                    },
                    "next": null,
                    "topLevel": false,
                    "parent": expect.any(String),
                    "shadow": true,
                    "breakpoint": false
                },
                {
                    "id": expect.any(String),
                    "opcode": "bbt_triggerGreenFlag",
                    "inputs": {},
                    "fields": {},
                    "next": expect.any(String),
                    "topLevel": false,
                    "parent": expect.any(String),
                    "shadow": false,
                    "breakpoint": false
                },
                {
                    "id": expect.any(String),
                    "opcode": "bbt_yieldMultipleTimes",
                    "inputs": {
                        "COUNT": {
                            "name": "COUNT",
                            "block": expect.any(String),
                            "shadow": expect.any(String),
                        }
                    },
                    "fields": {},
                    "next": expect.any(String),
                    "topLevel": false,
                    "parent": expect.any(String),
                    "shadow": false,
                    "breakpoint": false
                },
                {
                    "id": expect.any(String),
                    "opcode": "math_number",
                    "inputs": {},
                    "fields": {
                        "NUM": {
                            "name": "NUM",
                            "value": "50"
                        }
                    },
                    "next": null,
                    "topLevel": false,
                    "parent": expect.any(String),
                    "shadow": true,
                    "breakpoint": false
                },
                {
                    "id": expect.any(String),
                    "opcode": "bbt_yieldMultipleTimes",
                    "inputs": {
                        "COUNT": {
                            "name": "COUNT",
                            "block": expect.any(String),
                            "shadow": expect.any(String),
                        }
                    },
                    "fields": {},
                    "next": expect.any(String),
                    "topLevel": false,
                    "parent": expect.any(String),
                    "shadow": false,
                    "breakpoint": false
                },
                {
                    "id": expect.any(String),
                    "opcode": "math_number",
                    "inputs": {},
                    "fields": {
                        "NUM": {
                            "name": "NUM",
                            "value": "1"
                        }
                    },
                    "next": null,
                    "topLevel": false,
                    "parent": expect.any(String),
                    "shadow": true,
                    "breakpoint": false
                },
                {
                    "id": expect.any(String),
                    "opcode": "bbt_testEnd",
                    "inputs": {},
                    "fields": {},
                    "next": null,
                    "topLevel": false,
                    "parent": expect.any(String),
                    "shadow": false,
                    "breakpoint": false
                }
            ],
            "comment": null
        };

        const actualBBT = toBlockBasedTest(whiskerTest);

        expect(actualBBT).toEqual(expectedBBT);
    });

});
