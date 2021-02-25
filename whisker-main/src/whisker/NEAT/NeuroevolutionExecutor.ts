import VMWrapper = require("../../vm/vm-wrapper.js")
import {List} from "../utils/List";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchEvent} from "../testcase/ScratchEvent";
import {EventObserver} from "../testcase/EventObserver";
import {ExecutionTrace} from "../testcase/ExecutionTrace";
import {Randomness} from "../utils/Randomness";
import {seedScratch} from "../../util/random"
import {ScratchEventExtractor} from "../testcase/ScratchEventExtractor";
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {WaitEvent} from "../testcase/events/WaitEvent";
import {NeatChromosome} from "./NeatChromosome";
import {KeyDownEvent} from "../testcase/events/KeyDownEvent";
import {Container} from "../utils/Container";
import {NeatParameter} from "./NeatParameter";

const Runtime = require('scratch-vm/src/engine/runtime');

export class NeuroevolutionExecutor {

    private readonly _vm: VirtualMachine;
    private _vmWrapper: VMWrapper
    private availableEvents: List<ScratchEvent>;
    private eventObservers: EventObserver[] = [];
    private _initialState = {};
    private _projectRunning

    constructor(vmWrapper: VMWrapper) {
        this._vmWrapper = vmWrapper;
        this._vm = vmWrapper.vm;
        this.recordInitialState();
    }

    async executeTests(networks: List<NeatChromosome>): Promise<void> {
        for (const network of networks) {
            if (network.trace == null) {
                await this.execute(network);
            }
        }
    }

    async execute(network: NeatChromosome): Promise<ExecutionTrace> {
        const events = new List<[ScratchEvent, number[]]>();
        network.generateNetwork();
        network.flushNodeValues();
        seedScratch("KingBaileys")

        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        this._vmWrapper.start();
        const start = Date.now();
        while (this._projectRunning) {
            this.availableEvents = ScratchEventExtractor.extractEvents(this._vmWrapper.vm)
            if (this.availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                continue;
            }

            let inputs = ScratchEventExtractor.extractSpriteInfo(this._vmWrapper.vm)
            // eslint-disable-next-line prefer-spread
            inputs = [].concat.apply([], inputs);
            for (let i = 0; i < NeatParameter.MAX_HIDDEN_LAYERS; i++) {
                network.activateNetwork(inputs);
            }
            const output = network.activateNetwork(inputs);
            const indexOfMaxValue = output.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
            let nextEvent: ScratchEvent = this.availableEvents.get(indexOfMaxValue)
            let args = [1];
            if (nextEvent instanceof KeyDownEvent) {
                args = [+true];
            } else if (nextEvent instanceof WaitEvent) {
                nextEvent = new WaitEvent()
                args = [Container.config.getWaitDuration()];
            }
            events.add([nextEvent, args]);
            this.notify(nextEvent, args);
            await nextEvent.apply(this._vm, args)
            StatisticsCollector.getInstance().incrementEventsCount();

            const waitEvent = new WaitEvent();
            events.add([waitEvent, []])
            await waitEvent.apply(this._vm);
        }
        // round due to small variances in runtime
        const end = Math.round((Date.now() - start) / 100);
        network.timePlayed = end;

        let points = 0;
        for (const target of this._vm.runtime.targets) {
            if (target.sprite.name === 'Stage')
                for (const [key, value] of Object.entries(target.variables)) {
                    // @ts-ignore
                    if (value.name === 'Punkte') { // @ts-ignore
                        points = value.value
                    }
                }
        }

        network.points = points
        this._vmWrapper.end();
        network.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);
        this._vm.removeListener(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this.resetState();
        return network.trace;
    }

    private projectStopped() {
        return this._projectRunning = false;
    }

    private _getArgs(event: ScratchEvent, outputs: List<number>, paramCount: number): number[] {
        const args = [];
        for (let i = 0; i < event.getNumParameters(); i++) {
            // Get next codon, but wrap around if length exceeded
            const arg = outputs.get(++paramCount % outputs.size());
            args.push(arg)
        }
        return args;
    }

    public attach(observer: EventObserver): void {
        const isExist = this.eventObservers.includes(observer);
        if (!isExist) {
            this.eventObservers.push(observer);
        }
    }

    public detach(observer: EventObserver): void {
        const observerIndex = this.eventObservers.indexOf(observer);
        if (observerIndex !== -1) {
            this.eventObservers.splice(observerIndex, 1);
        }
    }

    private notify(event: ScratchEvent, args: number[]): void {
        for (const observer of this.eventObservers) {
            observer.update(event, args);
        }
    }

    private recordInitialState(): void {
        for (const targetsKey in this._vm.runtime.targets) {
            this._initialState[targetsKey] = {
                direction: this._vm.runtime.targets[targetsKey]["direction"],
                currentCostume: this._vm.runtime.targets[targetsKey]["currentCostume"],
                draggable: this._vm.runtime.targets[targetsKey]["draggable"],
                dragging: this._vm.runtime.targets[targetsKey]["dragging"],
                effects: Object.assign({}, this._vm.runtime.targets[targetsKey]["effects"]),
                videoState: this._vm.runtime.targets[targetsKey]["videoState"],
                videoTransparency: this._vm.runtime.targets[targetsKey]["videoTransparency"],
                visible: this._vm.runtime.targets[targetsKey]["visible"],
                volume: this._vm.runtime.targets[targetsKey]["volume"],
                x: this._vm.runtime.targets[targetsKey]["x"],
                y: this._vm.runtime.targets[targetsKey]["y"],
            }
        }
    }

    private resetState() {
        // Delete clones
        const clones = [];
        for (const targetsKey in this._vm.runtime.targets) {
            if (!this._vm.runtime.targets[targetsKey].isOriginal) {
                clones.push(this._vm.runtime.targets[targetsKey]);
            }
        }

        for (const target of clones) {
            this._vm.runtime.stopForTarget(target);
            this._vm.runtime.disposeTarget(target);
        }

        // Restore state of all others
        for (const targetsKey in this._vm.runtime.targets) {
            this._vm.runtime.targets[targetsKey]["direction"] = this._initialState[targetsKey]["direction"];
            this._vm.runtime.targets[targetsKey]["currentCostume"] = this._initialState[targetsKey]["currentCostume"];
            this._vm.runtime.targets[targetsKey]["draggable"] = this._initialState[targetsKey]["draggable"];
            this._vm.runtime.targets[targetsKey]["dragging"] = this._initialState[targetsKey]["dragging"];
            this._vm.runtime.targets[targetsKey]["effects"] = Object.assign({}, this._initialState[targetsKey]["effects"]);
            this._vm.runtime.targets[targetsKey]["videoState"] = this._initialState[targetsKey]["videoState"];
            this._vm.runtime.targets[targetsKey]["videoTransparency"] = this._initialState[targetsKey]["videoTransparency"];
            this._vm.runtime.targets[targetsKey]["visible"] = this._initialState[targetsKey]["visible"];
            this._vm.runtime.targets[targetsKey]["volume"] = this._initialState[targetsKey]["volume"];
            this._vm.runtime.targets[targetsKey]["x"] = this._initialState[targetsKey]["x"];
            this._vm.runtime.targets[targetsKey]["y"] = this._initialState[targetsKey]["y"];
            this._vm._events.PROJECT_RUN_STOP = this._initialState['eventListenerRunStop']
        }
    }
}
