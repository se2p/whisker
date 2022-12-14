import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {Container} from "../../utils/Container";
import {NetworkExecutor} from "../Misc/NetworkExecutor";
import {NeuroevolutionEventSelection} from "../HyperParameter/BasicNeuroevolutionParameter";

export abstract class NoveltyFitness implements NetworkFitnessFunction<NetworkChromosome> {

    /**
     * Determines how many k-nearest neighbours are incorporated in the novelty calculation.
     */
    protected readonly _neighbourCount: number;

    /**
     * Determines how novel a chromosome has to be in order to be added to the behaviourArchive.
     */
    protected readonly _archiveThreshold: number;

    /**
     * Contains all behaviours seen so far.
     */
    protected _behaviourArchive;

    /**
     * Constructs a new NoveltyNetworkFitness object.
     * @param neighbourCount determines the number of k nearest neighbours in the novelty calculation.
     * @param archiveThreshold determines how novel a found behaviour has to be in order to be added to the archive.
     */
    protected constructor(neighbourCount: number, archiveThreshold: number) {
        this._neighbourCount = neighbourCount;
        this._archiveThreshold = archiveThreshold;
    }

    /**
     * Calculates the novelty score.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @returns Promise<number> the sparseness of the network's behaviour, which is a metric of novelty.
     */
    async getFitness(network: NetworkChromosome, timeout: number, eventSelection: NeuroevolutionEventSelection): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout, eventSelection, false);
        await executor.execute(network);
        const sparseness = this.sparseNess(network);
        this.addToBehaviourArchive(network, sparseness);
        network.fitness = sparseness;
        return sparseness;
    }

    /**
     * Calculates the sparseness of a Network's behaviour. This metric represents the novelty of a given solution.
     * @param network the network whose solution should be evaluated in terms of novelty.
     * @returns number representing the sparseness of the given network's solution.
     */
    protected abstract sparseNess(network: NetworkChromosome): number;

    /**
     * This function adds the behaviour of the given network to the archive of encountered behaviours iff it appears
     * to be novel enough.
     * @param network the network whose solution might be added to the behaviour archive.
     * @param sparseNess the metric defining the novelty of a given solution.
     */
    protected abstract addToBehaviourArchive(network: NetworkChromosome, sparseNess: number): void;
}
