import {List} from '../../utils/List';
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
     * Evaluates the networks by letting them play the given Scratch game.
     * @param networks the networks to evaluate -> Current population
     */
    private async evaluateNetworks(networks: List<C>): Promise<void> {
        for (const network of networks) {
            // Evaluate the networks by letting them play the game.
            await this._networkFitnessFunction.getFitness(network, this._neuroevolutionProperties.timeout, this._neuroevolutionProperties.randomEventSelection);
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
        const population = this.getPopulation();
        console.log("Starting population:", population);
        population.generatePopulation();
        this._iterations = 0;
        this._startTime = Date.now();

        while (!(this._stoppingCondition.isFinished(this))) {
            await this.evaluateNetworks(population.chromosomes as List<C>);
            population.updatePopulationStatistics();
            population.evolve();
            this.updateBestIndividualAndStatistics(population);
            this.reportOfCurrentIteration(population);
            this._iterations++;
        }
        return this._archive as Map<number, C>;
    }

    /**
     * Updates the archive of best chromosomes. In NEAT we favor networks having a high network fitness function.
     *
     * @param candidateChromosome The candidate chromosome for the archive.
     */
    protected updateArchive(candidateChromosome: C): void {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
            let bestNetworkFitness = this._archive.has(fitnessFunctionKey)
                ? this._archive.get(fitnessFunctionKey).networkFitness
                : -1;
            const statementFitness = fitnessFunction.getFitness(candidateChromosome);
            const candidateNetworkFitness = candidateChromosome.networkFitness;
            if (fitnessFunction.isOptimal(statementFitness) && candidateNetworkFitness > bestNetworkFitness) {
                bestNetworkFitness = candidateNetworkFitness;
                if (!this._archive.has(fitnessFunctionKey)) {
                    StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                }
                this._archive.set(fitnessFunctionKey, candidateChromosome);
            }
        }
        this._bestIndividuals = new List<C>(Array.from(this._archive.values())).distinct();
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
    private updateBestIndividualAndStatistics(population: NeuroevolutionPopulation<NetworkChromosome>): void {
        this._bestIndividuals = new List<C>(Array.from(this._archive.values())).distinct();
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.size();
        StatisticsCollector.getInstance().incrementIterationCount();
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = this._archive.size;
        StatisticsCollector.getInstance().updateBestNetworkFitnessTimeline(this._iterations, population.populationChampion.networkFitness);
        StatisticsCollector.getInstance().updateHighestNetworkFitness(population.populationChampion.networkFitness);
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
        console.log(`Iteration:  ${this._iterations}`);
        console.log(`Highest Network Fitness:  ${population.highestFitness}`);
        console.log(`Current Iteration Highest Network Fitness:  ${population.populationChampion.networkFitness}`);
        console.log(`Generations passed since last improvement: ${population.highestFitnessLastChanged}`);
        for (const species of population.species) {
            console.log(`Species ${species.id} has ${species.size()} members and an average fitness of ${species.averageFitness}`);
        }
        console.log(`Time passed in seconds: ${(Date.now() - this.getStartTime())}`);
        console.log(`Covered goals: ${this._archive.size + "/" + this._fitnessFunctions.size}`);
        console.log("-----------------------------------------------------")
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

    getCurrentSolution(): List<C> {
        return this._bestIndividuals as List<C>;
    }

    getFitnessFunctions(): Iterable<FitnessFunction<C>> {
        return this._fitnessFunctions.values();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }
}
