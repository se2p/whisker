import {Container} from "../../../utils/Container";
import {NetworkChromosome} from "../networks/NetworkChromosome";
import {NetworkExecutor} from "../misc/NetworkExecutor";
import {ClassificationType, NeuroevolutionEventSelection} from "../hyperparameter/BasicNeuroevolutionParameter";
import {ReliableCoverageFitness} from "./ReliableCoverageFitness";
import {ManyObjectiveNetworkFitnessFunction} from "./ManyObjectiveNetworkFitnessFunction";
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import {NoveltyFitness} from "./Novelty/NoveltyFitness";

export class ManyObjectiveReliableCoverageFitness extends ReliableCoverageFitness implements ManyObjectiveNetworkFitnessFunction<NetworkChromosome> {

    private readonly _noveltyFitness: NoveltyFitness<NetworkChromosome>;

    constructor(stableCount: number, noveltyFitness?: NoveltyFitness<NetworkChromosome>) {
        super(stableCount, false);
        this._noveltyFitness = noveltyFitness;
    }

    async calculateFitness(network: NetworkChromosome, timeout: number, eventSelection: NeuroevolutionEventSelection,
                           classificationType: ClassificationType): Promise<void> {
        await this._executeNetwork(network, timeout, eventSelection, classificationType);

        // If at least one statement was covered, check reliable fitness
        if (await this.updateUncoveredObjectives(network)) {
            await this.checkStableCoverage(network, timeout, eventSelection, classificationType);
        }
        StatisticsCollector.getInstance().computeStatementCoverage();
        StatisticsCollector.getInstance().computeBranchCoverage();

        // If a novelty fitness function was registered, compute the novelty score.
        if (this._noveltyFitness) {
            network.noveltyScore = this._noveltyFitness.computeNovelty(network);
            this._noveltyFitness.addToBehaviourArchive(network);
        }

    }


    /**
     * Executes a single network and resets the openStatementTargets.
     *
     * @param network the network that should be executed.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @param classificationType defines how the networks select events.
     */
    private async _executeNetwork(network: NetworkChromosome, timeout: number,
                                  eventSelection: NeuroevolutionEventSelection,
                                  classificationType: ClassificationType): Promise<void> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection,
            classificationType,false);
        await executor.execute(network);
        await executor.resetState();
        network.resetCoverageMap();
    }


    /**
     * Since we design the optimisation task of covering all coverage objectives as a maximisation task, we prefer
     * higher fitness values.
     */
    compare(fitness1: number, fitness2: number): number {
        return fitness1 - fitness2;
    }

    isOptimal(fitness: number): boolean {
        return fitness >= this.stableCount;
    }
}
