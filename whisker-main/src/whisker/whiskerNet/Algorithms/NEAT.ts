import {ChromosomeGenerator} from '../../search/ChromosomeGenerator';
import {SearchAlgorithmProperties} from "../../search/SearchAlgorithmProperties";
import {SearchAlgorithmDefault} from "../../search/algorithms/SearchAlgorithmDefault";
import {FitnessFunction} from "../../search/FitnessFunction";
import {NeuroevolutionFitnessOverTime, StatisticsCollector} from "../../utils/StatisticsCollector";
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
import {NetworkFitnessFunction} from "../NetworkFitness/NetworkFitnessFunction";
import Arrays from "../../utils/Arrays";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {Container} from "../../utils/Container";
import {NeuroevolutionTestGenerationParameter} from "../HyperParameter/NeuroevolutionTestGenerationParameter";

export class NEAT extends SearchAlgorithmDefault<NeatChromosome> {

    /**
     * The search parameters.
     */
    protected _neuroevolutionProperties: NeuroevolutionTestGenerationParameter;

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
            await this._networkFitnessFunction.getFitness(network, this._neuroevolutionProperties.timeout, this._neuroevolutionProperties.eventSelection);
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
        population.generatePopulation();
        this._iterations = 0;
        this._startTime = Date.now();

        while (!(await this._stoppingCondition.isFinished(this))) {
            await this.evaluateNetworks(population.networks);
            population.updatePopulationStatistics();
            this.reportOfCurrentIteration(population);
            this.updateBestIndividualAndStatistics(population);
            population.evolve();
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
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                this._archive.set(fitnessFunctionKey, candidateChromosome);
            }
        }

        // Save the best performing chromosome according to the set network fitness function.
        const bestNetworkKey = this._fitnessFunctions.size + 1;
        if (!this._archive.has(bestNetworkKey) ||
            this._archive.get(bestNetworkKey).fitness < candidateChromosome.fitness) {
            this._archive.set(bestNetworkKey, candidateChromosome);
        }
        this._bestIndividuals = Arrays.distinctObjects([...this._archive.values()]);
    }

    /**
     * Generate the desired type of NeuroevolutionPopulation to be used by the NEAT algorithm.
     * @returns NeuroevolutionPopulation defined in the config files.
     */
    protected getPopulation(): NeatPopulation {
        return new NeatPopulation(this._chromosomeGenerator, this._neuroevolutionProperties);
    }

    /**
     * Updates the List of the best networks found so far and the statistics used for reporting. Order is important!
     * @param population the current generation's population of networks.
     */
    protected updateBestIndividualAndStatistics(population: NeatPopulation): void {
        this._bestIndividuals = Arrays.distinct(this._archive.values());
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.length;
        StatisticsCollector.getInstance().incrementIterationCount();
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = this._archive.size - 1;
        StatisticsCollector.getInstance().updateHighestNetworkFitness(population.populationChampion.fitness);

        const highestFitness = Math.max(...population.networks.map(n => n.fitness));
        const highestScore = Math.max(...population.networks.map(n => n.score));
        const highestSurvive = Math.max(...population.networks.map(n => n.playTime));
        StatisticsCollector.getInstance().updateHighestScore(highestScore);
        StatisticsCollector.getInstance().updateHighestPlaytime(highestSurvive);

        const timeLineValues: NeuroevolutionFitnessOverTime = {
            coverage: this._archive.size,
            fitness: highestFitness,
            score: highestScore,
            survive: highestSurvive
        };
        StatisticsCollector.getInstance().updateFitnessOverTime(Date.now() - this._startTime, timeLineValues);

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
        Container.debugLog(`Iteration:  ${this._iterations}`);
        Container.debugLog(`Best Network Fitness:  ${population.bestFitness}`);
        Container.debugLog(`Current Iteration Best Network Fitness:  ${population.populationChampion.fitness}`);
        Container.debugLog(`Average Network Fitness: ${population.averageFitness}`);
        Container.debugLog(`Generations passed since last improvement: ${population.highestFitnessLastChanged}`);
        for (const species of population.species) {
            Container.debugLog(`Species ${species.uID} has ${species.networks.length} members and an average fitness of ${species.averageFitness}`);
        }
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            if (!this._archive.has(fitnessFunctionKey)) {
                Container.debugLog(`Not covered: ${this._fitnessFunctions.get(fitnessFunctionKey).toString()}`);
            }
        }
        Container.debugLog(`Time passed in seconds: ${(Date.now() - this.getStartTime())}`);
        Container.debugLog(`Covered goals: ${this._archive.size - 1 + "/" + this._fitnessFunctions.size}`);
        if (this._neuroevolutionProperties.printPopulationRecord) {
            const currentPopulationRecord = {};
            currentPopulationRecord[`Generation ${this._iterations}`] = population;
            Container.debugLog(`PopulationRecord: \n ${JSON.stringify(currentPopulationRecord, undefined, 4)}`);
        }
        Container.debugLog("-----------------------------------------------------");
    }

    getStartTime(): number {
        return this._startTime;
    }

    setProperties(properties: SearchAlgorithmProperties<NeatChromosome>): void {
        this._neuroevolutionProperties = properties as unknown as NeuroevolutionTestGenerationParameter;
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
        return this._bestIndividuals as NeatChromosome[];
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
