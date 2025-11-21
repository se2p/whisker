import {Neatest} from "./Neatest";
import {NetworkChromosome} from "../networks/NetworkChromosome";
import {ManyObjectiveNetworkFitnessFunction} from "../networkFitness/ManyObjectiveNetworkFitnessFunction";
import {Randomness} from "../../../utils/Randomness";
import {DiversityMetric, ManyObjectiveNeatestParameter} from "../hyperparameter/ManyObjectiveNeatestParameter";
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import {StatementFitnessFunction} from "../../../testcase/fitness/StatementFitnessFunction";
import {SearchAlgorithmProperties} from "../../../search/SearchAlgorithmProperties";
import {NeatChromosome} from "../networks/NeatChromosome";
import {NeatPopulation} from "../neuroevolutionPopulations/NeatPopulation";
import logger from "../../../../util/logger";
import {FitnessFunction} from "../../../search/FitnessFunction";
import {TestCase} from "../../../core/TestCase";


/**
 * A base class containing utilities for all many-objective enhancements of Neatest.
 */
export abstract class ManyObjectiveNeatest extends Neatest {

    /**
     * The search parameters.
     */
    protected override _neuroevolutionProperties: ManyObjectiveNeatestParameter;

    /**
     * The network fitness function.
     */
    protected override _networkFitnessFunction: ManyObjectiveNetworkFitnessFunction<NetworkChromosome>;

    /**
     * Random number Generator.
     */
    protected readonly _random = Randomness.getInstance();

    /**
     * The currently optimized targets which are uncovered and reachable in the CDG.
     */
    protected _currentTargets: number[];

    /**
     * The method used to calculate the diversity of a network.
     */
    private _diversityMetric: DiversityMetric;

    /**
     * Checks whether the resource budget is consumed.
     */
    protected async isResourceBudgetConsumed(): Promise<boolean> {
        return this._archive.size === this._fitnessFunctions.size || await this._stoppingCondition.isFinished(this);
    }

    /**
     * Initializes required variables.
     */
    protected initialize(): void {
        this._iterations = 0;
        this._startTime = Date.now();
        this._fitnessFunctionMap = new Map(this._fitnessFunctions) as unknown as Map<number, StatementFitnessFunction>;
        StatisticsCollector.getInstance().iterationCount = 0;
    }

    /**
     * Initializes the population with newly generated networks.
     */
    protected async initPopulation(): Promise<void> {
        this._population = new NeatPopulation(this._chromosomeGenerator, this._neuroevolutionProperties);
        await this._population.generatePopulation();
        this.initCoverageObjectivesMap(this._population.networks);
    }

    /**
     * Compares the given chromosomes based on their fitness towards a coverage objective.
     * If both chromosomes achieve the same fitness, the diversity metric is used as a tie-breaker.
     * @param chromosome1 The first chromosome to be compared.
     * @param chromosome2 The second chromosome to be compared.
     * @param objective The coverage objective based on which the chromosomes will be compared.
     * @returns a positive value if the first chromosome is better,
     * a negative value if the second chromosome is better, and 0 if they are equal.
     */
    protected async compareChromosomes(chromosome1: NeatChromosome, chromosome2: NeatChromosome,
                                       objective: FitnessFunction<TestCase>): Promise<number> {
        const fitnessKey = this.mapObjectiveToKey(objective as StatementFitnessFunction);
        const fitness1 = await chromosome1.getFitness(objective, fitnessKey);
        const fitness2 = await chromosome2.getFitness(objective, fitnessKey);

        const compareValue = fitness1 - fitness2;
        if (compareValue != 0) {
            return compareValue;
        }
        return this.compareDiversity(chromosome1, chromosome2);
    }


    /**
     * Comparator for the diversity of two chromosomes.
     *
     * @param chromosome1 First chromosome
     * @param chromosome2 Second chromosome
     * @returns a positive value if the first chromosome is more diverse,
     * a negative value if the second chromosome is more diverse, and 0 if they are equally diverse.
     */
    protected compareDiversity(chromosome1: NeatChromosome, chromosome2: NeatChromosome): number {
        switch (this._diversityMetric) {
            case DiversityMetric.COMPAT_DISTANCE:
                return this._compareCompatibilityDiversity(chromosome1, chromosome2);
            case DiversityMetric.SPECIES_SIZE:
                return this._compareSpeciesDiversity(chromosome1, chromosome2);
            case DiversityMetric.NOVELTY:
                return this._compareNovelty(chromosome1, chromosome2);
        }
    }


    /**
     * Compares two chromosomes based on the average compatibility distance to their peers.
     * The chromosomes are compared by their average compatibility distance with respect to the current population.
     * Chromosomes with higher compatibility distances are more diverse than chromosomes with a lower distance value.
     *
     * @param chromosome1 First chromosome
     * @param chromosome2 Second chromosome
     */
    private _compareCompatibilityDiversity(chromosome1: NeatChromosome, chromosome2: NeatChromosome): number {
        return this._getAverageCompatDistance(chromosome1) - this._getAverageCompatDistance(chromosome2);
    }

    /**
     * Computes the average compatibility distance of the given chromosome against the current population.
     *
     * @param chromosome The chromosome for which the compatibility distance will be computed.
     * @returns the average compatibility distance of the supplied chromosome.
     */
    private _getAverageCompatDistance(chromosome: NeatChromosome): number {
        const sum = this._population.networks
            .reduce((acc, network) => acc + this._population.compatibilityDistance(network, chromosome), 0);
        return sum / this._population.networks.length;
    }

    /**
     * Compares two chromosomes based on the size of their species.
     * A chromosome is more diverse if its species hosts fewer individuals than the species of another chromosome.
     *
     * @param chromosome1 First chromosome
     * @param chromosome2 Second chromosome
     */
    private _compareSpeciesDiversity(chromosome1: NeatChromosome, chromosome2: NeatChromosome): number {
        const specie1 = this._population.getSpeciesOfNetwork(chromosome1);
        const specie2 = this._population.getSpeciesOfNetwork(chromosome2);
        return specie2.networks.length - specie1.networks.length;
    }

    /**
     * Compares two chromosomes based on their novelty score.
     * A chromosome is more diverse, the higher the novelty score.
     *
     * @param chromosome1 First chromosome
     * @param chromosome2 Second chromosome
     */
    private _compareNovelty(chromosome1: NeatChromosome, chromosome2: NeatChromosome): number {
        return chromosome1.noveltyScore - chromosome2.noveltyScore;
    }


    /**
     * Updates the currently optimized targets that are not covered and reachable in the CDG.
     */
    protected updateCurrentTargets(): void {
        this._currentTargets = [];
        const nearestTargets = this._getNearestObjectives();

        for (const stmt of nearestTargets) {
            const statementKey = this.mapObjectiveToKey(stmt);
            this._currentTargets.push(statementKey);
        }
    }

    /**
     * Executes the networks and calculates its fitness values on all open statement targets.
     *
     * @param networks the networks to evaluate.
     */
    protected override async evaluatePopulation(networks: NeatChromosome[]): Promise<void> {
        logger.debug(`Evaluate ${this._neuroevolutionProperties.populationSize} networks on ${this._currentTargets.length} targets...`);
        this.initCoverageObjectivesMap(networks);

        const timeout = this._neuroevolutionProperties.timeout;
        const eventSelection = this._neuroevolutionProperties.eventSelection;
        const classificationType = this._neuroevolutionProperties.classificationType;

        for (const network of networks) {
            await this._networkFitnessFunction.calculateFitness(network, timeout, eventSelection, classificationType);
            await this.updateArchive(network);
            this.updateCurrentTargets();

            // Stop if we depleted the search budget.
            if (await this.isResourceBudgetConsumed()) {
                return;
            }
        }

        logger.debug(`Number of current targets: ${this._currentTargets.length}`);
    }


    /**
     * Adds the given chromosomes to the population and applies speciation on them.
     *
     * @param population The population to add the chromosomes to.
     * @param chromosomes The chromosomes to add.
     */
    protected addToPopulation(population: NeatPopulation, chromosomes: NeatChromosome[]): NeatPopulation {
        for (const chromosome of chromosomes) {
            population.networks.push(chromosome);
            population.assignSpecies(chromosome);
        }
        return population;
    }

    /**
     * Replaces the networks of the global population with the given networks and updates the global population.
     *
     * @param chromosomes The networks to replace the global population with.
     */
    protected replaceGlobalPopulation(chromosomes: NeatChromosome[]): void {
        // Remove networks to be deleted from species.
        this._population.networks
            .filter(network => !chromosomes.includes(network))
            .forEach(network => this._population.removeNetworkFromSpecie(network));

        // Delete networks from the population
        this._population.networks = this._population.networks.filter(network => chromosomes.includes(network));

        // Add networks that are new to the population
        const newChromosomes = chromosomes.filter(chrom => !this._population.networks.includes(chrom));
        this.addToPopulation(this._population, newChromosomes);
    }


    /**
     * Prints statistics about the current iteration.
     */
    protected iterationSummary(): void {
        logger.debug(`Total Iteration: ${StatisticsCollector.getInstance().iterationCount}`);
        logger.debug(`Covered Statements: ${StatisticsCollector.getInstance().statementCoverage * 100}%`);
        logger.debug(`Covered Branches: ${StatisticsCollector.getInstance().branchCoverage * 100}%`);
        logger.debug(`Number of current fitness targets: ${this._currentTargets.length}`);
        for (const target of this._currentTargets) {
            logger.debug(`Current target: ${target} : ${this._fitnessFunctions.get(target)}`);
        }
        this._population.species.sort((a, b) => b.age - a.age);
        logger.debug(`Population of ${this._population.networks.length} distributed in ${this._population.species.length} species`);
        logger.debug("\tID\tage\tsize");
        for (const species of this._population.species) {
            logger.debug(`\t${species.uID}\t${species.age}\t${species.networks.length}`);
        }
        logger.debug(`Time passed in seconds: ${(Date.now() - this.getStartTime())}`);
        logger.debug("\n-----------------------------------------------------\n");
    }

    /**
     * Sets the required hyperparameter.
     * @param properties the user-defined hyperparameter.
     */
    public override setProperties(properties: SearchAlgorithmProperties<NeatChromosome>): void {
        super.setProperties(properties);
        this._diversityMetric = this._neuroevolutionProperties.diversityMetric;
    }

}

