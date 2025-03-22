import {fc, test} from "@fast-check/jest";
import {IntegerListChromosome} from "../../../src/whisker/integerlist/IntegerListChromosome";
import {Randomness} from "../../../src/whisker/utils/Randomness";
import {BiasedVariableLengthMutation} from "../../../src/whisker/integerlist/BiasedVariableLengthMutation";
import {SinglePointRelativeCrossover} from "../../../src/whisker/search/operators/SinglePointRelativeCrossover";

const num = fc.double();
const nat = fc.nat();
const pos = nat.map((n) => n + 1);

const ijn = fc.tuple(nat, nat, pos)
    .filter(([i, j, n]) => i < n && j < n && i !== j)
    .map(([i, j, n]) => i < j ? [i, j, n] : [j, i, n]);

const mut = fc.tuple(num, num, nat, nat, num)
    .map(([min, max, len, res, gauss]) => new BiasedVariableLengthMutation(min, max, len, res, gauss));

describe("BiasedVariableLengthMutation Test", () => {
    const random = Randomness.getInstance();
    const min = 0;
    const max = 420;
    const crossover = new SinglePointRelativeCrossover<IntegerListChromosome>(2);
    const mutation = new BiasedVariableLengthMutation(min, max, 20, 2, 5);

    test("Test apply mutation", async () => {
        const codons = Array.from({length: 10}, () => Math.floor(random.nextInt(min, max)));
        const chromosome = new IntegerListChromosome(codons, mutation, crossover);
        let mutant = await mutation.apply(chromosome);
        for (let i = 0; i < 30; i++) {
            mutant = await mutation.apply(mutant);
        }
        expect(mutant.getGenes()).not.toEqual(chromosome.getGenes());
    });

    test("Test apply mutation with minimal chromosome size of 2 (specified virtual space)", async () => {
        const codons = Array.from({length: 2}, () => Math.floor(random.nextInt(min, max)));
        const chromosome = new IntegerListChromosome(codons, mutation, crossover);
        let mutant = await mutation.apply(chromosome);
        for (let i = 0; i < 30; i++) {
            mutant = await mutation.apply(mutant);
        }
        expect(mutant.getGenes()).not.toEqual(chromosome.getGenes());
    });

    test("Test apply mutation maximum chromosome size", async () => {
        const codons = Array.from({length: 20}, () => Math.floor(random.nextInt(min, max)));
        const chromosome = new IntegerListChromosome(codons, mutation, crossover);
        let mutant = await mutation.apply(chromosome);
        for (let i = 0; i < 30; i++) {
            mutant = await mutation.apply(mutant);
        }
        expect(mutant.getGenes()).not.toEqual(chromosome.getGenes());
    });

    test.prop([mut, ijn])("Smaller indices should have smaller mutation probability compared to larger indices",
        (mut, [i, j, n]) => {
            expect(mut.getMutationProbability(i, n)).toBeLessThan(mut.getMutationProbability(j, n));
        });
});
