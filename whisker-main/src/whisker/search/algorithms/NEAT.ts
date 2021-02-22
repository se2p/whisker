import {List} from '../../utils/List';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {NeatChromosome} from "../../NEAT/NeatChromosome";
import {ConnectionGene} from "../../NEAT/ConnectionGene";
import {Species} from "../../NEAT/Species";
import {SearchAlgorithmProperties} from "../SearchAlgorithmProperties";
import {StoppingCondition} from "../StoppingCondition";
import {NeatConfig} from "../../NEAT/NeatConfig";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {FitnessFunction} from "../FitnessFunction";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {Selection} from "../Selection";
import {NeuroevolutionExecutor} from "../../NEAT/NeuroevolutionExecutor";
import {Container} from "../../utils/Container";
import {NeatPopulation} from "../../NEAT/NeatPopulation";


export class NEAT<C extends NeatChromosome> extends SearchAlgorithmDefault<NeatChromosome> {
    private _chromosomeGenerator: ChromosomeGenerator<C>;

    private _properties: SearchAlgorithmProperties<C>;

    private _fitnessFunctions: List<FitnessFunction<C>>;

    private _fitnessFunction: FitnessFunction<C>;

    private _stoppingCondition: StoppingCondition<C>;

    private _iterations = 0;

    private _bestIndividuals = new List<C>();

    private _archive = new Map<number, C>();

    private _selectionOperator: Selection<C>;

    private _startTime: number;

    private _fullCoverageReached = false;

    private _topChromosome: C;

    private _topFitness: number;

    private speciesList = new List<Species<C>>()

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<NeatChromosome>) {
        StatisticsCollector.getInstance().fitnessFunctionCount = 1;
        this._fitnessFunction = fitnessFunction;
        this._fitnessFunctions = new List<FitnessFunction<C>>();
        this._fitnessFunctions.add(fitnessFunction);
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): List<C> {
        return this._bestIndividuals;
    }

    async evaluatePopulation(population: List<C>): Promise<void> {
        for (const chromosome of population) {
            await this.evaluate(chromosome);
        }
    }

    async evaluate(chromosome: NeatChromosome): Promise<void> {
        const executor = new NeuroevolutionExecutor(Container.vmWrapper);
        await executor.execute(chromosome);
    }

    /**
     * Returns a list of solutions for the given problem.
     *
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<List<C>> {
        const speciesNumber = 4;
        const population = new NeatPopulation(this._chromosomeGenerator.get(),this._properties.getPopulationSize(), speciesNumber);
        this._iterations = 0;
        this._startTime = Date.now();

        while (!this._stoppingCondition.isFinished(this)) {
            console.log("Iteration: " + this._iterations + " Best Fitness: " + population.highestFitness)
            await this.evaluatePopulation(population.chromosomes);
            this.calculateFitness(population.chromosomes);
            population.evolution();
            console.log("Size of Population: " + population.chromosomes.size())
            console.log("Size of Species: " + population.species.size())
            this._iterations++;
        }

        this._bestIndividuals.add(this._topChromosome);
        return this._bestIndividuals;
    }

    private calculateFitness(population: List<C>): void {
        for (const chromosome of population) {
            chromosome.fitness = this._fitnessFunction.getFitness(chromosome);
        }
    }

    getStartTime(): number {
        return this._startTime;
    }
}
