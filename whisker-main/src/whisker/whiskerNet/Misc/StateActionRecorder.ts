import {EventEmitter} from "events";
import Scratch from "whisker-web/src/components/scratch-stage";
import {InputExtraction, InputFeatures} from "./InputExtraction";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {Container} from "../../utils/Container";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";
import {KeyPressEvent} from "../../testcase/events/KeyPressEvent";
import Runtime from "scratch-vm/src/engine/runtime";
import {StatementFitnessFunctionFactory} from "../../testcase/fitness/StatementFitnessFunctionFactory";
import VMWrapper from "../../../vm/vm-wrapper";
import {WaitEvent} from "../../testcase/events/WaitEvent";
import {WhiskerSearchConfiguration} from "../../utils/WhiskerSearchConfiguration";
import {TypeTextEvent} from "../../testcase/events/TypeTextEvent";


export class StateActionRecorder extends EventEmitter {
    private readonly WAIT_THRESHOLD = Infinity;

    private readonly _scratch: Scratch;
    private readonly _vm: VirtualMachine
    private readonly _eventExtractor: NeuroevolutionScratchEventExtractor;
    private _statements: string[];

    private readonly _fullRecordings: Recording[];
    private _actionRecords: ActionRecord[]

    private _isRecording: boolean;
    private _lastActionStep: number;
    private _checkForWaitInterval: number;
    private _pressedKeys: Map<string, number>;
    private readonly _stateAtAction: Map<string, InputFeatures>;

    private readonly _onRunStart: () => void;
    private readonly _onRunStop: () => void;
    private readonly _onInput: () => void;
    private readonly _checkForWaitCallBack: () => void;

    constructor(scratch: Scratch) {
        super();
        this._scratch = scratch;
        this._vm = scratch.vm;
        Container.vm = this._vm;
        Container.vmWrapper = new VMWrapper(this._vm, this._scratch);

        this._actionRecords = [];
        this._eventExtractor = new NeuroevolutionScratchEventExtractor(scratch.vm);
        this._fullRecordings = [];
        this._pressedKeys = new Map<string, number>();
        this._stateAtAction = new Map<string, InputFeatures>();

        this._onRunStart = this.onGreenFlag.bind(this);
        this._onRunStop = this.onStopAll.bind(this);
        this._onInput = this.handleInput.bind(this);
        this._checkForWaitCallBack = this._checkForWait.bind(this);
    }

    /**
     * Starts the recording procedure by setting listeners for the start and end of Scratch runs.
     * @param config: contains settings that are important during test generation such as the click duration.
     */
    public startRecording(config: string): void {
        this._vm.on(Runtime.PROJECT_RUN_START, this._onRunStart);
        this._vm.on(Runtime.PROJECT_RUN_STOP, this._onRunStop);
        this._vm.on(Runtime.Project_STOP_ALL, this._onRunStop);
        Container.config = new WhiskerSearchConfiguration(JSON.parse(config));
        this._isRecording = true;
        this._statements = new StatementFitnessFunctionFactory().extractFitnessFunctions(this._vm, []).map(stat => stat.getNodeId());
    }

    /**
     * Starts recording scratch input actions and sets an interval for wait event checks when a Scratch run has started.
     */
    private onGreenFlag(): void {
        this._scratch.on(Scratch.INPUT_LISTENER_KEY, this._onInput);
        this._checkForWaitInterval = window.setInterval(this._checkForWaitCallBack, 500);
        this._lastActionStep = this._getCurrentStepCount();
        this._stateAtAction.set("WaitEvent", InputExtraction.extractFeatures(this._vm));
    }

    /**
     * Stops the recording of scratch input actions and clears the wait event check interval when the Scratch run stops.
     */
    private onStopAll(): void {
        this._scratch.off(Scratch.INPUT_LISTENER_KEY, this._onInput);
        clearInterval(this._checkForWaitInterval);
        this.addStateActionRecordsToRecording(this._fullRecordings.length, this._vm.runtime.traceInfo.tracer.coverage as Set<string>);
    }

    /**
     * Stops the recording by clearing listeners.
     */
    public stopRecording(): void {
        this._scratch.off(Scratch.INPUT_LISTENER_KEY, this._onInput);
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
            const availableActions = this._eventExtractor.extractEvents(this._vm).map(event => event.stringIdentifier());

            // Check if event is present at all. Always include typeTextEvents since they can only be emitted if a
            // question was asked.
            if (availableActions.indexOf(event.stringIdentifier()) >= 0 || event instanceof TypeTextEvent) {
                this._recordAction(event);
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
            case 'text':
                event = new TypeTextEvent(actionData.text);
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

            // Long key-presses account for multiple isDown actions leading to the replacement of the first press.
            // Hence, we only set a counter if the key is not registered yet.
            if (!this._pressedKeys.has(key)) {
                this._pressedKeys.set(key, this._getCurrentStepCount());
                this._stateAtAction.set(new KeyPressEvent(key).stringIdentifier(), InputExtraction.extractFeatures(this._vm));
            }
        } else if (!actionData.isDown && actionData.key !== null) {
            const key = this._vm.runtime.ioDevices.keyboard._keyStringToScratchKey(actionData.key);
            if (this._pressedKeys.has(key)) {
                const steps = this._getCurrentStepCount() - this._pressedKeys.get(key);
                this._pressedKeys.delete(key);
                return new KeyPressEvent(key, steps);
            }
        }
        return undefined;
    }

    /**
     * Adds a {@link WaitEvent} if no action has been executed for a set number of steps.
     */
    private _checkForWait(): void {
        const stepsSinceLastAction = this._getCurrentStepCount() - this._lastActionStep;
        const acceleration = Container.acceleration != undefined ? Container.acceleration : 1;
        if (stepsSinceLastAction > (this.WAIT_THRESHOLD / acceleration)) {
            this._recordAction(new WaitEvent(this.WAIT_THRESHOLD));
        }
    }

    /**
     * Records an observed action including the corresponding state by adding it to the actionRecords array.
     * @param event the observed action/event.
     */
    private _recordAction(event: ScratchEvent): void {
        const action = event.stringIdentifier();
        const stateFeatures = this._stateAtAction.get(action) || InputExtraction.extractFeatures(this._vm);
        let parameter: Record<string, number>;
        switch (event.toJSON()['type']) {
            case "WaitEvent":
                parameter = {'Duration': Math.min(event.getParameters().pop() / 100, 1)};     // Wait duration
                break;
            case "KeyPressEvent":
                parameter = {'Steps': Math.min(event.getParameters()[1] / 30, 1)};      // Press duration
                break;
            case "TypeTextEvent":
                parameter = {};
                break;
        }

        const record: ActionRecord = {
            state: stateFeatures,
            action: action,
            actionParameter: parameter
        };
        this._actionRecords.push(record);
        this._lastActionStep = this._getCurrentStepCount();

        // Fetch state BEFORE we add a wait since the state at this point is the interesting one,
        // NOT when the action gets added.
        this._stateAtAction.set("WaitEvent", InputExtraction.extractFeatures(this._vm));
    }

    /**
     * Fetches the current step count of the Scratch-VM.
     * @returns number of executed steps.
     */
    private _getCurrentStepCount(): number {
        return this._vm.runtime.stepsExecuted;
    }

    /**
     * Adds an {@link ActionRecord} to the global {@link Recording}.
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
            const stateActionRecordJSON = {};
            for (const stateActionRecord of this._fullRecordings[i].recordings) {
                const spriteFeatures = {};
                for (const [sprite, features] of stateActionRecord.state.entries()) {
                    const featureJSON = {};
                    for (const [feature, value] of features.entries()) {
                        featureJSON[feature] = value;
                    }
                    spriteFeatures[sprite] = featureJSON;
                }
                const keyNumber = Object.keys(stateActionRecordJSON).length;
                stateActionRecordJSON[keyNumber] = {
                    'features': spriteFeatures,
                    'action': stateActionRecord.action,
                    'parameter': stateActionRecord.actionParameter
                };
            }
            stateActionRecordJSON['coverage'] = this._fullRecordings[i].coverage;
            json[Object.keys(json).length] = stateActionRecordJSON;
        }
        return json;
    }
}

/**
 * StateAction record of a single action.
 */
export interface ActionRecord {
    state: InputFeatures
    action: string
    actionParameter?: Record<string, number>
}

/**
 * Collection of {@link ActionRecord}s of an entire recording procedure combined with the achieved coverage.
 */
export interface Recording {
    recordings: ActionRecord[],
    coverage: string[]
}
