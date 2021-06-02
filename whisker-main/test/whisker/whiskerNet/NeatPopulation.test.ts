import {NeatPopulation} from "../../../src/whisker/whiskerNet/NeatPopulation";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/NetworkChromosome";
import {NetworkChromosomeGeneratorSparse} from "../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorSparse";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/whiskerNet/NeatMutation";
import {NeuroevolutionProperties} from "../../../src/whisker/whiskerNet/NeuroevolutionProperties";
import {Randomness} from "../../../src/whisker/utils/Randomness";
import {ScratchEvent} from "../../../src/whisker/testcase/events/ScratchEvent";
import {List} from "../../../src/whisker/utils/List";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../src/whisker/testcase/events/KeyPressEvent";

describe("Test NeatPopulation", () => {

    let size: number;
    let numberOfSpecies: number;
    let population: NeatPopulation<NetworkChromosome>;
    let random: Randomness;


    beforeEach(() => {
        size = 100;
        numberOfSpecies = 5;
        const crossOver = new NeatCrossover(0.4);
        const mutation = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8,
            1.5, 0.1, 3, 0.1);
        const genInputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        sprite1.set("Costume", 3);
        sprite1.set("DistanceToSprite2-X", 4);
        sprite1.set("DistanceToSprite2-y", 5);
        genInputs.set("Sprite1", sprite1);
        const events = new List<ScratchEvent>([new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()]);
        const chromosomeGenerator = new NetworkChromosomeGeneratorSparse(mutation, crossOver, genInputs, events, 0.4);
        const properties = new NeuroevolutionProperties<NetworkChromosome>(size);
        properties.disjointCoefficient = 1;
        properties.excessCoefficient = 1;
        properties.weightCoefficient = 0.3;
        properties.distanceThreshold = 3;
        properties.penalizingAge = 10;
        properties.ageSignificance = 1.0
        properties.parentsPerSpecies = 0.2
        properties.mutationWithoutCrossover = 0.3
        properties.interspeciesMating = 0.1;
        population = new NeatPopulation(size, numberOfSpecies, chromosomeGenerator, properties);
        random = Randomness.getInstance();
        for (const c of population.chromosomes)
            c.networkFitness = random.nextInt(1, 50);
    })

    test("Test Constructor", () => {
        expect(population.speciesCount).toBeGreaterThan(0);
        expect(population.highestFitness).toBe(0);
        expect(population.highestFitnessLastChanged).toBe(0);
        expect(population.numberOfSpeciesTargeted).toBe(numberOfSpecies);
        expect(population.generator).toBeInstanceOf(NetworkChromosomeGeneratorSparse);
        expect(population.startSize).toBe(size);
        expect(population.generation).toBe(0);
        expect(population.species.size()).toBeGreaterThan(0);
        expect(population.chromosomes.size()).toBe(size);
        expect(population.properties).toBeInstanceOf(NeuroevolutionProperties);
        expect(population.averageFitness).toBe(0);
    })

    test("Test Getter and Setter", () => {

        population.speciesCount = 3;
        population.highestFitness = 3;
        population.highestFitnessLastChanged = 3;
        population.generation = 3;
        population.averageFitness = 3;

        const champ = population.chromosomes.get(0);
        population.populationChampion = champ;

        expect(population.speciesCount).toBe(3);
        expect(population.highestFitness).toBe(3);
        expect(population.highestFitnessLastChanged).toBe(3);
        expect(population.generation).toBe(3);
        expect(population.averageFitness).toBe(3);
        expect(population.populationChampion).toBe(champ);
    })

    test("Test evolution", () => {
        const oldGeneration = population.chromosomes;
        for (let i = 0; i < 50; i++) {
            for (const c of population.chromosomes)
                c.networkFitness = random.nextInt(1, 50);
            population.evolution();
        }
        const newGeneration = population.chromosomes;

        expect(oldGeneration).not.toContainEqual(newGeneration);
        expect(population.speciesCount).toBeGreaterThan(0);
        expect(population.generation).toBe(50);
        expect(population.species.size()).toBeGreaterThan(0);
        expect(population.chromosomes.size()).toBe(size);
    })

    test("Test evolution stagnant population with only one species", () => {
        population.highestFitness = 60;
        population.highestFitnessLastChanged = 100;
        for (let i = 1; i < population.species.size(); i++) {
            population.species.remove(population.species.get(i))
        }
        population.evolution();
        expect(population.species.size()).toBe(1);
        expect(population.species.get(0).chromosomes.size()).toBe(size);
    })

    test("Test evolve with distance Threshold below 0.3", () => {
        population.generation = 3;
        population.properties.distanceThreshold = 0.1;
        population.evolution();
        expect(population.properties.distanceThreshold).toBe(0.3);
    })

})
