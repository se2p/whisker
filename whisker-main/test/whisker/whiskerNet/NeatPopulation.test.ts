import {NeatPopulation} from "../../../src/whisker/whiskerNet/NeuroevolutionPopulations/NeatPopulation";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/NetworkChromosome";
import {NetworkChromosomeGeneratorSparse} from "../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorSparse";
import {NeuroevolutionProperties} from "../../../src/whisker/whiskerNet/NeuroevolutionProperties";
import {Randomness} from "../../../src/whisker/utils/Randomness";
import {ScratchEvent} from "../../../src/whisker/testcase/events/ScratchEvent";
import {WaitEvent} from "../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../src/whisker/testcase/events/KeyPressEvent";
import Arrays from "../../../src/whisker/utils/Arrays";

describe("Test NeatPopulation", () => {

    let size: number;
    let numberOfSpecies: number;
    let population: NeatPopulation<NetworkChromosome>;
    let random: Randomness;


    beforeEach(() => {
        size = 100;
        numberOfSpecies = 5;
        const crossoverConfig = {
            "operator": "neatCrossover",
            "crossoverWithoutMutation": 0.2,
            "interspeciesRate": 0.001,
            "weightAverageRate": 0.4
        };

        const mutationConfig = {
            "operator": "neatMutation",
            "mutationWithoutCrossover": 0.25,
            "mutationAddConnection": 0.2,
            "recurrentConnection": 0.1,
            "addConnectionTries": 20,
            "populationChampionNumberOffspring": 10,
            "populationChampionNumberClones": 5,
            "populationChampionConnectionMutation": 0.3,
            "mutationAddNode": 0.1,
            "mutateWeights": 0.6,
            "perturbationPower": 2.5,
            "mutateToggleEnableConnection": 0.1,
            "toggleEnableConnectionTimes": 3,
            "mutateEnableConnection": 0.03
        };
        const genInputs = new Map<string, Map<string, number>>();
        const sprite1 = new Map<string, number>();
        sprite1.set("X-Position", 1);
        sprite1.set("Y-Position", 2);
        sprite1.set("Costume", 3);
        sprite1.set("DistanceToSprite2-X", 4);
        sprite1.set("DistanceToSprite2-y", 5);
        genInputs.set("Sprite1", sprite1);
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        const chromosomeGenerator = new NetworkChromosomeGeneratorSparse(mutationConfig, crossoverConfig, genInputs, events, 0.4);
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
        properties.numberOfSpecies = 5;
        population = new NeatPopulation(chromosomeGenerator, properties);
        population.generatePopulation();
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
        expect(population.species.length).toBeGreaterThan(0);
        expect(population.chromosomes.length).toBe(size);
        expect(population.properties).toBeInstanceOf(NeuroevolutionProperties);
        expect(population.averageFitness).toBe(0);
    })

    test("Test Getter and Setter", () => {

        population.speciesCount = 3;
        population.highestFitness = 3;
        population.highestFitnessLastChanged = 3;
        population.generation = 3;
        population.averageFitness = 3;

        const champ = population.chromosomes[0];
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
            population.updatePopulationStatistics();
            population.evolve();
        }
        const newGeneration = population.chromosomes;

        expect(oldGeneration).not.toContainEqual(newGeneration);
        expect(population.speciesCount).toBeGreaterThan(0);
        expect(population.generation).toBe(50);
        expect(population.species.length).toBeGreaterThan(0);
        expect(population.chromosomes.length).toBe(size);
    })

    test("Test evolution stagnant population with only one species", () => {
        population.highestFitness = 60;
        population.highestFitnessLastChanged = 100;
        for (let i = 1; i < population.species.length; i++) {
            Arrays.remove(population.species, population.species[i]);
        }
        population.updatePopulationStatistics()
        population.evolve();
        expect(population.species.length).toBe(1);
        expect(population.species[0].chromosomes.length).toBe(size);
    })

    test("Test evolve with distance Threshold below 0.3", () => {
        population.generation = 3;
        population.properties.distanceThreshold = 0.1;
        population.updatePopulationStatistics();
        population.evolve();
        expect(population.properties.distanceThreshold).toBe(0.3);
    })

})
