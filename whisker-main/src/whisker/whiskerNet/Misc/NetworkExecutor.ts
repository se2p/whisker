import VMWrapper = require("../../../vm/vm-wrapper.js");
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {EventAndParameters, ExecutionTrace} from "../../testcase/ExecutionTrace";
import {Randomness} from "../../utils/Randomness";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {WaitEvent} from "../../testcase/events/WaitEvent";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {InputExtraction, InputFeatures} from "./InputExtraction";
import {NeuroevolutionUtil} from "./NeuroevolutionUtil";
import {ScratchEventExtractor} from "../../testcase/ScratchEventExtractor";
import Runtime from "scratch-vm/src/engine/runtime";
import {NeuroevolutionScratchEventExtractor} from "../../testcase/NeuroevolutionScratchEventExtractor";
import {KeyPressEvent} from "../../testcase/events/KeyPressEvent";
import {Container} from "../../utils/Container";
import {ParameterType} from "../../testcase/events/ParameterType";
import {ScoreFitness} from "../NetworkFitness/ScoreFitness";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";

export class NetworkExecutor {

    /**
     * The Scratch-VM of the project which will we executed.
     */
    private readonly _vm: VirtualMachine;

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
     * Random generator
     */
    private _random = Randomness.getInstance();

    /**
     * Extractor to determine possible events
     */
    private _eventExtractor: ScratchEventExtractor;

    /**
     * The number of steps we are waiting before executing a new event. Set by WaitEvents.
     */
    private _waitDuration = 0;

    /**
     * Constructs a new NetworkExecutor object.
     * @param _vmWrapper the wrapper of the Scratch-VM.
     * @param _timeout timeout after which each playthrough is halted.
     * @param _eventSelection defines how a network will select events during its playthrough.
     * @param _stopEarly determines whether we want to stop the execution as soon was we have covered the network's
     * fitness objective.
     */
    constructor(private readonly _vmWrapper: VMWrapper, private readonly _timeout: number,
                private readonly _eventSelection: string,
                private readonly _stopEarly: boolean) {
        this._vm = this._vmWrapper.vm;
        this._eventExtractor = new NeuroevolutionScratchEventExtractor(this._vm);
        this.recordInitialState();
    }

    async execute(network: NetworkChromosome): Promise<ExecutionTrace> {
        const events: EventAndParameters[] = [];

        // Set up the Scratch-VM and start the game
        Randomness.seedScratch(this._vm);
        const _onRunStop = this.projectStopped.bind(this);
        this._projectRunning = true;
        this._vmWrapper.start();
        this._waitDuration = 0;

        // Initialise required variables.
        network.codons = [];
        let stepCount = 0;

        // Play the game until we reach a GameOver state or the timeout.
        const statementTarget = network.targetFitness as StatementFitnessFunction;
        const isGreenFlag = this._stopEarly &&
            statementTarget !== undefined &&
            statementTarget.getTargetNode().block.opcode === 'event_whenflagclicked';

        this._vm.runtime.on(Runtime.PROJECT_STOP_ALL, _onRunStop);
        const startTime = Date.now();
        while (this._projectRunning && Date.now() - startTime < this._timeout) {
            // Collect the currently available events.
            this.availableEvents = this._eventExtractor.extractEvents(this._vm);
            if (this.availableEvents.length === 0) {
                console.log("Whisker-Main: No events available for project.");
                break;
            }

            // Update input nodes and load inputs into the Network.
            const spriteFeatures = InputExtraction.extractFeatures(this._vm);

            // Check if we encountered additional events during the playthrough
            // If we did so add corresponding ClassificationNodes and RegressionNodes to the network.
            network.updateOutputNodes(this.availableEvents);
            const defect = !network.activateNetwork(spriteFeatures);

            // Stop if our network is defect.
            if (defect) {
                console.log("Defect network:", network.toString());
                break;
            }

            // Select the next event and execute it if we did not decide to wait
            if (this._waitDuration <= 0) {
                let eventIndex = this.selectNextEvent(network, isGreenFlag);
                let nextEvent = this.availableEvents[eventIndex];

                // If something goes wrong, e.g. we have a defect network due to all active input nodes being
                // disconnected to every output node, just insert a Wait.
                if (nextEvent === undefined) {
                    eventIndex = this.availableEvents.findIndex(event => event instanceof WaitEvent);
                    nextEvent = this.availableEvents[eventIndex];

                    // If we still don't have a WaitEvent, we must add it manually. This could happen if we encounter
                    // type text events.
                    if (nextEvent === undefined) {
                        this.availableEvents.push(new WaitEvent());
                        nextEvent = this.availableEvents[this.availableEvents.length - 1];
                    }
                }
                network.codons.push(eventIndex);
                await this.executeNextEvent(network, nextEvent, events, isGreenFlag);

                // Record the state action pair:
                if (Container.peerToPeerSharing && !(nextEvent instanceof WaitEvent)) {
                    network.updateStateActionPair(spriteFeatures, events[events.length - 1]);
                }
            }

            // Otherwise, we just Wait...
            else {
                this._waitDuration--;
            }

            // Record the activation trace and increase the stepCount.
            this.recordActivationTrace(network, stepCount, spriteFeatures);
            stepCount++;

            // Check if we have reached our selected target and stop if it's not the green flag this is the case.
            // Keep executing when green flag was covered to cover all easy target at once and avoid repeated executions
            // for trivial targets.
            if (this._stopEarly && statementTarget !== undefined && statementTarget.getCDGDepth() > 1) {
                const currentCoverage: Set<string> = this._vm.runtime.traceInfo.tracer.coverage;
                if (currentCoverage.has(statementTarget.getTargetNode().id)) {
                    break;
                }
            }
        }

        // Set score and play time.
        network.score = ScoreFitness.gatherPoints(this._vm);
        network.playTime = Math.trunc((Date.now() - startTime)) / 1000 * Container.acceleration;

        // Save the executed Trace and the covered blocks
        network.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.branchDistTraces, events);
        network.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;

        // Stop VM and remove listeners.
        this._vm.runtime.off(Runtime.PROJECT_STOP_ALL, _onRunStop);
        this._vmWrapper.end();

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
     * Executes an execution trace that is saved within the network.
     * @param network the network holding the execution trace.
     */
    public async executeSavedTrace(network: NetworkChromosome): Promise<ExecutionTrace> {
        // Set up the Scratch-VM and start the game
        Randomness.seedScratch(this._vm);
        const _onRunStop = this.projectStopped.bind(this);
        this._projectRunning = true;
        this._vmWrapper.start();

        const eventTrace = network.trace.events;
        const statementTarget = network.targetFitness as StatementFitnessFunction;
        this._vm.on(Runtime.PROJECT_STOP_ALL, _onRunStop);
        const startTime = Date.now();
        for (let i = 0; i < eventTrace.length; i++) {

            // Stop if project is no longer running.
            if (!this._projectRunning) {
                break;
            }
            // Load input features into the node to record the AT later.
            const spriteFeatures = InputExtraction.extractFeatures(this._vm);
            network.setUpInputs(spriteFeatures);

            // Execute the event
            const event = eventTrace[i].event;
            await event.apply();

            // Record Activation trace.
            this.recordActivationTrace(network, i, spriteFeatures);

            // Check if we have reached our selected target and stop if this is the case.
            if (this._stopEarly && statementTarget !== undefined) {
                const currentCoverage: Set<string> = this._vm.runtime.traceInfo.tracer.coverage;
                if (currentCoverage.has(statementTarget.getTargetNode().id)) {
                    break;
                }
            }
        }

        // Set score and play time.
        network.score = ScoreFitness.gatherPoints(this._vm);
        network.playTime = Math.trunc((Date.now() - startTime)) / 1000 * Container.acceleration;

        // Save the executed Trace and the covered blocks
        network.trace = new ExecutionTrace(this._vm.runtime.traceInfo.tracer.branchDistTraces, eventTrace);
        network.coverage = this._vm.runtime.traceInfo.tracer.coverage as Set<string>;

        // Stop VM and remove listeners.
        this._vm.off(Runtime.PROJECT_STOP_ALL, _onRunStop);
        this._vmWrapper.end();
        StatisticsCollector.getInstance().numberFitnessEvaluations++;
        return network.trace;
    }

    /**
     * Selects the next event by 1) Waiting for 1 step if we are currently trying to cover the GreenFlag event.
     *                           2) Selecting a random event if the eventSelection variable is set appropriately.
     *                           3) Querying the network's classification head.
     * @param network the network that will be queried in case of 3).
     * @param isGreenFlag boolean determining whether we are currently trying to cover the greenFlagEvent.
     * @returns the index of the chosen event parameter based on the set of events extracted from the Scratch state.
     */
    private selectNextEvent(network: NetworkChromosome, isGreenFlag: boolean): number {
        // 1) GreenFlag is current target Statement
        if (isGreenFlag) {
            return this.availableEvents.findIndex(event => event instanceof WaitEvent);
        }
        // 2) Random event selection
        else if (this._eventSelection === 'random') {
            return this._random.nextInt(0, this.availableEvents.length);
        }
        // 3) Query the network's classification head.
        else {
            // Choose the event with the highest probability according to the softmax values
            const eventProbabilities = NeuroevolutionUtil.softmaxEvents(network, this.availableEvents);
            if (eventProbabilities.size > 0) {
                const mostProbablePair = [...eventProbabilities.entries()].reduce(
                    (pV, cV) => cV[1] > pV [1] ? cV : pV);
                return this.availableEvents.findIndex(event => event.stringIdentifier() === mostProbablePair[0].stringIdentifier());
            } else {
                // It can happen that all output nodes of corresponding available events do not have an active path
                // starting from the input nodes, i.e. they did not get activated. In that case we just wait.
                return this.availableEvents.findIndex(event => event instanceof WaitEvent);
            }
        }
    }

    /**
     * Selects the next event and executes it.
     * @param network determines the next action to take.
     * @param nextEvent the event that should be executed next.
     * @param events saves a trace of executed events.
     * @param greenFlag determines whether the next event is based on the greenFlag event as a targetStatement. If
     * so we do not want to add any parameters and just wait for 1 Step.
     */
    private async executeNextEvent(network: NetworkChromosome, nextEvent: ScratchEvent, events: EventAndParameters[],
                                   greenFlag = false): Promise<void> {
        let setParameter: number[];
        const argType: ParameterType = this._eventSelection as ParameterType;
        if (nextEvent.numSearchParameter() > 0 && !greenFlag) {
            const parameters = NetworkExecutor.getArgs(nextEvent, network);
            setParameter = nextEvent.setParameter(parameters, argType);
        }

        // Do not double press Keys as this just interrupts the prior key press.
        if (!this.isDoubleKeyPress(nextEvent)) {
            events.push(new EventAndParameters(nextEvent, setParameter));
            await nextEvent.apply();
        }

        // To perform non-waiting actions, we have to execute a Wait.
        if (!(nextEvent instanceof WaitEvent)) {
            const waitEvent = new WaitEvent(1);
            events.push(new EventAndParameters(waitEvent, [1]));
            await waitEvent.apply();
        } else {
            // Otherwise, set the wait duration
            this._waitDuration = nextEvent.getParameters()[0];
        }

        StatisticsCollector.getInstance().incrementEventsCount();
    }

    /**
     * Checks for double key presses. We do not want to re-press an already pressed key since this only interrupts
     * the key press signal sent to the VM.
     * @param nextEvent the nextEvent which will be checked against a double keyPress.
     * @returns true if we are about to double press an already pressed key.
     */
    private isDoubleKeyPress(nextEvent: ScratchEvent): boolean {
        const key = String(nextEvent.getParameters()[0]);
        return nextEvent instanceof KeyPressEvent && this._vmWrapper.inputs.isKeyDown(key);
    }

    /**
     * Extracts the arguments for parameters by querying the regression head of the neural network.
     * @param event for which parameter will be extracted
     * @param network that will be queried for parameter
     * @returns the extracted parameter.
     */
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
     * @param step determines whether we want to record the trace at the current step.
     * @param inputs the inputs based on which an activationTrace will be recorded.
     */
    private recordActivationTrace(network: NetworkChromosome, step: number, inputs: InputFeatures) {
        if (network.recordNetworkStatistics && step > 0 && (step % 5 == 0 || step == 1)) {
            network.setUpInputs(inputs);
            network.updateActivationTrace(step);
            const probabilities = NeuroevolutionUtil.softmaxEvents(network, this.availableEvents);
            if (probabilities.size > 0) {
                network.testUncertainty.set(step, 1 - [...probabilities.values()].reduce(
                    (pv, cv) => pv + Math.pow(cv, 2), 0));
            }
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
                variables: JSON.parse(JSON.stringify(this._vm.runtime.targets[targetsKey]["variables"]))
            };
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
            const x = this._initialState[targetsKey]["x"];
            const y = this._initialState[targetsKey]["y"];
            this._vm.runtime.targets[targetsKey].setXY(x, y, true, true);
            this._vm.runtime.targets[targetsKey]["variables"] = JSON.parse(JSON.stringify(this._initialState[targetsKey]["variables"]));
        }

        this._vmWrapper.inputs.resetMouse();
        this._vmWrapper.inputs.resetKeyboard();
    }
}
