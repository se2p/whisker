import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {NeuroevolutionPopulation} from "./NeuroevolutionPopulation";
import {NeuroevolutionProperties} from "../NeuroevolutionProperties";
import {Species} from "./Species";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {NeatMutation} from "../Operators/NeatMutation";
import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";

export class NeatPopulation extends NeuroevolutionPopulation<NeatChromosome> {

    /**
     * The average shared fitness of the current population across all species.
     * Used for determining how many children each chromosome is allowed to produce.
     */
    private _averageSharedFitness: number;

    /**
     * Saves all species that are currently alive within the population.
     */
    private _species: Species<NeatChromosome>[] = [];

    /**
     * The number of species we would like to maintain through the generations.
     * To ensure this, the distanceThreshold is adjusted appropriately in each generation.
     */
    private readonly _numberOfSpeciesTargeted: number;

    /**
     * The number of encountered species through all generations.
     */
    private _speciesCount = 0;

    /**
     * Constructs a new NeatPopulation
     * @param generator the ChromosomeGenerator used for creating the initial population.
     * @param hyperParameter the defined search parameters
     */
    constructor(generator: ChromosomeGenerator<NeatChromosome>, hyperParameter: NeuroevolutionProperties<NeatChromosome>) {
        super(generator, hyperParameter);
        this._numberOfSpeciesTargeted = hyperParameter.numberOfSpecies;
    }

    /**
     * Generates an initial population of networks.
     */
    public generatePopulation(): void {
        while (this.networks.length < this.populationSize) {
            const network = this.generator.get();
            this.networks.push(network);
            this.speciate(network);
        }
    }

    /**
     * Generates a new generation of networks by evolving the current population.
     */
    public evolve(): void {
        // Remove chromosomes which are not allowed to reproduce.
        for (const chromosome of this.networks) {
            if (!chromosome.isParent) {
                const specie = chromosome.species;
                specie.removeNetwork(chromosome);
                this.removeNetwork(chromosome);
            }
        }

        // Now, let the reproduction start.
        const offspring: NeatChromosome[] = []
        for (const specie of this.species) {
            offspring.push(...specie.evolve(this, this.species));
        }

        // Speciate the produced offspring
        for (const child of offspring) {
            this.speciate(child);
        }

        // Remove the parents from the population and the species. The new ones still exist within their species
        for (const chromosome of this.networks) {
            const specie = chromosome.species;
            specie.removeNetwork(chromosome);
        }
        this.networks.splice(0);

        // Remove empty species and age the ones that survive.
        // Furthermore, add the members of the surviving species to the population List
        const doomedSpecies: Species<NeatChromosome>[] = [];
        for (const specie of this._species) {
            if (specie.networks.size() === 0) {
                doomedSpecies.push(specie);
            } else {
                // Give the new species an age bonus!
                if (specie.isNovel)
                    specie.isNovel = false;
                else
                    specie.age++;
                for (const network of specie.networks) {
                    this.networks.push(network);
                }
            }
        }
        this._species = this.species.filter(specie => !doomedSpecies.includes(specie));
        for (const specie of doomedSpecies) {
            this.species.splice(this.species.indexOf(specie), 1);
        }
        this.generation++;
    }

    /**
     * Calculates the shared fitness of each species member and infers the number of children each species is allowed
     * to produce in the next evolution step.
     */
    public updatePopulationStatistics(): void {
        this.updateCompatibilityThreshold();
        this.calculateFitnessDistribution();
        this.assignNumberOfOffspring();
        this.calculateAverageNetworkFitness();
    }

    /**
     * Updates the CompatibilityThreshold with the goal of obtaining the desired amount of species.
     */
    private updateCompatibilityThreshold(): void {
        const compatibilityModifier = 0.3;
        if (this.generation > 1) {
            if (this.species.size() < this.numberOfSpeciesTargeted)
                this.hyperParameter.distanceThreshold -= compatibilityModifier;
            else if (this.species.size() > this.numberOfSpeciesTargeted)
                this.hyperParameter.distanceThreshold += compatibilityModifier;

            if (this.hyperParameter.distanceThreshold < 1) {
                this.hyperParameter.distanceThreshold = 1;
            }
        }
    }

    /**
     * Calculates the fitnessDistribution across species, marks chromosomes which are allowed to reproduce and
     * calculates the average shared fitness value across all species.
     */
    protected calculateFitnessDistribution(): void {

        // Calculate the shared fitness value for each chromosome in each Specie and mark parent candidates.
        for (const specie of this.species) {
            specie.assignSharedFitness();
            specie.calculateAverageNetworkFitness();
        }

        // Calculate the total average fitness value of all chromosomes in the generation.
        let fitnessSum = 0.0;
        for (const chromosome of this.networks) {
            fitnessSum += chromosome.sharedFitness;
        }
        const numberOrganisms = this.networks.size();
        this._averageSharedFitness = fitnessSum / numberOrganisms;
    }

    /**
     * Defines how many children each Chromosome/Species is allowed to produce.
     */
    protected assignNumberOfOffspring(): void {
        // Compute the expected number of offspring for each chromosome which depends on its fitness value
        // in comparison to the averageFitness of the population
        for (const chromosome of this.networks) {
            chromosome.expectedOffspring = chromosome.sharedFitness / this._averageSharedFitness;
        }
        // Now calculate the number of offspring in each Species
        let leftOver = 0.0;
        let totalOffspringExpected = 0;
        for (const specie of this.species) {
            leftOver = specie.getNumberOfOffspringsNEAT(leftOver);
            totalOffspringExpected += specie.expectedOffspring;
        }

        // Find the population champion and reward him with additional children
        this.sortPopulation();
        this.sortSpecies();
        this.populationChampion = this.networks.get(0);
        this.populationChampion.isPopulationChampion = true;
        this.populationChampion.numberOffspringPopulationChamp = this.hyperParameter.populationChampionNumberOffspring;

        // Handle lost children due to rounding errors
        if (totalOffspringExpected < this.populationSize) {
            // Assign the lost children to the population champion's species
            const lostChildren = this.populationSize - totalOffspringExpected;
            this.populationChampion.species.expectedOffspring += lostChildren;
        }

        // Check for fitness stagnation
        if (this.populationChampion.networkFitness > this.highestFitness) {
            this.highestFitness = this.populationChampion.networkFitness;
            this.highestFitnessLastChanged = 0;
        } else {
            this.highestFitnessLastChanged++;
        }

        // If there is a stagnation in fitness refocus the search
        if (this.highestFitnessLastChanged > this.hyperParameter.penalizingAge + 5) {
            console.info("Refocusing the search on the two most promising species")
            this.highestFitnessLastChanged = 0;
            const halfPopulation = this.populationSize / 2;

            // If we only have one Specie allow only the champ to reproduce
            if (this.species.size() == 1) {
                const specie = this.species.get(0);
                specie.chromosomes.get(0).numberOffspringPopulationChamp = Math.floor(this.populationSize);
                specie.expectedOffspring = this.populationSize;
                specie.ageOfLastImprovement = specie.age;
            }

            // Otherwise, allow only the first two most promising species to reproduce and mark the others dead.
            else {
                this.species.sort((a, b) => b.averageFitness - a.averageFitness);
                for (let i = 0; i < this.species.size(); i++) {
                    const specie = this.species.get(i);
                    if (i <= 1) {
                        specie.chromosomes.get(0).numberOffspringPopulationChamp = Math.floor(halfPopulation);
                        specie.expectedOffspring = halfPopulation;
                        specie.ageOfLastImprovement = specie.age;
                    }
                    // The other species are terminated.
                    else {
                        specie.expectedOffspring = 0;
                    }
                }
            }

            //TODO: Babies Stolen
        }
    }

    /**
     * Calculates the average fitness of the whole population. Used for reporting.
     */
    private calculateAverageNetworkFitness(): void {
        let sum = 0;
        for (const chromosome of this.networks)
            sum += chromosome.networkFitness;
        this.averageFitness = sum / this.populationSize();
    }

    /**
     * Assigns the given chromosome to a species
     * @param chromosome the network which should be assigned to a species
     */
    protected speciate(chromosome: NeatChromosome): void {

        // If we have no species at all so far create the first one
        if (this.species.length === 0) {
            const newSpecies = new Species(this.speciesCount, true, this.hyperParameter);
            this.speciesCount++;
            this.species.push(newSpecies);
            newSpecies.addChromosome(chromosome);
            chromosome.species = newSpecies;

        } else {
            // If we already have some species find the correct one or create a new one for the chromosome if it
            // fits in none of them
            let foundSpecies = false;
            for (const specie of this.species) {
                // Get a representative of the specie and calculate the compatibility distance
                const representative = specie.networks.get(0);
                const compatDistance = this.compatibilityDistance(chromosome, representative);

                // If they are compatible enough add the chromosome to the species
                if (compatDistance < this.hyperParameter.distanceThreshold) {
                    specie.addChromosome(chromosome);
                    chromosome.species = specie;
                    foundSpecies = true;
                    break;
                }
            }

            // If the chromosome fits into no species create one for it.
            if (!foundSpecies) {
                const newSpecies = new Species(this.speciesCount, true, this.hyperParameter);
                this.speciesCount++;
                this.species.push(newSpecies)
                newSpecies.addChromosome(chromosome);
                chromosome.species = newSpecies;
            }
        }
    }

    /**
     * Calculates the compatibility distance of two NetworkChromosomes
     * @param chromosome1 the first NetworkChromosome
     * @param chromosome2 the second NetworkChromosome
     */
    public compatibilityDistance(chromosome1: NetworkChromosome, chromosome2: NetworkChromosome): number {
        // This should never happen!
        if (chromosome1 === undefined || chromosome2 === undefined) {
            console.error("Undefined Chromosome in compatDistance Calculation")
            return Number.MAX_SAFE_INTEGER;
        }

        chromosome1.generateNetwork();
        chromosome2.generateNetwork();

        // counters for excess, disjoint ,matching innovations and the weight difference
        let excess = 0;
        let disjoint = 0;
        let matching = 0;
        let weight_diff = 0;

        // size of both connections and the biggest size in terms of connections
        const size1 = chromosome1.connections.length;
        const size2 = chromosome2.connections.length;
        const maxSize = Math.max(size1, size2);

        // Iterators through the connections of each chromosome
        let i1 = 0;
        let i2 = 0;

        // Move through each connection of both chromosomes and count the excess, disjoint, matching connections
        // and their weight differences
        for (let i = 0; i < maxSize; i++) {
            if (i1 >= size1) {
                excess++;
                i2++
            } else if (i2 >= size2) {
                excess++;
                i1++;
            } else {

                // Get the connection at the position
                const connection1 = chromosome1.connections[i1];
                const connection2 = chromosome2.connections[i2];

                // Extract the innovation numbers
                const innovation1 = connection1.innovation;
                const innovation2 = connection2.innovation;

                if (innovation1 === innovation2) {
                    matching++;
                    weight_diff += Math.abs(connection1.weight - connection2.weight);
                    i1++;
                    i2++;
                } else if (innovation1 < innovation2) {
                    i1++;
                    disjoint++;
                } else if (innovation2 < innovation1) {
                    i2++;
                    disjoint++;
                }
            }
        }

        // Calculate the compatibility distance according to the number of matching, excess and disjoint genes.
        const disjointCoefficient = this.hyperParameter.disjointCoefficient;
        const excessCoefficient = this.hyperParameter.excessCoefficient;
        const weightCoefficient = this.hyperParameter.weightCoefficient;
        if (matching === 0)
            return (disjointCoefficient * disjoint + excessCoefficient * excess);

        return (disjointCoefficient * disjoint + excessCoefficient * excess
            + weightCoefficient * (weight_diff / matching));
    }

    /**
     * Assigns the next valid innovation number to a given connection gene
     * @param newInnovation the connection gene to which the innovation number should be assigned to
     */
    public static assignInnovationNumber(newInnovation: ConnectionGene): void {
        // Check if innovation already happened in the past, if so assign the same innovation number.
        const oldInnovation = NeatMutation._innovations.find(innovation => innovation.equalsByNodes(newInnovation));
        if (oldInnovation !== null) {
            newInnovation.innovation = oldInnovation.innovation;
        }
        // If not assign a new one
        else {
            newInnovation.innovation = ConnectionGene.getNextInnovationNumber();
            NeatMutation._innovations.push(newInnovation);
        }
    }

    /**
     * Sorts the population according to the networkFitness in decreasing order.
     */
    protected sortPopulation(): void {
        this.networks.sort((a, b) => b.networkFitness - a.networkFitness)
    }

    /**
     * Sorts the species List according to their champion's networkFitness in decreasing order.
     */
    protected sortSpecies(): void {
        this.species.sort((a, b) => b.expectedOffspring - a.expectedOffspring)
    }

    /**
     * Removes a network from the current population.
     * @param network the network that should be removed
     */
    protected removeNetwork(network:C):void{
        const index = this.networks.indexOf(network);
        this.networks.splice(index, 1);
    }

    /**
     * Deep Clone of NeatPopulation
     * @returns clone of this NeatPopulation.
     */
    public clone(): NeatPopulation<C> {
        const clone = new NeatPopulation(this.generator, this.hyperParameter);
        clone.speciesCount = this.speciesCount;
        clone.highestFitness = this.highestFitness;
        clone.highestFitnessLastChanged = this.highestFitnessLastChanged;
        clone.averageFitness = this.averageFitness;
        clone.generation = this.generation;
        clone.populationChampion = this.populationChampion.clone() as C;
        for (const network of this.networks) {
            clone.networks.add(network.clone() as C);
        }
        for (const species of this.species) {
            clone.species.add(species.clone());
        }
        return clone;
    }

    public toJSON(): Record<string, (number | Species<C>)> {
        const population = {};
        population[`aF`] = Number(this.averageFitness.toFixed(4));
        population[`hF`] = Number(this.highestFitness.toFixed(4));
        population[`PC`] = this.populationChampion.uID;
        for (let i = 0; i < this.species.size(); i++) {
            population[`S ${i}`] = this.species.get(i).toJSON();
        }
        return population;
    }


    get averageSharedFitness(): number {
        return this._averageSharedFitness;
    }

    set averageSharedFitness(value: number) {
        this._averageSharedFitness = value;
    }

    get speciesCount(): number {
        return this._speciesCount;
    }

    set speciesCount(value: number) {
        this._speciesCount = value;
    }

    get species(): Species<NeatChromosome>[] {
        return this._species;
    }

    get numberOfSpeciesTargeted(): number {
        return this._numberOfSpeciesTargeted;
    }
}
