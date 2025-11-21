import {ChromosomeGenerator} from '../../../search/ChromosomeGenerator';
import {SearchAlgorithmProperties} from "../../../search/SearchAlgorithmProperties";
import {SearchAlgorithmDefault} from "../../../search/algorithms/SearchAlgorithmDefault";
import {FitnessFunction} from "../../../search/FitnessFunction";
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import {NeatPopulation} from "../neuroevolutionPopulations/NeatPopulation";
import {NetworkFitnessFunction} from "../networkFitness/NetworkFitnessFunction";
import Arrays from "../../../utils/Arrays";
import {NeatChromosome} from "../networks/NeatChromosome";
import logger from '../../../../util/logger';
import {NeatParameter} from "../hyperparameter/NeatParameter";

export class NEAT extends SearchAlgorithmDefault<NeatChromosome> {

    /**
     * The search parameters.
     */
    protected _neuroevolutionProperties: NeatParameter;

    /**
     * The fitnessFunction used to evaluate the networks of Neuroevolution Algorithm.
     */
    protected _networkFitnessFunction: NetworkFitnessFunction<NeatChromosome>;

    /**
     * Evaluates the networks by letting them play the given Scratch game.
     * @param networks the networks to evaluate -> Current population
     */
    protected async evaluateNetworks(networks: NeatChromosome[]): Promise<void> {
        for (const network of networks) {
            // Evaluate the networks by letting them play the game.
            await this._networkFitnessFunction.getFitness(network, this._neuroevolutionProperties.timeout,
                this._neuroevolutionProperties.eventSelection, this._neuroevolutionProperties.classificationType);
            // Update the archive and stop in the middle of the evaluation if we already cover all statements.
            await this.updateArchive(network);
            if ((await this._stoppingCondition.isFinished(this))) {
                return;
            }
        }
    }

    /**
     * Returns a list of solutions for the given problem.
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<Map<number, NeatChromosome>> {
        const population = this.getPopulation();
        await population.generatePopulation();
        this._iterations = 0;
        this._startTime = Date.now();

        while (!(await this._stoppingCondition.isFinished(this))) {
            await this.evaluateNetworks(population.networks);
            population.updatePopulationStatistics();
            this.reportOfCurrentIteration(population);
            this.updateBestIndividualAndStatistics();
            await population.evolve();
            this._iterations++;
        }
        return this._archive as Map<number, NeatChromosome>;
    }

    /**
     * Updates the archive of covered block statements. Each chromosome is mapped to the block it covers.
     * Additionally, we save the best performing chromosome regarding the achieved network fitness.
     * @param candidateChromosome The candidate chromosome to update the archive with.
     */
    protected override async updateArchive(candidateChromosome: NeatChromosome): Promise<void> {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
            const statementFitness = await fitnessFunction.getFitness(candidateChromosome);
            if (await fitnessFunction.isOptimal(statementFitness) && !this._archive.has(fitnessFunctionKey)) {
                this._archive.set(fitnessFunctionKey, candidateChromosome);
            }
        }

        // Save the best performing chromosome according to the set network fitness function.
        const bestNetworkKey = this._fitnessFunctions.size + 1;
        if (!this._archive.has(bestNetworkKey) ||
            this._archive.get(bestNetworkKey).fitness < candidateChromosome.fitness) {
            this._archive.set(bestNetworkKey, candidateChromosome);
        }
    }

    /**
     * Generate the desired type of NeuroevolutionPopulation to be used by the NEAT algorithm.
     * @returns NeuroevolutionPopulation defined in the config files.
     */
    protected getPopulation(): NeatPopulation {
        return new NeatPopulation(this._chromosomeGenerator, this._neuroevolutionProperties);
    }

    /**
     * Updates the List of the best networks found so far, and the statistics used for reporting.
     * Order is important!
     */
    protected updateBestIndividualAndStatistics(): void {
        StatisticsCollector.getInstance().bestTestSuiteSize = this.getCurrentSolution().length;
        StatisticsCollector.getInstance().incrementIterationCount();
        this.updateCoverageTimeLine();

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
    protected reportOfCurrentIteration(population: NeatPopulation): void {
        logger.debug(`Iteration:  ${this._iterations}`);
        logger.debug(`Population Size: ${this.getPopulation().networks.length}`);
        logger.debug(`Current compatibility threshold: ${this.getPopulation().compatibilityThreshold}`);
        logger.debug(`Best Network Fitness:  ${population.bestFitness}`);
        logger.debug(`Current Iteration Best Network Fitness:  ${population.populationChampion.fitness}`);
        logger.debug(`Average Network Fitness: ${population.averageFitness}`);
        logger.debug(`Generations passed since last improvement: ${population.highestFitnessLastChanged}`);
        for (const species of population.species) {
            logger.debug(`Species ${species.uID} has ${species.networks.length} members and an average fitness of ${species.averageFitness}`);
        }
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            if (!this._archive.has(fitnessFunctionKey)) {
                logger.debug(`Not covered: ${this._fitnessFunctions.get(fitnessFunctionKey).toString()}`);
            }
        }
        logger.debug(`Time passed in seconds: ${(Date.now() - this.getStartTime())}`);
        logger.debug(`Covered objectives: ${this._archive.size - 1 + "/" + this._fitnessFunctions.size}`);
        if (this._neuroevolutionProperties.printPopulationRecord) {
            const currentPopulationRecord = {};
            currentPopulationRecord[`Generation ${this._iterations}`] = population;
            logger.debug(`PopulationRecord: \n ${JSON.stringify(currentPopulationRecord, undefined, 4)}`);
        }
        logger.debug("-----------------------------------------------------");
    }

    getStartTime(): number {
        return this._startTime;
    }

    setProperties(properties: SearchAlgorithmProperties<NeatChromosome>): void {
        this._neuroevolutionProperties = properties as unknown as NeatParameter;
        this._stoppingCondition = this._neuroevolutionProperties.stoppingCondition;
        this._networkFitnessFunction = this._neuroevolutionProperties.networkFitness;
    }

    setChromosomeGenerator(generator: ChromosomeGenerator<NeatChromosome>): void {
        this._chromosomeGenerator = generator;
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): NeatChromosome[] {
        return Arrays.distinct(this._archive.values());
    }

    getFitnessFunctions(): Iterable<FitnessFunction<NeatChromosome>> {
        return this._fitnessFunctions.values();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<NeatChromosome>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    setFitnessFunction(): void {
        throw new Error('Method not implemented.');
    }

    setSelectionOperator(): void {
        throw new Error('Method not implemented.');
    }

    setLocalSearchOperators(): void {
        throw new Error('Method not implemented.');
    }
}
