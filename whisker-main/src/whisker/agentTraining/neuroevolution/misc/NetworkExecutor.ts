import VMWrapper = require("../../../../vm/vm-wrapper.js");
import VirtualMachine from "scratch-vm/src/virtual-machine";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {CoverageTrace, EventAndParameters, ExecutionTrace, SpriteTrace} from "../../../testcase/ExecutionTrace";
import {Randomness} from "../../../utils/Randomness";
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import {WaitEvent} from "../../../testcase/events/WaitEvent";
import {NetworkChromosome} from "../networks/NetworkChromosome";
import {ScratchEventExtractor} from "../../../testcase/ScratchEventExtractor";
import Runtime from "scratch-vm/src/engine/runtime";
import {NeuroevolutionScratchEventExtractor} from "../../../testcase/NeuroevolutionScratchEventExtractor";
import {Container} from "../../../utils/Container";
import {ScoreFitness} from "../networkFitness/ScoreFitness";
import {StatementFitnessFunction} from "../../../testcase/fitness/StatementFitnessFunction";
import {NetworkFitnessFunctionType} from "../networkFitness/NetworkFitnessFunctionType";
import {CosineStateNovelty} from "../networkFitness/Novelty/CosineStateNovelty";
import {MouseMoveDimensionEvent} from "../../../testcase/events/MouseMoveDimensionEvent";
import {ActionNode} from "../networkComponents/ActionNode";
import {TypeNumberEvent} from "../../../testcase/events/TypeNumberEvent";
import {ActivationFunction} from "../networkComponents/ActivationFunction";
import {ClassificationType} from "../hyperparameter/BasicNeuroevolutionParameter";
import {FeatureExtraction, InputFeatures} from "../../featureExtraction/FeatureExtraction";

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
    private readonly _initialState = {};

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
     * The number of frames to skip between events.
     */
    private readonly _skipFrame: number;

    /**
     * The threshold for an activation value that must be met for an action to be executed.
     */
    private readonly _actionThreshold: number;

    /**
     * Constructs a new NetworkExecutor object.
     * @param _vmWrapper the wrapper of the Scratch-VM.
     * @param _timeout timeout after which each playthrough is halted.
     * @param _eventSelection defines how a network will select events during its playthrough.
     * @param _classificationType defines the classification type.
     * @param _stopEarly determines whether we want to stop the execution when we have covered the network's objective.
     */
    constructor(private readonly _vmWrapper: VMWrapper, private readonly _timeout: number,
                private readonly _eventSelection: string,
                _classificationType: ClassificationType,
                private readonly _stopEarly: boolean) {
        this._vm = this._vmWrapper.vm;
        this._eventExtractor = new NeuroevolutionScratchEventExtractor(this._vm, _classificationType);
        this._initialState = this._vmWrapper._recordInitialState();
        this._skipFrame = Container.config.getSkipFrame();
        this._actionThreshold = Container.config.getActionThreshold();
    }

    async execute(network: NetworkChromosome): Promise<ExecutionTrace> {
        const events: EventAndParameters[] = [];
        const spritesTrace: SpriteTrace = {pass: false, positions: []};

        // Set up the Scratch-VM and start the game
        const _onRunStop = this._projectStopped.bind(this);
        this._projectRunning = true;
        await this._vmWrapper.start();
        let stepCount = 0;

        this._vm.runtime.on(Runtime.PROJECT_STOP_ALL, _onRunStop);
        const startTime = Date.now();
        while (this._projectRunning && Date.now() - startTime < this._timeout) {
            this.availableEvents = this._eventExtractor.extractEvents(this._vm);

            // Execute WaitEvent if there are no events available.
            if (this.availableEvents.length === 0) {
                await new WaitEvent(this._skipFrame).apply();
                continue;
            }

            // Update input/output nodes if novel inputs/actions have been discovered.
            const spriteFeatures = FeatureExtraction.getFeatureMap(this._vm);
            const collectedTrace = this._collectSpritePositions(spriteFeatures);
            spritesTrace.positions.push(collectedTrace);

            network.updateInputNodes(spriteFeatures);
            network.updateOutputNodes(this.availableEvents);

            // Select the next event and execute it if we did not decide to wait
            network.activateNetwork(spriteFeatures);
            const nextEvents = this._selectNextEvents(network);
            await this._executeNextEvents(nextEvents, events, network);

            // Record the activation trace and increase the stepCount.
            this._recordActivationTrace(network, stepCount, spriteFeatures);
            stepCount++;

            if (this._doStopEarly(network.targetObjective as StatementFitnessFunction)) {
                break;
            }
        }

        // Set score and playtime.
        network.score = ScoreFitness.gatherPoints(this._vm);
        network.playTime = Date.now() - startTime;

        // Save the executed Trace, the covered blocks and the sprites trace
        const coverageTrace: CoverageTrace = this._vm.getTraces();
        network.trace = new ExecutionTrace(coverageTrace.branchDistances, events, spritesTrace);
        network.coverage = coverageTrace.blockCoverage;
        network.branchCoverage = coverageTrace.branchCoverage;

        // Saves the final state of the network if we want to compute a state-based novelty score.
        if (Container.config.getNetworkFitnessFunctionType() === NetworkFitnessFunctionType.NOVELTY_COSINE ||
            Container.config.getManyObjectiveNoveltyFunction() instanceof CosineStateNovelty) {
            network.finalState = FeatureExtraction.getFeatureMap(this._vm);
        }

        // Stop VM and remove listeners.
        this._vm.runtime.off(Runtime.PROJECT_STOP_ALL, _onRunStop);
        this._vmWrapper.end();

        StatisticsCollector.getInstance().evaluations++;
        return network.trace;
    }

    /**
     * Event listener which checks if the project is still running, i.e., no GameOver state was reached.
     */
    private _projectStopped() {
        return this._projectRunning = false;
    }

    /**
     * Determines whether to stop early if the specified objective has been covered.
     *
     * @param {StatementFitnessFunction} objective to be covered.
     * @return {boolean} True if the process should stop early, false otherwise.
     */
    private _doStopEarly(objective: StatementFitnessFunction): boolean {
        if (!this._stopEarly) {
            return false;
        }
        const traces: CoverageTrace = this._vm.getTraces();
        const coverages = new Set([...traces.blockCoverage, ...traces.branchCoverage]);
        return coverages.has(objective.getNodeId());
    }

    /**
     * Executes an execution trace saved within the network.
     * @param network the network holding the execution trace.
     */
    public async executeSavedTrace(network: NetworkChromosome): Promise<ExecutionTrace> {
        const spritesTrace: SpriteTrace = {pass: false, positions: []};

        // Set up the Scratch-VM and start the game
        const _onRunStop = this._projectStopped.bind(this);
        this._projectRunning = true;
        await this._vmWrapper.start();

        const eventTrace = network.trace.events;
        this._vm.on(Runtime.PROJECT_STOP_ALL, _onRunStop);
        const startTime = Date.now();
        for (let i = 0; i < eventTrace.length; i++) {

            // Stop if the project is no longer running.
            if (!this._projectRunning) {
                break;
            }
            // Load input features into the node to record the activation trace later.
            const spriteFeatures = FeatureExtraction.getFeatureMap(this._vm);
            const collectedTrace = this._collectSpritePositions(spriteFeatures);
            spritesTrace.positions.push(collectedTrace);

            network.setUpInputs(spriteFeatures);

            // Execute the event
            const event = eventTrace[i].event;
            await event.apply();

            // Record Activation trace.
            this._recordActivationTrace(network, i, spriteFeatures);

            if (this._doStopEarly(network.targetObjective as StatementFitnessFunction)) {
                break;
            }
        }

        // Set score and playtime.
        network.score = ScoreFitness.gatherPoints(this._vm);
        network.playTime = Date.now() - startTime;

        // Save the executed Trace and the covered blocks
        const coverageTrace: CoverageTrace = this._vm.getTraces();
        network.trace = new ExecutionTrace(coverageTrace.branchDistances, eventTrace, spritesTrace);
        network.coverage = coverageTrace.blockCoverage;
        network.branchCoverage = coverageTrace.branchCoverage;

        // Stop VM and remove listeners.
        this._vm.off(Runtime.PROJECT_STOP_ALL, _onRunStop);
        this._vmWrapper.end();
        StatisticsCollector.getInstance().evaluations++;
        return network.trace;
    }

    /**
     * Collects all (X, Y) positions of sprites (excluding "Stage") from the given input features.
     * @param inputFeatures - Map of sprite names to their feature sets.
     * @returns A flat array of numbers representing all sprite coordinates [x1, y1, x2, y2, ...].
     */
    private _collectSpritePositions(inputFeatures: InputFeatures): number[] {
        const spritesPositions: number[] = [];
        inputFeatures.forEach((features, sprite) => {
            if (sprite != "Stage" && features.size > 0 && features.has("X") && features.has("Y")) {
                spritesPositions.push(features.get('X'), features.get('Y'));
            }
        });
        return spritesPositions;
    }

    /**
     * Selects the next event by selecting a random event if the eventSelection variable is set correspondingly
     * or by querying the network otherwise.
     * @param network the network that will be used to determine the next events.
     * @returns the set of events to be executed in the next step.
     */
    private _selectNextEvents(network: NetworkChromosome): ScratchEvent[] {
        if (this._eventSelection === 'random') {
            return this.availableEvents.filter(() => this._random.nextDouble());
        } else if (network.outputActivationFunction === ActivationFunction.SIGMOID) {
            const triggerNodes = network.getTriggerActionNodes().filter(node => node.activationValue > this._actionThreshold);
            const continuousNodes = network.getContinuousActionNodes();
            return [...this._filterMatchingEvents(triggerNodes), ...this._filterMatchingEvents(continuousNodes)];
        } else if (network.outputActivationFunction === ActivationFunction.SOFTMAX) {
            const availableEventIdentifier = this.availableEvents.map(e => e.stringIdentifier());
            const availableNodes = network.getTriggerActionNodes().filter(node => availableEventIdentifier.includes(node.event.stringIdentifier()));
            const maxTriggerAction = availableNodes.reduce((a, b) => a.activationValue > b.activationValue ? a : b).event;

            const continuousNodes = network.getContinuousActionNodes();
            return [maxTriggerAction, ...this._filterMatchingEvents(continuousNodes)];
        } else {
            throw new Error(`Output activation function ${network.outputActivationFunction} not supported`);
        }
    }

    /**
     * Filters the available events to only include those that match the given action nodes.
     * @param node the action nodes to filter the events by.
     */
    private _filterMatchingEvents(node: ActionNode[]): ScratchEvent[] {
        return this.availableEvents.filter(e => node
            .some(n => n.event.stringIdentifier() === e.stringIdentifier()));
    }

    /**
     * Execute the selected events.
     * @param nextEvents the event that should be executed next.
     * @param events the trace of executed events.
     * @param network the network that will be used to determine parameters.
     */
    private async _executeNextEvents(nextEvents: ScratchEvent[], events: EventAndParameters[], network: NetworkChromosome) {
        // If the only event to be executed is a WaitEvent, update the state without sending events to the VM.
        if (nextEvents.length === 1 && nextEvents[0] instanceof WaitEvent) {
            await this.updateState(events);
            return;
        }

        // Otherwise, if there are other events to be executed, send them to the VM and filter WaitEvents.
        // We need to filter WaitEvents as otherwise continuous action nodes might not be properly executed in
        // a multi-class classification network with continuous action nodes.
        const filteredEvents = nextEvents.filter(e => !(e instanceof WaitEvent));
        for (const nextEvent of filteredEvents) {
            const parameters = [this._getParameter(nextEvent, network)];
            events.push(new EventAndParameters(nextEvent, parameters));
            nextEvent.setParameter(parameters, "activation");
            await nextEvent.apply();
            StatisticsCollector.getInstance().incrementEventsCount();
        }
        await this.updateState(events);
    }

    /**
     * Trigger a state update in the VM by executing a WaitEvent.
     * @param events the trace of executed events.
     */
    private async updateState(events: EventAndParameters[]) {
        const waitEvent = new WaitEvent(this._skipFrame);
        events.push(new EventAndParameters(waitEvent, [this._skipFrame]));
        await waitEvent.apply();
    }

    /**
     * Gets the parameters for the next event.
     * @param event the event whose parameters should be retrieved.
     * @param network the network that will be used to determine parameters.
     * @returns the parameters for the next event.
     */
    private _getParameter(event: ScratchEvent, network: NetworkChromosome): number {
        if (event instanceof MouseMoveDimensionEvent) {
            const mouseMoveByNode = this._findNodeByEvent(event, network);
            return mouseMoveByNode.activationValue;
        } else if (event instanceof TypeNumberEvent) {
            const typeNumberNode = this._findNodeByEvent(event, network);
            return typeNumberNode.activationValue;
        }
        return this._skipFrame;
    }

    /**
     * Finds the node corresponding to the given event in the network.
     * @param event the event whose node should be found.
     * @param network the network in which to search for the node.
     * @returns the node corresponding to the event.
     */
    private _findNodeByEvent(event: ScratchEvent, network: NetworkChromosome): ActionNode {
        return network.getActionNodes().find(node => node.event.stringIdentifier() === event.stringIdentifier());
    }

    /**
     * Records the ActivationTrace. We skip step 0 as this simply reflects how the project was loaded. However,
     * we are interested in step 1 as this one reflects initialization values.
     * @param network the network whose activation trace should be updated.
     * @param step determines whether we want to record the trace at the current step.
     * @param inputs the inputs based on which an activationTrace will be recorded.
     */
    private _recordActivationTrace(network: NetworkChromosome, step: number, inputs: InputFeatures) {
        // With higher skipFrame values, we see fewer overall frames/steps.
        // Hence, we scale the sample frequency based on the skipFrame parameter.
        let sampleFrequency = 1;
        if (this._skipFrame === 1) {
            sampleFrequency = 5;
        } else if (this._skipFrame === 2 || this._skipFrame === 3) {
            sampleFrequency = 2;
        }
        if (network.recordNetworkStatistics && step > 0 && (step % sampleFrequency === 0 || step === 1)) {
            network.setUpInputs(inputs);
            network.updateActivationTrace(step);
        }
    }

    /**
     * Resets the Scratch-VM to the initial state
     */
    public async resetState(): Promise<void> {
        await this._vmWrapper.resetProject(this._initialState);
    }
}
