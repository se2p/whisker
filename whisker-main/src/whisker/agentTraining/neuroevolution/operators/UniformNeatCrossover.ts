import {Pair} from "../../../utils/Pair";
import {NeatChromosome} from "../networks/NeatChromosome";
import {NeatCrossover} from "./NeatCrossover";


export class UniformNeatCrossover extends NeatCrossover {

    /**
     * Applies the default NEAT crossover with parent1 dominating parent2 and vice versa.
     * @param parent1 the first crossover parent.
     * @param parent2 the second crossover parent.
     */
    override async apply(parent1: NeatChromosome, parent2: NeatChromosome): Promise<Pair<NeatChromosome>> {
        const parent1Clone = parent1.clone();
        const parent2Clone = parent2.clone();

        parent1Clone.sortConnections();
        parent2Clone.sortConnections();

        parent1Clone.fitness = Number.MAX_VALUE;
        parent2Clone.fitness = 0;
        const child1 = this.multipointCrossover(parent1Clone, parent2Clone, true);

        parent1Clone.fitness = 0;
        parent2Clone.fitness = Number.MAX_VALUE;
        const child2 = this.multipointCrossover(parent2Clone, parent1Clone, true);
        return [child1, child2];
    }

    /**
     * Applies the crossover operator.
     * @param parents the parents that should be mated with each other.
     */
    override async applyFromPair(parents: Pair<NeatChromosome>): Promise<Pair<NeatChromosome>> {
        return this.apply(parents[0], parents[1]);
    }

}
