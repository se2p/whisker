import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {Container} from "../../../utils/Container";
import {NetworkChromosome} from "../networks/NetworkChromosome";
import {NetworkExecutor} from "../misc/NetworkExecutor";
import {Randomness} from "../../../utils/Randomness";
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import {ClassificationType, NeuroevolutionEventSelection} from "../hyperparameter/BasicNeuroevolutionParameter";
import {ExecutionTrace} from "../../../testcase/ExecutionTrace";


export class ReliableCoverageFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Random number generator.
     */
    private _random: Randomness

    constructor(private _stableCount: number, private _earlyStop: boolean) {
        this._random = Randomness.getInstance();
    }

    /**
     * Fetches the targeted objective of a network and calculates its fitness.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @param classificationType defines how the networks select events.
     * @returns Promise<number> the fitness of the given network based on reliable coverage.
     */
    async getFitness(network: NetworkChromosome, timeout: number, eventSelection: NeuroevolutionEventSelection,
                     classificationType: ClassificationType): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection,
            classificationType, this._earlyStop);
        await executor.execute(network);
        network.resetCoverageMap();
        const fitness = await network.targetObjective.getFitness(network);
        await this.updateUncoveredObjectives(network);
        await executor.resetState();

        if (fitness > 0) {
            network.fitness = 1 - fitness;
        } else {
            // Check for stable coverage if we covered the objective once.
            network.fitness = 1;
            await this.checkStableCoverage(network, timeout, eventSelection, classificationType);
        }

        StatisticsCollector.getInstance().computeStatementCoverage();
        StatisticsCollector.getInstance().computeBranchCoverage();
        return network.fitness;
    }

    /**
     * Keep executing the network with different seeds and check for each seed which objectives are covered.
     * @param network the network that will be executed.
     * @param timeout the timeout for one playthrough.
     * @param eventSelection the eventSelection method (activation | random).
     * @param classificationType defines how the networks select events.
     */
    protected async checkStableCoverage(network: NetworkChromosome, timeout: number, eventSelection: string,
                                        classificationType: ClassificationType): Promise<void> {
        // Save some values to recover them later
        const {playTime, score, trace, finalState, coverage, branchCoverage} = this.copyNetworkAttributes(network);
        const trueFitnessEvaluations = StatisticsCollector.getInstance().evaluations;
        const repetitionSeeds = Array(this.stableCount - 1).fill(0).map(
            () => this._random.nextInt(0, Number.MAX_SAFE_INTEGER));

        // Iterate over each seed and calculate the achieved fitness
        for (const seed of repetitionSeeds) {
            Randomness.setScratchSeed(seed, true);
            const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection, classificationType, this._earlyStop);
            eventSelection === 'random' ? await executor.executeSavedTrace(network) : await executor.execute(network);
            await this.updateUncoveredObjectives(network);
            if (network.targetObjective && await network.targetObjective.isCovered(network)) {
                network.fitness++;
            }
            await executor.resetState();
        }

        // Reset network attributes.
        this.restoreNetworkAttributes(network, playTime, score, trace, finalState, coverage, branchCoverage);
        StatisticsCollector.getInstance().evaluations = trueFitnessEvaluations;
    }

    /**
     * Makes a copy of relevant network attributes to restore them after the robustness check.
     * @param network hosting the relevant network attributes to be copied.
     */
    private copyNetworkAttributes(network: NetworkChromosome) {
        const playTime = network.playTime;
        const score = network.score;
        const trace = network.trace.clone();
        const finalState = new Map(network.finalState);
        const coverage = new Set(network.coverage);
        const branchCoverage = new Set(network.branchCoverage);
        return {playTime, score, trace, finalState, coverage, branchCoverage};
    }

    /**
     * Restores the supplied network attributes.
     * @param network whose attributes will be restored.
     * @param playTime the time the network spent playing the game.
     * @param score the score the network achieved while playing.
     * @param trace the generated execution trace during the playthrough.
     * @param finalState the final program state reached after the playthrough.
     * @param coverage the set of blocks covered during the playthrough.
     * @param branchCoverage the set of branching blocks covered during the playthrough.
     */
    private restoreNetworkAttributes(network: NetworkChromosome, playTime: number, score: number,
                                     trace: ExecutionTrace, finalState: Map<string, Map<string, number>>,
                                     coverage: Set<string>, branchCoverage: Set<string>) {
        network.playTime = playTime;
        network.score = score;
        network.trace = trace;
        network.finalState = finalState;
        network.coverage = coverage;
        network.branchCoverage = branchCoverage;
    }

    /**
     * Updates the map of uncovered objectives by tracking how often a given network covered a coverage objective.
     * @param network the network chromosome that has finished its playthrough.
     * @returns true if the network covered one coverage objective at least once, false otherwise.
     */
    protected async updateUncoveredObjectives(network: NetworkChromosome): Promise<boolean> {
        let covered = false;
        for (const [fitnessKey, coverCount] of network.coverageObjectives.entries()) {
            const objective = Container.coverageObjectives[fitnessKey];
            if (await objective.isCovered(network)) {
                covered = true;
                network.coverageObjectives.set(fitnessKey, coverCount + 1);
            }
        }

        // Update statistics on the number of covered statements and branches
        await StatisticsCollector.getInstance().updateStatementCoverage(network);
        await StatisticsCollector.getInstance().updateBranchCoverage(network);
        return covered;
    }

    get stableCount(): number {
        return this._stableCount;
    }

    get earlyStop(): boolean {
        return this._earlyStop;
    }
}
