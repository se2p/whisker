import {List} from '../../utils/List';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {NeatChromosome} from "../../NEAT/NeatChromosome";
import {SearchAlgorithmProperties} from "../SearchAlgorithmProperties";
import {StoppingCondition} from "../StoppingCondition";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {FitnessFunction} from "../FitnessFunction";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {NeatPopulation} from "../../NEAT/NeatPopulation";
import {NeuroevolutionProperties} from "../../NEAT/NeuroevolutionProperties";
import {NetworkFitnessFunction} from "../../NEAT/NetworkFitness/NetworkFitnessFunction";


export class NEAT<C extends NeatChromosome> extends SearchAlgorithmDefault<NeatChromosome> {
    private _chromosomeGenerator: ChromosomeGenerator<C>;

    private _properties: NeuroevolutionProperties<C>;

    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    private _stoppingCondition: StoppingCondition<C>;

    private _iterations = 0;

    private _bestIndividuals = new List<C>();

    private _archive = new Map<number, C>();

    private _startTime: number;

    private _fullCoverageReached = false;

    private _networkFitnessFunction: NetworkFitnessFunction<NeatChromosome>;

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties as unknown as NeuroevolutionProperties<C>;
        this._stoppingCondition = this._properties.stoppingCondition
        this._networkFitnessFunction = this._properties.networkFitness;
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
        for (const network of networks) {
            // Evaluate the networks by letting them play the game.
            await this._networkFitnessFunction.getFitness(network, this._properties.timeout);

            // Update the archive and stop if during the evaluation of the population if we already cover all
            // statements.
            this.updateArchive(network);
            if ((this._stoppingCondition.isFinished(this))) {
                return;
            }
        }
    }

    /**
     * Returns a list of solutions for the given problem.
     *
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<List<C>> {
        const speciesNumber = 6;
        const population = new NeatPopulation(this._properties.populationSize, speciesNumber, this._chromosomeGenerator,
            this._properties);
        this._iterations = 0;
        this._startTime = Date.now();

        while (!(this._stoppingCondition.isFinished(this))) {
            await this.evaluateNetworks(population.chromosomes);
            population.evolution();
            this._iterations++;
            this.updateBestIndividualAndStatistics();
            console.log("Iteration: " + this._iterations)
            console.log("Highest fitness last changed: " + population.highestFitnessLastChanged)
            console.log("Highest Network Fitness: " + population.highestFitness)
            console.log("Current Iteration Highest Network Fitness: " + population.populationChampion.nonAdjustedFitness)
            console.log("Average Fitness: " + population.averageFitness)
            console.log("Population Size: " + population.populationSize())
            console.log("Population Champion: ", population.populationChampion)
            console.log("All Species: ", population.species)
            for (const specie of population.species)
                console.log("Species: " + specie.id + " has a size of " + specie.size() + " and expects "
                    + specie.expectedOffspring + " children")
            console.log("Time passed in seconds: " + (Date.now() - this.getStartTime()))
            console.log("Covered goals: " + this._archive.size + "/" + this._fitnessFunctions.size);
            console.log("-----------------------------------------------------")

            for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
                if (!this._archive.has(fitnessFunctionKey)) {
                    console.log("Not covered: "+this._fitnessFunctions.get(fitnessFunctionKey).toString());
                }
            }

        }
        StatisticsCollector.getInstance().createdTestsCount = (this._iterations + 1) * this._properties.populationSize;
        return this._bestIndividuals;
    }

    getStartTime(): number {
        return this._startTime;
    }

    /**
     * Updates the archive by casting the network into a Testchromosome.
     *
     * @param network The candidate network the archive may gets updated with.
     */
    private updateArchive(network: C): void {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
            let bestLength = this._archive.has(fitnessFunctionKey)
                ? this._archive.get(fitnessFunctionKey).getLength()
                : Number.MAX_SAFE_INTEGER;
            const candidateFitness = fitnessFunction.getFitness(network);
            const candidateLength = network.getLength();
            if (fitnessFunction.isOptimal(candidateFitness) && candidateLength < bestLength) {
                bestLength = candidateLength;
                if (!this._archive.has(fitnessFunctionKey)) {
                    StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount();
                }
                this._archive.set(fitnessFunctionKey, network);
                //console.log("Found test for goal: " + fitnessFunction);
            }
        }
        this._bestIndividuals = new List<C>(Array.from(this._archive.values())).distinct();
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
