import {Species} from "../../../src/whisker/whiskerNet/Species";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/NetworkChromosome";
import {List} from "../../../src/whisker/utils/List";
import {NetworkChromosomeGeneratorSparse} from "../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorSparse";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/whiskerNet/NeatMutation";
import {Randomness} from "../../../src/whisker/utils/Randomness";
import {NeatPopulation} from "../../../src/whisker/whiskerNet/NeatPopulation";
import {NeuroevolutionProperties} from "../../../src/whisker/whiskerNet/NeuroevolutionProperties";

describe("Species Test", () => {

    let crossOver: NeatCrossover;
    let mutation: NeatMutation;
    let inputs: Map<string, number[]>;
    let numberOutputs: number;
    let generator: NetworkChromosomeGeneratorSparse
    let species: Species<NetworkChromosome>;
    let population: List<NetworkChromosome>;
    let populationSize: number;
    let random: Randomness;
    let champion: NetworkChromosome;
    let properties: NeuroevolutionProperties<NetworkChromosome>

    beforeEach(() => {
        crossOver = new NeatCrossover(0.4);
        mutation = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8,
            1.5, 0.1, 3, 0.1);
        inputs = new Map<string, number[]>();
        inputs.set("First", [1,2,3,4,5,6]);
        numberOutputs = 3;
        generator = new NetworkChromosomeGeneratorSparse(mutation, crossOver, inputs, numberOutputs, 0.4, false)
        population = new List<NetworkChromosome>();
        populationSize = 50;
        properties = new NeuroevolutionProperties(populationSize);
        properties.ageSignificance = 1.0
        properties.parentsPerSpecies = 0.2
        properties.mutationWithoutCrossover = 0.3
        properties.interspeciesMating = 0.1;
        properties.populationChampionNumberOffspring = 5;
        properties.populationChampionNumberClones = 3;
        species = new Species(0, false, properties);
        while (population.size() < populationSize)
            population.add(generator.get())
        species.chromosomes.addList(population);
        random = Randomness.getInstance();
        for (let i = 0; i < species.chromosomes.size(); i++) {
            species.chromosomes.get(i).networkFitness = (i % 5) + 1;
        }
        champion = random.pickRandomElementFromList(species.chromosomes)
        champion.networkFitness = 10;
    })

    test("Test Constructor", () =>{
        const species = new Species(1, true, properties);
        expect(species.id).toBe(1)
        expect(species.age).toBe(1)
        expect(species.averageFitness).toBe(0)
        expect(species.expectedOffspring).toBe(0)
        expect(species.isNovel).toBeTruthy()
        expect(species.ageOfLastImprovement).toBe(0)
        expect(species.currentBestFitness).toBe(0)
        expect(species.allTimeBestFitness).toBe(0)
        expect(species.properties).toBe(properties)
        expect(species.chromosomes.size()).toBe(0)
    })

    test("Test Getter and Setter", () =>{
        species.age = 10;
        species.averageFitness = 3;
        species.expectedOffspring = 4;
        species.isNovel = true
        species.ageOfLastImprovement = 7;
        species.currentBestFitness = 5;
        species.allTimeBestFitness = 6;

        expect(species.age).toBe(10)
        expect(species.averageFitness).toBe(3)
        expect(species.expectedOffspring).toBe(4)
        expect(species.isNovel).toBeTruthy()
        expect(species.ageOfLastImprovement).toBe(7)
        expect(species.currentBestFitness).toBe(5)
        expect(species.allTimeBestFitness).toBe(6)
        expect(species.properties).toBeInstanceOf(NeuroevolutionProperties)
        expect(species.chromosomes.get(0)).toBeInstanceOf(NetworkChromosome)
    })

    test("Test assignAdjustFitness()", () => {
        species.assignAdjustFitness();

        expect(champion.networkFitness).toBe(10)
        expect(champion.sharedFitness).toBe(
            champion.networkFitness * properties.ageSignificance / species.chromosomes.size())
    })

    test("Test assignAdjustFitness() with negative fitness values", () => {
        champion.networkFitness = -1;
        species.assignAdjustFitness();

        expect(champion.sharedFitness).toBeGreaterThan(0)
        expect(champion.sharedFitness).toBeLessThan(1)
    })

    test("Test assignAdjustFitness() with stagnant species", () =>{
        species.age = 10;
        species.ageOfLastImprovement = 6;
        species.properties.penalizingAge = 5;
        species.assignAdjustFitness();

        expect(champion.networkFitness).toBe(10)
        expect(champion.sharedFitness).toBe(
            champion.networkFitness * 0.01 * properties.ageSignificance / species.chromosomes.size())
    })

    test("Test markKillCandidates()", () => {
        species.markKillCandidates();

        const eliminateList = new List<NetworkChromosome>();
        for (const c of species.chromosomes)
            if (c.hasDeathMark)
                eliminateList.add(c);

        expect(species.chromosomes.get(0).networkFitness).toBe(10);
        expect(species.chromosomes.get(0).isSpeciesChampion).toBe(true);
        expect(species.chromosomes.get(0).hasDeathMark).toBe(false);
        expect(species.allTimeBestFitness).toBe(10);
        expect(species.ageOfLastImprovement).toBe(species.age);
    })

    test("Calculate the number of Offspring with leftOver of 0 using NEAT", () => {
        species.assignAdjustFitness();

        let totalOffsprings = 0;
        const avgFitness = species.averageSpeciesFitness();
        for (const c of species.chromosomes) {
            c.expectedOffspring = c.networkFitness / avgFitness;
            totalOffsprings += c.expectedOffspring;
        }
        const leftOver = species.getNumberOfOffspringsNEAT(0);
        expect(Math.floor(totalOffsprings)).toBeLessThanOrEqual(species.expectedOffspring + 1)
        expect(leftOver).toBeLessThan(1)
    })

    test("Calculate the number of Offspring with leftOver of 0.99 using NEAT", () => {
        species.assignAdjustFitness();

        let totalOffsprings = 0;
        const avgFitness = species.averageSpeciesFitness();
        for (const c of species.chromosomes) {
            c.expectedOffspring = c.networkFitness / avgFitness;
            totalOffsprings += c.expectedOffspring;
        }
        const leftOver = species.getNumberOfOffspringsNEAT(0.99);
        expect(Math.floor(totalOffsprings)).toBeLessThanOrEqual(species.expectedOffspring + 1)
        expect(leftOver).toBeGreaterThan(0.98)
    })

    test("Calculate the number of Offspring with leftOver of 0 using avgSpeciesFitness", () => {
        species.assignAdjustFitness();
        const leftOver = species.getNumberOffspringsAvg(0, 30, populationSize);
        expect(Math.floor(species.expectedOffspring)).toBeLessThan(50)
        expect(leftOver).toBeLessThan(1)
    })

    test("Calculate the number of Offspring with leftOver of 0.99 using avgSpeciesFitness", () => {
        species.assignAdjustFitness();
        const leftOver = species.getNumberOffspringsAvg(0.99, 30, populationSize);
        expect(Math.floor(species.expectedOffspring)).toBeLessThan(50)
        expect(leftOver).toBeGreaterThan(0.98)
    })

    test("Test remove and add Chromosome", () => {
        const speciesSizeBefore = species.size();
        const testChromosome = generator.get();
        species.addChromosome(testChromosome)
        const speciesSizeAdded = species.size();
        species.removeChromosome(testChromosome);
        const speciesSizeRemoved = species.size();

        expect(speciesSizeAdded).toBe(speciesSizeBefore + 1);
        expect(speciesSizeRemoved).toBe(speciesSizeBefore)
    })

    test("Test breed new networks in Species", () => {
        properties.distanceThreshold = 20;
        properties.weightCoefficient = 0.1;
        properties.disjointCoefficient = 0.1
        properties.excessCoefficient = 0.1;
        const population = new NeatPopulation(50, 1, generator, properties)
        const speciesList = new List<Species<NetworkChromosome>>();
        const popSpecie = population.species.get(0);

        for (let i = 0; i < popSpecie.chromosomes.size(); i++) {
            popSpecie.chromosomes.get(i).networkFitness = (i % 5) + 1;
        }
        const popChampion = random.pickRandomElementFromList(popSpecie.chromosomes)
        popChampion.networkFitness = 10;
        popChampion.isPopulationChampion = true;
        popChampion.numberOffspringPopulationChamp = 5;

        const champion = random.pickRandomElementFromList(popSpecie.chromosomes)
        champion.isSpeciesChampion = true;

        speciesList.add(popSpecie);
        speciesList.add(new Species<NetworkChromosome>(1, true, properties))
        popSpecie.assignAdjustFitness();

        popSpecie.averageSpeciesFitness();
        popSpecie.expectedOffspring = 50;
        const sizeBeforeBreed = popSpecie.size();

        for (let i = 0; i < 100; i++) {
        popSpecie.breed(population, speciesList)
        }

        // We did not eliminate the marked Chromosomes here therefore 2 times the size of the old population
        expect(popSpecie.size()).toBeLessThanOrEqual(2 * sizeBeforeBreed)
    })

    test("Test breed new networks with an empty species", () => {
        properties.distanceThreshold = 20;
        properties.weightCoefficient = 0.1;
        properties.disjointCoefficient = 0.1
        properties.excessCoefficient = 0.1;
        const population = new NeatPopulation(50, 1, generator, properties)
        const speciesList = new List<Species<NetworkChromosome>>();
        const popSpecie = population.species.get(0);
        popSpecie.chromosomes.clear();
        popSpecie.expectedOffspring = 10;

        popSpecie.breed(population, speciesList)

        // We did not eliminate the marked Chromosomes here therefore 2 times the size of the old population
        expect(popSpecie.size()).toBe(0)
    })

    test(" Test averageSpeciesFitness", () =>{
        species.assignAdjustFitness();
        const avgFitness = species.averageSpeciesFitness();
        expect(avgFitness).toBeLessThan(10)
        expect(avgFitness).toBeGreaterThan(0)
    })
})
