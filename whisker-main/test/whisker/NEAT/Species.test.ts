import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {Mutation} from "../../../src/whisker/search/Mutation";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {Crossover} from "../../../src/whisker/search/Crossover";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {List} from "../../../src/whisker/utils/List";
import {Species} from "../../../src/whisker/NEAT/Species";


describe("Species Test", () => {

    let generator: NeatChromosomeGenerator;
    let mutationOp: Mutation<NeatChromosome>
    let crossoverOp: Crossover<NeatChromosome>
    let population: List<NeatChromosome>
    let inputSize: number;
    let outputSize: number;

    beforeEach(() => {
        mutationOp = new NeatMutation();
        crossoverOp = new NeatCrossover();
        inputSize = 3;
        outputSize = 4;
        generator = new NeatChromosomeGenerator(mutationOp, crossoverOp, inputSize, outputSize);
        population = new List<NeatChromosome>();
        while (population.size() < 10)
            population.add(generator.get())
    })

    test("Calculate adjusted fitness of whole species", () => {
        for (const chromosome of population)
            chromosome.fitness = 1;
        const species = new Species(population.get(0))
        species.chromosomes.addList(population);
        const totalFitness = Math.floor(species.getAdjustedFitnessTotal());
        expect(totalFitness).toEqual(1)
    })

    test("Kill weakest Chromosomes", () => {
        for (const chromosome of population)
            chromosome.fitness = 1;
        const species = new Species(population.get(0))
        species.chromosomes.addList(population);
        population.get(0).fitness = 0.2;
        population.get(1).fitness = 0.5;
        species.removeWeakChromosomes(0.2)
        expect(species.chromosomes.size()).toBeLessThan(10)
    })

    test("Get Elites", () => {
        for (const chromosome of population)
            chromosome.fitness = 0.5;
        const species = new Species(population.get(0))
        species.chromosomes.addList(population);
        population.get(5).fitness = 0.6;
        population.get(2).fitness = 0.8;
        const elites = species.getElites(0.2)
        expect(elites.size()).toBe(2)
        expect(elites.get(0).fitness).toBe(0.8)
        expect(elites.get(1).fitness).toBe(0.6)
    })

    test("Get best Chromosome of species", () => {
        for (const chromosome of population)
            chromosome.fitness = 0.5;
        const species = new Species(population.get(0))
        species.chromosomes.addList(population);
        population.get(3).fitness = 0.6;
        population.get(8).fitness = 12
        const topChromosome = population.get(8)
        expect(species.getTopChromosome()).toBe(topChromosome)
    })

    test("Mutate random chromosome in species", () => {
        const species = new Species(population.get(0))
        species.chromosomes.addList(population);
        const child = species.breedChildMutationOnly();
        expect(species).not.toContainEqual(child)
    })

    test("Apply crossover to a random chromosome in species", () => {
        const species = new Species(population.get(0))
        species.chromosomes.addList(population);
        const child = species.breedChildCrossoverAndMutation()
        expect(species).not.toContainEqual(child)
    })
})
