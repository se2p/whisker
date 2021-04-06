import VMWrapper = require("../../vm/vm-wrapper.js");
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
import {NetworkChromosome} from "./NetworkChromosome";
import {MouseMoveEvent} from "../testcase/events/MouseMoveEvent";
import {RegressionNode} from "./NetworkNodes/RegressionNode";
import {InputExtraction} from "./InputExtraction";
import {NeuroevolutionUtil} from "./NeuroevolutionUtil";

const Runtime = require('scratch-vm/src/engine/runtime');

export class NetworkExecutor {

    /**
     * The Scratch-VM of the project which will we executed.
     */
    private readonly _vm: VirtualMachine;

    /**
     * The wrapper of the Scratch-VM
     */
    private _vmWrapper: VMWrapper

    /**
     * Collects the available events at the current state of the Scratch-VM
     */
    private availableEvents: List<ScratchEvent>;

    /**
     * Monitors the execution of the Scratch-VM
     */
    private eventObservers: EventObserver[] = [];

    /**
     * The initial sate of the Scratch-VM
     */
    private _initialState = {};

    /**
     * True if the project is currently running.
     */
    private _projectRunning: boolean

    /**
     * Timeout after which each playthrough is halted
     */
    private _timeout: number;

    /**
     * Random generator
     */
    private _random: Randomness;

    /**
     * Constructs a new NetworkExecutor object.
     * @param vmWrapper the wrapper of the Scratch-VM.
     * @param timeout timeout after which each playthrough is halted.
     */
    constructor(vmWrapper: VMWrapper, timeout: number) {
        this._vmWrapper = vmWrapper;
        this._vm = vmWrapper.vm;
        this._timeout = timeout;
        this._random = Randomness.getInstance();
        this.recordInitialState();
    }

    /**
     * Lets a neural network play the given Scratch game.
     * @param network the network which should play the given game.
     */
    async execute(network: NetworkChromosome): Promise<ExecutionTrace> {
        const events = new List<[ScratchEvent, number[]]>();
        let workingNetwork = false;
        const codons = new List<number>()

        // Check how many activations a network needs to stabilise
        const stabilizeCounter = network.stabilizedCounter(100, false)

        seedScratch(String(Randomness.getInitialSeed()))

        // Load the inputs into the Network
        const spriteInfo = InputExtraction.extractSpriteInfo(this._vmWrapper.vm)
        // eslint-disable-next-line prefer-spread
        const inputs = [].concat.apply([], spriteInfo);

        // Activate the network <stabilizeCounter + 1> times to stabilise it for classification
        network.flushNodeValues();
        for (let i = 0; i < stabilizeCounter + 1; i++) {
            workingNetwork = network.activateNetwork(inputs);
        }

        // Set up the Scratch-VM and start the game
        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        this._vmWrapper.start();

        // Initialise Timer for the timeout
        let timer = Date.now();
        this._timeout += Date.now();

        // Play the game until we reach a GameOver state or the timeout
        while (this._projectRunning && timer < this._timeout) {
            // Collect the currently available events
            this.availableEvents = ScratchEventExtractor.extractEvents(this._vmWrapper.vm)
            if (this.availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                continue;
            }

            // Load the inputs into the Network
            const spriteInfo = InputExtraction.extractSpriteInfo(this._vmWrapper.vm)
            // eslint-disable-next-line prefer-spread
            const inputs = [].concat.apply([], spriteInfo);

            // If we have a recurrent network we do not flush the nodes and only activate it once
            if (network.isRecurrent) {
                workingNetwork = network.activateNetwork(inputs)
            }

            // If we do not have a recurrent network we flush the network and activate it until the output stabilizes
            else {
                network.flushNodeValues();
                for (let i = 0; i < stabilizeCounter + 1; i++) {
                    workingNetwork = network.activateNetwork(inputs);
                }
            }

            // Get the classification results by using the softmax function over the outputNode values
            const output = NeuroevolutionUtil.softmax(network.outputNodes);

            // Choose the event with the highest probability according to the softmax values
            const indexOfMaxValue = output.reduce(
                (iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
            codons.add(indexOfMaxValue);
            const nextEvent: ScratchEvent = this.availableEvents.get(indexOfMaxValue)

            // Update the VM with the given event. No args given since only MouseMove events take params currently.
            events.add([nextEvent, []]);
            this.notify(nextEvent, []);
            await nextEvent.apply(this._vm, [])
            StatisticsCollector.getInstance().incrementEventsCount();

            // If we have a regression Node evaluate it.
            if (network.hasRegression) {
                const mouseCoords = NetworkExecutor.getMouseCoordinates(network);
                const mouseMoveEvent = new MouseMoveEvent();
                events.add([mouseMoveEvent, mouseCoords]);
                this.notify(mouseMoveEvent, mouseCoords);
                await mouseMoveEvent.apply(this._vm, mouseCoords)
                StatisticsCollector.getInstance().incrementEventsCount();
            }

            // Add a waitEvent in the end of each round.
            const waitEvent = new WaitEvent();
            events.add([waitEvent, []])
            await waitEvent.apply(this._vm);
            timer = Date.now();
        }

        // Save the executed Trace
        network.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);

        // End and reset the VM.
        this._vmWrapper.end();
        this._vm.removeListener(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this.resetState();

        // If we found a defect network let it go extinct! (Should not happen!)
        if (!workingNetwork)
            network.hasDeathMark = true;

        // Save the codons in order to transform the network into a TestChromosome later
        network.codons = codons;
        return network.trace;
    }

    /**
     * Plays a Scratch-Game by choosing an event randomly in each iteration
     * @param network the network to evaluate
     */
    async executeRandom(network: NetworkChromosome): Promise<ExecutionTrace> {
        const events = new List<[ScratchEvent, number[]]>();
        const codons = new List<number>()

        // Set up the Scratch-VM and start the game
        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        this._vmWrapper.start();

        // Initialise Timer for the timeout
        let timer = Date.now();
        this._timeout += Date.now();

        // Play the game until we reach a GameOver state or the timeout
        while (this._projectRunning && timer < this._timeout) {
            this.availableEvents = ScratchEventExtractor.extractEvents(this._vmWrapper.vm)
            if (this.availableEvents.isEmpty()) {
                console.log("Whisker-Main: No events available for project.");
                continue;
            }

            // Select a random event from the list of available events and update the Scratch-VM with it.
            const randomIndex = this._random.nextInt(0, this.availableEvents.size())
            codons.add(randomIndex);
            const nextEvent: ScratchEvent = this.availableEvents.get(randomIndex)
            events.add([nextEvent, []]);
            this.notify(nextEvent, []);
            await nextEvent.apply(this._vm, [])
            StatisticsCollector.getInstance().incrementEventsCount();

            // If we have a regression Node randomise this output as-well
            if (network.hasRegression) {
                const mouseCoords = [this._random.nextInt(-240, 240), this._random.nextInt(-180, 180)]
                const mouseMoveEvent = new MouseMoveEvent();
                events.add([mouseMoveEvent, mouseCoords]);
                this.notify(mouseMoveEvent, mouseCoords);
                await mouseMoveEvent.apply(this._vm, mouseCoords)
                StatisticsCollector.getInstance().incrementEventsCount();
            }

            // Add a wait event in the end of each iteration.
            const waitEvent = new WaitEvent();
            events.add([waitEvent, []])
            await waitEvent.apply(this._vm);
            timer = Date.now();
        }

        // Save the executed Trace
        network.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);

        // End and reset the VM.
        this._vmWrapper.end();
        this._vm.removeListener(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this.resetState();

        // Save the codons in order to transform the network into a TestChromosome later
        network.codons = codons;
        return network.trace;
    }

    /**
     * Event listener which checks if the project is still running, i.e no GameOver state was reached.
     */
    private projectStopped() {
        return this._projectRunning = false;
    }

    /**
     * Extracts the Mouse coordinates from the regression nodes
     * @param network the network which we ask for mouse coordinates
     * @private
     */
    private static getMouseCoordinates(network: NetworkChromosome): number[] {
        const coords = new List<number>();
        for (const node of network.outputNodes) {
            if (node instanceof RegressionNode && !coords.contains(node.nodeValue)) {
                coords.add(node.nodeValue)
            }
        }
        return coords.getElements();
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

    /**
     * Saves the initial state of the Scratch-VM
     */
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

    /**
     * Resets the Scratch-VM to the initial state
     */
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
