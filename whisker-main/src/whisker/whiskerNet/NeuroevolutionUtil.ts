import {Species} from "./Species";
import {NeatPopulation} from "./NeatPopulation";
import {NetworkChromosome} from "./NetworkChromosome";
import {List} from "../utils/List";
import {NeuroevolutionProperties} from "./NeuroevolutionProperties";
import {ConnectionGene} from "./ConnectionGene";
import {NeatMutation} from "./NeatMutation";

export class NeuroevolutionUtil {

    /**
     * Assigns the given chromosome to a species
     * @param chromosome the network which should be assigned to a species
     * @param population the whole population of NetworkChromosomes
     * @param properties the defined search-properties
     */
    public static speciate(chromosome: NetworkChromosome, population: NeatPopulation<NetworkChromosome>,
                           properties: NeuroevolutionProperties<NetworkChromosome>): void {

        // If we have no species at all so far create the first one
        if (population.species.isEmpty()) {
            const newSpecies = new Species(population.speciesCount, true, properties);
            population.speciesCount++;
            population.species.add(newSpecies);
            newSpecies.addChromosome(chromosome);
            chromosome.species = newSpecies;

        } else {
            // If we already have some species find the correct one or create a new one for the chromosome if it
            // fits in none of them
            let foundSpecies = false;
            for (const specie of population.species) {
                // Get a representative of the specie and calculate the compatibility distance
                const representative = specie.chromosomes.get(0);
                const compatDistance = NeuroevolutionUtil.compatibilityDistance(chromosome, representative, properties.excessCoefficient,
                    properties.disjointCoefficient, properties.weightCoefficient);

                // If they are compatible enough add the chromosome to the species
                if (compatDistance < properties.distanceThreshold) {
                    specie.addChromosome(chromosome);
                    chromosome.species = specie;
                    foundSpecies = true;
                    break;
                }
            }

            // If the chromosome fits into no species create one for it
            if (!foundSpecies) {
                const newSpecies = new Species(population.speciesCount, true, properties);
                population.speciesCount++;
                population.species.add(newSpecies)
                newSpecies.addChromosome(chromosome);
                chromosome.species = newSpecies;
            }
        }
    }

    /**
     * Calculates the compatibility distance of two NetworkChromosomes
     * @param chromosome1 the first NetworkChromosome
     * @param chromosome2 the second NetworkChromosome
     * @param excessCoefficient the defined excess coefficient
     * @param disjointCoefficient the defined disjoint coefficient
     * @param weightCoefficient the defined weight coefficient
     */
    public static compatibilityDistance(chromosome1: NetworkChromosome, chromosome2: NetworkChromosome, excessCoefficient: number,
                                        disjointCoefficient: number, weightCoefficient: number): number {

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
        const size1 = chromosome1.connections.size();
        const size2 = chromosome2.connections.size();
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
                const connection1 = chromosome1.connections.get(i1);
                const connection2 = chromosome2.connections.get(i2);

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

        // Calculate the compatibility distance according to the number of matching, excess and disjoint genes
        if (matching === 0)
            return (disjointCoefficient * disjoint + excessCoefficient * excess);

        return (disjointCoefficient * disjoint + excessCoefficient * excess
            + weightCoefficient * (weight_diff / matching));

    }

    /**
     * Checks if the network already contains a given connection
     * @param connections the list of connections
     * @param connection the connection which should be searched in the list of all connections
     * @return the found connection of the connection list
     */
    public static findConnection(connections: List<ConnectionGene>, connection: ConnectionGene): ConnectionGene {
        for (const con of connections) {
            if (con.equalsByNodes(connection)) return con;
        }
        return null;
    }

    /**
     * Assigns the next valid innovation number to a given connection gene
     * @param newInnovation the connection gene to which the innovation number should be assigned to
     */
    public static assignInnovationNumber(newInnovation: ConnectionGene): void {
        // Check if innovation already happened in this generation if Yes assign the same innovation number
        const oldInnovation = NeuroevolutionUtil.findConnection(NeatMutation._innovations, newInnovation)
        if (oldInnovation !== null)
            newInnovation.innovation = oldInnovation.innovation;
        // If Not assign a new one
        else {
            newInnovation.innovation = ConnectionGene.getNextInnovationNumber();
            NeatMutation._innovations.add(newInnovation);
        }
    }

    /**
     * SIGMOID activation function
     * @param x the value to which the SIGMOID function should be applied to
     * @param gain the gain of the SIGMOID function (set to 1 for a standard SIGMOID function)
     */
    public static sigmoid(x: number, gain: number): number {
        return (1 / (1 + Math.exp(gain * x)));
    }

    /**
     * Calculates the SOFTMAX function over all classification-outputNode values
     * @param network the network over which the softmax function should be calculated
     */
    public static softmax(network: NetworkChromosome): number[] {
        const result = []
        let denominator = 0;
        for (const oNode of network.getClassificationNodes()) {
            denominator += Math.exp(oNode.nodeValue);
        }
        for (const oNode of network.getClassificationNodes()) {
            result.push(Math.exp(oNode.nodeValue) / denominator)
        }
        return result;
    }

    /**
     * RELU activation function.
     * @param x the value to which the RELU function should be applied to
     */
    public static relu(x: number): number {
        return Math.max(0, x);
    }
}
