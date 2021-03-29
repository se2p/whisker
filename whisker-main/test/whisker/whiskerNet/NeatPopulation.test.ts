import {NeatPopulation} from "../../../src/whisker/whiskerNet/NeatPopulation";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/NetworkChromosome";
import {NetworkChromosomeGenerator} from "../../../src/whisker/whiskerNet/NetworkChromosomeGenerator";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/whiskerNet/NeatMutation";
import {NeuroevolutionProperties} from "../../../src/whisker/whiskerNet/NeuroevolutionProperties";
import {Randomness} from "../../../src/whisker/utils/Randomness";

describe("Test NeatPopulation", () =>{

    let size: number;
    let numberOfSpecies: number;
    let chromosomeGenerator: NetworkChromosomeGenerator;
    let crossOver: NeatCrossover;
    let mutation: NeatMutation;
    let inputs: number[][];
    let numberOutputs: number;
    let properties: NeuroevolutionProperties<NetworkChromosome>
    let population : NeatPopulation<NetworkChromosome>
    let random: Randomness


    beforeEach(() =>{
        size = 100;
        numberOfSpecies = 5;
        crossOver = new NeatCrossover(0.4);
        mutation = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8,
            1.5, 0.1, 3, 0.1);
        inputs = [[1,2,3,4,5,6]]
        numberOutputs = 3;
        chromosomeGenerator = new NetworkChromosomeGenerator(
            mutation, crossOver, inputs, numberOutputs, 0.4, false)
        properties = new NeuroevolutionProperties<NetworkChromosome>(size)
        properties.disjointCoefficient = 1;
        properties.excessCoefficient = 1;
        properties.weightCoefficient = 0.3;
        properties.distanceThreshold = 3;
        properties.penalizingAge = 10;
        properties.ageSignificance = 1.0
        properties.parentsPerSpecies = 0.2
        properties.mutationWithoutCrossover = 0.3
        properties.interspeciesMating = 0.1;
        population = new NeatPopulation(size, numberOfSpecies, chromosomeGenerator ,properties)
        random = Randomness.getInstance();
        for(const c of population.chromosomes)
            c.networkFitness = random.nextInt(1, 50);
    })

    test("Test Constructor", () =>{
        expect(population.speciesCount).toBeGreaterThan(0)
        expect(population.highestFitness).toBe(0)
        expect(population.highestFitnessLastChanged).toBe(0)
        expect(population.numberOfSpeciesTargeted).toBe(numberOfSpecies)
        expect(population.generator).toBeInstanceOf(NetworkChromosomeGenerator)
        expect(population.startSize).toBe(size)
        expect(population.generation).toBe(0)
        expect(population.species.size()).toBeGreaterThan(0)
        expect(population.chromosomes.size()).toBe(size)
        expect(population.properties).toBeInstanceOf(NeuroevolutionProperties)
        expect(population.averageFitness).toBe(0)
    })

    test("Test Getter and Setter", () =>{

        population.speciesCount = 3;
        population.highestFitness = 3;
        population.highestFitnessLastChanged = 3;
        population.generation = 3;
        population.averageFitness = 3;

        const champ = population.chromosomes.get(0);
        population.populationChampion = champ;

        expect(population.speciesCount).toBe(3)
        expect(population.highestFitness).toBe(3)
        expect(population.highestFitnessLastChanged).toBe(3)
        expect(population.generation).toBe(3)
        expect(population.averageFitness).toBe(3)
        expect(population.populationChampion).toBe(champ)
    })

    test("Test evolution", () =>{
        const oldGeneration = population.chromosomes;
        for (let i = 0; i < 50; i++) {
            for(const c of population.chromosomes)
                c.networkFitness = random.nextInt(1, 50);
            population.evolution();
        }
        const newGeneration = population.chromosomes;

        expect(oldGeneration).not.toContainEqual(newGeneration)
        expect(population.speciesCount).toBeGreaterThan(0)
        expect(population.generation).toBe(50)
        expect(population.species.size()).toBeGreaterThan(0)
        expect(population.chromosomes.size()).toBe(size)
    })

    test("Test evolution stagnant population with only one species", () =>{
        population.highestFitness = 60;
        population.highestFitnessLastChanged = 100;
        for (let i = 1; i < population.species.size(); i++) {
            population.species.remove(population.species.get(i))
        }
        population.evolution();
        expect(population.species.size()).toBe(1);
        expect(population.species.get(0).chromosomes.size()).toBe(size)
    })

    test("Test evolve with distance Threshold below 0.3", () =>{
        population.generation = 3;
        population.properties.distanceThreshold = 0.1;
        population.evolution();
        expect(population.properties.distanceThreshold).toBe(0.3)
    })

})
