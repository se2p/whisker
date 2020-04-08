/**
 * This class stores all relevant properties from a search algorithm.
 * 
 * TODO: not complete yet
 * 
 * @author Sophia Geserer
 */
export class SearchAlgorithmProperties {

    /**
     * The size of the population that will be initially generated.
     */
    private _populationSize: number;

    /**
     * The propability for applying crossover to chromosomes.
     */
    private _crossoverProbability: number;

    /**
     * The probability to apply mutation to a chromosome.
     */
    private _mutationProbablity: number;

    /**
     * Constructs an object that stores all relevant properties of a search algorithm.
     * @param populationSize the size of the population
     * @param crossoverProbability the probability for crossover
     * @param mutationProbability the probability for mutation
     */
    constructor(populationSize: number, crossoverProbability: number, mutationProbability: number) {
        this._populationSize = populationSize;
        this._crossoverProbability = crossoverProbability;
        this._mutationProbablity = mutationProbability;
    }

    /**
     * Returns the population size.
     * @returns population size
     */
    getPopulationSize(): number {
        return this._populationSize;
    }

    /**
     * Returns the crossover probability.
     * @returns probability to apply crossover
     */
    getCrossoverProbability(): number {
        return this._crossoverProbability;
    }

    /**
     * Returns the mutation probability.
     * @returns probability to apply mutation
     */
    getMutationProbablity(): number {
        return this._mutationProbablity;
    }

    /**
     * Sets the size of the population to the specified number.
     * @param populationSize the new population size
     */
    setPopulationSize(populationSize: number): void {
        this._populationSize = populationSize;
    }

    /**
     * Sets the probability for crossover to the specified number.
     * @param crossoverProbability the new crossover probability
     */
    setCrossoverProbability(crossoverProbability: number): void {
        this._crossoverProbability = crossoverProbability;
    }

    /**
     * Sets the probability for mutation to the specified number.
     * @param mutationProbablity the new mutation probability
     */
    setMutationProbablity(mutationProbablity: number): void {
        this._mutationProbablity = mutationProbablity;
    }

}
