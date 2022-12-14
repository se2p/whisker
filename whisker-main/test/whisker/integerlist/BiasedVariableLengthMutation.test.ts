import {IntegerListChromosome} from "../../../src/whisker/integerlist/IntegerListChromosome";
import {Randomness} from "../../../src/whisker/utils/Randomness";
import {BiasedVariableLengthMutation} from "../../../src/whisker/integerlist/BiasedVariableLengthMutation";
import {SinglePointRelativeCrossover} from "../../../src/whisker/search/operators/SinglePointRelativeCrossover";

describe("BiasedVariableLengthMutation Test", () => {

    const random = Randomness.getInstance();
    const min = 0;
    const max = 420;
    const crossover = new SinglePointRelativeCrossover<IntegerListChromosome>(2);
    const mutation = new BiasedVariableLengthMutation(min, max, 20, 2, 5);

    test("Test apply mutation", () => {
        const codons = Array.from({length: 10}, () => Math.floor(random.nextInt(min, max)));
        const chromosome = new IntegerListChromosome(codons, mutation, crossover);
        let mutant = mutation.apply(chromosome);
        for (let i = 0; i < 30; i++) {
            mutant = mutation.apply(mutant);
        }
        expect(mutant.getGenes()).not.toEqual(chromosome.getGenes());
    });

    test("Test apply mutation with minimal chromosome size of 2 (specified virtual space)", () => {
        const codons = Array.from({length: 2}, () => Math.floor(random.nextInt(min, max)));
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

    // https://dracoblue.net/dev/linear-least-squares-in-javascript/
    function linearLeastSquares(values_y: number[]): number[] {
        const values_x = [...values_y.keys()];
        const values_length = values_y.length;

        let sum_x = 0;
        let sum_y = 0;
        let sum_xy = 0;
        let sum_xx = 0;
        let count = 0;

        /*
         * We'll use those variables for faster read/write access.
         */
        let x = 0;
        let y = 0;

        /*
         * Nothing to do.
         */
        if (values_length === 0) {
            return [];
        }

        /*
         * Calculate the sum for each of the parts necessary.
         */
        for (let v = 0; v < values_length; v++) {
            x = values_x[v];
            y = values_y[v];
            sum_x += x;
            sum_y += y;
            sum_xx += x*x;
            sum_xy += x*y;
            count++;
        }

        /*
         * Calculate m and b for the formula:
         * y = x * m + b
         */
        const m = (count * sum_xy - sum_x * sum_y) / (count * sum_xx - sum_x * sum_x);
        const b = (sum_y / count) - (m * sum_x) / count;

        /*
         * We will make the x and y result line now
         */
        const result_values_y = [];

        for (let v = 0; v < values_length; v++) {
            x = values_x[v];
            y = x * m + b;
            result_values_y.push(y);
        }

        return result_values_y;
    }

    test("Test mutation bias", () => {
        const repetitions = 30;
        const length = 20;
        const histogram = Array(length).fill(0);

        const recordMutations = (original, mutant) => {
            const originalElements = original.getGenes();
            const mutantElements = mutant.getGenes();

            const zip = (a, b) => a.map((k, i) => [k, b[i], i]);

            for (const [oElem, mElem, idx] of zip(originalElements, mutantElements)) {
                if (oElem !== mElem) {
                    histogram[idx] = histogram[idx] + 1;
                }
            }
        };

        const codons = Array.from({length: length}, () => Math.floor(random.nextInt(min, max)));
        for (let i = 0, chromosome = new IntegerListChromosome(codons, mutation, crossover), mutant; i < repetitions; i++, chromosome = mutant) {
            mutant = mutation.apply(chromosome);
            recordMutations(chromosome, mutant);
        }

        // Higher indices should be mutated more often than lower indices. Thus, we try to fit a linear function to
        // our histogram using the Linear Least Squares algorithm, and check if the resulting curve is ascending.
        const ls = linearLeastSquares(histogram);

        let sorted = true;
        let notAllTheSame = false;
        for (let i = 1; i < length; i++) {
            if (ls[i - 1] > ls[i]) {
                sorted = false;
                break;
            } else if (ls[i - 1] !== ls[i]) {
                notAllTheSame = true;
            }
        }

        expect(sorted && notAllTheSame);
    });
});
