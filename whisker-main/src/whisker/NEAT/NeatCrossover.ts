import {Crossover} from "../search/Crossover";
import {NeatChromosome} from "./NeatChromosome";
import {Pair} from "../utils/Pair";

// TODO: Implement NEAT Crossover

export class NeatCrossover implements Crossover<NeatChromosome>{
    apply(parent1: NeatChromosome, parent2: NeatChromosome): Pair<NeatChromosome> {
        return undefined;
    }

    applyFromPair(parents: Pair<NeatChromosome>): Pair<NeatChromosome> {
        return undefined;
    }

}
