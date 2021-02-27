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
import {TestChromosome} from "../../testcase/TestChromosome";
import {IntegerListMutation} from "../../integerlist/IntegerListMutation";
import {SinglePointCrossover} from "../operators/SinglePointCrossover";
import {NeuroevolutionProperties} from "../../NEAT/NeuroevolutionProperties";
import {NetworkFitnessFunction} from "../../NEAT/NetworkFitness/NetworkFitnessFunction";


export class NEAT<C extends NeatChromosome> extends SearchAlgorithmDefault<NeatChromosome> {
    private _chromosomeGenerator: ChromosomeGenerator<C>;

    private _properties: NeuroevolutionProperties<C>;

    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    private _stoppingCondition: StoppingCondition<C>;

    private _iterations = 0;

    private _bestIndividuals = new List<C>();

    private _archive = new Map<number, TestChromosome>();

    private _startTime: number;

    private _fullCoverageReached = false;

    private _networkFitnessFunction: NetworkFitnessFunction<NeatChromosome>;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties as unknown as NeuroevolutionProperties<C>;
        this._stoppingCondition = this._properties.stoppingCondition
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

    getNetworkFitnessFunction(): NetworkFitnessFunction<NeatChromosome> {
        return this._networkFitnessFunction;
    }

    setNetworkFitnessFunction(value: NetworkFitnessFunction<NeatChromosome>) {
        this._networkFitnessFunction = value;
    }

    async evaluateNetworks(networks: List<C>): Promise<void> {
        for (const network of networks) {
            await this.getNetworkFitnessFunction().getFitness(network);
        }
    }

    /**
     * Returns a list of solutions for the given problem.
     *
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<List<C>> {
        const speciesNumber = 4;
        const population = new NeatPopulation(this._properties.populationSize, speciesNumber, this._chromosomeGenerator,
            this._properties);
        this._iterations = 0;
        this._startTime = Date.now();

        while (!(this._stoppingCondition.isFinished(this))) {
            console.log("-----------------------------------------------------")
            console.log("Iteration: " + this._iterations + " Network Fitness: " + population.highestFitness)
            console.log("Covered goals: " + this._archive.size + "/" + this._fitnessFunctions.size);
            await this.evaluateNetworks(population.chromosomes);
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

    getStartTime(): number {
        return this._startTime;
    }

    /**
     * Updates the archive of best chromosomes.
     *
     * @param chromosomes The candidate chromosomes for the archive.
     */
    private updateArchive(chromosomes: List<C>): void {
        for (const network of chromosomes) {
            // Convert the network into a test Chromosome
            const testChromosome = new TestChromosome(network.codons, new IntegerListMutation(0, 1), new SinglePointCrossover())
            testChromosome.trace = network.trace;
            for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
                const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
                let bestLength = this._archive.has(fitnessFunctionKey)
                    ? this._archive.get(fitnessFunctionKey).getLength()
                    : Number.MAX_SAFE_INTEGER;
                const candidateFitness = fitnessFunction.getFitness(testChromosome as unknown as C);
                const candidateLength = testChromosome.getLength();
                if (fitnessFunction.isOptimal(candidateFitness) && candidateLength < bestLength) {
                    bestLength = candidateLength;
                    if (!this._archive.has(fitnessFunctionKey)) {
                        StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount();
                    }
                    this._archive.set(fitnessFunctionKey, testChromosome);
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
                (this._iterations + 1) * this._properties.populationSize;
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
    }
}
