import VMWrapper = require("../../vm/vm-wrapper.js");
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchEvent} from "../testcase/events/ScratchEvent";
import {EventObserver} from "../testcase/EventObserver";
import {EventAndParameters, ExecutionTrace} from "../testcase/ExecutionTrace";
import {Randomness} from "../utils/Randomness";
import {StatisticsCollector} from "../utils/StatisticsCollector";
import {WaitEvent} from "../testcase/events/WaitEvent";
import {NetworkChromosome} from "./Networks/NetworkChromosome";
import {InputExtraction} from "./InputExtraction";
import {NeuroevolutionUtil} from "./NeuroevolutionUtil";
import {ScratchEventExtractor} from "../testcase/ScratchEventExtractor";
import Runtime from "scratch-vm/src/engine/runtime"
import {NeuroevolutionScratchEventExtractor} from "../testcase/NeuroevolutionScratchEventExtractor";

export class NetworkExecutor {

    /**
     * The Scratch-VM of the project which will we executed.
     */
    private readonly _vm: VirtualMachine;

    /**
     * The wrapper of the Scratch-VM
     */
    private readonly _vmWrapper: VMWrapper

    /**
     * Collects the available events at the current state of the Scratch-VM
     */
    private availableEvents: ScratchEvent[] = [];

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
    private _random = Randomness.getInstance();

    /**
     * Extractor to determine possible events
     */
    private _eventExtractor: ScratchEventExtractor;

    /**
     * Defines how a network will select events during its playthrough
     */
    private readonly _eventSelection: string

    /**
     * Constructs a new NetworkExecutor object.
     * @param vmWrapper the wrapper of the Scratch-VM.
     * @param timeout timeout after which each playthrough is halted.
     * @param eventSelection defines how a network will select events during its playthrough.
     */
    constructor(vmWrapper: VMWrapper, timeout: number, eventSelection?: string) {
        this._vmWrapper = vmWrapper;
        this._vm = vmWrapper.vm;
        this._timeout = timeout;
        this._eventExtractor = new NeuroevolutionScratchEventExtractor(this._vm);
        this._eventSelection = eventSelection;
        this.recordInitialState();
    }

    async execute(network: NetworkChromosome): Promise<ExecutionTrace> {
        switch (this._eventSelection) {
            case 'random':
                return this.executeRandom(network);
            case 'network':
            default:
                return this.executeNetwork(network);
        }
    }

    /**
     * Lets a neural network play the given Scratch game.
     * @param network the network which should play the given game.
     */
    private async executeNetwork(network: NetworkChromosome): Promise<ExecutionTrace> {
        const events: EventAndParameters[] = [];
        let workingNetwork = false;
        const codons: number[] = [];

        Randomness.seedScratch();

        // Activate the network <stabilizeCounter> times to stabilise it for classification
        network.flushNodeValues();
        for (let i = 0; i < network.stabiliseCount; i++) {
            workingNetwork = network.activateNetwork(InputExtraction.extractSpriteInfo(this._vmWrapper));
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
            // Collect the currently available events.
            this.availableEvents = this._eventExtractor.extractEvents(this._vm)
            if (this.availableEvents.length === 0) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }

            // Load the inputs into the Network
            const spriteFeatures = InputExtraction.extractSpriteInfo(this._vmWrapper);

            // Check if we encountered additional events during the playthrough
            // If we did so add corresponding ClassificationNodes and RegressionNodes to the network.
            network.updateOutputNodes(this.availableEvents);

            // If we have a recurrent network we do not flush the nodes and only activate it once
            if (network.isRecurrent) {
                workingNetwork = network.activateNetwork(spriteFeatures);
            }

            // If we do not have a recurrent network we flush the network and activate it until the output stabilizes
            else {
                network.flushNodeValues();
                for (let i = 0; i < network.stabiliseCount; i++) {
                    workingNetwork = network.activateNetwork(spriteFeatures);
                }
            }

            // Get the classification results by using the softmax function over the outputNode values
            const output = NeuroevolutionUtil.softmaxEvents(network, this.availableEvents);
            // Choose the event with the highest probability according to the softmax values
            const indexOfMaxValue = output.reduce(
                (iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
            codons.push(indexOfMaxValue);
            network.addActivationTrace(codons.length - 1);

            // Select the nextEvent, set its parameters and send it to the Scratch-VM
            const nextEvent: ScratchEvent = this.availableEvents[indexOfMaxValue];
            const parameters = [];
            if (nextEvent.numSearchParameter() > 0) {
                parameters.push(...NetworkExecutor.getArgs(nextEvent, network));
                nextEvent.setParameter(parameters, "regression");
            }
            events.push(new EventAndParameters(nextEvent, parameters));
            this.notify(nextEvent, parameters);
            await nextEvent.apply();
            StatisticsCollector.getInstance().incrementEventsCount();

            // Add a waitEvent in the end of each round.
            const waitEvent = new WaitEvent(1);
            events.push(new EventAndParameters(waitEvent, []));
            await waitEvent.apply();
            timer = Date.now();
        }

        // Save the executed Trace and the covered blocks
        network.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);
        network.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;

        // End and reset the VM.
        this._vmWrapper.end();
        this._vm.removeListener(Runtime.PROJECT_RUN_STOP, _onRunStop);

        StatisticsCollector.getInstance().numberFitnessEvaluations++;

        // Should not happen!
        if (!workingNetwork) {
            console.error("Found defect Network", network);
        }
        // Save the codons in order to transform the network into a TestChromosome later
        network.codons = codons;
        return network.trace;
    }

    /**
     * Lets a neural network play the given Scratch game by randomly choosing events.
     * @param network the network which should play the given game.
     */
    private async executeRandom(network: NetworkChromosome): Promise<ExecutionTrace> {
        const events: EventAndParameters[] = [];
        const codons: number[] = [];

        Randomness.seedScratch();

        // Set up the Scratch-VM and start the game
        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        this._vmWrapper.start();

        // Initialise Timer for the timeout
        let timer = Date.now();
        this._timeout += Date.now();
        this.availableEvents = this._eventExtractor.extractEvents(this._vm)


        // Play the game until we reach a GameOver state or the timeout
        while (this._projectRunning && timer < this._timeout) {
            // Collect the currently available events
            this.availableEvents = this._eventExtractor.extractEvents(this._vm);

            if (this.availableEvents.length === 0) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }

            // Check if we encountered additional events during the playthrough
            // If we did so add corresponding ClassificationNodes and RegressionNodes to the network.
            network.updateOutputNodes(this.availableEvents);

            // Select the nextEvent, set its parameters and send it to the Scratch-VM
            const randomEventIndex = this._random.nextInt(0, this.availableEvents.length);
            const nextEvent: ScratchEvent = this.availableEvents[randomEventIndex];
            const parameters = [];
            if (nextEvent.numSearchParameter() > 0) {
                parameters.push(...NetworkExecutor.getArgs(nextEvent, network));
                nextEvent.setParameter(parameters, "regression");
            }
            codons.push(randomEventIndex);
            events.push(new EventAndParameters(nextEvent, parameters));
            this.notify(nextEvent, parameters);
            await nextEvent.apply();
            StatisticsCollector.getInstance().incrementEventsCount();

            // Add a waitEvent in the end of each round.
            const waitEvent = new WaitEvent(1);
            events.push(new EventAndParameters(waitEvent, []));
            await waitEvent.apply();
            timer = Date.now();
        }

        // Save the executed Trace and the covered blocks
        network.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);
        network.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;

        // End and reset the VM.
        this._vmWrapper.end();
        this._vm.removeListener(Runtime.PROJECT_RUN_STOP, _onRunStop);

        StatisticsCollector.getInstance().numberFitnessEvaluations++;

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

    private static getArgs(event: ScratchEvent, network: NetworkChromosome): number[] {
        const args = [];
        for (const node of network.regressionNodes.get(event.stringIdentifier())) {
            args.push(node.activationValue);
        }
        return args;
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
                name: this._vm.runtime.targets[targetsKey].sprite['name'],
                direction: this._vm.runtime.targets[targetsKey]["direction"],
                currentCostume: this._vm.runtime.targets[targetsKey]["currentCostume"],
                draggable: this._vm.runtime.targets[targetsKey]["draggable"],
                dragging: this._vm.runtime.targets[targetsKey]["dragging"],
                drawableID: this._vm.runtime.targets[targetsKey]['drawableID'],
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
    public resetState(): void {
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
            this._vm.runtime.targets[targetsKey]["drawableID"] = this._initialState[targetsKey]["drawableID"];
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
