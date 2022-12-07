import {EventEmitter} from "events";
import Scratch from "whisker-web/src/components/scratch-stage";
import {InputExtraction, InputFeatures} from "./InputExtraction";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {Container} from "../../utils/Container";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {ScratchEventExtractor} from "../../testcase/ScratchEventExtractor";
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";
import {KeyPressEvent} from "../../testcase/events/KeyPressEvent";
import Runtime from "scratch-vm/src/engine/runtime";
import {StatementFitnessFunctionFactory} from "../../testcase/fitness/StatementFitnessFunctionFactory";


export class StateActionRecorder extends EventEmitter {
    private static INPUT_EVENT_NAME = 'input';

    private readonly _scratch: Scratch;
    private readonly _vm: VirtualMachine
    private readonly _eventExtractor: ScratchEventExtractor;
    private _statements: string[];

    private readonly _fullRecordings: Recording[];
    private _actionRecords: StateActionRecord[]

    private _isRecording: boolean;
    private _lastActionStep: number;
    private _checkForWaitInterval: number;

    private readonly _onRunStart: () => void;
    private readonly _onRunStop: () => void;
    private readonly _onInput: () => void;
    private readonly _checkForWaitCallBack: () => void;

    constructor(scratch: Scratch) {
        super();
        this._scratch = scratch;
        this._vm = scratch.vm;
        Container.vm = this._vm;

        this._actionRecords = [];
        this._eventExtractor = new NeuroevolutionScratchEventExtractor(scratch.vm);
        this._fullRecordings = [];

        this._onRunStart = this.onGreenFlag.bind(this);
        this._onRunStop = this.onStopAll.bind(this);
        this._onInput = this.handleInput.bind(this);
        this._checkForWaitCallBack = this._checkForWait.bind(this);
    }

    /**
     * Starts the recording procedure by setting listeners for the start and end of Scratch runs.
     */
    public startRecording(): void {
        this._vm.on(Runtime.PROJECT_RUN_START, this._onRunStart);
        this._vm.on(Runtime.PROJECT_RUN_STOP, this._onRunStop);
        this._vm.on(Runtime.Project_STOP_ALL, this._onRunStop);
        this._isRecording = true;

        this._statements = new StatementFitnessFunctionFactory().extractFitnessFunctions(this._vm, []).map(stat => stat.getNodeId());
    }

    /**
     * Starts recording scratch input actions and sets an interval for wait event checks when a Scratch run has started.
     */
    private onGreenFlag(): void {
        this._scratch.on(StateActionRecorder.INPUT_EVENT_NAME, this._onInput);
        this._checkForWaitInterval = window.setInterval(this._checkForWaitCallBack, 500);
        this._lastActionStep = this._getCurrentStepCount();
    }

    /**
     * Stops the recording of scratch input actions and clears the wait event check interval when the Scratch run stops.
     */
    private onStopAll(): void {
        this._scratch.off(StateActionRecorder.INPUT_EVENT_NAME, this._onInput);
        clearInterval(this._checkForWaitInterval);
        this.addStateActionRecordsToRecording(this._fullRecordings.length, this._vm.runtime.traceInfo.tracer.coverage as Set<string>);
    }

    /**
     * Stops the recording by clearing listeners.
     */
    public stopRecording(): void {
        this._scratch.off(StateActionRecorder.INPUT_EVENT_NAME, this._onInput);
        clearInterval(this._checkForWaitInterval);
        this._vm.off(Runtime.PROJECT_RUN_START, this._onRunStart);
        this._vm.off(Runtime.PROJECT_RUN_STOP, this._onRunStop);
        this._isRecording = false;
    }

    /**
     * Handles received action data by converting it to a string representation of an executable {@link ScratchEvent}
     * and checking whether the executed action has an active listener. If there is no active listener for the received
     * input event then the event can be discarded as it does not lead to a state change.
     * @param actionData represents the received input event.
     */
    private handleInput(actionData): void {
        const event = this._inputToEvent(actionData);
        if (event) {
            const action = event.stringIdentifier();
            const availableActions = this._eventExtractor.extractEvents(this._vm).map(event => event.stringIdentifier());
            if (availableActions.indexOf(action) >= 0) {
                this._recordAction(action);
            }
        }
    }

    /**
     * Maps a received action data object to the corresponding {@link ScratchEvent}.
     * @param actionData the action data object containing details of the input event.
     * @returns the ScratchEvent corresponding to the supplied action data.
     */
    private _inputToEvent(actionData): ScratchEvent {
        let event: ScratchEvent;
        switch (actionData.device) {
            case 'keyboard':
                event = this._handleKeyBoardInput(actionData);
                break;
            default:
                event = undefined;
        }
        return event;
    }

    /**
     * Handles keyboard input such as key presses.
     * @param actionData the action data object containing details of the input event.
     * @returns the Scratch event to the observed action data.
     */
    private _handleKeyBoardInput(actionData): ScratchEvent {
        if (actionData.isDown && actionData.key !== null) {
            const key = this._vm.runtime.ioDevices.keyboard._keyStringToScratchKey(actionData.key);
            return new KeyPressEvent(key);
        }
        return undefined;
    }

    /**
     * Adds a {@link WaitEvent} if no action has been executed for a set number of steps.
     */
    private _checkForWait(): void {
        const stepsSinceLastAction = this._getCurrentStepCount() - this._lastActionStep;
        const acceleration = Container.acceleration != undefined ? Container.acceleration : 1;
        if (stepsSinceLastAction > (50 / acceleration)) {
            this._recordAction('WaitEvent');
        }
    }

    /**
     * Records an observed action including the corresponding state by adding it to the actionRecords array.
     * @param action the observed action.
     */
    private _recordAction(action: string): void {
        const stateFeatures = InputExtraction.extractFeatures(this._vm);
        const record: StateActionRecord = {
            state: stateFeatures,
            action: action
        };
        this._actionRecords.push(record);
        this._lastActionStep = this._getCurrentStepCount();
    }

    /**
     * Fetches the current step count of the Scratch-VM.
     * @returns number of executed steps.
     */
    private _getCurrentStepCount(): number {
        return this._vm.runtime.stepsExecuted;
    }

    /**
     * Adds an {@link StateActionRecord} to the global {@link Recording}.
     */
    public addStateActionRecordsToRecording(id: number, coverage: Set<string>): void {
        const filteredCoverage = [...coverage.values()].filter(value => this._statements.includes(value));
        const fullRecord: Recording = {
            recordings: [...this._actionRecords],
            coverage: filteredCoverage
        };
        this._fullRecordings.push(fullRecord);
        this._actionRecords = [];
    }

    get isRecording(): boolean {
        return this._isRecording;
    }

    /**
     * Transforms the recording into a json object that can be transformed into a string and downloaded as '.json' file.
     * @returns downloadable json format.
     */
    getRecord(): Record<string, unknown> {
        // Remove empty records.
        const json = {};
        for (let i = 0; i < this._fullRecordings.length; i++) {
            const stateActionRecords = {};
            for (const stateActionRecord of this._fullRecordings[i].recordings) {
                const spriteFeatures = {};
                for (const [sprite, features] of stateActionRecord.state.entries()) {
                    const featureJSON = {};
                    for (const [feature, value] of features.entries()) {
                        featureJSON[feature] = value;
                    }
                    spriteFeatures[sprite] = featureJSON;
                }
                if (!(stateActionRecord.action in stateActionRecords)) {
                    stateActionRecords[stateActionRecord.action] = [];
                }
                stateActionRecords[stateActionRecord.action].push(spriteFeatures);
            }
            stateActionRecords['coverage'] = this._fullRecordings[i].coverage;
            json[Object.keys(json).length] = stateActionRecords;
        }
        return json;
    }
}

/**
 * StateAction record of a single action.
 */
export interface StateActionRecord {
    state: InputFeatures
    action: string
}

/**
 * Collection of {@link StateActionRecord}s of an entire recording procedure combined with the achieved coverage.
 */
export interface Recording {
    recordings: StateActionRecord[],
    coverage: string[]
}
