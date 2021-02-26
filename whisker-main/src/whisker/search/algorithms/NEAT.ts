import {List} from '../../utils/List';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {NeatChromosome} from "../../NEAT/NeatChromosome";
import {SearchAlgorithmProperties} from "../SearchAlgorithmProperties";
import {StoppingCondition} from "../StoppingCondition";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {FitnessFunction} from "../FitnessFunction";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {NeuroevolutionExecutor} from "../../NEAT/NeuroevolutionExecutor";
import {Container} from "../../utils/Container";
import {NeatPopulation} from "../../NEAT/NeatPopulation";
import {TimePlayedFitness} from "../../NEAT/TimePlayedFitness";
import {TestChromosome} from "../../testcase/TestChromosome";
import {NeatMutation} from "../../NEAT/NeatMutation";


export class NEAT<C extends NeatChromosome> extends SearchAlgorithmDefault<NeatChromosome> {
    private _chromosomeGenerator: ChromosomeGenerator<C>;

    private _properties: SearchAlgorithmProperties<C>;

    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    private _stoppingCondition: StoppingCondition<C>;

    private _iterations = 0;

    private _bestIndividuals = new List<C>();

    private _archive = new Map<number, C>();

    private _startTime: number;

    private _topChromosome: C;

    private _networkFitness = new TimePlayedFitness();

    private _fullCoverageReached = false;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): List<C> {
        return this._bestIndividuals;
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        return this._fitnessFunctions.values();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    async evaluateNetworks(networks: List<C>): Promise<void> {
        const executor = new NeuroevolutionExecutor(Container.vmWrapper);
        for (const network of networks) {
            await executor.execute(network);
        }
    }

    /**
     * Returns a list of solutions for the given problem.
     *
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<List<C>> {
        const speciesNumber = 4;
        const population = new NeatPopulation(this._properties.getPopulationSize(), speciesNumber, this._chromosomeGenerator);
        this._iterations = 0;
        this._startTime = Date.now();
        console.log(this._stoppingCondition)

        while (!(this._stoppingCondition.isFinished(this))) {
            console.log("-----------------------------------------------------")
            console.log("Iteration: " + this._iterations + " Network Fitness: " + population.highestFitness)
            await this.evaluateNetworks(population.chromosomes);
            this.calculateNetworkFitness(population.chromosomes);
            this.updateArchive(population.chromosomes)
            population.evolution();
            console.log("Size of Population: " + population.chromosomes.size())
            console.log("Number of Species: " + population.species.size())
            this._iterations++;
            this.updateBestIndividualAndStatistics();
        }
        console.log("Covered goals: " + this._archive.size + "/" + this._fitnessFunctions.size);
        return this._bestIndividuals;
    }

    private calculateNetworkFitness(population: List<NeatChromosome>): void {
        for (const chromosome of population) {
            chromosome.networkFitness = this._networkFitness.getFitness(chromosome);
        }
    }

    getStartTime(): number {
        return this._startTime;
    }

    /**
     * Updates the archive of best chromosomes.
     *
     * @param chromosomes The candidate chromosomes for the archive.
     */
    private updateArchive(chromosomes: List<C>): void {
        for (const candidateChromosome of chromosomes) {
            for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
                const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
                let bestLength = this._archive.has(fitnessFunctionKey)
                    ? this._archive.get(fitnessFunctionKey).getLength()
                    : Number.MAX_SAFE_INTEGER;
                const candidateFitness = fitnessFunction.getFitness(candidateChromosome);
                const candidateLength = candidateChromosome.getLength();
                if (fitnessFunction.isOptimal(candidateFitness) && candidateLength < bestLength) {
                    bestLength = candidateLength;
                    if (!this._archive.has(fitnessFunctionKey)) {
                        StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount();
                    }
                    this._archive.set(fitnessFunctionKey, candidateChromosome);
                    //console.log("Found test for goal: " + fitnessFunction);
                }
            }
        }
    }

    private updateBestIndividualAndStatistics() {
        this._bestIndividuals = new List<C>(Array.from(this._archive.values())).distinct();
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.size();
        StatisticsCollector.getInstance().incrementIterationCount();
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = this._archive.size;
        if (this._archive.size == this._fitnessFunctions.size && !this._fullCoverageReached) {
            this._fullCoverageReached = true;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage =
                (this._iterations + 1) * this._properties.getPopulationSize();
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
    }
}
