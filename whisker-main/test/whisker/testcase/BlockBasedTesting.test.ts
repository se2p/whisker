import {ClickSpriteEvent} from "../../../src/whisker/testcase/events/ClickSpriteEvent";
import {ClickStageEvent} from "../../../src/whisker/testcase/events/ClickStageEvent";
import {DragSpriteEvent} from "../../../src/whisker/testcase/events/DragSpriteEvent";
import {KeyPressEvent} from "../../../src/whisker/testcase/events/KeyPressEvent";
import {MouseDownEvent} from "../../../src/whisker/testcase/events/MouseDownEvent";
import {MouseDownForStepsEvent} from "../../../src/whisker/testcase/events/MouseDownForStepsEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";
import {SoundEvent} from "../../../src/whisker/testcase/events/SoundEvent";
import {TypeTextEvent} from "../../../src/whisker/testcase/events/TypeTextEvent";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";

import {Container} from "../../../src/whisker/utils/Container";
import {WhiskerSearchConfiguration} from "../../../src/whisker/utils/WhiskerSearchConfiguration";
import {ScratchScriptSnippet} from "../../../src/types/ScratchScriptSnippet";
import {ScratchVMBlock} from "../../../src/types/ScratchVMBlock";
import VMWrapper from "../../../src/vm/vm-wrapper";

describe("Test the correct conversion of WhiskerTest events to their Block-Based Test representation", () => {

    test("ClickSpriteEvent: click on a sprite", () => {

        const catSprite = {
            "name": "Sprite1",
            "clones": [],
        };
        const originalTarget = {
            "id": "1",
            "cloneID": null,
            "isOriginal": true,
            "sprite": catSprite
        };
        catSprite.clones.push(originalTarget);

        const clickSpriteEvent = new ClickSpriteEvent(originalTarget, 1);
        const blockRepresentation: ScratchScriptSnippet = clickSpriteEvent.toScratchBlocks();

        const block: ScratchVMBlock = {
            "id": expect.any(String),
            "opcode": "bbt_triggerSpriteClick",
            "inputs": {},
            "fields": {
                "SPRITE": {
                    "name": "SPRITE",
                    "value": "1"
                }
            },
            "next": null,
            "topLevel": false,
            "parent": null,
            "shadow": false,
            "breakpoint": false
        };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [block],
            first: block,
            last: block
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);
    });

    test("ClickSpriteEvent: click on a clone", () => {

        const catSprite = {
            "name": "Sprite1",
            "clones": [],
        };
        const originalTarget = {
            "id": "1",
            "cloneID": null,
            "isOriginal": true,
            "sprite": catSprite
        };
        const cloneTarget = {
            "id": "2",
            "cloneID": 1,
            "isOriginal": false,
            "sprite": catSprite
        };
        catSprite.clones.push(originalTarget, cloneTarget);

        const clickSpriteEvent = new ClickSpriteEvent(cloneTarget, 1);
        const blockRepresentation = clickSpriteEvent.toScratchBlocks();

        const mainBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "bbt_triggerCloneClick",
                "inputs": {
                    "CLONE": {
                        "name": "CLONE",
                        "block": expect.any(String),
                        "shadow": expect.any(String)
                    }
                },
                "fields": {
                    "SPRITE": {
                        "name": "SPRITE",
                        "value": "1"
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const inputFieldBlock: ScratchVMBlock =
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
            };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [mainBlock, inputFieldBlock],
            first: mainBlock,
            last: mainBlock
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);

        const actualMainBlock = blockRepresentation.blocks.find(
            block => block.opcode === "bbt_triggerCloneClick");
        const actualInputFieldBlock = blockRepresentation.blocks.find(
            block => block.opcode === "math_number");

        expect(actualMainBlock.id).not.toEqual(actualInputFieldBlock.id);

        expect(actualMainBlock.inputs["CLONE"]["block"]).toEqual(actualInputFieldBlock.id);
        expect(actualInputFieldBlock.parent).toEqual(actualMainBlock.id);
    });

    test("ClickStageEvent", () => {
        const clickStageEvent = new ClickStageEvent();
        const blockRepresentation = clickStageEvent.toScratchBlocks();

        const block: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "bbt_triggerStageClick",
                "inputs": {},
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [block],
            first: block,
            last: block
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);
    });

    test("DragSpriteEvent", () => {

        const catSprite = {
            "name": "Sprite1",
            "clones": [],
        };
        const originalTarget = {
            "id": "1",
            "cloneID": null,
            "isOriginal": true,
            "sprite": catSprite
        };
        catSprite.clones.push(originalTarget);

        const dragSpriteEvent = new DragSpriteEvent(originalTarget, 111, 222, 0);
        const blockRepresentation = dragSpriteEvent.toScratchBlocks();

        const mainBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "bbt_moveSpriteTo",
                "inputs": {
                    "X": {
                        "name": "X",
                        "block": expect.any(String),
                        "shadow": expect.any(String)
                    },
                    "Y": {
                        "name": "Y",
                        "block": expect.any(String),
                        "shadow": expect.any(String)
                    }
                },
                "fields": {
                    "SPRITE": {
                        "name": "SPRITE",
                        "value": "1"
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const xBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": "111"
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": expect.any(String),
                "shadow": true,
                "breakpoint": false
            };

        const yBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": "222"
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": expect.any(String),
                "shadow": true,
                "breakpoint": false
            };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [mainBlock, xBlock, yBlock],
            first: mainBlock,
            last: mainBlock
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);

        const actualMainBlock = blockRepresentation.blocks[0];
        const actualXBlock = blockRepresentation.blocks[1];
        const actualYBlock = blockRepresentation.blocks[2];

        expect(actualMainBlock.id).not.toEqual(actualXBlock.id);
        expect(actualMainBlock.id).not.toEqual(actualYBlock.id);
        expect(actualXBlock.id).not.toEqual(actualYBlock.id);

        expect(actualMainBlock.inputs["X"]["block"]).toEqual(actualXBlock.id);
        expect(actualMainBlock.inputs["Y"]["block"]).toEqual(actualYBlock.id);
        expect(actualXBlock.parent).toEqual(actualMainBlock.id);
        expect(actualYBlock.parent).toEqual(actualMainBlock.id);
    });

    test("KeyPressEvent: press+release", () => {
        const keyPressEvent = new KeyPressEvent("space");
        const blockRepresentation = keyPressEvent.toScratchBlocks();

        const block: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "bbt_pressKeyAndRelease",
                "inputs": {},
                "fields": {
                    "KEY": {
                        "name": "KEY",
                        "value": "space"
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [block],
            first: block,
            last: block
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);
    });

    test("KeyPressEvent: press+hold", () => {
        const holdDuration = 45; // 1.5 seconds
        const keyPressEvent = new KeyPressEvent("right arrow", holdDuration);
        const blockRepresentation = keyPressEvent.toScratchBlocks();

        const mainBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "bbt_pressKeyAndHold",
                "inputs": {
                    "DURATION": {
                        "name": "DURATION",
                        "block": expect.any(String),
                        "shadow": expect.any(String),
                    }
                },
                "fields": {
                    "KEY": {
                        "name": "KEY",
                        "value": "right arrow"
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const inputBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": (holdDuration / 30).toString()
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": expect.any(String),
                "shadow": true,
                "breakpoint": false
            };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [mainBlock, inputBlock],
            first: mainBlock,
            last: mainBlock
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);

        const actualMainBlock = blockRepresentation.blocks[0];
        const actualInputBlock = blockRepresentation.blocks[1];

        expect(actualMainBlock.id).not.toEqual(actualInputBlock.id);

        expect(actualMainBlock.inputs["DURATION"]["block"]).toEqual(actualInputBlock.id);
        expect(actualInputBlock.parent).toEqual(actualMainBlock.id);
    });

    test("MouseDownEvent", () => {
        const mouseDownEvent = new MouseDownEvent(true);
        const blockRepresentation = mouseDownEvent.toScratchBlocks();

        const block: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "bbt_clickCurrentCursorLocation",
                "inputs": {},
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [block],
            first: block,
            last: block
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);
    });

    test("MouseDownForStepsEvent", () => {
        const duration = 45; // 1.5 seconds
        const mouseDownForStepsEvent = new MouseDownForStepsEvent(duration);
        const blockRepresentation = mouseDownForStepsEvent.toScratchBlocks();

        const waitBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "control_wait",
                "inputs": {
                    "DURATION": {
                        "name": "DURATION",
                        "block": expect.any(String),
                        "shadow": expect.any(String)
                    }
                },
                "fields": {},
                "next": expect.any(String),
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const waitInputBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "math_positive_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": (duration / 30).toString()
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": expect.any(String),
                "shadow": true,
                "breakpoint": false

            };

        const clickBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "bbt_clickCurrentCursorLocation",
                "inputs": {},
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": expect.any(String),
                "shadow": false,
                "breakpoint": false
            };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [waitBlock, waitInputBlock, clickBlock],
            first: waitBlock,
            last: clickBlock
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);

        const actualWaitBlock = blockRepresentation.blocks.find(
            block => block.opcode === "control_wait");
        const actualClickBlock = blockRepresentation.blocks.find(
            block => block.opcode === "bbt_clickCurrentCursorLocation");

        expect(actualWaitBlock.id).not.toEqual(actualClickBlock.id);
        expect(actualWaitBlock.next).toEqual(actualClickBlock.id);
        expect(actualClickBlock.parent).toEqual(actualWaitBlock.id);
    });

    test("MouseMove(To)Event", () => {

        const initialVMWrapper = Container.vmWrapper;

        Container.vmWrapper = {
            getStageSize(): { width: number; height: number } {
                return {width: 480, height: 360};
            }
        } as VMWrapper;

        const mouseMoveEvent = new MouseMoveEvent(240, 180);
        const blockRepresentation = mouseMoveEvent.toScratchBlocks();

        Container.vmWrapper = initialVMWrapper;

        const mainBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "bbt_placeMousePointer",
                "inputs": {
                    "X": {
                        "name": "X",
                        "block": expect.any(String),
                        "shadow": expect.any(String),
                    },
                    "Y": {
                        "name": "Y",
                        "block": expect.any(String),
                        "shadow": expect.any(String),
                    }
                },
                "fields": {},
                "next": null,
                "topLevel": false,
                "parent": null,
                "shadow": false,
                "breakpoint": false
            };

        const xBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": "0"
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": expect.any(String),
                "shadow": true,
                "breakpoint": false
            };
        const yBlock: ScratchVMBlock = {
            "id": expect.any(String),
            "opcode": "math_number",
            "inputs": {},
            "fields": {
                "NUM": {
                    "name": "NUM",
                    "value": "0"
                }
            },
            "next": null,
            "topLevel": false,
            "parent": expect.any(String),
            "shadow": true,
            "breakpoint": false
        };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [mainBlock, xBlock, yBlock],
            first: mainBlock,
            last: mainBlock
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);

        const actualMainBlock = blockRepresentation.blocks[0];
        const actualXBlock = blockRepresentation.blocks[1];
        const actualYBlock = blockRepresentation.blocks[2];

        expect(actualMainBlock.id).not.toEqual(actualXBlock.id);
        expect(actualMainBlock.id).not.toEqual(actualYBlock.id);
        expect(actualXBlock.id).not.toEqual(actualYBlock.id);

        expect(actualMainBlock.inputs["X"]["block"]).toEqual(actualXBlock.id);
        expect(actualMainBlock.inputs["Y"]["block"]).toEqual(actualYBlock.id);
        expect(actualXBlock.parent).toEqual(actualMainBlock.id);
        expect(actualYBlock.parent).toEqual(actualMainBlock.id);
    });

    test("SoundEvent", () => {

        const initialConfig = Container.config;

        Container.config = {
            getSoundDuration(): number {
                return 123;
            }
        } as WhiskerSearchConfiguration;

        const soundEvent = new SoundEvent(50);
        Container.config = initialConfig;

        const blockRepresentation = soundEvent.toScratchBlocks();

        const mainBlock: ScratchVMBlock =
            {

                "id": expect.any(String),
                "opcode": "bbt_simulateMicrophoneInput",
                "inputs": {
                    "VOLUME": {
                        "name": "VOLUME",
                        "block": expect.any(String),
                        "shadow": expect.any(String),
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
            };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [mainBlock, inputBlock],
            first: mainBlock,
            last: mainBlock
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);


        const actualMainBlock = blockRepresentation.blocks[0];
        const actualInputBlock = blockRepresentation.blocks[1];

        expect(actualMainBlock.id).not.toEqual(actualInputBlock.id);

        expect(actualMainBlock.inputs["VOLUME"]["block"]).toEqual(actualInputBlock.id);
        expect(actualInputBlock.parent).toEqual(actualMainBlock.id);
    });

    test("Type(Text/Number)Event", () => {
        const typeTextEvent = new TypeTextEvent("hello");
        const blockRepresentation = typeTextEvent.toScratchBlocks();

        const mainBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "bbt_simulateAnswerInput",
                "inputs": {
                    "ANSWER": {
                        "name": "ANSWER",
                        "block": expect.any(String),
                        "shadow": expect.any(String),
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
                "id": expect.any(String),
                "opcode": "text",
                "inputs": {},
                "fields": {
                    "TEXT": {
                        "name": "TEXT",
                        "value": "hello"
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": expect.any(String),
                "shadow": true,
                "breakpoint": false
            };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [mainBlock, inputBlock],
            first: mainBlock,
            last: mainBlock
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);

        const actualMainBlock = blockRepresentation.blocks[0];
        const actualInputBlock = blockRepresentation.blocks[1];

        expect(actualMainBlock.id).not.toEqual(actualInputBlock.id);

        expect(actualMainBlock.inputs["ANSWER"]["block"]).toEqual(actualInputBlock.id);
        expect(actualInputBlock.parent).toEqual(actualMainBlock.id);
    });

    test("WaitEvent", () => {
        const waitEvent = new WaitEvent(5);
        const blockRepresentation = waitEvent.toScratchBlocks();

        const mainBlock: ScratchVMBlock =
            {
                "id": expect.any(String),
                "opcode": "bbt_yieldMultipleTimes",
                "inputs": {
                    "COUNT": {
                        "name": "COUNT",
                        "block": expect.any(String),
                        "shadow": expect.any(String)
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
                "id": expect.any(String),
                "opcode": "math_number",
                "inputs": {},
                "fields": {
                    "NUM": {
                        "name": "NUM",
                        "value": "5"
                    }
                },
                "next": null,
                "topLevel": false,
                "parent": expect.any(String),
                "shadow": true,
                "breakpoint": false
            };

        const expectedBlockRepresentation: ScratchScriptSnippet = {
            blocks: [mainBlock, inputBlock],
            first: mainBlock,
            last: mainBlock
        };

        expect(blockRepresentation).toEqual(expectedBlockRepresentation);

        const actualMainBlock = blockRepresentation.blocks[0];
        const actualInputBlock = blockRepresentation.blocks[1];

        expect(actualMainBlock.id).not.toEqual(actualInputBlock.id);

        expect(actualMainBlock.inputs["COUNT"]["block"]).toEqual(actualInputBlock.id);
        expect(actualInputBlock.parent).toEqual(actualMainBlock.id);
    });

});
