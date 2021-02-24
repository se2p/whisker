import {Species} from "./Species";
import {NeatPopulation} from "./NeatPopulation";
import {NeatChromosome} from "./NeatChromosome";
import {NeatParameter} from "./NeatParameter";

export class NeatUtil {


    static speciate(chromosome: NeatChromosome, population: NeatPopulation<NeatChromosome>): void {

        // If we have no species at all so far create the first one
        if (population.species.isEmpty()) {
            const newSpecies = new Species(population.speciesCount, true);
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
                const compatDistance = NeatUtil.compatibilityDistance(chromosome, representative);

                // If they are compatible enough add the chromosome to the species
                if (compatDistance < NeatParameter.DISTANCE_THRESHOLD) {
                    specie.addChromosome(chromosome);
                    chromosome.species = specie;
                    foundSpecies = true;
                    break;
                }
            }

            // If the chromosome fits into no species create one for it
            if (!foundSpecies) {
                const newSpecies = new Species(population.speciesCount, true);
                population.speciesCount++;
                population.species.add(newSpecies)
                newSpecies.addChromosome(chromosome);
                chromosome.species = newSpecies;
            }
        }
    }

    static compatibilityDistance(chromosome1: NeatChromosome, chromosome2: NeatChromosome): number {

        if(chromosome1 === undefined || chromosome2 === undefined)
            return NeatParameter.DISTANCE_THRESHOLD + 1;

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

        if(matching === 0)
            return (NeatParameter.DISJOINT_COEFFICIENT * disjoint + NeatParameter.EXCESS_COEFFICIENT * excess);

        return (NeatParameter.DISJOINT_COEFFICIENT * disjoint + NeatParameter.EXCESS_COEFFICIENT * excess
            + NeatParameter.WEIGHT_COEFFICIENT * (weight_diff / matching));

    }
}
