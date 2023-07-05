import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {Container} from "../../utils/Container";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {NetworkExecutor} from "../Misc/NetworkExecutor";
import {Randomness} from "../../utils/Randomness";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {NeuroevolutionEventSelection} from "../HyperParameter/BasicNeuroevolutionParameter";
import {FitnessFunction} from "../../search/FitnessFunction";


export class ReliableStatementFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Random number generator.
     */
    private _random: Randomness

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
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection, this._earlyStop);
        await executor.execute(network);
        network.resetOpenStatement();
        const fitness = await network.targetFitness.getFitness(network);
        await ReliableStatementFitness.updateUncoveredMap(network);
        executor.resetState();

        if (fitness > 0) {
            network.fitness = 1 / fitness;
        } else {

            // If Peer-To-Peer Sharing is activated, add collected state-action trace to gradient descent training data.
            if (Container.backpropagationInstance && Container.peerToPeerSharing) {
                this._peerToPeerSharing(network);
            }
            // If we cover the statement, we want to ensure using different seeds that we would cover this statement
            // in other circumstances as well.
            await this.checkStableCoverage(network, timeout, eventSelection);
        }
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
            executor.resetState();
            await ReliableStatementFitness.updateUncoveredMap(network);
            executor.resetState();

            // Stop if we failed to cover our target statement.
            if(!await network.targetFitness.isCovered(network)){
                network.fitness += (1 / await network.targetFitness.getFitness(network));
                break;
            }

            // At this point we know that we have covered the statement again.
            // If Peer-To-Peer Sharing is activated, add collected state-action trace to gradient descent ground truth data.
            if (Container.backpropagationInstance && Container.peerToPeerSharing) {
                this._peerToPeerSharing(network);
            }
        }
        // Reset to the old Scratch seed and network attributes.
        Randomness.setScratchSeed(originalSeed, true);
        network.playTime = originalPlayTime;
        network.score = originalScore;
        network.trace = trace;
        network.coverage = coverage;
        StatisticsCollector.getInstance().numberFitnessEvaluations = trueFitnessEvaluations;
        Container.debugLog(`Achieved fitness for ${network.targetFitness}: ${network.fitness}`);
    }

    /**
     * Updates the map of uncovered targets by the amount of times the given network was able to cover a respective
     * target.
     * @param network the network chromosome that has finished its playthrough.
     */
    private static async updateUncoveredMap(network: NetworkChromosome): Promise<void> {
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
    }

    get stableCount(): number {
        return this._stableCount;
    }

    /**
     * Adds the collected state-action trace to the gradient descent ground truth data.
     * @param network the network in which the state-action trace is saved.
     */
    private _peerToPeerSharing(network: NetworkChromosome): void {
        for (const [state, action] of network.stateActionPairs.entries()) {
            Container.backpropagationInstance.training_data.set(state, action);
        }
        Container.debugLog(`Increased Dataset size to ${Container.backpropagationInstance.training_data.size}`);
        network.stateActionPairs.clear();
    }
}
