import VMWrapper = require("../../vm/vm-wrapper.js");
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchEvent} from "../testcase/events/ScratchEvent";
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
import {KeyPressEvent} from "../testcase/events/KeyPressEvent";
import {Container} from "../utils/Container";

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
     * The initial state of the Scratch-VM
     */
    private _initialState = {};

    /**
     * True if the project is currently running.
     */
    private _projectRunning: boolean

    /**
     * Timeout after which each playthrough is halted
     */
    private readonly _timeout: number;

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
        const events: EventAndParameters[] = [];

        // Set up the Scratch-VM and start the game
        Randomness.seedScratch();
        const _onRunStop = this.projectStopped.bind(this);
        this._vm.on(Runtime.PROJECT_RUN_STOP, _onRunStop);
        this._projectRunning = true;
        this._vmWrapper.start();

        // Initialise required variables.
        network.codons = [];
        let stepCount = 0;
        let workingNetwork = false;

        // Play the game until we reach a GameOver state or the timeout.
        const startTime = Date.now();
        while (this._projectRunning && Date.now() - startTime < this._timeout) {
            // Collect the currently available events.
            this.availableEvents = this._eventExtractor.extractEvents(this._vm)
            if (this.availableEvents.length === 0) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }

            // Update input nodes and load inputs into the Network.
            const spriteFeatures = InputExtraction.extractSpriteInfo(this._vmWrapper);

            // Check if we encountered additional events during the playthrough
            // If we did so add corresponding ClassificationNodes and RegressionNodes to the network.
            network.updateOutputNodes(this.availableEvents);

            // Select the next event...
            let eventIndex: number;
            if (this._eventSelection === 'random') {
                // Choose a random event index.
                eventIndex = this._random.nextInt(0, this.availableEvents.length);
                workingNetwork = true   // Set to true since we did not activate the network...
            } else {
                if (network.isRecurrent) {
                    workingNetwork = network.activateNetwork(spriteFeatures);
                } else {
                    // Flush the network and activate it until the output stabilizes.
                    network.flushNodeValues();
                    for (let i = 0; i < network.getMaxDepth(); i++) {
                        workingNetwork = network.activateNetwork(spriteFeatures);
                    }
                }

                // Choose the event with the highest probability according to the softmax values
                const output = NeuroevolutionUtil.softmaxEvents(network, this.availableEvents);
                const max = Math.max(...output);
                eventIndex = output.indexOf(max);
            }

            // Select the event matching, set required parameters and execute it.
            network.codons.push(eventIndex);
            const nextEvent: ScratchEvent = this.availableEvents[eventIndex];
            await this.executeNextEvent(network, nextEvent, events);

            // Record the activation trace.
            NetworkExecutor.recordActivationTrace(network, stepCount);

            stepCount++;
        }

        network.playTime = Math.trunc((Date.now() - startTime)) / 1000 * Container.acceleration;

        // Save the executed Trace and the covered blocks
        network.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.traces, events);
        network.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;

        // End and reset the VM.
        this._vmWrapper.end();
        this._vm.removeListener(Runtime.PROJECT_RUN_STOP, _onRunStop);

        // Should not happen!
        if (!workingNetwork) {
            console.error("Found defect Network", network);
        }

        StatisticsCollector.getInstance().numberFitnessEvaluations++;
        return network.trace;
    }

    /**
     * Event listener which checks if the project is still running, i.e. no GameOver state was reached.
     */
    private projectStopped() {
        return this._projectRunning = false;
    }

    /**
     * Selects the next event and executes it.
     * @param network determines the next action to take.
     * @param nextEvent the event that should be executed next.
     * @param events saves a trace of executed events.
     */
    private async executeNextEvent(network: NetworkChromosome, nextEvent: ScratchEvent, events: EventAndParameters[]) {
        const parameters = [];
        if (nextEvent.numSearchParameter() > 0) {
            parameters.push(...NetworkExecutor.getArgs(nextEvent, network));
            nextEvent.setParameter(parameters, "regression");
        }

        // Do not double press Keys as this just interrupts the prior key press.
        if (!this.isDoubleKeyPress(nextEvent)) {
            events.push(new EventAndParameters(nextEvent, parameters));
            await nextEvent.apply();
        }

        // To perform non-waiting actions, we have to execute a Wait.
        if (!(nextEvent instanceof WaitEvent)) {
            const waitEvent = new WaitEvent(1);
            events.push(new EventAndParameters(waitEvent, []));
            await waitEvent.apply();
        }

        StatisticsCollector.getInstance().incrementEventsCount();
    }

    private isDoubleKeyPress(nextEvent: ScratchEvent) {
        const key = String(nextEvent.getParameters()[0]);
        return nextEvent instanceof KeyPressEvent && this._vmWrapper.inputs.isKeyDown(key);
    }

    private static getArgs(event: ScratchEvent, network: NetworkChromosome): number[] {
        const args = [];
        for (const node of network.regressionNodes.get(event.stringIdentifier())) {
            args.push(node.activationValue);
        }
        return args;
    }

    /**
     * Records the ActivationTrace. We skip step 0 as this simply reflects how the project was loaded. However,
     * we are interested in step 1 as this one reflects initialisation values.
     * @param network the network whose activation trace should be updated.
     * @param stepCount determines whether we want to record the trace at the current step.
     */
    private static recordActivationTrace(network: NetworkChromosome, stepCount: number) {
        if (network.recordActivationTrace && stepCount > 0 && (stepCount % 5 == 0 || stepCount == 1)) {
            network.updateActivationTrace(stepCount);
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
