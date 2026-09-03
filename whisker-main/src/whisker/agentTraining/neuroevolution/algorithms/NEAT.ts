import { ChromosomeGenerator } from '../../../search/ChromosomeGenerator';
import { SearchAlgorithmProperties } from "../../../search/SearchAlgorithmProperties";
import { SearchAlgorithmDefault } from "../../../search/algorithms/SearchAlgorithmDefault";
import { FitnessFunction } from "../../../search/FitnessFunction";
import { StatisticsCollector } from "../../../utils/StatisticsCollector";
import { NeatPopulation } from "../neuroevolutionPopulations/NeatPopulation";
import { NetworkFitnessFunction } from "../networkFitness/NetworkFitnessFunction";
import Arrays from "../../../utils/Arrays";
import { NeatChromosome } from "../networks/NeatChromosome";
import logger from '../../../../util/logger';
import { NeatParameter } from "../hyperparameter/NeatParameter";
import { Container } from "../../../utils/Container";

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
     * Caches, per generation, the topology snapshot of the best network found so far, so that a
     * previously reported generation can be re-served on request (see REQUEST_TOPOLOGY_GEN) without
     * recomputation.
     */
    protected _topologyHistory: Map<number, object> = new Map();

    /**
     * The currently registered listener for REQUEST_TOPOLOGY_GEN events, tracked so it can be removed
     * before a new one is attached, avoiding stacking duplicate listeners on Container.vm.
     */
    private static _topologyHistoryListener: ((data: { generation: number }) => void) | null = null;

    /**
     * Caches, per generation, the topology snapshot of every species' representative network, so that a
     * previously reported generation can be re-served on request (see REQUEST_SPECIES_TOPOLOGY_GEN)
     * without recomputation.
     */
    protected _speciesTopologyHistory: Map<number, object> = new Map();

    /**
     * The currently registered listener for REQUEST_SPECIES_TOPOLOGY_GEN events, tracked so it can be
     * removed before a new one is attached, avoiding stacking duplicate listeners on Container.vm.
     */
    private static _speciesTopologyHistoryListener: ((data: { generation: number }) => void) | null = null;

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
        this._initTopologyHistory();
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
        this._emitNetworkTopology();
        this._emitCoverageUpdate();

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
        this._emitSpeciesTopologies(population);
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


    // Methods for reporting data to the UI

    /**
     * Generation number used to tag a topology/fitness snapshot. Overridden by ManyObjectiveNeatest, whose
     * shared population advances by generation rather than by search iteration.
     */
    protected _getTopologyGeneration(): number {
        return this._iterations;
    }

    /**
     * Sets up the generation-history feature for the topology/species charts: as the search progresses,
     * every snapshot gets cached in _topologyHistory/_speciesTopologyHistory (keyed by generation) so the
     * UI can later ask to see any past generation again, not just the latest one. That "asking" happens
     * over the shared Container.vm event bus: the UI emits REQUEST_TOPOLOGY_GEN/REQUEST_SPECIES_TOPOLOGY_GEN
     * with a generation number, the listeners registered below look it up in the cache, and reply with
     * NETWORK_TOPOLOGY_HISTORY/SPECIES_NETWORK_TOPOLOGY_HISTORY. Since findSolution() can run repeatedly
     * within one page session, old listeners are removed first so they don't stack up across runs.
     */
    protected _initTopologyHistory(): void {
        this._topologyHistory = new Map();
        this._speciesTopologyHistory = new Map();
        if (!Container.vm) return;

        if (NEAT._topologyHistoryListener) {
            Container.vm.removeListener('REQUEST_TOPOLOGY_GEN', NEAT._topologyHistoryListener);
        }
        NEAT._topologyHistoryListener = (data: { generation: number }) => this._onRequestTopologyGen(data);
        Container.vm.on('REQUEST_TOPOLOGY_GEN', NEAT._topologyHistoryListener);

        if (NEAT._speciesTopologyHistoryListener) {
            Container.vm.removeListener('REQUEST_SPECIES_TOPOLOGY_GEN', NEAT._speciesTopologyHistoryListener);
        }
        NEAT._speciesTopologyHistoryListener = (data: { generation: number }) => this._onRequestSpeciesTopologyGen(data);
        Container.vm.on('REQUEST_SPECIES_TOPOLOGY_GEN', NEAT._speciesTopologyHistoryListener);
    }

    /**
     * Answers a UI request for a past generation's network topology from the cache built up by
     * _emitNetworkTopology(); does nothing if that generation was never recorded.
     */
    private _onRequestTopologyGen(data: { generation: number }): void {
        const snapshot = this._topologyHistory.get(data.generation);
        if (snapshot) {
            Container.vm.emit('NETWORK_TOPOLOGY_HISTORY', snapshot);
        }
    }

    /**
     * Answers a UI request for a past generation's species topologies from the cache built up by
     * _emitSpeciesTopologies(); does nothing if that generation was never recorded.
     */
    private _onRequestSpeciesTopologyGen(data: { generation: number }): void {
        const snapshot = this._speciesTopologyHistory.get(data.generation);
        if (snapshot) {
            Container.vm.emit('SPECIES_NETWORK_TOPOLOGY_HISTORY', snapshot);
        }
    }

    /**
     * Reports the current best network's topology to the UI.
     * Overridden by Neatest (best network of the population it is currently evolving towards its one
     * target objective), ManyObjectiveNeatest (a frontier entry per target in its set of currently active
     * targets), and MioNeatest (only the single target it is currently mutating towards).
     */
    protected _emitNetworkTopology(): void {
        if (!Container.vm) return;
        // NEAT stores the overall best at _fitnessFunctions.size+1; Neatest only stores per-objective networks.
        let best = this._archive.get(this._fitnessFunctions.size + 1);
        if (!best) {
            for (const chr of this._archive.values()) {
                if (!best || chr.fitness > best.fitness) best = chr;
            }
        }
        if (!best) return;
        const nodes = best.getAllNodes().map(n => n.toJSON());
        const connections = best.connections
            .filter(c => c.isEnabled)
            .map(c => ({ source: c.source.uID, target: c.target.uID, weight: Number(c.weight.toFixed(4)) }));
        const gen = this._getTopologyGeneration();
        const snapshot = { generation: gen, nodes, connections };
        this._topologyHistory.set(gen, snapshot);
        Container.vm.emit('NETWORK_TOPOLOGY', snapshot);
    }

    /**
     * Reports the network that just covered a target's final topology, so the UI has one to show once that
     * target drops out of the "currently active" set above. Overridden by ManyObjectiveNeatest to also emit
     * a synthetic FITNESS_UPDATE data point for a target that is covered before its first regular per-round
     * update, which would otherwise leave that target's fitness-chart history empty.
     */
    protected _emitCoveredNetworkTopology(key: number, network: NeatChromosome): void {
        const label = this._fitnessFunctions.get(key)?.toString() ?? `Objective ${key}`;
        const nodes = network.getAllNodes().map(n => n.toJSON());
        const connections = network.connections
            .filter(c => c.isEnabled)
            .map(c => ({ source: c.source.uID, target: c.target.uID, weight: Number(c.weight.toFixed(4)) }));
        Container.vm.emit('NETWORK_TOPOLOGY_COVERED', { objectiveKey: key, label, nodes, connections });
    }

    /**
     * Reports the species breakdown at the moment a target's objective was covered, so the UI has one to
     * show once that target moves from "currently active" to "covered".
     */
    protected _emitCoveredSpeciesTopology(key: number, population: NeatPopulation, coveringNetwork: NeatChromosome): void {
        const label = this._fitnessFunctions.get(key)?.toString() ?? `Objective ${key}`;
        let bestSpeciesId: number | null = null;
        let species = population.species
            .map(s => {
                const isCoveringSpecies = s.networks.includes(coveringNetwork);
                if (isCoveringSpecies) bestSpeciesId = s.uID;
                const best = isCoveringSpecies
                    ? coveringNetwork
                    : (s.champion ?? s.networks.reduce((a, b) => b.fitness > a.fitness ? b : a, s.networks[0]));
                if (!best) return null;
                return {
                    speciesId: s.uID,
                    memberCount: s.networks.length,
                    averageFitness: Number(s.averageFitness.toFixed(4)),
                    nodes: best.getAllNodes().map(n => n.toJSON()),
                    connections: best.connections
                        .filter(c => c.isEnabled)
                        .map(c => ({ source: c.source.uID, target: c.target.uID, weight: Number(c.weight.toFixed(4)) }))
                };
            })
            .filter(s => s !== null);
        if (species.length === 0) {
            bestSpeciesId = 0;
            species = [{
                speciesId: 0,
                memberCount: 1,
                averageFitness: Number(coveringNetwork.fitness.toFixed(4)),
                nodes: coveringNetwork.getAllNodes().map(n => n.toJSON()),
                connections: coveringNetwork.connections
                    .filter(c => c.isEnabled)
                    .map(c => ({ source: c.source.uID, target: c.target.uID, weight: Number(c.weight.toFixed(4)) }))
            }];
        }
        Container.vm.emit('SPECIES_NETWORK_TOPOLOGY_COVERED', { objectiveKey: key, label, species, bestSpeciesId });
    }
    /**
     * Reports a single best/average fitness value to the UI for the fitness-over-time chart. Overridden by
     * ManyObjectiveNeatest to report a value per currently active target instead of just one, and by
     * MioNeatest to report only the single target it is currently mutating towards.
     */
    protected override _emitFitnessUpdate(best: number, average?: number, label?: string): void {
        const data: { generation: number; best: number; average?: number; label?: string } = {
            generation: this._getTopologyGeneration(),
            best: Number(best.toFixed(4))
        };
        if (average !== undefined) data.average = Number(average.toFixed(4));
        if (label !== undefined) data.label = label;
        Container.vm.emit('FITNESS_UPDATE', data);
    }

    /**
     * Reports every species' representative network topology to the UI. Overridden by ManyObjectiveNeatest
     * to also include a species breakdown per target in its set of currently active targets, and by
     * MioNeatest to pick each species' representative by the single target it is currently mutating
     * towards instead of by overall fitness.
     */
    protected _emitSpeciesTopologies(population: NeatPopulation): void {
        if (!Container.vm || population.networks.length === 0) return;
        const champion = population.networks.reduce((a, b) => b.fitness > a.fitness ? b : a, population.networks[0]);
        let bestSpeciesId: number | null = null;
        const species = population.species
            .map(s => {
                const best = s.champion ?? s.networks.reduce((a, b) => b.fitness > a.fitness ? b : a, s.networks[0]);
                if (!best) return null;
                if (champion && s.networks.includes(champion)) bestSpeciesId = s.uID;
                return {
                    speciesId: s.uID,
                    memberCount: s.networks.length,
                    averageFitness: Number(s.averageFitness.toFixed(4)),
                    nodes: best.getAllNodes().map(n => n.toJSON()),
                    connections: best.connections
                        .filter(c => c.isEnabled)
                        .map(c => ({ source: c.source.uID, target: c.target.uID, weight: Number(c.weight.toFixed(4)) }))
                };
            })
            .filter(s => s !== null);
        if (species.length === 0) return;
        const gen = this._getTopologyGeneration();
        const snapshot = { generation: gen, species, bestSpeciesId };
        this._speciesTopologyHistory.set(gen, snapshot);
        Container.vm.emit('SPECIES_NETWORK_TOPOLOGY', snapshot);
    }
}
