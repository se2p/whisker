import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {Container} from "../../utils/Container";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {NetworkExecutor} from "../NetworkExecutor";
import {ScoreFitness} from "./ScoreFitness";
import {Randomness} from "../../utils/Randomness";
import {StatisticsCollector} from "../../utils/StatisticsCollector";


export class ReliableStatementFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * The seeds used to test if a given statement can be covered reliably.
     */
    private readonly repetitionSeeds: number[];

    /**
     * Random number generator.
     */
    private random: Randomness

    constructor(private _stableCount: number) {
        this.random = Randomness.getInstance();
        // Add another seed to ensure that we do not get stuck due to very rare occurring program states that originate
        // from certain random seeds and in which a targeted statement is simply not reachable.
        this.repetitionSeeds = Array(this.stableCount + 1).fill(0).map(
            () => this.random.nextInt(0, Number.MAX_SAFE_INTEGER));
    }

    /**
     * Fetches the targeted statement of a network and calculates its fitness.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the network should be executed (random | activation).
     */
    async getFitness(network: NetworkChromosome, timeout: number, eventSelection: string): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection);
        await executor.execute(network);
        network.score = ScoreFitness.gatherPoints(Container.vm);
        const fitness = network.targetFitness.getFitness(network);
        executor.resetState();

        if (fitness > 0) {
            network.fitness = 1 / fitness;
        } else {
            // If we cover the statement, we want to ensure via different seeds that we would cover this statement
            // in other circumstances as well.
            network.fitness = 1;
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
    private async checkStableCoverage(network: NetworkChromosome, timeout, eventSelection): Promise<void> {
        // Save some values to recover them later
        const originalSeed = Randomness._scratchSeed;
        const originalPlayTime = network.playTime;
        const trace = network.trace.clone()
        const coverage = new Set(network.coverage);
        const trueFitnessEvaluations = StatisticsCollector.getInstance().numberFitnessEvaluations;

        // Iterate over each seed and calculate the achieved fitness
        for (const seed of this.repetitionSeeds) {
            Randomness.setScratchSeed(seed, true);
            const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection);
            if (eventSelection === 'random') {
                // Re-execute the saved sequence from the first run
                await executor.executeSavedTrace(network);
            } else {
                // Let the network decided on what to do...
                await executor.execute(network);
            }
            executor.resetState();

            // Increase the score by 1 if we covered the given statement in the executed scenario as well.
            for (const [statement, coverCount] of network.statementTargets.entries()) {
                if (statement.isCovered(network)) {
                    network.statementTargets.set(statement, coverCount + 1);
                    if (statement === network.targetFitness) {
                        network.fitness++;
                    }
                }
            }
            executor.resetState();
        }
        // Reset to the old Scratch seed and network attributes.
        Randomness.setScratchSeed(originalSeed, true);
        network.playTime = originalPlayTime;
        network.trace = trace;
        network.coverage = coverage;
        StatisticsCollector.getInstance().numberFitnessEvaluations = trueFitnessEvaluations;
        Container.debugLog(`Achieved fitness for ${network.targetFitness}: ${network.fitness}`)
    }

    public identifier(): string {
        return 'statement';
    }

    get stableCount(): number {
        return this._stableCount;
    }
}
