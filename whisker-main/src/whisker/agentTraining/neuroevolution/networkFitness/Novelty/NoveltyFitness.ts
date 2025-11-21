import {NetworkChromosome} from "../../networks/NetworkChromosome";
import {ClassificationType, NeuroevolutionEventSelection} from "../../hyperparameter/BasicNeuroevolutionParameter";
import {Randomness} from "../../../../utils/Randomness";
import {ReliableCoverageFitness} from "../ReliableCoverageFitness";

export abstract class NoveltyFitness<T> extends ReliableCoverageFitness {

    /**
     * Contains all behaviors observed so far.
     */
    protected behaviorArchive: T[] = [];

    /**
     * Constructs a new NoveltyFitness instance.
     * @param stableCount defines how often a coverage objective must be reached to count as covered.
     * @param numNeighbours defines the number of k nearest neighbours in the novelty calculation.
     * @param addToArchiveProb defines the probability of adding an observed behaviour to the archive.
     * @param noveltyWeight defines how much the novelty score contributes to the final fitness value.
     */
    public constructor(stableCount: number, private readonly numNeighbours: number,
                       private readonly addToArchiveProb: number, private noveltyWeight: number) {
        super(stableCount, false);
        this.numNeighbours = numNeighbours;
        this.addToArchiveProb = addToArchiveProb;
    }

    /**
     * Calculates the novelty score.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @param classificationType defines how the networks select events.
     * @returns Promise<number> the sparseness of the network's behaviour, which is a metric of novelty.
     */
    override async getFitness(network: NetworkChromosome, timeout: number, eventSelection: NeuroevolutionEventSelection,
                              classificationType: ClassificationType): Promise<number> {
        const coverageFitness = await super.getFitness(network, timeout, eventSelection, classificationType);
        const novelty = this.computeNovelty(network);

        let fitness: number;
        if (this.noveltyWeight > 0) {   // Normalise coverage fitness into the same range as novelty metric.
            fitness = this.noveltyWeight * novelty + (coverageFitness / this.stableCount) * (1 - this.noveltyWeight);
        } else {    // Default to standard coverage fitness without normalisation if novelty weight is set to zero.
            fitness = coverageFitness;
        }

        network.fitness = fitness;
        network.noveltyScore = novelty;
        this.addToBehaviourArchive(network);
        return fitness;
    }

    /**
     * Calculates the novelty of a network's behaviour by comparing its behaviour to the k-nearest neighbours.
     * @param network the network whose solution will be evaluated in terms of novelty.
     * @returns novelty score of the given network's behaviour.
     */
    public computeNovelty(network: NetworkChromosome): number {
        if (this.behaviorArchive.length === 0) {
            return 0.5;
        }
        const observedBehaviour = this.extractBehaviour(network);
        const distances = this.behaviorArchive.map(behaviour => this.compareBehaviours(behaviour, observedBehaviour));
        distances.sort();
        const kNearest = distances.slice(0, this.numNeighbours);
        return kNearest.reduce((partialSum, curr) => partialSum + curr, 0) / kNearest.length;
    }

    /**
     * Extracts the observed behaviour of the chromosome after it was executed in the problem domain.
     *
     * @param network whose behaviour is to be extracted.
     * @return behaviour of chromosome.
     */
    protected abstract extractBehaviour(network: NetworkChromosome): T;

    /**
     * Computes the distance between two behaviours.
     *
     * @param behaviour1 first behaviour to be compared.
     * @param behaviour2 second behaviour to be compared.
     * @return distance between the two behaviours.
     */
    protected abstract compareBehaviours(behaviour1: T, behaviour2: T): number;

    /**
     * Adds the supplied network's behaviour to the behaviour archive if deemed suitable.
     *
     * @param network the network whose behaviour might be added to the archive
     */
    public addToBehaviourArchive(network: NetworkChromosome): void {
        if (this.behaviorArchive.length === 0 || Randomness.getInstance().nextDouble() < this.addToArchiveProb) {
            this.behaviorArchive.push(this.extractBehaviour(network));
        }
    }
}
