import {List} from '../../utils/List';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {NetworkChromosome} from "../../whiskerNet/NetworkChromosome";
import {SearchAlgorithmProperties} from "../SearchAlgorithmProperties";
import {StoppingCondition} from "../StoppingCondition";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {FitnessFunction} from "../FitnessFunction";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {NeatPopulation} from "../../whiskerNet/NeatPopulation";
import {NeuroevolutionProperties} from "../../whiskerNet/NeuroevolutionProperties";
import {NetworkFitnessFunction} from "../../whiskerNet/NetworkFitness/NetworkFitnessFunction";

export class NEAT<C extends NetworkChromosome> extends SearchAlgorithmDefault<NetworkChromosome> {

    /**
     * The search parameters
     */
    private _properties: NeuroevolutionProperties<C>;

    /**
     * The generator used for creating the initial population.
     */
    private _chromosomeGenerator: ChromosomeGenerator<C>;

    /**
     * The used fitness function to evaluate how close we are to an optimal solution.
     */
    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    /**
     * Defines when we stop the search.
     */
    private _stoppingCondition: StoppingCondition<C>;

    /**
     * Saves the number of iterations.
     */
    private _iterations = 0;

    /**
     * Saves the best chromosomes according to the defined fitness function
     */
    private _bestIndividuals = new List<C>();

    /**
     * The archive maps all statements of a Scratch project as numbers to a chromosome which covers the given statement.
     */
    private readonly _archive = new Map<number, C>();

    /**
     * Saves the time at which the search was started.
     */
    private _startTime: number;

    /**
     * Flag if we reached 100% coverage of the given Scratch project.
     */
    private _fullCoverageReached = false;

    /**
     * The fitnessFunction used to evaluate the networks of Neuroevolution Algorithm.
     */
    private _networkFitnessFunction: NetworkFitnessFunction<NetworkChromosome>;

    /**
     * Saves all Networks mapped to the generation they occurred in.
     */
    private _populationRecord = new Map<number, NeatPopulation<C>>();

    /**
     * Evaluates the networks by letting them play the given Scratch game.
     * @param networks the networks to evaluate -> Current population
     */
    private async evaluateNetworks(networks: List<C>): Promise<void> {
        for (const network of networks) {
            // Evaluate the networks by letting them play the game.
            await this._networkFitnessFunction.getFitness(network, this._properties.timeout);
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
    async findSolution(): Promise<List<C>> {
        // The targeted number of species -> The distanceThreshold is adjusted appropriately.
        const speciesNumber = 10;
        // Report the current state of the search after <reportPeriod> iterations.
        const reportPeriod = 1;
        const population = new NeatPopulation(this._properties.populationSize, speciesNumber, this._chromosomeGenerator,
            this._properties);
        this._iterations = 0;
        this._startTime = Date.now();

        while (!(this._stoppingCondition.isFinished(this))) {
            await this.evaluateNetworks(population.chromosomes);
            population.assignNumberOfChildren();
            this._populationRecord.set(this._iterations, population.clone());
            population.evolve();
            this.updateBestIndividualAndStatistics();
            if (this._iterations % reportPeriod === 0) {
                this.reportOfCurrentIteration(population);
            }
            this._iterations++;
        }
        return this._bestIndividuals;
    }

    /**
     * Summarize the solution saved in _archive.
     * @returns: For each statement that is not covered, it returns 4 items:
     *        - Not covered: the statement that’s not covered by any
     *        function in the _bestIndividuals.
     *        - ApproachLevel: the approach level of that statement
     *        - BranchDistance: the branch distance of that statement
     *        - Fitness: the fitness value of that statement
     * For other search algorithms, it returns an empty string.
     */
    summarizeSolution(): string {
        const summary = [];
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const curSummary = {};
            if (!this._archive.has(fitnessFunctionKey)) {
                const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
                curSummary['block'] = fitnessFunction.toString();
                let fitness = Number.MAX_VALUE;
                let approachLevel = Number.MAX_VALUE;
                let branchDistance = Number.MAX_VALUE;
                let CFGDistance = Number.MAX_VALUE;
                for (const chromosome of this._bestIndividuals) {
                    const curFitness = fitnessFunction.getFitness(chromosome);
                    if (curFitness < fitness) {
                        fitness = curFitness;
                        approachLevel = fitnessFunction.getApproachLevel(chromosome);
                        branchDistance = fitnessFunction.getBranchDistance(chromosome);
                        if (approachLevel === 0 && branchDistance === 0) {
                            CFGDistance = fitnessFunction.getCFGDistance(chromosome);
                        } else {
                            CFGDistance = Number.MAX_VALUE;
                            //this means that it was unnecessary to calculate cfg distance, since
                            //approach level or branch distance was not 0;
                        }
                    }
                }
                curSummary['ApproachLevel'] = approachLevel;
                curSummary['BranchDistance'] = branchDistance;
                curSummary['CFGDistance'] = CFGDistance;
                curSummary['Fitness'] = fitness;
                if (Object.keys(curSummary).length > 0) {
                    summary.push(curSummary);
                }
            }

        }
        return JSON.stringify({'uncoveredBlocks': summary});
    }

    /**
     * Updates the archive with a given network candidate. The archive is updated if we cover a new statement or
     * if we cover a already covered statement by executing less events.
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

    /**
     * Updates the List of the best networks found so far and the statistics used for reporting.
     */
    private updateBestIndividualAndStatistics(): void {
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

    /**
     * Reports the current state of the search.
     * @param population the population of networks
     */
    private reportOfCurrentIteration(population: NeatPopulation<NetworkChromosome>): void {
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
        this._properties = properties as unknown as NeuroevolutionProperties<C>;
        this._stoppingCondition = this._properties.stoppingCondition
        this._networkFitnessFunction = this._properties.networkFitness;
    }

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
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

    get populationRecord(): Map<number, NeatPopulation<C>> {
        return this._populationRecord;
    }
}
