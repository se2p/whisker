import {Species} from "../../../src/whisker/whiskerNet/Species";
import {NetworkChromosome} from "../../../src/whisker/whiskerNet/NetworkChromosome";
import {List} from "../../../src/whisker/utils/List";
import {NetworkChromosomeGenerator} from "../../../src/whisker/whiskerNet/NetworkChromosomeGenerator";
import {NeatCrossover} from "../../../src/whisker/whiskerNet/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/whiskerNet/NeatMutation";
import {Randomness} from "../../../src/whisker/utils/Randomness";
import {NeatPopulation} from "../../../src/whisker/whiskerNet/NeatPopulation";
import {NeuroevolutionProperties} from "../../../src/whisker/whiskerNet/NeuroevolutionProperties";

describe("Species Test", () => {

    let crossOver: NeatCrossover;
    let mutation: NeatMutation;
    let inputs: number[][];
    let numberOutputs: number;
    let generator: NetworkChromosomeGenerator
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
        inputs = [[1,2,3,4,5,6]]
        numberOutputs = 3;
        generator = new NetworkChromosomeGenerator(mutation, crossOver, inputs, numberOutputs, 0.4, false)
        population = new List<NetworkChromosome>();
        populationSize = 50;
        properties = new NeuroevolutionProperties(populationSize);
        properties.ageSignificance = 1.0
        properties.parentsPerSpecies = 0.2
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

    test("Test assignAdjustFitness()", () => {
        species.assignAdjustFitness();

        expect(champion.networkFitness).toBeGreaterThan(species.chromosomes.get(1).networkFitness);
        expect(champion.networkFitness).toBe(10)
        expect(champion.sharedFitness).toBe(
            champion.networkFitness * properties.ageSignificance / species.chromosomes.size())
    })

    test("Calculate the number of Offspring with leftOver of 0", () => {
        species.assignAdjustFitness();

        let totalOffsprings = 0;
        let avgFitness = 0;
        for (const c of species.chromosomes) {
            avgFitness += c.networkFitness;
        }
        avgFitness /= species.chromosomes.size();
        for (const c of species.chromosomes) {
            c.expectedOffspring = c.networkFitness / avgFitness;
            totalOffsprings += c.expectedOffspring;
        }
        const leftOver = species.getNumberOfOffspringsOriginal(0);
        expect(Math.floor(totalOffsprings)).toBeLessThanOrEqual(species.expectedOffspring + 1)
        expect(leftOver).toBeLessThan(1)
    })

    test("Calculate the number of Offspring with leftOver of 0.99", () => {
        species.assignAdjustFitness();

        let totalOffsprings = 0;
        let avgFitness = 0;
        for (const c of species.chromosomes) {
            avgFitness += c.networkFitness;
        }
        avgFitness /= species.chromosomes.size();
        for (const c of species.chromosomes) {
            c.expectedOffspring = c.networkFitness / avgFitness;
            totalOffsprings += c.expectedOffspring;
        }
        const leftOver = species.getNumberOfOffspringsOriginal(0.99);
        expect(Math.floor(totalOffsprings)).toBeLessThanOrEqual(species.expectedOffspring + 1)
        expect(leftOver).toBeGreaterThan(0.98)
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

    test("Sieve Weak Chromosomes", () =>{
        for (let i = 0; i < 10; i++) {
            const chromosome = generator.get()
            chromosome.networkFitness = 0;
            species.addChromosome(chromosome)
        }
        species.assignAdjustFitness();
        const sizeBeforeSieve = species.size();
        const sievedChromosomes = species.sieveWeakChromosomes(10);
        expect(species.size()).toBe(sizeBeforeSieve - 10);
        expect(sievedChromosomes.size()).toBe(10)
    })

    test("Breed new Chromosomes in Species", () => {
        properties.distanceThreshold = 20;
        properties.weightCoefficient = 0.1;
        properties.disjointCoefficient = 0.1
        properties.excessCoefficient = 0.1;
        const neatPopulation = new NeatPopulation(50, 1, generator, properties)
        const speciesList = new List<Species<NetworkChromosome>>();
        const popSpecie = neatPopulation.species.get(0);

        for (let i = 0; i < popSpecie.chromosomes.size(); i++) {
            popSpecie.chromosomes.get(i).networkFitness = (i % 5) + 1;
        }
        champion = random.pickRandomElementFromList(popSpecie.chromosomes)
        champion.networkFitness = 10;
        champion.isPopulationChampion = true;
        champion.numberOffspringPopulationChamp = 3;

        speciesList.add(popSpecie);
        speciesList.add(new Species<NetworkChromosome>(1, true, properties))
        popSpecie.assignAdjustFitness();

        let avgFitness = 0;
        for (const c of popSpecie.chromosomes) {
            avgFitness += c.networkFitness;
        }
        avgFitness /= popSpecie.chromosomes.size();
        for (const c of popSpecie.chromosomes) {
            c.expectedOffspring = c.networkFitness / avgFitness;
        }
        popSpecie.getNumberOfOffspringsOriginal(0);
        const sizeBeforeBreed = popSpecie.size();

        popSpecie.breed(neatPopulation, speciesList)

        // We did not eliminate the marked Chromosomes here therefore 2 times the size of the old population
        expect(popSpecie.size()).toBeLessThanOrEqual(2 * sizeBeforeBreed)
    })
})
