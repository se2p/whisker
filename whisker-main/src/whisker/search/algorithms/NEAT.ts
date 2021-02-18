import {List} from '../../utils/List';
import {ChromosomeGenerator} from '../ChromosomeGenerator';
import {NeatChromosome} from "../../NEAT/NeatChromosome";
import {ConnectionGene} from "../../NEAT/ConnectionGene";
import {Species} from "../../NEAT/Species";
import {SearchAlgorithmProperties} from "../SearchAlgorithmProperties";
import {StoppingCondition} from "../StoppingCondition";
import {NeatConfig} from "../../NEAT/NeatConfig";
import {SearchAlgorithmDefault} from "./SearchAlgorithmDefault";
import {FitnessFunction} from "../FitnessFunction";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {Selection} from "../Selection";
import {NeuroevolutionExecutor} from "../../NEAT/NeuroevolutionExecutor";
import {Container} from "../../utils/Container";


export class NEAT<C extends NeatChromosome> extends SearchAlgorithmDefault<NeatChromosome> {
    private _chromosomeGenerator: ChromosomeGenerator<C>;

    private _properties: SearchAlgorithmProperties<C>;

    private _fitnessFunctions: List<FitnessFunction<C>>;

    private _fitnessFunction: FitnessFunction<C>;

    private _stoppingCondition: StoppingCondition<C>;

    private _iterations = 0;

    private _bestIndividuals = new List<C>();

    private _archive = new Map<number, C>();

    private _selectionOperator: Selection<C>;

    private _startTime: number;

    private _fullCoverageReached = false;

    private _topChromosome: C;

    private _topFitness: number;

    private speciesList = new List<Species<C>>()

    setChromosomeGenerator(generator: ChromosomeGenerator<C>): void {
        this._chromosomeGenerator = generator;
    }

    setProperties(properties: SearchAlgorithmProperties<C>): void {
        this._properties = properties;
        this._stoppingCondition = this._properties.getStoppingCondition();
    }

    setFitnessFunction(fitnessFunction: FitnessFunction<NeatChromosome>) {
        StatisticsCollector.getInstance().fitnessFunctionCount = 1;
        this._fitnessFunction = fitnessFunction;
        this._fitnessFunctions = new List<FitnessFunction<C>>();
        this._fitnessFunctions.add(fitnessFunction);
    }

    getNumberOfIterations(): number {
        return this._iterations;
    }

    getCurrentSolution(): List<C> {
        return this._bestIndividuals;
    }

    async evaluatePopulation(population: List<C>): Promise<void> {
        for (const chromosome of population) {
            await this.evaluate(chromosome);
        }
    }

    async evaluate(chromosome: NeatChromosome): Promise<void> {
        const executor = new NeuroevolutionExecutor(Container.vmWrapper);
        await executor.execute(chromosome);
    }

    /**
     * Returns a list of solutions for the given problem.
     *
     * @returns Solution for the given problem
     */
    async findSolution(): Promise<List<C>> {
        this._iterations = 0;
        this._startTime = Date.now();
        let population = this.generatePopulation();

        while (!this._stoppingCondition.isFinished(this)) {
            console.log("Iteration: " + this._iterations + " Best Fitness: " + this._topFitness)
            await this.evaluatePopulation(population);
            this.calculateFitness(population);
            population = this.breedNewGeneration(population);
            console.log(population)
            this._iterations++;
        }

        this._bestIndividuals.add(this._topChromosome);
        return this._bestIndividuals;
    }

    private generatePopulation(): List<C> {
        const population = new List<C>()
        while (population.size() < this._properties.getPopulationSize())
            population.add(this._chromosomeGenerator.get())
        return population;
    }

    private calculateFitness(population: List<C>): void {
        for (const chromosome of population) {
            chromosome.fitness = this._fitnessFunction.getFitness(chromosome);
        }
    }

    private breedNewGeneration(population:List<C>): List<C> {

        // divide population into species
        this.dividePopulationIntoSpecies(population)

        const nextGeneration = new List<C>()        // Save next Generation
        const speciesRepresentatives = new List<Species<C>>()       // Save representatives of each species

        // Remove the weak Chromosomes in each Species
        this.killWeakChromosomesInSpecies();

        // Calculate the total AdjustedFitness Value of the Population used for determining how much Chromosomes in each
        // species are used for reproduction
        const adjustedFitnessPopulation = this.calculateAdjustedPopulation();
        for (const species of this.speciesList) {

            // Pick random representative for this species
            const representative = species.chromosomes.get(Math.floor(Math.random() * species.chromosomes.size()));
            speciesRepresentatives.add(new Species<C>(representative));

            // Calculate the number of Children to pick from this species
            let numberChildren = Math.floor(this._properties.getPopulationSize() * (species.getAdjustedFitnessTotal() / adjustedFitnessPopulation))

            // Elitism
            const elites = species.getElites(NeatConfig.ELITE_RATE);
            nextGeneration.addList(elites)
            numberChildren -= elites.size();

            // Children from mutation without Crossover
            numberChildren *= NeatConfig.MUTATION_WITHOUT_CROSSOVER
            for (let i = 0; i < numberChildren; i++) {
                nextGeneration.add(species.breedChildMutationOnly())
            }

            // Children from Crossover and Mutation
            numberChildren *= NeatConfig.MUTATION_WITHOUT_CROSSOVER - 1;
            for (let i = 0; i < numberChildren; i++) {
                nextGeneration.add(species.breedChildCrossoverAndMutation())
            }
        }

        // Set Species for next Generation
        this.speciesList = speciesRepresentatives;
        return nextGeneration;
    }

    private killWeakChromosomesInSpecies() {
        for (const species of this.speciesList)
            species.removeWeakChromosomes(NeatConfig.CHROMOSOME_IN_SPECIES_EXTINCTION)
    }

    private calculateAdjustedPopulation(): number {
        let totalFitness = 0;
        for (const species of this.speciesList) {
            totalFitness += species.getAdjustedFitnessTotal();
        }
        return totalFitness;
    }

    // TODO: pulbic only for testing
    /**
     * Calculates the compatibility distance between two chromosomes; used for speciating
     * @param chromosome1 the first chromosome
     * @param chromosome2 the second chromosome
     * @return the compatibility distance of both chromosomes
     */
    public compatibilityDistance(chromosome1: C, chromosome2: C): number {
        let matching = 0;
        let disjoint = 0;
        let excess = 0;
        let weight = 0;
        let distance = 0;
        let lowestMaxInnovation;

        // Save first connections in a Map <InnovationNumber, Connection>
        const genome1Innovations = new Map<number, ConnectionGene>()
        for (const connection of chromosome1.connections) {
            genome1Innovations.set(connection.innovation, connection)
        }

        // Save second connections in a Map <InnovationNumber, Connection>
        const genome2Innovations = new Map<number, ConnectionGene>()
        for (const connection of chromosome2.connections) {
            genome2Innovations.set(connection.innovation, connection)
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

    /**
     * Decide based on the compatibility distance if both Chromosomes belong to the same species
     * @param chromosome1 the first chromosome
     * @param chromosome2 the second chromosome
     * @return true if both belong to the same species
     */
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

    public dividePopulationIntoSpecies(population: List<C>): void {
        for (const chromosome of population) {
            this.addToSpecies(chromosome);
        }
    }

    private getTopChromosome(population: List<C>): C {
        let topChromosome = population.get(0);
        for (const chromosome of population) {
            if (topChromosome.fitness < chromosome.fitness) {
                topChromosome = chromosome;
            }
        }
        return topChromosome;
    }

    getStartTime(): number {
        return this._startTime;
    }
}
