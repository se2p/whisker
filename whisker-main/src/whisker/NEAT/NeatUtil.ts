import {Species} from "./Species";
import {NeatPopulation} from "./NeatPopulation";
import {NeatChromosome} from "./NeatChromosome";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {NeuroevolutionProperties} from "./NeuroevolutionProperties";

export class NeatUtil {


    static speciate(chromosome: NeatChromosome, population: NeatPopulation<NeatChromosome>,
                    properties: NeuroevolutionProperties<any>): void {

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
                const compatDistance = NeatUtil.compatibilityDistance(chromosome, representative, properties.excessCoefficient,
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

    static compatibilityDistance(chromosome1: NeatChromosome, chromosome2: NeatChromosome, excessCoefficient: number,
                                 disjointCoefficient: number, weightCoefficient: number): number {

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
                const innvoation1 = connection1.innovation;
                const innovation2 = connection2.innovation;

                if (innvoation1 === innovation2) {
                    matching++;
                    weight_diff += Math.abs(connection1.weight - connection2.weight);
                    i1++;
                    i2++;
                } else if (innvoation1 < innovation2) {
                    i1++;
                    disjoint++;
                } else if (innovation2 < innvoation1) {
                    i2++;
                    disjoint++;
                }
            }
        }

        if (matching === 0)
            return (disjointCoefficient * disjoint + excessCoefficient * excess);

        return (disjointCoefficient * disjoint + excessCoefficient * excess
            + weightCoefficient * (weight_diff / matching));

    }

    /**
     * Modified Sigmoid function proposed by the paper
     * @param x the value the sigmoid function should be applied to
     * @private
     */
    public static sigmoid(x: number): number {
        return (1 / (1 + Math.exp(-4.9 * x)));
    }

    public static softmaxValue(x: number, v: number[]): number {
        let denominator = 0;
        for (const num of v) {
            denominator += Math.exp(num);
        }
        return Math.exp(x) / denominator;
    }

    public static softmax(outputNodes: List<NodeGene>): number[] {
        const result = []
        let denominator = 0;
        for (const oNode of outputNodes)
            denominator += Math.exp(oNode.nodeValue);
        for (const oNode of outputNodes) {
            result.push(Math.exp(oNode.nodeValue) / denominator)
        }
        return result;
    }
}
