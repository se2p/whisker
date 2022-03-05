import {NEAT} from "./NEAT";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {SearchAlgorithmProperties} from "../../search/SearchAlgorithmProperties";
import {NeatProperties} from "../HyperParameter/NeatProperties";
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
import {TargetStatementPopulation} from "../NeuroevolutionPopulations/TargetStatementPopulation";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import Arrays from "../../utils/Arrays";
import {Randomness} from "../../utils/Randomness";
import {OneOfStoppingCondition} from "../../search/stoppingconditions/OneOfStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../../search/stoppingconditions/OptimalSolutionStoppingCondition";

export class ExplorativeNEAT extends NEAT {

    private _currentStatementKey: number;
    private _currentTargetStatement: StatementFitnessFunction;
    private _parentKeyOfTargetStatement: number;
    private _intermediateIterations = 0;
    private _fitnessFunctionMap: Map<number, StatementFitnessFunction>;

    async findSolution(): Promise<Map<number, NeatChromosome>> {
        this._startTime = Date.now();
        this._iterations = 0;
        this._fitnessFunctionMap = new Map(this._fitnessFunctions) as unknown as Map<number, StatementFitnessFunction>;
        StatisticsCollector.getInstance().iterationCount = 0;
        const totalGoals = this._fitnessFunctions.size;
        while (this._archive.size != totalGoals && !(this._stoppingCondition.isFinished(this))) {
            this.setNextGoal();
            console.log(`Next goal ${this._archive.size}/${totalGoals}:${this._currentTargetStatement}`);
            const population = this.getPopulation();
            population.generatePopulation();
            this._intermediateIterations = 0;
            while (!this._stoppingCondition.isFinished(this)) {
                await this.evaluateNetworks(population.networks);
                this.updateBestIndividualAndStatistics(population);
                if (this._archive.has(this._currentStatementKey)) {
                    console.log(`Covered Target Statement ${this._currentStatementKey}:${this._currentTargetStatement}`);
                    break;
                }
                population.updatePopulationStatistics();
                this.reportOfCurrentIteration(population);
                population.evolve();
                for (const network of population.networks) {
                    network.targetFitness = this._currentTargetStatement;
                    network.initialiseStatementTargets([...this._fitnessFunctions.values()]);
                }
                this._intermediateIterations++;
                this._iterations++;
            }
        }
        return this._archive;
    }

    private setNextGoal(): void {
        const uncoveredStatements: StatementFitnessFunction[] = [];
        const allStatements = [...this._fitnessFunctionMap.values()];
        for (const [key, statement] of this._fitnessFunctionMap.entries()) {
            if (!this._archive.has(key)) {
                uncoveredStatements.push(statement);
            }
        }
        const random = Randomness.getInstance();
        const uncoveredPairs = StatementFitnessFunction.getNextUncoveredNodePairs(allStatements, uncoveredStatements);
        this._currentTargetStatement = random.pick([...uncoveredPairs.keys()]);
        this._currentStatementKey = this.mapStatementToKey(this._currentTargetStatement);
        const parentStatement = uncoveredPairs.get(this._currentTargetStatement);
        if (parentStatement !== undefined) {
            this._parentKeyOfTargetStatement = this.mapStatementToKey(uncoveredPairs.get(this._currentTargetStatement));
        }

    }

    private mapStatementToKey(statement: StatementFitnessFunction): number {
        for (const [key, st] of this._fitnessFunctionMap.entries()) {
            if (st.getTargetNode().id === statement.getTargetNode().id) {
                return key
            }
        }
        return undefined;
    }

    /**
     * Evaluates the networks by letting them play the given Scratch game.
     * @param networks the networks to evaluate.
     */
    protected async evaluateNetworks(networks: NeatChromosome[]): Promise<void> {
        for (const network of networks) {
            // Evaluate the networks by letting them play the game.
            await this._networkFitnessFunction.getFitness(network, this._neuroevolutionProperties.timeout,
                this._neuroevolutionProperties.eventSelection);
            // Update the archive and stop in the middle of the evaluation if we covered the targeted statement,
            // or depleted the search budget.
            this.updateArchive(network);
            if (this._archive.has(this._currentStatementKey) || this._stoppingCondition.isFinished(this)) {
                return;
            }
        }
    }

    protected updateArchive(candidateChromosome: NeatChromosome): void {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
            if (this.countAsCovered(fitnessFunctionKey, candidateChromosome)) {
                console.log(`Covered Statement ${fitnessFunctionKey}:${fitnessFunction}`);
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                this._archive.set(fitnessFunctionKey, candidateChromosome);
            }
        }
        this._bestIndividuals = Arrays.distinctObjects([...this._archive.values()]);
    }

    /**
     * Checks whether a given Scratch statement counts as covered.
     * @param fitnessFunctionKey the key of the Scratch statement that will be checked if it counts as covered.
     * @param candidateChromosome the chromosome that is evaluated whether it covers the given statement.
     * @returns boolean which is true if the statement counts as covered.
     */
    private countAsCovered(fitnessFunctionKey: number, candidateChromosome: NeatChromosome): boolean {
        const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);
        const coverageStableCount = candidateChromosome.statementTargets.get(fitnessFunction);
        const statementFitness = fitnessFunction.getFitness(candidateChromosome);
        return (coverageStableCount >= this._neuroevolutionProperties.coverageStableCount &&
                !this._archive.has(fitnessFunctionKey)) ||
            (this._neuroevolutionProperties.coverageStableCount == 0 &&
                fitnessFunction.isOptimal(statementFitness) &&
                !this._archive.has(fitnessFunctionKey));
    }

    /**
     * Reports the current state of the search.
     * @param population the population of networks.
     */
    protected reportOfCurrentIteration(population: NeatPopulation): void {
        console.log(`Total Iteration: ${StatisticsCollector.getInstance().iterationCount}`)
        console.log(`Intermediate Iteration:  ${this._intermediateIterations}`);
        console.log(`Covered Statements: ${this._archive.size}/${this._fitnessFunctions.size}`)
        console.log(`Current fitness Target: ${this._fitnessFunctions.get(this._currentStatementKey)}`);
        console.log(`Best Network Fitness:  ${population.bestFitness}`);
        console.log(`Current Iteration Best Network Fitness:  ${population.populationChampion.fitness}`);
        console.log(`Average Network Fitness: ${population.averageFitness}`)
        console.log(`Generations passed since last improvement: ${population.highestFitnessLastChanged}`);
        const sortedSpecies = population.species.sort((a, b) => b.averageFitness - a.averageFitness);
        for (const species of sortedSpecies) {
            console.log(`Species ${species.uID} has ${species.networks.length} members and an average fitness of ${species.averageFitness}`);
        }
        console.log(`Time passed in seconds: ${(Date.now() - this.getStartTime())}`);
        console.log("-----------------------------------------------------")
    }

    /**
     * Updates the List of the best networks found so far and the statistics used for reporting. Order is important!
     * @param population the current generation's population of networks.
     */
    protected updateBestIndividualAndStatistics(population: NeatPopulation): void {
        this._bestIndividuals = Arrays.distinct(this._archive.values());
        StatisticsCollector.getInstance().bestTestSuiteSize = this._bestIndividuals.length;
        StatisticsCollector.getInstance().iterationCount = this._iterations;
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = this._archive.size;
        StatisticsCollector.getInstance().updateHighestNetworkFitness(this._archive.size);

        const highestFitness = Math.max(...population.networks.map(n => n.fitness));
        const highestScore = Math.max(...population.networks.map(n => n.score));
        const highestSurvive = Math.max(...population.networks.map(n => n.playTime));
        StatisticsCollector.getInstance().updateHighestScore(highestScore);
        StatisticsCollector.getInstance().updateHighestPlaytime(highestSurvive);

        // Update TimeLine
        const timeLineValues: [number, number, number, number] = [this._archive.size, highestFitness, highestScore,
            highestSurvive];
        StatisticsCollector.getInstance().updateFitnessOverTime(Date.now() - this._startTime, timeLineValues);

        if (this._archive.size == this._fitnessFunctions.size && !this._fullCoverageReached) {
            this._fullCoverageReached = true;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage =
                (StatisticsCollector.getInstance().iterationCount + 1) * this._neuroevolutionProperties.populationSize;
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
    }

    protected getPopulation(): NeatPopulation {
        let startingNetworks: NeatChromosome[];
        if (this._parentKeyOfTargetStatement === undefined || !this._archive.has(this._parentKeyOfTargetStatement)) {
            startingNetworks = [this._chromosomeGenerator.get()];
            startingNetworks[0].initialiseStatementTargets([...this._fitnessFunctions.values()]);
        } else {
            startingNetworks = Arrays.distinct(this._archive.values());
        }
        return new TargetStatementPopulation(this._neuroevolutionProperties, this._currentTargetStatement,
            startingNetworks);
    }

    setProperties(properties: SearchAlgorithmProperties<NeatChromosome>): void {
        this._neuroevolutionProperties = properties as unknown as NeatProperties;
        this._stoppingCondition = this._neuroevolutionProperties.stoppingCondition;
        if (this._stoppingCondition instanceof OneOfStoppingCondition){
            for(const condition of this._stoppingCondition.conditions){
                if(condition instanceof OptimalSolutionStoppingCondition){
                    Arrays.remove(this._stoppingCondition.conditions, condition);
                }
            }
        }
        this._networkFitnessFunction = this._neuroevolutionProperties.networkFitness;
    }
}
