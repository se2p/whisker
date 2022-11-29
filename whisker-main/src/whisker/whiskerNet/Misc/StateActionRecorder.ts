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


export class StateActionRecorder extends EventEmitter {

    private static INPUT_EVENT_NAME = 'input';

    private readonly _scratch: Scratch;
    private readonly _vm: VirtualMachine
    private readonly _recording: StateActionRecord;
    private readonly _eventExtractor: ScratchEventExtractor;

    private _lastActionStep: number;
    private _checkForWaitInterval: number;

    private _onRunStop: () => void;
    private _onRunStart: () => void;
    private _onInput: () => void;
    private _checkForWaitCallBack: () => void;

    constructor(scratch: Scratch) {
        super();
        this._scratch = scratch;
        this._vm = scratch.vm;
        Container.vm = this._vm;

        this._recording = new Map<InputFeatures, string>();
        this._eventExtractor = new NeuroevolutionScratchEventExtractor(scratch.vm);
    }

    /**
     * Initialises the listeners required for starting and stopping the recording.
     */
    public setup(): void {
        this._onRunStart = this.startRecording.bind(this);
        this._onRunStop = this.stopRecording.bind(this);
        this._onInput = this.handleInput.bind(this);
        this._checkForWaitCallBack = this._checkForWait.bind(this);

        this._vm.on(Runtime.PROJECT_RUN_START, this._onRunStart);
        this._vm.on(Runtime.PROJECT_RUN_STOP, this._onRunStop);
    }

    /**
     * Starts the recording procedure by setting up a listener for inputs sent to Scratch-VM and an interval that
     * checks periodically whether the absence of an input event indicates the necessity of a WaitEvent.
     */
    public startRecording(): void {
        this._lastActionStep = 0;
        this._scratch.on(StateActionRecorder.INPUT_EVENT_NAME, this._onInput);
        this._checkForWaitInterval = window.setInterval(this._checkForWaitCallBack, 500);
    }

    /**
     * Stops the recording by clearing listeners and the periodic wait event check.
     */
    private stopRecording(): void {
        this._lastActionStep = 0;
        clearInterval(this._checkForWaitInterval);
        this._scratch.off(StateActionRecorder.INPUT_EVENT_NAME, this._onInput);
    }

    /**
     * Handles received input data by converting it to a string representation of an executable {@link ScratchEvent} and
     * checking whether the executed action has an active listener. If there is no active listener for the received
     * input event then the event can be discarded as it does not lead to a state change.
     * @param inputData represents the received input event.
     */
    private handleInput(inputData): void {
        const event = this._inputToEvent(inputData);
        if (event) {
            const action = event.stringIdentifier();
            const availableActions = this._eventExtractor.extractEvents(this._vm).map(event => event.stringIdentifier());
            if (availableActions.indexOf(action) >= 0) {
                this._addActionToRecord(action);
            }
        }
    }

    /**
     * Maps a received input data object to the corresponding {@link ScratchEvent}.
     * @param inputData the input data object containing details of the input event.
     * @returns the ScratchEvent corresponding to the supplied input data.
     */
    private _inputToEvent(inputData): ScratchEvent {
        let event: ScratchEvent;
        switch (inputData.device) {
            case 'keyboard':
                event = this._handleKeyBoardInput(inputData);
                break;
            default:
                event = undefined;
        }
        return event;
    }

    /**
     * Handles keyboard input such as key presses.
     * @param inputData the input data object containing details of the input event.
     * @returns the Scratch event to the observed input data..
     */
    private _handleKeyBoardInput(inputData): ScratchEvent {
        if (inputData.isDown && inputData.key !== null) {
            const key = this._vm.runtime.ioDevices.keyboard._keyStringToScratchKey(inputData.key);
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
            this._addActionToRecord('WaitEvent');
        }
    }

    /**
     * Adds an observed action event and the corresponding Scratch-State to the recording.
     * @param action the observed {@link ScratchEvent} in a string representation.
     */
    private _addActionToRecord(action: string): void {
        const stateFeatures = InputExtraction.extractFeatures(this._vm);
        this._recording.set(stateFeatures, action);
        this._lastActionStep = this._getCurrentStepCount();
    }

    /**
     * Fetches the current step count of the Scratch-VM.
     * @returns number of executed steps.
     */
    private _getCurrentStepCount(): number {
        return this._vm.runtime.stepsExecuted;
    }
}

/**
 * A {@link StateActionRecord} links a set of input features to the executed action.
 */
export type StateActionRecord = Map<InputFeatures, string>;
