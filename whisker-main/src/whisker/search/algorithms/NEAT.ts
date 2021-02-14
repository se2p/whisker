import {Chromosome} from '../Chromosome';
import {List} from '../../utils/List';
import {SearchAlgorithmProperties} from '../SearchAlgorithmProperties';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {FitnessFunction} from "../FitnessFunction";
import {StoppingCondition} from "../StoppingCondition";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {Selection} from "../Selection";
import {NeatChromosome} from "../../NEAT/NeatChromosome";
import {ConnectionGene} from "../../NEAT/ConnectionGene";
import {NeatConfig} from "../../NEAT/NeatConfig";
import {Species} from "../../NEAT/Species";


export class NEAT<C extends NeatChromosome> extends SearchAlgorithmDefault<Chromosome> {
    private _chromosomeGenerator: ChromosomeGenerator<C>;

    private _properties: SearchAlgorithmProperties<C>;

    private _fitnessFunctions: Map<number, FitnessFunction<C>>;

    private _stoppingCondition: StoppingCondition<C>;

    private _iterations = 0;

    private _bestIndividuals = new List<C>();

    private _archive = new Map<number, C>();

    private _selectionOperator: Selection<C>;

    private _startTime: number;

    private _fullCoverageReached = false;

    private speciesList = new List<Species<C>>()

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
    }

    setFitnessFunctions(fitnessFunctions: Map<number, FitnessFunction<C>>): void {
        this._fitnessFunctions = fitnessFunctions;
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessFunctions.size;
    }

    setSelectionOperator(selectionOperator: Selection<C>): void {
        this._selectionOperator = selectionOperator;
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

    /**
     * Returns a list of solutions for the given problem.
     *
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<List<C>> {
        this._bestIndividuals.clear();
        this._iterations = 0;
        this._startTime = Date.now();
        const parentPopulation = this.generatePopulation();
        for (const chromosome of parentPopulation)
            this.addToSpecies(chromosome);

        //const spriteInfos = ScratchEventExtractor.extractSpriteInfo(Container.vmWrapper.vm)
        return this._bestIndividuals;
    }

    private generatePopulation(): List<C> {
        const population = new List<C>()
        while (population.size() < this._properties.getPopulationSize())
            population.add(this._chromosomeGenerator.get())
        return population;
    }

    // TODO: pulbic only for testing
    public compatibilityDistance(chromosome1: C, chromosome2: C): number {
        let matching = 0;
        let disjoint = 0;
        let excess = 0;
        let weight = 0;
        let distance = 0;
        let lowestMaxInnovation = 0;

        // Save first connections in a Map <InnovationNumber, Connection>
        const genome1Innovations = new Map<number, ConnectionGene>()
        for (const connection of chromosome1.connections) {
            genome1Innovations.set(connection.innovationNumber, connection)
        }

        // Save second connections in a Map <InnovationNumber, Connection>
        const genome2Innovations = new Map<number, ConnectionGene>()
        for (const connection of chromosome2.connections) {
            genome2Innovations.set(connection.innovationNumber, connection)
        }

        // Get the highest innovation Number of the genome with the least gene innovationNumber
        // Later used to decide between excess and disjoint genes
        if (genome1Innovations.size === 0 || genome2Innovations.size === 0)
            lowestMaxInnovation = 0;
        else {
            const genome1Highest = Array.from(genome1Innovations.keys()).pop()
            const genome2Highest = Array.from(genome2Innovations.keys()).pop()
            lowestMaxInnovation = Math.min(genome1Highest, genome2Highest)
        }

        // Save in a set to remove duplicates
        let allInnovations = new Set<number>(genome1Innovations.keys());
        genome2Innovations.forEach((value, key) => allInnovations.add(key))
        allInnovations = new Set([...allInnovations].sort());

        for (const innovation of allInnovations) {
            // If both share the connection then increasing matching and sum the weight difference
            if (genome1Innovations.has(innovation) && genome2Innovations.has(innovation)) {
                matching++;
                weight += Math.abs(genome1Innovations.get(innovation).weight - genome2Innovations.get(innovation).weight)
            }
                // If the innovationNumber is lower then the lowestMaxInnovation
            // its a disjoint connection otherwise its an excess connection
            else {
                innovation < lowestMaxInnovation ? disjoint++ : excess++;
            }
        }

        // get number of genes in the bigger Genome for normalization
        const N = Math.max(chromosome1.connections.size(), chromosome2.connections.size())

        if (N > 0)
            distance = (excess * NeatConfig.EXCESS_COEFFICIENT + disjoint * NeatConfig.DISJOINT_COEFFICIENT) / N +
                ((weight / matching) * NeatConfig.WEIGHT_COEFFICIENT);
        return distance;
    }

    public isSameSpecies(chromosome1: C, chromosome2: C): boolean {
        return this.compatibilityDistance(chromosome1, chromosome2) < NeatConfig.DISTANCE_THRESHOLD;
    }

    public addToSpecies(chromosome: C): void {
        for (const species of this.speciesList) {
            if (species.chromosomes.size() === 0)
                continue;
            // Get the representative of the species
            const representative = species.chromosomes.get(0);
            if (this.isSameSpecies(representative, chromosome)) {
                species.chromosomes.add(chromosome);
                return;
            }
        }
        const newSpecies = new Species(chromosome);
        this.speciesList.add(newSpecies);
    }

    getStartTime(): number {
        return this._startTime;
    }
}
