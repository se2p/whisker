import { FitnessFunction } from "../fitness/FitnessFunction"
import { Pair } from "../util/Pair"
import { Mutation } from "../operators/Mutation"
import { Crossover } from "../operators/Crossover"

/**
 * The Chromosome defines a gene representation for valid solutions to a given optimization problem.
 * 
 * @param <C> the type of the chromosomes produced as offspring by mutation and crossover
 * @author Sophia Geserer
 */
export abstract class Chromosome<C extends Chromosome<C>> {

    /**
     * The crossover operation that defines how to manipulate the gene of two chromosomes. 
     */
    private _crossoverOp: Crossover<C>;

    /**
     * The mutation operator that defines how to mutate the chromosome.
     */
    private _mutationOp: Mutation<C>;

    /**
     * Constructs a new chromosome using the specified crossover and mutation.
     * @param crossover the strategy to perform crossover
     * @param mutation the strategy to perform mutation
     */
    constructor(crossover: Crossover<C>, mutation: Mutation<C>) {
        this._crossoverOp = crossover;
        this._mutationOp = mutation;
    }

    /**
     * Mutates this chromosome and returns the resulting chromosome.
     * @returns the mutated chromosome
     */
    mutate(): C {
        // TODO: I am not sure if this will work (Would be only syntactic sugar)
        // because 'this' cannot be given to mutation as parameter.
        // There is a problem with the generic types.
        console.log('Chromosome#mutation not implemented');
        return null;
    }

    /**
     * Pairs this chromosome with the other given chromosome and returns the resulting offspring.
     * @param other the chomosome to pair with
     * @returns the offspring
     */
    crossover(other: C): Pair<C> {
        // TODO: Same issue as in 'mutate'
        console.log('Chromosome#crossover not implemented');
        return null;
    }

    /**
     * Computes and returns the fitness of this chromosome using the supplied fitness function.
     * @param fitnessFunction the fitness function with which to compute the fitness of the
     *                        chromosome
     * @returns the fitness of this chromosome
     */
    getFitness(fitnessFunction: FitnessFunction<C>): number {
        // TODO: Same issue as in 'mutate'
        console.log('Chromosome#getFitness not implemented');
        return null;
    }
}
