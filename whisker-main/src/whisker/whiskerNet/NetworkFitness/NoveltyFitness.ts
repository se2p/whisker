import {NetworkFitnessFunction} from "./NetworkFitnessFunction";
import {NetworkChromosome} from "../NetworkChromosome";
import {Container} from "../../utils/Container";
import {NetworkExecutor} from "../NetworkExecutor";

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
     * @param neighbourCount determines the number of k nearest neighbours.
     * @param archiveThreshold determines how novel a found behaviour has to be in order to be added to the archive.
     */
    protected constructor(neighbourCount: number, archiveThreshold: number) {
        this._neighbourCount = neighbourCount;
        this._archiveThreshold = archiveThreshold;
    }

    /**
     * Calculates the novelty score.
     * @param network the network to evaluate.
     * @param timeout the timeout after which the execution of the Scratch-VM is halted.
     * @returns sparseness which is a metric of novelty.
     */
    async getFitness(network: NetworkChromosome, timeout: number): Promise<number> {
        const executor = new NetworkExecutor(Container.vmWrapper, timeout);
        await executor.execute(network);
        const sparseness = this.sparseNess(network);
        this.addToBehaviourArchive(network, sparseness);
        network.networkFitness = sparseness;
        return sparseness;
    }

    /**
     * Calculates the reached novelty score without starting a new playthrough.
     * Used for CombinedNetworkFitness.
     * @returns sparseness which is a metric of novelty.
     */
    getFitnessWithoutPlaying(network: NetworkChromosome): number {
        const sparseness = this.sparseNess(network);
        this.addToBehaviourArchive(network, sparseness);
        network.networkFitness = sparseness;
        return sparseness;
    }

    /**
     * Compares two fitness values. For the reason that the fitness values represent the novelty of a chromosome,
     * higher values are better.
     * @param value1 first fitness value.
     * @param value2 second fitness value.
     * @returns number whose value is
     *                - negative if value1 is better than value2
     *                - 0 if both values are equally good
     *                - positive if value2 is better than value1
     */
    compare(value1: number, value2: number): number {
        return value2 - value1;
    }

    /**
     * Calculates the sparseness of a Network's behaviour. This metric represents the novelty of a given solution.
     * @param network the network whose solution should be evaluated in terms of novelty.
     * @returns sparseness of the given network's solution, determining how novel the solution is.
     */
    protected abstract sparseNess(network: NetworkChromosome): number;

    /**
     * This function adds the behaviour of the given network to the archive of encountered behaviours if it appears
     * to be novel enough.
     * @param network the network whose solution might be added to the behaviour archive.
     * @param sparseNess the metric defining the novelty of a given solution.
     */
    protected abstract addToBehaviourArchive(network: NetworkChromosome, sparseNess: number): void;
}
