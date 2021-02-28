import {Species} from "../../../src/whisker/NEAT/Species";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {List} from "../../../src/whisker/utils/List";
import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {Randomness} from "../../../src/whisker/utils/Randomness";
import {NeatPopulation} from "../../../src/whisker/NEAT/NeatPopulation";
import {NeuroevolutionProperties} from "../../../src/whisker/NEAT/NeuroevolutionProperties";

describe("Species Test", () => {

    let crossOver: NeatCrossover;
    let mutation: NeatMutation;
    let numberInputs: number;
    let numberOutputs: number;
    let generator: NeatChromosomeGenerator
    let species: Species<NeatChromosome>;
    let population: List<NeatChromosome>;
    let populationSize: number;
    let random: Randomness;
    let champion: NeatChromosome;
    let properties: NeuroevolutionProperties<NeatChromosome>

    beforeEach(() => {
        crossOver = new NeatCrossover(0.4);
        mutation = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8,
            1.5, 0.1, 3, 0.1);
        numberInputs = 6;
        numberOutputs = 3;
        generator = new NeatChromosomeGenerator(mutation, crossOver, numberInputs, numberOutputs, 0.4, false)
        population = new List<NeatChromosome>();
        populationSize = 50;
        properties = new NeuroevolutionProperties(populationSize);
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
        champion.nonAdjustedFitness = 10;
    })

    test("Test markKillCandidates()", () => {
        species.markKillCandidates();

        const eliminateList = new List<NeatChromosome>();
        for (const c of species.chromosomes)
            if (c.eliminate)
                eliminateList.add(c);

        expect(species.chromosomes.get(0).networkFitness).toBe(10);
        expect(species.chromosomes.get(0).champion).toBe(true);
        expect(species.chromosomes.get(0).eliminate).toBe(false);
        expect(species.allTimeBestFitness).toBe(10);
        expect(species.ageOfLastImprovement).toBe(species.age);
    })

    test("Test assignAdjustFitness()", () => {
        species.assignAdjustFitness();

        expect(champion.fitness).toBeGreaterThan(species.chromosomes.get(1).fitness);
        expect(champion.fitness).toBe(
            champion.nonAdjustedFitness * properties.ageSignificance / species.chromosomes.size())
        expect(species.chromosomes.get(1).fitness).toBe(
            species.chromosomes.get(1).nonAdjustedFitness * properties.ageSignificance / species.chromosomes.size())
        expect(champion.fitness).not.toBe(champion.nonAdjustedFitness)
    })

    test("Calculate the number of Offspring with leftOver of 0", () => {
        species.assignAdjustFitness();

        let totalOffsprings = 0;
        let avgFitness = 0;
        for (const c of species.chromosomes) {
            avgFitness += c.fitness;
        }
        avgFitness /= species.chromosomes.size();
        for (const c of species.chromosomes) {
            c.expectedOffspring = c.fitness / avgFitness;
            totalOffsprings += c.expectedOffspring;
        }
        const leftOver = species.getNumberOfOffsprings(0);
        expect(Math.floor(totalOffsprings)).toBe(species.expectedOffspring)
        expect(leftOver).toBeLessThan(1)
    })

    test("Calculate the number of Offspring with leftOver of 0.99", () => {
        species.assignAdjustFitness();

        let totalOffsprings = 0;
        let avgFitness = 0;
        for (const c of species.chromosomes) {
            avgFitness += c.fitness;
        }
        avgFitness /= species.chromosomes.size();
        for (const c of species.chromosomes) {
            c.expectedOffspring = c.fitness / avgFitness;
            totalOffsprings += c.expectedOffspring;
        }
        const leftOver = species.getNumberOfOffsprings(0.99);
        expect(Math.floor(totalOffsprings)).toBe(species.expectedOffspring)
        expect(leftOver).toBeGreaterThan(0.99)
    })

    test("Remove and Add Chromosome", () => {
        const speciesSizeBefore = species.size();
        const testChrom = generator.get();
        species.addChromosome(testChrom)
        const speciesSizeAdded = species.size();
        species.removeChromosome(testChrom);
        const speciesSizeRemoved = species.size();

        expect(speciesSizeAdded).toBe(speciesSizeBefore + 1);
        expect(speciesSizeRemoved).toBe(speciesSizeBefore)
    })

    test("Breed new Chromosomes in Species", () => {
        const neatPopulation = new NeatPopulation(50, 1, generator, properties)
        const speciesList = new List<Species<NeatChromosome>>();
        const popSpecie = neatPopulation.species.get(0);

        for (let i = 0; i < popSpecie.chromosomes.size(); i++) {
            popSpecie.chromosomes.get(i).fitness = (i % 5) + 1;
        }
        champion = random.pickRandomElementFromList(popSpecie.chromosomes)
        champion.fitness = 10;
        champion.nonAdjustedFitness = 10;
        champion.populationChampion = true;
        champion.numberOffspringPopulationChamp = 3;

        speciesList.add(popSpecie);
        speciesList.add(new Species<NeatChromosome>(1, true, properties))
        popSpecie.assignAdjustFitness();

        let avgFitness = 0;
        for (const c of popSpecie.chromosomes) {
            avgFitness += c.fitness;
        }
        avgFitness /= popSpecie.chromosomes.size();
        for (const c of popSpecie.chromosomes) {
            c.expectedOffspring = c.fitness / avgFitness;
        }
        popSpecie.getNumberOfOffsprings(0);
        const sizeBeforeBreed = popSpecie.size();

        for (let i = 0; i < 100; i++) {
            popSpecie.breed(neatPopulation, speciesList)
        }

        // We did not eliminate the marked Chromosomes here therefore 101 the size of the old population
        expect(popSpecie.size()).toBe(101 * sizeBeforeBreed)
    })
})
