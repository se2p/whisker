import {Species} from "../../../../src/whisker/whiskerNet/NeuroevolutionPopulations/Species";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {NeatPopulation} from "../../../../src/whisker/whiskerNet/NeuroevolutionPopulations/NeatPopulation";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {NeatChromosome} from "../../../../src/whisker/whiskerNet/Networks/NeatChromosome";
import Arrays from "../../../../src/whisker/utils/Arrays";
import {NeuroevolutionTestGenerationParameter} from "../../../../src/whisker/whiskerNet/HyperParameter/NeuroevolutionTestGenerationParameter";
import {Container} from "../../../../src/whisker/utils/Container";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {generateInputs} from "../Algorithms/NEAT.test";

describe("Species Test", () => {

    let generator: NeatChromosomeGenerator;
    let species: Species<NeatChromosome>;
    let populationSize: number;
    let random: Randomness;
    let champion: NeatChromosome;
    let properties: NeuroevolutionTestGenerationParameter;

    beforeEach(() => {
        Container.debugLog = () => { /* suppress output */};
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
        const mutationOp = new NeatMutation(mutationConfig);
        const crossoverOp = new NeatCrossover(crossoverConfig);
        const genInputs = generateInputs();
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        generator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, mutationOp, crossoverOp);
        const population: NeatChromosome[] = [];
        populationSize = 50;
        properties = new NeuroevolutionTestGenerationParameter();
        properties.ageSignificance = 1.0;
        properties.parentsPerSpecies = 0.2;
        properties.mutationWithoutCrossover = 0.3;
        properties.interspeciesMating = 0.1;
        properties.populationChampionNumberOffspring = 5;
        properties.populationChampionNumberClones = 3;
        species = new Species(0, false, properties);
        while (population.length < populationSize) {
            population.push(generator.get() as NeatChromosome);
        }
        species.networks.push(...population);
        random = Randomness.getInstance();
        for (let i = 0; i < species.networks.length; i++) {
            species.networks[i].fitness = (i % 5) + 1;
        }
        champion = random.pick(species.networks);
        champion.fitness = 10;
    });

    test("Test Constructor", () => {
        const species = new Species(1, true, properties);
        expect(species.uID).toBe(1);
        expect(species.age).toBe(1);
        expect(species.averageSharedFitness).toBe(0);
        expect(species.expectedOffspring).toBe(0);
        expect(species.isNovel).toBeTruthy();
        expect(species.ageOfLastImprovement).toBe(1);
        expect(species.currentBestFitness).toBe(0);
        expect(species.allTimeBestFitness).toBe(0);
        expect(species.hyperParameter).toBe(properties);
        expect(species.networks.length).toBe(0);
    });

    test("Test Getter and Setter", () => {
        species.age = 10;
        species.averageSharedFitness = 3;
        species.expectedOffspring = 4;
        species.isNovel = true;
        species.ageOfLastImprovement = 7;
        species.currentBestFitness = 5;
        species.allTimeBestFitness = 6;

        expect(species.age).toBe(10);
        expect(species.averageSharedFitness).toBe(3);
        expect(species.expectedOffspring).toBe(4);
        expect(species.isNovel).toBeTruthy();
        expect(species.ageOfLastImprovement).toBe(7);
        expect(species.currentBestFitness).toBe(5);
        expect(species.allTimeBestFitness).toBe(6);
        expect(species.hyperParameter).toBeInstanceOf(NeuroevolutionTestGenerationParameter);
        expect(species.networks[0]).toBeInstanceOf(NeatChromosome);
    });

    test("Test assignAdjustFitness()", () => {
        species.assignSharedFitness();

        expect(champion.fitness).toBe(10);
        expect(champion.sharedFitness).toBe(
            champion.fitness * properties.ageSignificance / species.networks.length);
    });

    test("Test assignAdjustFitness() with negative fitness values", () => {
        champion.fitness = -1;
        species.assignSharedFitness();

        expect(champion.sharedFitness).toBeGreaterThan(0);
        expect(champion.sharedFitness).toBeLessThan(1);
    });

    test("Test assignAdjustFitness() with stagnant species", () => {
        species.age = 10;
        species.ageOfLastImprovement = 6;
        species.hyperParameter.penalizingAge = 5;
        species.assignSharedFitness();

        expect(champion.fitness).toBe(10);
        expect(champion.sharedFitness).toBe(
            champion.fitness * 0.01 * properties.ageSignificance / species.networks.length);
    });

    test("Test markKillCandidates()", () => {
        species.markParents();
        expect(species.networks[0].fitness).toBe(10);
        expect(species.networks[0].isSpeciesChampion).toBe(true);
        expect(species.networks[0].isParent).toBe(true);
        expect(species.allTimeBestFitness).toBe(10);
        expect(species.ageOfLastImprovement).toBe(species.age);
    });

    test("Calculate the number of Offspring with leftOver of 0 using NEAT", () => {
        species.assignSharedFitness();

        let totalOffsprings = 0;
        const avgFitness = species.calculateAverageSharedFitness();
        for (const c of species.networks) {
            c.expectedOffspring = c.fitness / avgFitness;
            totalOffsprings += c.expectedOffspring;
        }
        const leftOver = species.getNumberOfOffspringsNEAT(0);
        expect(Math.floor(totalOffsprings)).toBeLessThanOrEqual(species.expectedOffspring + 1);
        expect(leftOver).toBeLessThan(1);
    });

    test("Calculate the number of Offspring with leftOver of 0.99 using NEAT", () => {
        species.assignSharedFitness();

        let totalOffsprings = 0;
        const avgFitness = species.calculateAverageSharedFitness();
        for (const c of species.networks) {
            c.expectedOffspring = c.fitness / avgFitness;
            totalOffsprings += c.expectedOffspring;
        }
        const leftOver = species.getNumberOfOffspringsNEAT(0.99);
        expect(Math.floor(totalOffsprings)).toBeLessThanOrEqual(species.expectedOffspring + 1);
        expect(leftOver).toBeGreaterThan(0.98);
    });

    test("Calculate the number of Offspring with leftOver of 0 using avgSpeciesFitness", () => {
        species.assignSharedFitness();
        const leftOver = species.getNumberOffspringsAvg(0, 30, populationSize);
        expect(Math.floor(species.expectedOffspring)).toBeLessThan(50);
        expect(leftOver).toBeLessThan(1);
    });

    test("Calculate the number of Offspring with leftOver of 0.99 using avgSpeciesFitness", () => {
        species.assignSharedFitness();
        const leftOver = species.getNumberOffspringsAvg(0.99, 30, populationSize);
        expect(Math.floor(species.expectedOffspring)).toBeLessThan(50);
        expect(leftOver).toBeGreaterThan(0.98);
    });

    test("Test remove and add Chromosome", () => {
        const speciesSizeBefore = species.networks.length;
        const testChromosome = generator.get() as NeatChromosome;
        species.networks.push(testChromosome);
        const speciesSizeAdded = species.networks.length;
        species.removeNetwork(testChromosome);
        const speciesSizeRemoved = species.networks.length;

        expect(speciesSizeAdded).toBe(speciesSizeBefore + 1);
        expect(speciesSizeRemoved).toBe(speciesSizeBefore);
    });

    test("Test breed new networks in Species", () => {
        properties.compatibilityDistanceThreshold = 20;
        properties.weightCoefficient = 0.1;
        properties.disjointCoefficient = 0.1;
        properties.excessCoefficient = 0.1;
        const population = new NeatPopulation(generator, properties);
        population.generatePopulation();
        const speciesList: Species<NeatChromosome>[] = [];
        const popSpecie = population.species[0];

        for (let i = 0; i < popSpecie.networks.length; i++) {
            popSpecie.networks[i].fitness = (i % 5) + 1;
        }
        const popChampion = random.pick(popSpecie.networks);
        popChampion.fitness = 10;
        popChampion.isPopulationChampion = true;
        popChampion.numberOffspringPopulationChamp = 5;

        const champion = random.pick(popSpecie.networks);
        champion.isSpeciesChampion = true;

        speciesList.push(popSpecie);
        speciesList.push(new Species<NeatChromosome>(1, true, properties));
        popSpecie.assignSharedFitness();

        popSpecie.calculateAverageSharedFitness();
        popSpecie.expectedOffspring = 50;
        const sizeBeforeBreed = popSpecie.networks.length;

        for (let i = 0; i < 5; i++) {
            popSpecie.evolve(population, speciesList);
        }

        // We did not eliminate the marked Chromosomes here therefore 2 times the size of the old population
        expect(popSpecie.networks.length).toBeLessThanOrEqual(2 * sizeBeforeBreed);
    });

    test("Test breed new networks with an empty species", () => {
        properties.compatibilityDistanceThreshold = 20;
        properties.weightCoefficient = 0.1;
        properties.disjointCoefficient = 0.1;
        properties.excessCoefficient = 0.1;
        const population = new NeatPopulation(generator, properties);
        population.generatePopulation();
        const speciesList: Species<NeatChromosome>[] = [];
        const popSpecie = population.species[0];
        Arrays.clear(popSpecie.networks);
        popSpecie.expectedOffspring = 10;

        popSpecie.evolve(population, speciesList);

        // We did not eliminate the marked Chromosomes here therefore 2 times the size of the old population.
        expect(popSpecie.networks.length).toBe(0);
    });

    test(" Test averageSpeciesFitness", () => {
        species.assignSharedFitness();
        const avgFitness = species.calculateAverageSharedFitness();
        expect(avgFitness).toBeLessThan(10);
        expect(avgFitness).toBeGreaterThan(0);
    });
});
