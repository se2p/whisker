import {IntegerListChromosome} from "../../../src/whisker/integerlist/IntegerListChromosome";
import {Randomness} from "../../../src/whisker/utils/Randomness";
import {VariableLengthMutation} from "../../../src/whisker/integerlist/VariableLengthMutation";
import {SinglePointRelativeCrossover} from "../../../src/whisker/search/operators/SinglePointRelativeCrossover";

describe("VariableLengthMutation Test", () => {

    const random = Randomness.getInstance();
    const min = 0;
    const max = 420;
    const crossover = new SinglePointRelativeCrossover<IntegerListChromosome>(3);
    const mutation = new VariableLengthMutation(min, max, 20, 3, 5);

    test("Test apply mutation", () => {
        const codons = Array.from({length: 10}, () => Math.floor(random.nextInt(min, max)));
        const chromosome = new IntegerListChromosome(codons, mutation, crossover);
        let mutant = mutation.apply(chromosome);
        for (let i = 0; i < 30; i++) {
            mutant = mutation.apply(mutant);
        }
        expect(mutant.getGenes()).not.toEqual(chromosome.getGenes());
    });

    test("Test apply mutation with minimal chromosome size of 3 (specified virtual space)", () => {
        const codons = Array.from({length: 3}, () => Math.floor(random.nextInt(min, max)));
        const chromosome = new IntegerListChromosome(codons, mutation, crossover);
        let mutant = mutation.apply(chromosome);
        for (let i = 0; i < 30; i++) {
            mutant = mutation.apply(mutant);
        }
        expect(mutant.getGenes()).not.toEqual(chromosome.getGenes());
    });

    test("Test apply mutation maximum chromosome size", () => {
        const codons = Array.from({length: 20}, () => Math.floor(random.nextInt(min, max)));
        const chromosome = new IntegerListChromosome(codons, mutation, crossover);
        let mutant = mutation.apply(chromosome);
        for (let i = 0; i < 30; i++) {
            mutant = mutation.apply(mutant);
        }
        expect(mutant.getGenes()).not.toEqual(chromosome.getGenes());
    });
});
