import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NeuroevolutionTestGenerationParameter} from "../HyperParameter/NeuroevolutionTestGenerationParameter";

export abstract class NeuroevolutionPopulation<C extends NetworkChromosome> {

    /**
     * The defined search parameters.
     */
    private readonly _hyperParameter: NeuroevolutionTestGenerationParameter;

    /**
     * The NetworkGenerator used for generating a starting population.
     */
    private readonly _generator: ChromosomeGenerator<C>

    /**
     * The desired population size.
     */
    private readonly _populationSize: number;

    /**
     * Saves all networks of the current population.
     */
    private readonly _networks: C[] = [];

    /**
     * The average fitness of the current generation. Used for reporting purposes.
     */
    private _averageFitness = 0;

    /**
     * The highest fitness value ever achieved through all generations.
     */
    private _bestFitness = 0;

    /**
     * Number of iterations since the highest network fitness has improved.
     */
    private _highestFitnessLastChanged = 0;

    /**
     * Number of evolution processes conducted.
     */
    private _generation = 0;

    /**
     * Points to the populationChampion.
     */
    private _populationChampion: C;

    /**
     * Constructs a new NeuroevolutionPopulation.
     * @param generator the ChromosomeGenerator used for creating the initial population.
     * @param hyperParameter the defined search parameters
     */
    protected constructor(generator: ChromosomeGenerator<C>, hyperParameter: NeuroevolutionTestGenerationParameter) {
        this._hyperParameter = hyperParameter;
        this._populationSize = hyperParameter.populationSize;
        this._generator = generator;
    }

    /**
     * Generates an initial population of networks.
     */
    public abstract generatePopulation(): void

    /**
     * Generates a new generation of networks by evolving the current population.
     */
    public abstract evolve(): void

    /**
     * Deep Clone of a concrete NeuroevolutionPopulation.
     * @returns clone of concrete NeuroevolutionPopulation.
     */
    public abstract clone(): NeuroevolutionPopulation<C>;

    /**
     * Transform this NeuroevolutionPopulation into a JSON representation.
     * @return Record containing this NeuroevolutionPopulation's attributes mapped to the corresponding values.
     */
    public abstract toJSON(): Record<string, unknown>;

    get networks(): C[] {
        return this._networks;
    }

    get bestFitness(): number {
        return this._bestFitness;
    }

    set bestFitness(value: number) {
        this._bestFitness = value;
    }

    get highestFitnessLastChanged(): number {
        return this._highestFitnessLastChanged;
    }

    set highestFitnessLastChanged(value: number) {
        this._highestFitnessLastChanged = value;
    }

    get generation(): number {
        return this._generation;
    }

    set generation(value: number) {
        this._generation = value;
    }

    get populationChampion(): C {
        return this._populationChampion;
    }

    set populationChampion(value: C) {
        this._populationChampion = value;
    }

    get populationSize(): number {
        return this._populationSize;
    }

    get averageFitness(): number {
        return this._averageFitness;
    }

    set averageFitness(value: number) {
        this._averageFitness = value;
    }

    get hyperParameter(): NeuroevolutionTestGenerationParameter {
        return this._hyperParameter;
    }

    get generator(): ChromosomeGenerator<C> {
        return this._generator;
    }
}
