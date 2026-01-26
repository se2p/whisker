import {NEAT} from "./NEAT";
import {NeatChromosome} from "../networks/NeatChromosome";
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import {SearchAlgorithmProperties} from "../../../search/SearchAlgorithmProperties";
import {NeatPopulation} from "../neuroevolutionPopulations/NeatPopulation";
import {NeatestPopulation} from "../neuroevolutionPopulations/NeatestPopulation";
import {StatementFitnessFunction} from "../../../testcase/fitness/StatementFitnessFunction";
import Arrays from "../../../utils/Arrays";
import {OneOfStoppingCondition} from "../../../search/stoppingconditions/OneOfStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../../../search/stoppingconditions/OptimalSolutionStoppingCondition";
import {Container} from "../../../utils/Container";
import {NeatestParameter} from "../hyperparameter/NeatestParameter";
import logger from "../../../../util/logger";
import {TargetObjectiveSelection} from "../misc/TargetObjectiveSelection";

export class Neatest extends NEAT {

    /**
     * The search parameters.
     */
    protected override _neuroevolutionProperties: NeatestParameter;

    /**
     * The population of networks for the current generation.
     */
    protected _population: NeatPopulation

    /**
     * Holds the key of the currently targeted coverage objective.
     */
    protected _targetKey: number;

    /**
     * Maps objective keys to the corresponding FitnessFunction.
     */
    protected _fitnessFunctionMap: Map<number, StatementFitnessFunction>;

    /**
     * Since iterations in Neatest may stop in the middle of a generation due to covering a targeted
     * objective, we use a second variable that counts the number of executed generations since having selected the
     * current target objective.
     */
    private _targetIterations = 0;

    /**
     * Saves objective ids of objectives that have already been switched out to prioritise different ones.
     */
    private _switchedObjectives = new Set<StatementFitnessFunction>();


    /**
     * Searches for a suite of networks that are able to cover all objectives of a given Scratch program reliably.
     * @returns Mapping of an objective's key to the network capable of reaching the given objective reliably.
     */
    override async findSolution(): Promise<Map<number, NeatChromosome>> {
        this.initialise();
        const totalNumObjectives = this._fitnessFunctions.size;
        while (this._archive.size != totalNumObjectives && !(await this._stoppingCondition.isFinished(this))) {
            const currentTarget = this._setNextObjective();
            logger.debug(`Next objective ${this._archive.size}/${totalNumObjectives}:${currentTarget}`);
            this._population = this.getPopulation();
            await this._population.generatePopulation();
            this._targetIterations = 0;
            while (!(await this._stoppingCondition.isFinished(this))) {
                await this.evaluateNetworks();
                this.updateBestIndividualAndStatistics();

                // Stop if we managed to cover the current target objective.
                if (this._archive.has(this._targetKey)) {
                    logger.debug(`Covered Target Objective ${this._targetKey}:${currentTarget}`);
                    break;
                }

                // Update the population, report the current status to the user and evolve the population.
                this._population.updatePopulationStatistics();

                // Switch if we stopped improving for a set number of generations.
                const remainingTargets = this._getUncoveredObjectives()
                    .filter(target => target.getNodeId() !== currentTarget.getNodeId());
                if (this._population.highestFitnessLastChanged >= this._neuroevolutionProperties.switchObjectiveCount
                    && remainingTargets.length > 0) {
                    this._switchedObjectives.add(currentTarget);
                    logger.debug("Switching Target " + currentTarget.getNodeId() + " due to missing improvement.");
                    break;
                }

                await this.evolvePopulation(currentTarget);
                this._targetIterations++;
                this._iterations++;
            }
        }

        StatisticsCollector.getInstance().iterationCount = this._iterations;
        this.updateBestIndividualAndStatistics();
        return this._archive;
    }

    /**
     * Initialises required variables.
     */
    protected initialise(): void {
        this._startTime = Date.now();
        this._iterations = 0;
        this._fitnessFunctionMap = new Map(this._fitnessFunctions) as unknown as Map<number, StatementFitnessFunction>;
        StatisticsCollector.getInstance().iterationCount = 0;
    }

    /**
     * Initializes or updates the coverage objective map.
     * @param networks the networks for which the open statements should be initialized.
     */
    protected initCoverageObjectivesMap(networks: NeatChromosome[]): void {
        networks.forEach(network => network.initialiseCoverageObjectives([...this._fitnessFunctionMap.keys()]));
    }

    /**
     * Sets the next coverage objective for which a dynamic test case ought to be optimized.
     */
    private _setNextObjective(): StatementFitnessFunction {
        const feasibleObjectives = this._getNearestObjectives();

        // Preclude switches objectives and current objective.
        const preclude = [...this._switchedObjectives.values()];
        preclude.push(this._fitnessFunctionMap.get(this._targetKey));

        const nextObjective = TargetObjectiveSelection.getPromisingObjective(feasibleObjectives, preclude);
        this._targetKey = this.mapObjectiveToKey(nextObjective);
        Container.neatestTargetId = this._getIdOfCurrentObjective();
        return nextObjective;
    }

    /**
     * Fetch the nearest objectives based on which objectives have already been covered within the CDG.
     * If we optimise for statement coverage, we filter for statements whose CDG parents have been covered.
     * If we optimise for branch coverage, we filter for branches whose control nodes have already been covered.
     * @returns the nearest coverage objectives based on which objectives have already been covered.
     */
    protected _getNearestObjectives(): StatementFitnessFunction[] {
        const allObjectives = [...this._fitnessFunctionMap.values()];
        const uncoveredObjectives = [...this._getUncoveredObjectives()];
        return TargetObjectiveSelection.getFeasibleCoverageObjectives(allObjectives, uncoveredObjectives);
    }

    /**
     * Extracts all yet uncovered coverage objectives.
     * @returns array of yet uncovered objectives.
     */
    private _getUncoveredObjectives(): StatementFitnessFunction[] {
        return [...this._fitnessFunctionMap.values()]
            .filter(objective => !this._archive.has(this.mapObjectiveToKey(objective)));
    }

    /**
     * Helper function to get the map key of an objective.
     * @param objective the objective whose key should be extracted.
     * @returns the key of the given objective.
     */
    protected mapObjectiveToKey(objective: StatementFitnessFunction): number {
        for (const [key, st] of this._fitnessFunctionMap.entries()) {
            if (st.getNodeId() === objective.getNodeId()) {
                return key;
            }
        }
        return undefined;
    }

    /**
     * Evaluates the networks by letting them play the given Scratch game.
     */
    protected override async evaluateNetworks(): Promise<void> {
        for (const network of this._population.networks) {
            await this._networkFitnessFunction.getFitness(network, this._neuroevolutionProperties.timeout,
                this._neuroevolutionProperties.eventSelection, this._neuroevolutionProperties.classificationType);
            await this.updateArchive(network);

            // Free memory if the network was not added to the archive.
            if (![...this._archive.values()].includes(network)) {
                network.trace = null;
                network.coverage = null;
                network.branchCoverage = null;
            }

            // Stop if we covered the targeted objective or depleted the search budget.
            if (this._archive.has(this._targetKey) || await this._stoppingCondition.isFinished(this)) {
                return;
            }
        }
    }

    /**
     * Updates the archive of covered block objectives. Each chromosome is mapped to the block it covers.
     * @param network The candidate network to update the archive with.
     */
    protected override async updateArchive(network: NeatChromosome): Promise<void> {
        let coveredNewObjective = false;
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);

            // If we covered an objective, update the archive, statistics and the map of open objectives.
            if (this.coveredNewObjective(fitnessFunctionKey, network)) {
                logger.debug(`Covered Objective ${fitnessFunctionKey}:${fitnessFunction}`);
                coveredNewObjective = true;
                this._archive.set(fitnessFunctionKey, network);
                this.updateBestIndividualAndStatistics();
            }
        }

        if (coveredNewObjective) {
            await this.minimizeArchive(network);
        }
    }

    /**
     * Minimises the number of networks stored in the archive by replacing previously stored networks with
     * networks that were just added to the archive.
     * The idea is that networks found later in the search are more likely better at playing the game reasonably,
     * and thus, also cover previously reached objectives.
     *
     * Minimising the archive size helps to deal with memory issues that might occur when the archive grows too large,
     * e.g., if there are a lot of objectives to cover.
     * @param addedNetwork A network that was recently added to the archive.
     */
    protected async minimizeArchive(addedNetwork: NeatChromosome): Promise<void> {
        const sizeBefore = this.getCurrentSolution().length;
        for (const fitnessKey of this._archive.keys()) {
            if (this._coveredObjective(fitnessKey, addedNetwork)) {
                this._archive.set(fitnessKey, addedNetwork);
            }
        }
        const sizeAfter = this.getCurrentSolution().length;
        if (sizeAfter < sizeBefore) {
            logger.debug(`Minimized Archive: ${sizeBefore} -> ${sizeAfter}`);
        }
    }

    /**
     * Checks whether the given objective was covered in a network's playthrough.
     * @param fitnessFunctionKey the key of the coverage objective to be checked.
     * @param network the chromosome that might cover the given objective.
     * @returns boolean true if the objective was covered.
     */
    private _coveredObjective(fitnessFunctionKey: number, network: NeatChromosome): boolean {
        const coverageStableCount = network.coverageObjectives.get(fitnessFunctionKey);
        return coverageStableCount >= this._neuroevolutionProperties.coverageStableCount;
    }

    /**
     * Checks whether a previously uncovered objective was covered in a network's playthrough.
     * @param fitnessFunctionKey the key of the coverage objective to be checked.
     * @param network the chromosome that might cover the given objective.
     * @returns boolean true if the objective was covered for the first time.
     */
    protected coveredNewObjective(fitnessFunctionKey: number, network: NeatChromosome): boolean {
        return !this._archive.has(fitnessFunctionKey) && this._coveredObjective(fitnessFunctionKey, network);
    }

    /**
     * Evolves the population and updates the open objectives.
     * @param currentTarget The current target objective.
     */
    protected async evolvePopulation(currentTarget: StatementFitnessFunction): Promise<void> {
        this.reportOfCurrentIteration();
        await this._population.evolve();
        this.initCoverageObjectivesMap(this._population.networks);
        this._population.networks.forEach(network => network.targetObjective = currentTarget);
    }

    /**
     * Reports the current state of the search.
     */
    protected override reportOfCurrentIteration(): void {
        logger.debug(`\nTotal Iteration: ${StatisticsCollector.getInstance().iterationCount}`);
        logger.debug(`Intermediate Iteration:  ${this._targetIterations}`);
        logger.debug(`Covered Objectives: ${this._archive.size}/${this._fitnessFunctions.size}`);
        logger.debug(`Covered Statements: ${StatisticsCollector.getInstance().statementCoverage * 100}%`);
        logger.debug(`Covered Branches: ${StatisticsCollector.getInstance().branchCoverage * 100}%`);
        logger.debug(`Current Compatibility Threshold: ${this._population.compatibilityThreshold}`);
        logger.debug(`Current Target Objective: ${this._fitnessFunctions.get(this._targetKey)}`);
        logger.debug(`Best Network Fitness:  ${this._population.bestFitness}`);
        logger.debug(`Current Iteration Best Network Fitness:  ${this._population.populationChampion.fitness}`);
        logger.debug(`Average Network Fitness: ${this._population.averageFitness}`);

        const sortedSpecies = this._population.species.sort((a, b) => b.uID - a.uID);
        logger.debug(`Population of ${this._population.populationSize} distributed over ${sortedSpecies.length} species`);
        logger.debug("\tID\tage\tsize\tfitness\tshared fitness");
        for (const species of sortedSpecies) {
            logger.debug(`\t${species.uID}\t${species.age}\t${species.networks.length}\t${Math.round(species.averageFitness * 100) / 100}\t${Math.round(species.averageSharedFitness * 100) / 100}`);
        }
        logger.debug(`Generations passed since last improvement: ${this._population.highestFitnessLastChanged}`);
        logger.debug(`Time passed in seconds: ${(Date.now() - this.getStartTime())}`);
        logger.debug("\n-----------------------------------------------------\n");
    }

    /**
     * Updates the List of the best networks found so far, and the statistics used for reporting.
     */
    protected override updateBestIndividualAndStatistics(): void {
        StatisticsCollector.getInstance().bestTestSuiteSize = this.getCurrentSolution().length;
        StatisticsCollector.getInstance().iterationCount = this._iterations;

        this.updateCoverageTimeLine();

        if (this._archive.size == this._fitnessFunctions.size && !this._fullCoverageReached) {
            this._fullCoverageReached = true;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage =
                (StatisticsCollector.getInstance().iterationCount + 1) * this._neuroevolutionProperties.populationSize;
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
    }

    /**
     * Generates the next population based on the supplied starting networks.
     * @returns a population of networks.
     */
    protected override getPopulation(): NeatPopulation {
        const startingNetworks = this._getStartingNetworks();
        const allObjectives = [...this._fitnessFunctions.keys()];
        const currentTarget = this._fitnessFunctionMap.get(this._targetKey);
        return new NeatestPopulation(this._chromosomeGenerator, this._neuroevolutionProperties, allObjectives,
            currentTarget, startingNetworks, this._neuroevolutionProperties.randomFraction);
    }

    /**
     * Fetches the required starting networks based on the supplied {@link PopulationGeneration} strategy.
     * @returns starting networks for the next population.
     */
    private _getStartingNetworks(): NeatChromosome[] {
        switch (this._neuroevolutionProperties.populationGeneration) {
            case "global_solutions":
                return this.getCurrentSolution();
            case "direct_parent": {
                const allObjectives = [...this._fitnessFunctionMap.values()];
                const currentObjective = this._fitnessFunctionMap.get(this._targetKey);
                const parentObjective = TargetObjectiveSelection.getCDGParentObjective(currentObjective, allObjectives);
                const parentObjectiveKeys = parentObjective.map(objective => this.mapObjectiveToKey(objective));

                const parentNetworks: NeatChromosome[] = [];
                for (const parentObjectiveKey of parentObjectiveKeys) {
                    if (this._archive.has(parentObjectiveKey) && !parentNetworks.includes(this._archive.get(parentObjectiveKey))) {
                        parentNetworks.push(this._archive.get(parentObjectiveKey));
                    }
                }
                return parentNetworks;
            }
            case "random":
            default:
                return [];
        }
    }

    /**
     * Returns the id of the currently targeted objective.
     */
    private _getIdOfCurrentObjective(): string {
        return this._fitnessFunctionMap.get(this._targetKey).getNodeId();
    }

    /**
     * Sets the required hyperparameter.
     * @param properties the user-defined hyperparameter.
     */
    public override setProperties(properties: SearchAlgorithmProperties<NeatChromosome>): void {
        this._neuroevolutionProperties = properties as unknown as NeatestParameter;
        this._stoppingCondition = this._neuroevolutionProperties.stoppingCondition;
        if (this._stoppingCondition instanceof OneOfStoppingCondition) {
            for (const condition of this._stoppingCondition.conditions) {
                if (condition instanceof OptimalSolutionStoppingCondition) {
                    Arrays.remove(this._stoppingCondition.conditions, condition);
                }
            }
        }
        this._networkFitnessFunction = this._neuroevolutionProperties.networkFitness;
    }
}
