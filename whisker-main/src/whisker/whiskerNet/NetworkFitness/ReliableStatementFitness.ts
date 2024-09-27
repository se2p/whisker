import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {Container} from "../../utils/Container";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {NetworkExecutor} from "../Misc/NetworkExecutor";
import {Randomness} from "../../utils/Randomness";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {NeuroevolutionEventSelection} from "../HyperParameter/BasicNeuroevolutionParameter";
import {FitnessFunction} from "../../search/FitnessFunction";
import {eventAndParametersObject, ObjectInputFeatures, StateActionRecord} from "../Misc/GradientDescent";
import logger from "../../../util/logger";


export class ReliableStatementFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Random number generator.
     */
    private _random: Randomness

    /**
     * Safes the collected recordings of a single network evaluation.
     */
    private _dynamicRecordingBuffer: StateActionRecord = new Map<ObjectInputFeatures, eventAndParametersObject>();

    constructor(private _stableCount: number, private _earlyStop: boolean) {
        this._random = Randomness.getInstance();
    }

    /**
     * Fetches the targeted statement of a network and calculates its fitness.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @returns Promise<number> the fitness of the given network based on reliable statement coverage.
     */
    async getFitness(network: NetworkChromosome, timeout: number, eventSelection: NeuroevolutionEventSelection): Promise<number> {
        this._dynamicRecordingBuffer.clear();
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection, this._earlyStop);
        await executor.execute(network);
        network.resetOpenStatement();
        const fitness = await network.targetFitness.getFitness(network);
        await this.updateUncoveredMap(network);
        await executor.resetState();

        if (fitness > 0) {
            network.fitness = 1 - fitness;
        } else {

            // If Peer-To-Peer Sharing is activated, add collected trace to recording buffer.
            if (Container.backpropagationInstance && Container.dynamicRecordingFraction > 0) {
                this._dynamicRecordingBuffer = new Map([...this._dynamicRecordingBuffer, ...network.stateActionPairs]);
            }

            // If we cover the statement, we want to ensure using different seeds that we would cover this statement
            // in other circumstances as well.
            await this.checkStableCoverage(network, timeout, eventSelection);
        }

        StatisticsCollector.getInstance().computeStatementCoverage(this.stableCount);
        StatisticsCollector.getInstance().computeBranchCoverage(this.stableCount);
        return network.fitness;
    }

    /**
     * Keep executing the network with different seeds and check for each seed which Scratch statements are covered.
     * @param network the network that will be executed.
     * @param timeout the timeout for one playthrough.
     * @param eventSelection the eventSelection method (activation | random).
     */
    private async checkStableCoverage(network: NetworkChromosome, timeout: number, eventSelection: string): Promise<void> {
        // Save some values to recover them later
        const originalSeed = Randomness.scratchSeed;
        const originalPlayTime = network.playTime;
        const originalScore = network.score;
        const trace = network.trace.clone();
        const coverage = new Set(network.coverage);
        const trueFitnessEvaluations = StatisticsCollector.getInstance().numberFitnessEvaluations;
        const repetitionSeeds = Array(this.stableCount - 1).fill(0).map(
            () => this._random.nextInt(0, Number.MAX_SAFE_INTEGER));

        // Iterate over each seed and calculate the achieved fitness
        for (const seed of repetitionSeeds) {
            Randomness.setScratchSeed(seed, true);
            const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection, this._earlyStop);
            if (eventSelection === 'random') {
                // Re-execute the saved sequence from the first run
                await executor.executeSavedTrace(network);
            } else {
                // Let the network decided on what to do...
                await executor.execute(network);
            }
            await executor.resetState();
            await this.updateUncoveredMap(network);
            await executor.resetState();

            // If the chromosome did not manage to reach the target statement, add the inverted distance toward the
            // target statement to the fitness function.
            if (!await network.targetFitness.isCovered(network)) {
                network.fitness += (1 - await network.targetFitness.getFitness(network));
                continue;
            }

            // At this point, we know that we have covered the statement again.
            // If Peer-To-Peer Sharing is activated, add collected state-action trace to gradient descent ground truth data.
            if (Container.backpropagationInstance && Container.dynamicRecordingFraction > 0) {
                this._dynamicRecordingBuffer = new Map([...this._dynamicRecordingBuffer, ...network.stateActionPairs]);
            }
        }
        // Add dynamically recorded data to training dataset.
        this._addDynamicRecordToTrainingDataset();

        // Reset to the old Scratch seed and network attributes.
        Randomness.setScratchSeed(originalSeed, true);
        network.playTime = originalPlayTime;
        network.score = originalScore;
        network.trace = trace;
        network.coverage = coverage;
        StatisticsCollector.getInstance().numberFitnessEvaluations = trueFitnessEvaluations;
        logger.debug(`Achieved fitness for ${network.targetFitness}: ${network.fitness}`);
    }

    /**
     * Updates the map of uncovered targets by the number of times the given network was able to cover a respective
     * target.
     * @param network the network chromosome that has finished its playthrough.
     */
    private async updateUncoveredMap(network: NetworkChromosome): Promise<void> {
        // Increase the score by 1 if we covered the given statement in the executed scenario as well.
        for (const [fitnessKey, coverCount] of network.openStatementTargets.entries()) {
            const statement = Container.statementFitnessFunctions[fitnessKey] as unknown as FitnessFunction<NetworkChromosome>;
            if (await statement.isCovered(network)) {
                network.openStatementTargets.set(fitnessKey, coverCount + 1);
                if (statement === network.targetFitness) {
                    network.fitness++;
                }
            }
        }

        // Update statistics on the number of covered statements and branches
        await StatisticsCollector.getInstance().updateStatementCoverage(network, this.stableCount);
        await StatisticsCollector.getInstance().updateBranchCoverage(network, this.stableCount);
    }

    get stableCount(): number {
        return this._stableCount;
    }

    /**
     * Adds a random subset of collected state-action traces to the gradient descent ground truth data.
     */
    private _addDynamicRecordToTrainingDataset(): void {
        if (Container.dynamicRecordingFraction <= 0) {
            return;
        }

        const extractionSize = Math.floor(this._dynamicRecordingBuffer.size * Container.dynamicRecordingFraction);
        const stateKeys: ObjectInputFeatures[] = [...this._dynamicRecordingBuffer.keys()];

        for (let i = 0; i < extractionSize; i++) {
            const randomKey = this._random.pick(stateKeys);
            const event = this._normaliseActionParameter(this._dynamicRecordingBuffer.get(randomKey));
            Container.backpropagationInstance.training_data.set(randomKey, event);
            stateKeys.slice(stateKeys.indexOf(randomKey), 1);
        }

        logger.debug(`Picked ${extractionSize} data points and increased Dataset size to ${Container.backpropagationInstance.training_data.size}`);
    }

    /**
     * Normalises executed event parameter.
     * @param event the event object hosting the executed event parameter.
     */
    private _normaliseActionParameter(event: eventAndParametersObject): eventAndParametersObject {
        if (event.event == "WaitEvent") {
            event.parameter = {'Duration': Math.min(event.parameter['Duration'] / Container.config.getWaitStepUpperBound(), 1)};     // Wait duration
        } else if (event.event.startsWith("KeyPressEvent")) {
            event.parameter = {'Steps': Math.min(event.parameter['Steps'] / Container.config.getPressDurationUpperBound(), 1)};      // Press duration
        } else if (event.event == "TypeNumberEvent") {
            event.parameter = {"Number": event.parameter['Number']};   // Number
        } else if (event.event == "MouseMoveEvent") {
            event.parameter = {"X": event['X'] / 240, "Y": event['Y'] / 180}; // Coordinates.
        } else if (event.event == "MouseDownForStepsEvent") {
            event.parameter = {"Steps": Math.min(event['Steps'] / Container.config.getPressDurationUpperBound(), 1)}; // Steps;
        }

        return event;
    }
}
