import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import Statistics from "../../utils/Statistics";
import {ReliableStatementFitness} from "./ReliableStatementFitness";
import {NeuroevolutionEventSelection} from "../HyperParameter/BasicNeuroevolutionParameter";

export class NoveltyReliableStatementFitness extends ReliableStatementFitness {

    /**
     * Saves an archive of observed event traces.
     */
    private _eventTraceArchive: ScratchEvent[][] = [];

    /**
     * Saves the largest event trace seen so far.
     */
    private _largestEventSequence = 0;

    constructor(stableCount: number, earlyStop:boolean) {
        super(stableCount, earlyStop);
    }

    /**
     * Calculates the novelty of an observed event trace based on the levenshtein distance.
     * @param network the network that has executed an event trace after a playthrough.
     * @returns number indicating the novelty of an executed event trace.
     */
    private novelty(network: NetworkChromosome): number {
        if (this._eventTraceArchive.length === 0) {
            return 0;
        }
        const execTrace = network.trace.events.map(e => e.event);
        let min = Number.MAX_SAFE_INTEGER;
        for (const archiveTrace of this._eventTraceArchive) {
            const distance = Statistics.levenshteinDistanceEventsChunks(archiveTrace, execTrace, 10);
            if (distance < min) {
                min = distance;
            }
            if (min === 0) {
                break;
            }
        }
        return min;
    }

    /**
     * Adds an executed event trace to the archive of observed event traces if the archive is yet empty or if the
     * novel trace has at least 10% of the events differently executed than any other trace saved so far.
     * @param executedTrace the executed event trace which might get added to the archive
     * @param novelty the novelty value of the observed trace
     */
    private addToBehaviourArchive(executedTrace: ScratchEvent[], novelty: number): void {
        if (this._eventTraceArchive.length < 1 || novelty > 0.1 * this._largestEventSequence) {
            this._eventTraceArchive.push([...executedTrace]);
            if (executedTrace.length > this._largestEventSequence) {
                this._largestEventSequence = executedTrace.length;
            }
        }
    }

    /**
     * Calculates the fitness of the network by combining the statementFitness value with the novelty value.
     * @param network the network that should be evaluated.
     * @param timeout the timeout defining how long a network is allowed to play the game.
     * @param eventSelection defines how the networks select events.
     * @returns Promise<number> the combined fitness value of novelty and reliable statement coverage.
     */
    override async getFitness(network: NetworkChromosome, timeout: number, eventSelection: NeuroevolutionEventSelection): Promise<number> {
        const statementFitness = await super.getFitness(network, timeout, eventSelection);
        const sparseNess = this.novelty(network);
        this.addToBehaviourArchive(network.trace.events.map(eventAndParameter => eventAndParameter.event), sparseNess);

        // If we have already covered the statement, there is no need to reward novel behaviour, since the objective
        // now is to foster the learned behaviour
        if (statementFitness >= 1) {
            network.fitness = 2 * statementFitness;
        }

        // Otherwise, we have to explore novel strategies, i.e. reward novel behaviour.
        else {
            network.fitness = statementFitness + (sparseNess / (sparseNess + 1));
        }
        return network.fitness;
    }

}
