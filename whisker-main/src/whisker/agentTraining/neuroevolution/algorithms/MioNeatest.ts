import {NeatChromosome} from "../networks/NeatChromosome";
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import {ManyObjectiveNeatest} from "./ManyObjectiveNeatest";
import {NeatPopulation} from "../neuroevolutionPopulations/NeatPopulation";
import {NeatMutation} from "../operators/NeatMutation";
import {SearchAlgorithmProperties} from "../../../search/SearchAlgorithmProperties";
import {MioNeatestParameter} from "../hyperparameter/MioNeatestParameter";
import logger from "../../../../util/logger";
import Arrays from "../../../utils/Arrays";

/**
 * Enhances Neatest with the MIO algorithm.
 */
export class MioNeatest extends ManyObjectiveNeatest {

    /**
     * The search parameters.
     */
    protected override _neuroevolutionProperties: MioNeatestParameter;

    /**
     * Maps the keys of uncovered statements to the chromosomes closest to covering them.
     */
    private _archiveUncovered: Map<number, NeatChromosome[]>;

    /**
     * The maximum size of a fitness function's archive population.
     */
    private _maxArchiveSize: number;

    /**
     * Maps the fitness function keys to a counter determining how often the fitnessFunction has been selected for a
     * mutation/randomSampling round.
     * When selecting a fitness function for the next mutation/randomSampling round,
     * we always choose the FitnessFunction with the lowest samplingCounter value.
     */
    private _samplingCounter: Map<number, number>;

    /**
     * The currently chosen target.
     */
    private _currentTarget: number;

    /**
     * The NeatMutation operator used for mutation.
     */
    private _mutationOperator: NeatMutation;

    /**
     * Defines the number of mutations applied to a given Chromosome within one round of mutation during search.
     */
    private _maxMutationCount: number;

    /**
     * The probability for applying one structural mutation.
     */
    private _structMutationProb: number;

    /**
     * Defines the probability of sampling a new Chromosome instead of mutating an existing one during search.
     */
    private _randomSelectionProbability: number;

    // ----------------- Focus Phase Params -------------------

    /**
     * The percentage of time after which MIO's focus phase starts.
     */
    private _focusedPhaseStart: number;

    /**
     * The maximum size of a fitness function's archive population after the focused phase has begun.
     */
    private _maxArchiveSizeFocusedPhase: number;

    /**
     * after the focused phase has begun.
     */
    private _maxMutationCountFocusedPhase: number;

    /**
     * Defines the probability of sampling a new Chromosome instead of mutating an existing one during search
     * after the focused phase has begun.
     */
    private _randomSelectionProbabilityFocusedPhase: number;


    override async findSolution(): Promise<Map<number, NeatChromosome>> {
        this.initialize();
        this._population = new NeatPopulation(this._chromosomeGenerator, this._neuroevolutionProperties);
        this.updateCurrentTargets();
        this._initCounter();

        while (!await this.isResourceBudgetConsumed()) {
            const selectedChromosomes = this._checkGenerateRandom() ?
                [await this._generateChromosome()] : this._sampleFromArchive();

            for (const chromosome of selectedChromosomes) {
                if (this._archive.has(this._currentTarget) || await this.isResourceBudgetConsumed()) {
                    break;
                }
                const structMutation = this._random.nextDouble() < this._structMutationProb;
                let parent = chromosome;

                if (structMutation) {
                    [parent] = this._mutationOperator.mutateStructureDefault(chromosome.cloneStructure(true));
                    await this._evaluateChromosome(parent);
                }

                const maxWeightMutations = structMutation ? this._maxMutationCount - 1 : this._maxMutationCount;
                await this._weightMutation(maxWeightMutations, parent);
            }

            // Update algorithm parameter.
            if (!this._isFocusedPhaseReached()) {
                await this._updateParameters();
            }

            // Population Management.
            this._population.removeEmptySpecies();

            // Statistics.
            this.updateBestIndividualAndStatistics();
            this._iterations++;

            // MIO has no explicit generations. We model a generation after about 50 mutation rounds.
            if (StatisticsCollector.getInstance().iterationCount % 50 === 0) {
                this._population.generation++;
                this._population.updateCompatibilityThreshold();
                this._population.species.forEach(specie => specie.age++);
                this.iterationSummary();
                await this._fitnessReport();
            }
        }
        return this._archive;
    }

    /**
     * Mutates the weights of the given parent chromosome and evaluates the mutated chromosome until the maximum number
     * of weight mutations is reached, the resource budget is consumed, or the current target is covered.
     * We start with mutating the weights of the parent chromosome and evaluate the mutated chromosome.
     * If the mutated chromosome is better than the parent, we continue mutating the weights of the mutated chromosome,
     * otherwise we keep mutating the weights of the parent chromosome.
     * @param maxWeightMutations The maximum number of weight mutations to apply.
     * @param parent The initial parent chromosome to be mutated.
     */
    private async _weightMutation(maxWeightMutations: number, parent: NeatChromosome) {
        for (let weightMutationCount = 0; weightMutationCount < maxWeightMutations; weightMutationCount++) {
            if (await this.isResourceBudgetConsumed() || this._archive.has(this._currentTarget)) {
                break;
            }
            const [mutatedChromosome] = this._mutationOperator.mutateWeightsAndConnectionsDefault(parent.cloneStructure(true), parent);
            await this._evaluateChromosome(mutatedChromosome);
            const compareChromosomes = await this.compareChromosomes(
                mutatedChromosome, parent, this._fitnessFunctions.get(this._currentTarget));
            parent = compareChromosomes >= 0 ? mutatedChromosome : parent;
        }
    }

    override initialize(): void {
        super.initialize();
        this._archive = new Map<number, NeatChromosome>();
        this._archiveUncovered = new Map<number, []>();
        this._samplingCounter = new Map<number, number>();
    }


    /**
     * Sets all unreachable statements to infinity and all reachable statements to zero.
     */
    private _initCounter(): void {
        for (const funcKey of this._fitnessFunctions.keys()) {
            this._samplingCounter.set(funcKey, Number.MAX_VALUE);
        }
        for (const target of this._currentTargets) {
            this._samplingCounter.set(target, 0);
        }
    }


    /**
     * Checks whether we should generate a new network or sample from the archive.
     * @returns true if we generate a new chromosome, false otherwise.
     */
    private _checkGenerateRandom(): boolean {
        return this._archiveUncovered.size === 0 || this._maxMutationCount === 0
            || this._random.nextDouble() < this._randomSelectionProbability;
    }

    /**
     * Determines if the focused phase is reached.
     *
     * @returns True if the focused phase is reached, false otherwise.
     */
    private _isFocusedPhaseReached(): boolean {
        return this._randomSelectionProbability == this._randomSelectionProbabilityFocusedPhase
            && this._maxArchiveSize == this._maxArchiveSizeFocusedPhase
            && this._maxMutationCount == this._maxMutationCountFocusedPhase;
    }


    /**
     * Updates the probability for the random selection, the maximum size of the archive population
     * and the maximum number of mutations of the same chromosome according to the overall progress
     * of the search and the start of the focused phase.
     */
    private async _updateParameters(): Promise<void> {
        const overallProgress = await this._stoppingCondition.getProgress(this);
        const progressUntilFocusedPhaseReached = overallProgress / this._focusedPhaseStart;
        const previousMaxArchiveSize = this._maxArchiveSize;

        if (progressUntilFocusedPhaseReached >= 1) {
            this._randomSelectionProbability = this._randomSelectionProbabilityFocusedPhase;
            this._maxArchiveSize = this._maxArchiveSizeFocusedPhase;
            this._maxMutationCount = this._maxMutationCountFocusedPhase;
        } else {
            this._randomSelectionProbability = this._randomSelectionProbability
                + (this._randomSelectionProbabilityFocusedPhase - this._randomSelectionProbability)
                * progressUntilFocusedPhaseReached;
            this._maxArchiveSize = Math.round(this._maxArchiveSize
                + (this._maxArchiveSizeFocusedPhase - this._maxArchiveSize)
                * progressUntilFocusedPhaseReached);
            this._maxMutationCount = Math.round(this._maxMutationCount
                + (this._maxMutationCountFocusedPhase - this._maxMutationCount)
                * progressUntilFocusedPhaseReached);
        }

        // Remove excess chromosomes from the archive if the maximum archive size has been reduced.
        if (previousMaxArchiveSize > this._maxArchiveSize) {
            for (const fitnessFunctionKey of this._archiveUncovered.keys()) {
                const archiveChromosomes = this._archiveUncovered.get(fitnessFunctionKey);
                if (archiveChromosomes.length > this._maxArchiveSize) {
                    archiveChromosomes.sort((a, b) => a.coverageObjectives.get(fitnessFunctionKey) - b.coverageObjectives.get(fitnessFunctionKey));
                    archiveChromosomes.splice(0, (archiveChromosomes.length - this._maxArchiveSize - 1));
                }
            }
        }
    }

    /**
     * Evaluates the given chromosome and updates the archive according to the MIO scheme.
     *
     * @param network The network to evaluate.
     */
    private async _evaluateChromosome(network: NeatChromosome): Promise<void> {
        this.initCoverageObjectivesMap([network]);
        await this._networkFitnessFunction.calculateFitness(network, this._neuroevolutionProperties.timeout,
            this._neuroevolutionProperties.eventSelection, this._neuroevolutionProperties.classificationType);
        await this._archiveUpdate(network);
    }

    /**
     * Generates a new chromosome and picks a random current target.
     *
     * @return A newly generated network.
     */
    private async _generateChromosome(): Promise<NeatChromosome> {
        const generatedChromosome = await this._chromosomeGenerator.get();
        await this._evaluateChromosome(generatedChromosome);
        this._currentTarget = this._random.pick(this._currentTargets);
        return generatedChromosome;
    }

    /**
     * Samples a network from every species of the archive population with the lowest sampling counter, and
     * sets the current target to the target with the lowest counter.
     *
     * @return A list of sampled networks from the archive.
     */
    private _sampleFromArchive(): NeatChromosome[] {
        // Set the current target and increase sampling counter.
        this._setCurrentTargetFromCounter();
        this._samplingCounter.set(this._currentTarget, this._samplingCounter.get(this._currentTarget) + 1);

        // Draw one chromosome from every species
        return this._population.species.map(species => this._random.pick(species.networks));
    }

    /**
     * Sets the current target to the target with the lowest counter.
     * If there are multiple targets with the same lowest counter, the target is drawn randomly.
     */
    private _setCurrentTargetFromCounter(): void {
        // Find target key(s) with the lowest counter
        let lowestCounters: number[] = [];
        let lowestCounter = Number.MAX_VALUE;

        for (const targetKey of this._archiveUncovered.keys()) {
            const targetCounter = this._samplingCounter.get(targetKey);
            if (targetCounter < lowestCounter) {    // New lowest found, reset the list
                lowestCounters = [targetKey];
                lowestCounter = targetCounter;
            } else if (targetCounter === lowestCounter) {   // Same lowest, add to the list
                lowestCounters.push(targetKey);
            }
        }
        this._currentTarget = this._random.pick(lowestCounters);
    }

    /**
     * Updates the archive according to the MIO scheme.
     * @param candidate The chromosome to update the archive with.
     */
    private async _archiveUpdate(candidate: NeatChromosome): Promise<void> {
        const currentTargetsTmp: number[] = Object.assign([], this._currentTargets);

        // Replace the global population with all chromosomes that are distributed across the archives.
        const chromosomes = [...this._archiveUncovered.values()].flat(1);
        this.replaceGlobalPopulation(Arrays.distinctByComparator(chromosomes, (v1, v2) => v1.uID === v2.uID));

        let coveredNewObjective = false;
        for (const selectedTarget of this._currentTargets) {
            const fitnessFunction = this._fitnessFunctions.get(selectedTarget);
            if (this.coveredNewObjective(selectedTarget, candidate)) {
                logger.debug(`Covered Statement ${selectedTarget}: ${fitnessFunction}`);
                coveredNewObjective = true;
                this._archive.set(selectedTarget, candidate);
                this._archiveUncovered.delete(selectedTarget);
                this._samplingCounter.delete(selectedTarget);
                this.updateBestIndividualAndStatistics();
                continue;
            }

            let currentArchiveChromosomes: NeatChromosome[] = [];
            if (this._archiveUncovered.has(selectedTarget) && !this._archive.has(selectedTarget)) {
                currentArchiveChromosomes = this._archiveUncovered.get(selectedTarget);
            }

            if (currentArchiveChromosomes.length < this._maxArchiveSize) {
                // Not covered and maximal population size not reached → add
                this._addToPopulationIfNotPresent(candidate);
                currentArchiveChromosomes.push(candidate);
                this._samplingCounter.set(selectedTarget, 0);
            } else {
                // Not covered, and the population is full → replace if better than worst.

                currentArchiveChromosomes.sort((a, b) => a.coverageObjectives.get(selectedTarget) - b.coverageObjectives.get(selectedTarget));
                const worstIndividual = currentArchiveChromosomes[0];
                const compareChromosomes = await this.compareChromosomes(candidate, worstIndividual, fitnessFunction);

                // Check if the candidate performs at least as good as the worst individual of the current archive.
                if (compareChromosomes >= 0) {
                    // Remove the worst network
                    Arrays.remove(currentArchiveChromosomes, worstIndividual);
                    Arrays.remove(this._population.networks, worstIndividual);
                    this._population.removeNetworkFromSpecie(worstIndividual);

                    // Add current network and reset sampling counter due to improvement.
                    this._addToPopulationIfNotPresent(candidate);
                    currentArchiveChromosomes.push(candidate);
                    this._samplingCounter.set(selectedTarget, 0);
                }
            }

            // Update archive.
            if (currentArchiveChromosomes.length > 0) {
                this._archiveUncovered.set(selectedTarget, currentArchiveChromosomes);
            }
        }

        if (coveredNewObjective) {
            await this.minimizeArchive(candidate);
        }

        this.updateCurrentTargets();

        // Set sampling counter of new objectives to 0.
        for (const child of this._currentTargets.filter((key) => !currentTargetsTmp.includes(key))) {
            this._samplingCounter.set(child, 0);
        }
    }

    /**
     * Adds the given chromosome to the population if it's not already present.
     * @param chromosome The chromosome to add.
     */
    private _addToPopulationIfNotPresent(chromosome: NeatChromosome) {
        if (!this._population.networks.includes(chromosome)) {
            this.addToPopulation(this._population, [chromosome]);
        }
    }

    /**
     * Reports the fitness value of the best chromosome in the archive for each uncovered target.
     */
    private async _fitnessReport(): Promise<void> {
        super.iterationSummary();
        for (const target of this._currentTargets) {
            const archive = this._archiveUncovered.get(target);
            if (!archive) {
                continue;
            }
            const fitness = this._fitnessFunctions.get(target);
            const bestChromosome = archive[archive.length - 1];
            logger.debug(`Best fitness for target ${target}:${fitness}: ${await bestChromosome.getFitness(fitness, target)}`);
        }
    }

    /**
     * Sets the required hyperparameter.
     * @param properties the user-defined hyperparameter.
     */
    override setProperties(properties: SearchAlgorithmProperties<NeatChromosome>): void {
        super.setProperties(properties);
        this._mutationOperator = this._neuroevolutionProperties.mutationOperator;
        this._maxArchiveSize = this._neuroevolutionProperties.maxArchiveSize;
        this._maxMutationCount = this._neuroevolutionProperties.maxMutationCount;
        this._structMutationProb = this._neuroevolutionProperties.structMutationProb;
        this._randomSelectionProbability = this._neuroevolutionProperties.randomSelectionProbability;
        this._focusedPhaseStart = this._neuroevolutionProperties.focusedPhaseStart;
        this._maxArchiveSizeFocusedPhase = this._neuroevolutionProperties.maxArchiveSizeFocusedPhase;
        this._maxMutationCountFocusedPhase = this._neuroevolutionProperties.maxMutationCountFocusedPhase;
        this._randomSelectionProbabilityFocusedPhase = this._neuroevolutionProperties.randomSelectionProbabilityFocusedPhase;
    }

}
