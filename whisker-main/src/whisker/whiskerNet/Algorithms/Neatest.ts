import {NEAT} from "./NEAT";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {SearchAlgorithmProperties} from "../../search/SearchAlgorithmProperties";
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
import {TargetStatementPopulation} from "../NeuroevolutionPopulations/TargetStatementPopulation";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import Arrays from "../../utils/Arrays";
import {Randomness} from "../../utils/Randomness";
import {OneOfStoppingCondition} from "../../search/stoppingconditions/OneOfStoppingCondition";
import {OptimalSolutionStoppingCondition} from "../../search/stoppingconditions/OptimalSolutionStoppingCondition";
import {Container} from "../../utils/Container";
import {NeatestParameter} from "../HyperParameter/NeatestParameter";
import {UserEventNode} from "scratch-analysis";
import logger from "../../../util/logger";

export class Neatest extends NEAT {

    /**
     * The search parameters.
     */
    protected override _neuroevolutionProperties: NeatestParameter;

    /**
     * The population of networks for the current generation.
     */
    private _population: NeatPopulation

    /**
     * Holds the key of the currently targeted statement.
     */
    private _targetKey: number;

    /**
     * Maps statement keys to the corresponding StatementFitnessFunction.
     */
    private _fitnessFunctionMap: Map<number, StatementFitnessFunction>;

    /**
     * Since iterations in Neatest may stop in the middle of a generation due to covering a targeted
     * statement, we use a second variable that counts the number of executed generations since having selected the
     * current target statement.
     */
    private _targetIterations = 0;

    /**
     * Saves target ids of objectives that have already been switched out to prioritise different ones.
     */
    private _switchedTargets = new Set<string>();

    /**
     * Holds a record of promising targets, i.e., the maximum amount of how often a target has accidentally already been
     * covered by a network without it actually being the currently targeted statement.
     */
    private _promisingTargets = new Map<number, number>();

    /**
     * Searches for a suite of networks that are able to cover all statements of a given Scratch program reliably.
     * @returns Mapping of a statement's key to the network capable of reaching the given statement reliably.
     */
    override async findSolution(): Promise<Map<number, NeatChromosome>> {
        this.initialise();
        const totalGoals = this._fitnessFunctions.size;
        while (this._archive.size != totalGoals && !(await this._stoppingCondition.isFinished(this))) {
            const currentTarget = this.setNextGoal();
            logger.debug(`Next goal ${this._archive.size}/${totalGoals}:${currentTarget}`);
            this._population = this.getPopulation();
            this._population.generatePopulation();
            this._targetIterations = 0;
            while (!(await this._stoppingCondition.isFinished(this))) {
                await this.evaluateNetworks();
                this.updateBestIndividualAndStatistics();

                // Stop if we managed to cover the current target statement.
                if (this._archive.has(this._targetKey)) {
                    logger.debug(`Covered Target Statement ${this._targetKey}:${currentTarget}`);
                    break;
                }

                // Update the population, report the current status to the user and evolve the population.
                this._population.updatePopulationStatistics();

                // Switch the target if we stop improving for a set number of times and have statements to which we
                // can switch to left
                const uncoveredStatementIds = this.getUncoveredStatements().map(statement => statement.getNodeId());
                const uncoveredUntouchedTargets = uncoveredStatementIds.filter(targetId => !this._switchedTargets.has(targetId));
                if (this._population.highestFitnessLastChanged >= this._neuroevolutionProperties.switchTargetCount &&
                    uncoveredUntouchedTargets.length > 0) {
                    const currentTargetId = this._fitnessFunctionMap.get(this._targetKey).getNodeId();
                    this._switchedTargets.add(currentTargetId);
                    logger.debug("Switching Target " + currentTargetId + " due to missing improvement.");
                    break;
                }

                this.reportOfCurrentIteration();
                this._population.evolve();

                // Extract the remaining openStatements and set them for the evolved population of networks.
                const openStatements: number[] = [];
                for (const key of this._fitnessFunctions.keys()) {
                    if (!this._archive.has(key)) {
                        openStatements.push(key);
                    }
                }
                for (const network of this._population.networks) {
                    network.targetFitness = currentTarget;
                    network.initialiseOpenStatements(openStatements);
                }

                this._targetIterations++;
                this._iterations++;
            }
        }
        this.updateBestIndividualAndStatistics();
        return this._archive;
    }

    /**
     * Initialises required variables.
     */
    private initialise(): void {
        this._startTime = Date.now();
        this._iterations = 0;
        this._fitnessFunctionMap = new Map(this._fitnessFunctions) as unknown as Map<number, StatementFitnessFunction>;
        for (const fitnessKey of this._fitnessFunctionMap.keys()) {
            this._promisingTargets.set(fitnessKey, 0);
        }
        StatisticsCollector.getInstance().iterationCount = 0;
    }

    /**
     * Sets the next fitness objective by prioritising the most promising statements, i.e., statements that are direct
     * children of already reached statements in the control dependence graph.
     * @returns the next target statement's fitness function.
     */
    private setNextGoal(): StatementFitnessFunction {
        const uncoveredStatements = this.getUncoveredStatements();
        const allStatements = [...this._fitnessFunctionMap.values()];
        let potentialTargets = StatementFitnessFunction.getNearestTargets(allStatements, uncoveredStatements);

        // Prioritise greenFlag events
        let nextTarget = [...potentialTargets.values()]
            .find(target => target.getTargetNode().block.opcode === 'event_whenflagclicked');

        // If there are no greenFlagEvents left to cover, prioritise targets we have already reached in the past and
        // were not selected as target yet.
        if (nextTarget === undefined) {
            const uncoveredUntouchedTargets = new Set([...potentialTargets].filter(target => !this._switchedTargets.has(target.getNodeId())));
            potentialTargets = uncoveredUntouchedTargets.size > 0 ? uncoveredUntouchedTargets : potentialTargets;
            let mostPromisingTargets = [];
            let mostPromisingValue = 0;
            for (const potTarget of potentialTargets) {

                // When switching targets without having covered the previous target, we want to make sure not to
                // select the same target again.
                if (this._targetKey !== undefined &&
                    this._fitnessFunctionMap.get(this._targetKey).getNodeId() === potTarget.getNodeId()) {
                    continue;
                }

                const potentialValue = this._promisingTargets.get(this.mapStatementToKey(potTarget));
                if (potentialValue > mostPromisingValue) {
                    mostPromisingValue = potentialValue;
                    mostPromisingTargets = [potTarget];
                } else if (potentialValue > 0 && potentialValue === mostPromisingValue) {
                    mostPromisingTargets.push(potTarget);
                }
            }
            if (mostPromisingTargets.length > 0) {
                nextTarget = Randomness.getInstance().pick(mostPromisingTargets);
            }
        }

        // If no target looks promising, we pick the next target randomly.
        if (nextTarget === undefined) {
            nextTarget = Randomness.getInstance().pick(Array.from(potentialTargets));
        }
        this._targetKey = this.mapStatementToKey(nextTarget);
        Container.neatestTargetId = this._getIdOfCurrentStatement();
        return nextTarget;
    }

    /**
     * Extracts all yet uncovered statements.
     * @returns array of yet uncovered statements.
     */
    private getUncoveredStatements(): StatementFitnessFunction[] {
        const uncoveredStatements: StatementFitnessFunction[] = [];

        // Collect yet uncovered statements.
        for (const [key, statement] of this._fitnessFunctionMap.entries()) {
            if (!this._archive.has(key)) {
                uncoveredStatements.push(statement);
            }
        }
        return uncoveredStatements;
    }

    /**
     * Helper function to get the map key of a statement.
     * @param statement the statement whose key should be extracted.
     * @returns the key of the given statement.
     */
    private mapStatementToKey(statement: StatementFitnessFunction): number {
        for (const [key, st] of this._fitnessFunctionMap.entries()) {
            if (st.getNodeId() === statement.getNodeId()) {
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
                this._neuroevolutionProperties.eventSelection);
            await this.updateArchive(network);

            // Free memory if the network was not added to the archive.
            if (![...this._archive.values()].includes(network)) {
                network.trace = null;
                network.coverage = null;
                network.codons = null;
            }

            // Check if we just covered the greenFlag event, and if so, save the number of blocks that are covered
            // by only clicking on the greenFlag.
            // This is ensured since we stopped the execution as soon as
            // we covered the target statement and prioritised the greenFlag as a target statement.
            if (this._fitnessFunctionMap.get(this._targetKey).getTargetNode().block.opcode === 'event_whenflagclicked' &&
                this._archive.has(this._targetKey)) {
                StatisticsCollector.getInstance().greenFlagCovered = this._archive.size;
            }

            // Update the map of the most promising fitness targets
            this.updateMostPromisingMap(network);
            network.openStatementTargets = null;

            // Stop if we covered the targeted statement or depleted the search budget.
            if (this._archive.has(this._targetKey) || await this._stoppingCondition.isFinished(this)) {
                return;
            }
        }
    }

    /**
     * Updates the map of the most promising statement targets.
     * @param network the network with which the map will be updated.
     */
    private updateMostPromisingMap(network: NeatChromosome): void {
        for (const fitnessFunctionKey of this._promisingTargets.keys()) {
            const networkFitness = network.openStatementTargets.get(fitnessFunctionKey);
            if (this._promisingTargets.has(fitnessFunctionKey) &&
                networkFitness > this._promisingTargets.get(fitnessFunctionKey)) {
                this._promisingTargets.set(fitnessFunctionKey, networkFitness);
            }
        }
    }

    /**
     * Updates the archive of covered block statements. Each chromosome is mapped to the block it covers.
     * @param network The candidate network to update the archive with.
     */
    protected override async updateArchive(network: NeatChromosome): Promise<void> {
        for (const fitnessFunctionKey of this._fitnessFunctions.keys()) {
            const fitnessFunction = this._fitnessFunctions.get(fitnessFunctionKey);

            // If we covered a statement, update the archive, statistics and the map of open target statements.
            if (this.coveredNewObjective(fitnessFunctionKey, network)) {
                logger.debug(`Covered Statement ${fitnessFunctionKey}:${fitnessFunction}`);
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                await this.minimiseArchive(network);
                this._archive.set(fitnessFunctionKey, network);
                for (const n of this._population.networks) {
                    if (n.openStatementTargets != null) {
                        n.openStatementTargets.delete(fitnessFunctionKey);
                    }
                }
                if (this._promisingTargets.has(fitnessFunctionKey)) {
                    this._promisingTargets.delete(fitnessFunctionKey);
                }
            }
        }
    }

    /**
     * Minimises the number of networks stored in the archive by replacing previously stored networks with
     * networks that were just added to the archive.
     * The idea is that networks found later in the search are more likely better in playing the game reasonably,
     * and thus, also cover previously reached statements.
     *
     * Minimising the archive size helps to deal with memory issues that might occur when the archive grows too large,
     * e.g., if there are a lot of statements to cover.
     * @param addedNetwork
     */
    private async minimiseArchive(addedNetwork: NeatChromosome): Promise<void> {
        const sizeBefore = this.getCurrentSolution().length;
        for (const fitnessKey of this._archive.keys()) {
            if (this.coveredObjective(fitnessKey, addedNetwork)) {
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
    private coveredObjective(fitnessFunctionKey: number, network: NeatChromosome): boolean {
        const coverageStableCount = network.openStatementTargets.get(fitnessFunctionKey);
        return coverageStableCount >= this._neuroevolutionProperties.coverageStableCount;
    }

    /**
     * Checks whether a previously uncovered objective was covered in a network's playthrough.
     * @param fitnessFunctionKey the key of the coverage objective to be checked.
     * @param network the chromosome that might cover the given objective.
     * @returns boolean true if the objective was covered for the first time.
     */
    private coveredNewObjective(fitnessFunctionKey: number, network: NeatChromosome): boolean {
        return !this._archive.has(fitnessFunctionKey) && this.coveredObjective(fitnessFunctionKey, network);
    }

    /**
     * Reports the current state of the search.
     */
    protected override reportOfCurrentIteration(): void {
        logger.debug(`\nTotal Iteration: ${StatisticsCollector.getInstance().iterationCount}`);
        logger.debug(`Intermediate Iteration:  ${this._targetIterations}`);
        logger.debug(`Covered Targets: ${this._archive.size}/${this._fitnessFunctions.size}`);
        logger.debug(`Covered Statements: ${StatisticsCollector.getInstance().statementCoverage * 100}%`);
        logger.debug(`Covered Branches: ${StatisticsCollector.getInstance().branchCoverage * 100}%`);
        logger.debug(`Current fitness Target: ${this._fitnessFunctions.get(this._targetKey)}`);
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
        StatisticsCollector.getInstance().coveredFitnessFunctionsCount = this._archive.size;
        StatisticsCollector.getInstance().updateHighestNetworkFitness(this._archive.size);

        this.updateCoverageTimeLine();

        if (this._archive.size == this._fitnessFunctions.size && !this._fullCoverageReached) {
            this._fullCoverageReached = true;
            StatisticsCollector.getInstance().createdTestsToReachFullCoverage =
                (StatisticsCollector.getInstance().iterationCount + 1) * this._neuroevolutionProperties.populationSize;
            StatisticsCollector.getInstance().timeToReachFullCoverage = Date.now() - this._startTime;
        }
    }

    /**
     * Generates the next population based on the supplied starting Networks.
     * @returns a population of networks.
     */
    protected override getPopulation(): NeatPopulation {
        const startingNetworks = this._getStartingNetworks();
        const allStatements = [...this._fitnessFunctions.keys()];
        const currentTarget = this._fitnessFunctionMap.get(this._targetKey);
        return new TargetStatementPopulation(this._chromosomeGenerator, this._neuroevolutionProperties, allStatements,
            currentTarget, startingNetworks, this._neuroevolutionProperties.randomFraction);
    }

    /**
     * Fetches the required starting networks based ont he supplied {@link PopulationGeneration} strategy.
     * @returns starting networks for the next population.
     */
    private _getStartingNetworks(): NeatChromosome[] {
        switch (this._neuroevolutionProperties.populationGeneration) {
            case "global_solutions":
                return this._archive.size == 0 ? [] : Arrays.distinct(this._archive.values());
            case "direct_parent": {
                const currentTarget = this._fitnessFunctionMap.get(this._targetKey);
                const parents = StatementFitnessFunction.getCDGParent(currentTarget.getTargetNode());
                const graphParents = parents.filter(node => !(node instanceof UserEventNode));
                if (graphParents.length === 0) {
                    return [];
                }
                const allStatements = [...this._fitnessFunctionMap.values()];
                const parentNetworks: NeatChromosome[] = [];

                // We may get multiple parents. Filter for unique networks.
                for (const parent of graphParents) {
                    const parentStatement = StatementFitnessFunction.mapNodeToStatement(parent, allStatements);
                    const parentId = this.mapStatementToKey(parentStatement);
                    for (const [statementId, network] of this._archive.entries()) {
                        if (statementId == parentId && !parentNetworks.includes(network)) {
                            parentNetworks.push(network);
                        }
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
     * Returns the id of the currently targeted statement.
     */
    private _getIdOfCurrentStatement(): string {
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
