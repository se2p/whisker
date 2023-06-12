import {NeuroevolutionPopulation} from "./NeuroevolutionPopulation";
import {Species} from "./Species";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NeuroevolutionTestGenerationParameter} from "../HyperParameter/NeuroevolutionTestGenerationParameter";
import Arrays from "../../utils/Arrays";
import {Container} from "../../utils/Container";

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
     * Saves all encountered innovations.
     */
    public static innovations: Innovation[] = [];

    /**
     * Keeps track of the highest node id seen so far.
     */
    public static highestNodeId = 0;

    /**
     * The threshold determining at which point two networks are defined to belong to different species.
     */
    private compatibilityThreshold: number

    /**
     * Maps input, classification and regression nodes to corresponding node ids via input features, events and
     * event parameter respectively.
     */
    public static nodeToId = new Map<string, number>();

    /**
     * Used for determining the next available innovation number.
     */
    private static innovationCounter = 0;

    /**
     * Constructs a new NeatPopulation.
     * @param generator the ChromosomeGenerator used for creating the initial population.
     * @param hyperParameter the defined search parameters.
     */
    constructor(generator: ChromosomeGenerator<NeatChromosome>, hyperParameter: NeuroevolutionTestGenerationParameter) {
        super(generator, hyperParameter);
        this._numberOfSpeciesTargeted = hyperParameter.numberOfSpecies;
        this.compatibilityThreshold = hyperParameter.compatibilityDistanceThreshold;
    }

    public static getAvailableInnovationNumber(): number {
        return this.innovationCounter++;
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
        // Remove chromosomes that are not allowed to reproduce.
        for (const chromosome of this.networks) {
            if (!chromosome.isParent) {
                const specie = chromosome.species;
                specie.removeNetwork(chromosome);
                this.removeNetwork(chromosome);
            }
        }
        // Now, let the reproduction start.
        const offspring: NeatChromosome[] = [];
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
            if (specie.networks.length === 0) {
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
        for (const doomedSpecie of doomedSpecies) {
            Arrays.remove(this.species, doomedSpecie);
        }
        this.generation++;

        // If we have big differences in fitness values across species, we might get small over-populations that expand.
        if (this.networks.length > this.hyperParameter.populationSize) {
            Container.debugLog(`The population size has changed from ${this.hyperParameter.populationSize} to
            ${this.networks.length} members.`);
            while (this.networks.length > this.hyperParameter.populationSize) {
                this.networks.pop();
            }
            Container.debugLog(`Reduced the population size down to ${this.networks.length}`);
        }
    }

    /**
     * Calculates the shared fitness of each species member and infers the number of children each species is allowed
     * to produce during the next breeding process.
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
        if (this.generation > 0) {
            // If we have less species than desired, we have to reduce the threshold.
            if (this.species.length < this.numberOfSpeciesTargeted)
                this.compatibilityThreshold -= compatibilityModifier;
            // If we have more species than desired, we have to increase the threshold.
            else if (this.species.length > this.numberOfSpeciesTargeted)
                this.compatibilityThreshold += compatibilityModifier;

            // Let it not fall below 0.1 though!
            if (this.compatibilityThreshold < 0.1) {
                this.compatibilityThreshold = 0.1;
            }
        }
    }

    /**
     * Calculates the fitness distribution across all species, marks networks which are allowed to reproduce and
     * calculates the average shared fitness value across all species.
     */
    protected calculateFitnessDistribution(): void {

        // Calculate the shared fitness value for each network in each Specie and mark parent candidates.
        for (const specie of this.species) {
            specie.assignSharedFitness();
            specie.calculateAverageNetworkFitness();
        }

        // Calculate the total average fitness value of all networks in the generation.
        let fitnessSum = 0.0;
        for (const network of this.networks) {
            fitnessSum += network.sharedFitness;
        }
        const numberOrganisms = this.networks.length;
        this.averageSharedFitness = fitnessSum / numberOrganisms;
    }

    /**
     * Defines how many children each network and therefore each species is allowed to produce.
     */
    protected assignNumberOfOffspring(): void {
        // Compute the expected number of offspring for each network which depends on its fitness value
        // in comparison to the averageFitness of the population
        for (const network of this.networks) {
            network.expectedOffspring = network.sharedFitness / this.averageSharedFitness;
        }

        // Now calculate the number of offspring in each species
        let leftOver = 0.0;
        let totalOffspringExpected = 0;
        for (const specie of this.species) {
            leftOver = specie.getNumberOfOffspringsNEAT(leftOver);
            totalOffspringExpected += specie.expectedOffspring;
        }

        // Find the population champion and reward him with additional children.
        this.sortPopulation();
        this.sortSpecies();
        this.populationChampion = this.networks[0];
        this.populationChampion.isPopulationChampion = true;
        this.populationChampion.numberOffspringPopulationChamp = this.hyperParameter.populationChampionNumberOffspring;

        // Handle lost children due to rounding errors.
        if (totalOffspringExpected < this.populationSize) {
            // Assign the lost children to the population champion's species.
            const lostChildren = this.populationSize - totalOffspringExpected;
            this.populationChampion.species.expectedOffspring += lostChildren;
        }

        // Check for fitness stagnation
        if (this.populationChampion.fitness > this.bestFitness) {
            this.bestFitness = this.populationChampion.fitness;
            this.highestFitnessLastChanged = 0;
        } else {
            this.highestFitnessLastChanged++;
        }

        // If there is a stagnation in fitness refocus the search
        if (this.highestFitnessLastChanged > this.hyperParameter.penalizingAge + 5) {
            Container.debugLog("Refocusing the search on the two most promising species");
            this.highestFitnessLastChanged = 0;
            const halfPopulation = this.populationSize / 2;

            // If we only have one Specie allow only the champ to reproduce
            if (this.species.length == 1) {
                const specie = this.species[0];
                specie.networks[0].numberOffspringPopulationChamp = Math.floor(this.populationSize);
                specie.expectedOffspring = this.populationSize;
                specie.ageOfLastImprovement = specie.age;
            }

            // Otherwise, allow only the first two most promising species to reproduce and mark the others dead.
            else {
                this.species.sort((a, b) => b.averageFitness - a.averageFitness);
                for (let i = 0; i < this.species.length; i++) {
                    const specie = this.species[i];
                    if (i <= 1) {
                        specie.networks[0].numberOffspringPopulationChamp = Math.floor(halfPopulation);
                        specie.expectedOffspring = halfPopulation;
                        specie.ageOfLastImprovement = specie.age;
                    }
                    // The other species are terminated.
                    else {
                        specie.expectedOffspring = 0;
                        Arrays.clear(specie.networks);
                    }
                }
            }

            // TODO: Babies Stolen
        }
    }

    /**
     * Calculates the average fitness across all networks of the population.
     * @returns number average fitness across all networks.
     */
    private calculateAverageNetworkFitness(): number {
        this.averageFitness = this.networks.reduce((a, b) => a + b.fitness, 0)
            / this.networks.length;
        return this.averageFitness;
    }

    /**
     * Assigns a network to the first compatible species.
     * @param network the network that should be assigned to a species.
     */
    public speciate(network: NeatChromosome): void {

        // If we have no existent species in our population create the first one.
        if (this.species.length === 0) {
            const newSpecies = new Species(this.speciesCount, true, this.hyperParameter);
            this.speciesCount++;
            this.species.push(newSpecies);
            newSpecies.networks.push(network);
            network.species = newSpecies;
        }

            // If we already have some species find a compatible one or create a new species for the network if the network
        // is not compatible enough with any existent species.
        else {
            let foundSpecies = false;
            for (const specie of this.species) {
                // Skip empty species
                if (specie.networks.length == 0) {
                    continue;
                }
                // Get a representative of the specie and calculate the compatibility distance.
                const representative = specie.networks[0];
                const compatDistance = this.compatibilityDistance(network, representative);

                // If the representative and the given network are compatible enough add the network to the
                // representative's species.
                if (compatDistance < this.compatibilityThreshold) {
                    specie.networks.push(network);
                    network.species = specie;
                    foundSpecies = true;
                    break;
                }
            }

            // If the network fits into no species create a new one.
            if (!foundSpecies) {
                const newSpecies = new Species(this.speciesCount, true, this.hyperParameter);
                this.speciesCount++;
                this.species.push(newSpecies);
                newSpecies.networks.push(network);
                network.species = newSpecies;
            }
        }
    }

    /**
     * Calculates the compatibility distance between two networks which indicates how similar they are.
     * @param network1 the first network
     * @param network2 the second network
     * @returns number the compatibility distance between the two given chromosomes.
     */
    public compatibilityDistance(network1: NeatChromosome, network2: NeatChromosome): number {

        // Safety check.
        if (network1 === undefined || network2 === undefined) {
            console.error("Undefined network in compatDistance Calculation");
            return Number.MAX_SAFE_INTEGER;
        }

        // Generate the networks and by that sort the connections according to their innovation numbers.
        network1.sortConnections();
        network2.sortConnections();

        // Counters for excess, disjoint and matching innovations & the weight difference.
        let excess = 0;
        let disjoint = 0;
        let matching = 0;
        let weight_diff = 0;

        // Size of both networks measured based on their number of connections.
        const size1 = network1.connections.length;
        const size2 = network2.connections.length;
        const maxSize = Math.max(size1, size2);

        // Iterators for the connections of each network.
        let i1 = 0;
        let i2 = 0;

        // Move through each connection of both networks and count the excess, disjoint, matching connections
        // and their weight differences.
        for (let i = 0; i < maxSize; i++) {

            // If we exceeded the size of one of the two network, we have an excess gene.
            if (i1 >= size1) {
                excess++;
                i2++;
            } else if (i2 >= size2) {
                excess++;
                i1++;
            }

            // With excess genes our of the way, we now check if we have a matching or disjoint gene on our hands.
            else {
                // Get the connection at the position
                const connection1 = network1.connections[i1];
                const connection2 = network2.connections[i2];

                // Extract the innovation numbers
                const innovation1 = connection1.innovation;
                const innovation2 = connection2.innovation;

                // If we have equal innovation numbers, we have a matching gene.
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
        const disjointFactor = (disjoint * this.hyperParameter.disjointCoefficient) / maxSize;
        const excessFactor = (excess * this.hyperParameter.excessCoefficient) / maxSize;
        const weightCoefficient = this.hyperParameter.weightCoefficient;
        if (matching === 0) {
            return disjointFactor + excessFactor;
        } else {
            return disjointFactor + excessFactor + weightCoefficient * (weight_diff / matching);
        }
    }

    /**
     * Assigns the right innovation number for a given connection.
     * @param connection the connection gene used to evaluate whether a novel innovation occurred.
     * @param innovationType the type of innovation that occurred (newNode | newConnection).
     */
    public static findInnovation(connection: ConnectionGene, innovationType: InnovationType): Innovation | undefined {
        let findMatchingInnovation: (innovation: Innovation, connection: ConnectionGene) => boolean;
        switch (innovationType) {
            case 'addConnection':
                findMatchingInnovation = (innovation, connection) => {
                    return innovation.type === 'addConnection' &&
                        innovation.idSourceNode === connection.source.uID &&
                        innovation.idTargetNode === connection.target.uID &&
                        innovation.recurrent === connection.isRecurrent;
                };
                break;
            case "addNodeSplitConnection":
                findMatchingInnovation = (innovation, connection) => {
                    return innovation.type === 'addNodeSplitConnection' &&
                        innovation.idSourceNode === connection.source.uID &&
                        innovation.idTargetNode === connection.target.uID &&
                        innovation.splitInnovation === connection.innovation;
                };
                break;
        }
        return this.innovations.find(innovation => findMatchingInnovation(innovation, connection));
    }

    /**
     * Sorts the networks of the population according to their fitness values in decreasing order.
     */
    protected sortPopulation(): void {
        this.networks.sort((a, b) => b.fitness - a.fitness);
    }

    /**
     * Sorts all currently existent species according to their number of expected offspring in decreasing order.
     */
    protected sortSpecies(): void {
        this.species.sort((a, b) => b.expectedOffspring - a.expectedOffspring);
    }

    /**
     * Removes a network from the current population.
     * @param network the network that should be removed.
     */
    protected removeNetwork(network: NeatChromosome): void {
        const index = this.networks.indexOf(network);
        this.networks.splice(index, 1);
    }

    /**
     * Clones this instance of a NeatPopulation.
     * @returns NeatPopulation deep clone of this instance of a NeatPopulation.
     */
    public clone(): NeatPopulation {
        const clone = new NeatPopulation(this.generator, this.hyperParameter);
        clone.speciesCount = this.speciesCount;
        clone.bestFitness = this.bestFitness;
        clone.highestFitnessLastChanged = this.highestFitnessLastChanged;
        clone.averageFitness = this.averageFitness;
        clone.generation = this.generation;
        clone.populationChampion = this.populationChampion.clone() as NeatChromosome;
        for (const network of this.networks) {
            clone.networks.push(network.clone() as NeatChromosome);
        }
        for (const species of this.species) {
            clone.species.push(species.clone());
        }
        return clone;
    }

    /**
     * Transform this NeuroevolutionPopulation into a JSON representation.
     * @return Record containing this NeuroevolutionPopulation's attributes mapped to the corresponding values.
     */
    public toJSON(): Record<string, (number | Species<NeatChromosome>)> {
        const population = {};
        population['aF'] = Number(this.averageFitness.toFixed(4));
        population['bF'] = Number(this.bestFitness.toFixed(4));
        population['PC'] = this.populationChampion.uID;
        for (let i = 0; i < this.species.length; i++) {
            population[`S ${i}`] = this.species[i].toJSON();
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

export type Innovation = AddConnectionInnovation | AddNodeSplitConnectionInnovation;

export interface AddConnectionInnovation {
    type: 'addConnection';
    idSourceNode: number;
    idTargetNode: number;
    innovationNumber: number;
    recurrent: boolean
}

export interface AddNodeSplitConnectionInnovation {
    type: 'addNodeSplitConnection';
    idSourceNode: number;
    idTargetNode: number;
    firstInnovationNumber: number;
    secondInnovationNumber: number
    idNewNode: number
    splitInnovation: number
}

export type InnovationType =
    | 'addConnection'
    | 'addNodeSplitConnection'
    ;
