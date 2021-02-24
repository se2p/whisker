import {Species} from "../../../src/whisker/NEAT/Species";
import {NeatChromosome} from "../../../src/whisker/NEAT/NeatChromosome";
import {List} from "../../../src/whisker/utils/List";
import {NeatChromosomeGenerator} from "../../../src/whisker/NEAT/NeatChromosomeGenerator";
import {NeatCrossover} from "../../../src/whisker/NEAT/NeatCrossover";
import {NeatMutation} from "../../../src/whisker/NEAT/NeatMutation";
import {Randomness} from "../../../src/whisker/utils/Randomness";
import {NeatConfig} from "../../../src/whisker/NEAT/NeatConfig";

describe("Species Test", () => {

    let crossOver: NeatCrossover;
    let mutation: NeatMutation;
    let numberInputs: number;
    let numberOutputs: number;
    let generator: NeatChromosomeGenerator
    let species: Species<NeatChromosome>;
    let population: List<NeatChromosome>;
    let populationSize: number;
    let random : Randomness

    beforeEach(() => {
        crossOver = new NeatCrossover();
        mutation = new NeatMutation();
        numberInputs = 6;
        numberOutputs = 3;
        generator = new NeatChromosomeGenerator(mutation, crossOver, numberInputs, numberOutputs)
        population = new List<NeatChromosome>();
        populationSize = 50;
        species = new Species(0, false);
        while (population.size() < populationSize)
            population.add(generator.get())
        species.chromosomes.addList(population);
        random = Randomness.getInstance();
    })

    test("Test markKillCandidates()", () =>{
        for (let i = 0; i < species.chromosomes.size(); i++) {
            species.chromosomes.get(i).fitness = (i % 5) + 1;
        }
        const champion = random.pickRandomElementFromList(species.chromosomes)
        champion.fitness = 10;
        champion.nonAdjustedFitness = 10;

        species.markKillCandidates();

        const eliminateList = new List<NeatChromosome>();
        for(const c of species.chromosomes)
            if(c.eliminate)
                eliminateList.add(c);

        expect(species.chromosomes.get(0).fitness).toBe(10);
        expect(species.chromosomes.get(0).champion).toBe(true);
        expect(species.chromosomes.get(0).eliminate).toBe(false);
        expect(species.allTimeBestFitness).toBe(10);
        expect(species.ageOfLastImprovement).toBe(species.age);
        expect(eliminateList.size()).toBeGreaterThanOrEqual(species.chromosomes.size() - (Math.floor(NeatConfig.SPECIES_PARENTS * species.chromosomes.size()) + 1))
    })

    test("Test assignAdjustFitness()", () =>{
        for (let i = 0; i < species.chromosomes.size(); i++) {
            species.chromosomes.get(i).fitness = (i % 5) + 1;
        }
        const champion = random.pickRandomElementFromList(species.chromosomes)
        champion.fitness = 10;
        champion.nonAdjustedFitness = 10;

        species.assignAdjustFitness();
        expect(champion.fitness).toBeGreaterThan(species.chromosomes.get(1).fitness);
        expect(champion.fitness).toBe(0.22)
        expect(species.chromosomes.get(1).fitness).toBe(0.11)
        expect(champion.fitness).not.toBe(champion.nonAdjustedFitness)
    })
})
