import {IntegerListChromosome} from "../../../src/whisker/integerlist/IntegerListChromosome";
import {List} from "../../../src/whisker/utils/List";
import {Randomness} from "../../../src/whisker/utils/Randomness";
import {VariableLengthMutation} from "../../../src/whisker/integerlist/VariableLengthMutation";
import {SinglePointRelativeCrossover} from "../../../src/whisker/search/operators/SinglePointRelativeCrossover";

describe("VariableLengthMutation Test", () => {

    const random = Randomness.getInstance();
    const min = 0;
    const max = 420;
    const length = 50;
    let chromosome: IntegerListChromosome;
    let variableLengthMutation: VariableLengthMutation

    beforeEach(() => {
        const codons = new List<number>();
        const chromosomeSize = random.nextInt(1, length - 1);
        for (let i = 0; i < chromosomeSize; i++) {
            codons.add(random.nextInt(min, max))
        }
        chromosome = new IntegerListChromosome(codons, variableLengthMutation,
            new SinglePointRelativeCrossover<IntegerListChromosome>());
    })

    test("Test insert mutation", () => {
        variableLengthMutation = new VariableLengthMutation(
            min, max, length, 0, 0, 1, 1, 0.5)
        const mutant = variableLengthMutation.apply(chromosome)
        expect(mutant.getLength()).toBeGreaterThan(chromosome.getLength())
    })

    test("Test remove mutation", () => {
        variableLengthMutation = new VariableLengthMutation(
            min, max, length, 1, 0, 1, 0, 0.5)
        const mutant = variableLengthMutation.apply(chromosome)
        expect(mutant.getLength()).toBeLessThanOrEqual(chromosome.getLength())
    })

    test("Test remove mutation with minimal ChromosomeLength", () => {
        const codons = new List<number>([1, 1]);
        const chromosome = new IntegerListChromosome(codons, variableLengthMutation,
            new SinglePointRelativeCrossover<IntegerListChromosome>());
        variableLengthMutation = new VariableLengthMutation(
            min, max, length, 1, 0, 1, 0, 0.5)
        for (let i = 0; i < 50; i++) {
            const mutant = variableLengthMutation.apply(chromosome)
            expect(mutant.getLength()).toBeGreaterThanOrEqual(1)
        }
    })

    test("Test change mutation", () => {
        variableLengthMutation = new VariableLengthMutation(
            min, max, length, 0, 1, 5, 0, 0)
        let mutant = variableLengthMutation.apply(chromosome)
        for (let i = 0; i < 50; i++) {
            mutant = variableLengthMutation.apply(mutant)
        }
        expect(mutant.getGenes().getElements()).not.toEqual(chromosome.getGenes().getElements())
    })
})
