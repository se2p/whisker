import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {NetworkChromosome} from "../../whiskerNet/NetworkChromosome";
import {SearchAlgorithmProperties} from "../SearchAlgorithmProperties";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {FitnessFunction} from "../FitnessFunction";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {NeatPopulation} from "../../whiskerNet/NeuroevolutionPopulations/NeatPopulation";
import {NeuroevolutionProperties} from "../../whiskerNet/NeuroevolutionProperties";
import {NetworkFitnessFunction} from "../../whiskerNet/NetworkFitness/NetworkFitnessFunction";
import {NeuroevolutionPopulation} from "../../whiskerNet/NeuroevolutionPopulations/NeuroevolutionPopulation";
import {RandomNeuroevolutionPopulation} from "../../whiskerNet/NeuroevolutionPopulations/RandomNeuroevolutionPopulation";
import Arrays from "../../utils/Arrays";

export class NEAT<C extends NetworkChromosome> extends SearchAlgorithmDefault<NetworkChromosome> {

    // TODO: Really necessary to separate SearchAlgorithms and NE-Algorithms!!!!
    /**
     * The search parameters
     */
    private _neuroevolutionProperties: NeuroevolutionProperties<C>;

    /**
     * The fitnessFunction used to evaluate the networks of Neuroevolution Algorithm.
     */
    private _networkFitnessFunction: NetworkFitnessFunction<NetworkChromosome>;

    /**
     * Saves all Networks mapped to the generation they occurred in.
     */
    private _populationRecord = new Map<number, NeuroevolutionPopulation<NetworkChromosome>>();

    /**
     * Evaluates the networks by letting them play the given Scratch game.
     * @param networks the networks to evaluate -> Current population
     */
    private async evaluateNetworks(networks: C[]): Promise<void> {
        for (const network of networks) {
            // Evaluate the networks by letting them play the game.
            await this._networkFitnessFunction.getFitness(network, this._neuroevolutionProperties.timeout);
            // Update the archive and stop in the middle of the evaluation if we already cover all statements.
            this.updateArchive(network);
            if ((this._stoppingCondition.isFinished(this))) {
                return;
            }
        }
    }

    /**
     * Returns a list of solutions for the given problem.
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<Map<number, C>> {
        // Report the current state of the search after <reportPeriod> iterations.
        const reportPeriod = 1;
        const population = this.getPopulation();
        population.generatePopulation();
        this._iterations = 0;
        this._startTime = Date.now();

        while (!(this._stoppingCondition.isFinished(this))) {
            await this.evaluateNetworks(population.chromosomes as C[]);
            population.updatePopulationStatistics();
            this._populationRecord.set(this._iterations, population.clone());
            population.evolve();
            this.updateBestIndividualAndStatistics();
            if (this._iterations % reportPeriod === 0) {
                this.reportOfCurrentIteration(population);
            }
            this._iterations++;
        }
        return this._archive as Map<number, C>;
    }

    /**
     * Generate the desired type of NeuroevolutionPopulation to be used by the NEAT algorithm.
     * @returns NeuroevolutionPopulation defined in the config files.
     */
    private getPopulation(): NeuroevolutionPopulation<NetworkChromosome> {
        switch (this._neuroevolutionProperties.populationType) {
            case 'random':
                return new RandomNeuroevolutionPopulation(this._chromosomeGenerator, this._neuroevolutionProperties);
            default:
            case 'neat':
                return new NeatPopulation(this._chromosomeGenerator, this._neuroevolutionProperties);
        }
    }

    /**
     * Updates the List of the best networks found so far and the statistics used for reporting.
     */
    private updateBestIndividualAndStatistics(): void {
        this._bestIndividuals = Arrays.distinct(this._archive.values());
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.length;
        StatisticsCollector.getInstance().incrementIterationCount();
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = this._archive.size;
        if (this._archive.size == this._fitnessFunctions.size && !this._fullCoverageReached) {
            this._fullCoverageReached = true;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage =
                (this._iterations + 1) * this._neuroevolutionProperties.populationSize;
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
    }

    /**
     * Reports the current state of the search.
     * @param population the population of networks
     */
    private reportOfCurrentIteration(population: NeuroevolutionPopulation<NetworkChromosome>): void {
        console.log("Iteration: " + this._iterations)
        console.log("Highest fitness last changed: " + population.highestFitnessLastChanged)
        console.log("Highest Network Fitness: " + population.highestFitness)
        console.log("Current Iteration Highest Network Fitness: " + population.populationChampion.networkFitness)
        console.log("Average Fitness: " + population.averageFitness)
        console.log("Population Size: " + population.populationSize())
        console.log("Population Champion: ", population.populationChampion)
        console.log("All Species: ", population.species)
        for (const specie of population.species)
            console.log("Species: " + specie.id + " has a size of " + specie.size() + " and produces "
                + specie.expectedOffspring + " offspring")
        console.log("Time passed in seconds: " + (Date.now() - this.getStartTime()))
        console.log("Covered goals: " + this._archive.size + "/" + this._fitnessFunctions.size);
        console.log("-----------------------------------------------------")

        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            if (!this._archive.has(fitnessFunctionKey)) {
                console.log("Not covered: " + this._fitnessFunctions.get(fitnessFunctionKey).toString());
            }
        }
    }

    /**
     * Transforms the collected information about each Population obtained during the search into a JSON representation.
     * @return string in JSON format containing collected Population information of each iteration.
     */
    public getPopulationRecordAsJSON(): string {
        const solution = {};
        this.populationRecord.forEach((population, iteration) => {
            solution[`Generation ${iteration}`] = population.toJSON();
        })
        return JSON.stringify(solution, undefined, 4);
    }

    getStartTime(): number {
        return this._startTime;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._neuroevolutionProperties = properties as unknown as NeuroevolutionProperties<C>;
        this._stoppingCondition = this._neuroevolutionProperties.stoppingCondition
        this._networkFitnessFunction = this._neuroevolutionProperties.networkFitness;
    }

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): C[] {
        return this._bestIndividuals as C[];
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        return this._fitnessFunctions.values();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    get populationRecord(): Map<number, NeuroevolutionPopulation<NetworkChromosome>> {
        return this._populationRecord;
    }
}
