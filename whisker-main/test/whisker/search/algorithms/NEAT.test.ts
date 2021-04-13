import {VMWrapperMock} from "../../utils/VMWrapperMock";
import {Container} from "../../../../src/whisker/utils/Container";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {SearchAlgorithmType} from "../../../../src/whisker/search/algorithms/SearchAlgorithmType";
import {NetworkChromosome} from "../../../../src/whisker/whiskerNet/NetworkChromosome";
import {NeuroevolutionProperties} from "../../../../src/whisker/whiskerNet/NeuroevolutionProperties";
import {SearchAlgorithm} from "../../../../src/whisker/search/SearchAlgorithm";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {Chromosome} from "../../../../src/whisker/search/Chromosome";
import {NeatMutation} from "../../../../src/whisker/whiskerNet/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/NeatCrossover";
import {NetworkChromosomeGeneratorSparse} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NetworkChromosomeGeneratorSparse";
import {OneOfStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/OneOfStoppingCondition";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {NetworkFitnessFunction} from "../../../../src/whisker/whiskerNet/NetworkFitness/NetworkFitnessFunction";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";
import {NeatPopulation} from "../../../../src/whisker/whiskerNet/NeatPopulation";


describe('Test NEAT', () => {

    let properties: NeuroevolutionProperties<NetworkChromosome>
    let searchAlgorithm: SearchAlgorithm<NetworkChromosome>
    let builder: SearchAlgorithmBuilder<NetworkChromosome>
    let iterations: number
    let populationSize: number
    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let generator: NetworkChromosomeGeneratorSparse
    let genInputs: Map<string,number[]>
    let outputSize: number
    let random: Randomness

    beforeEach(() => {
        const mock = new VMWrapperMock();
        mock.init()
        // @ts-ignore
        Container.vmWrapper = mock;

        crossoverOp = new NeatCrossover(0.4);
        mutationOp = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1, 3, 0.1);
        genInputs = new Map<string, number[]>();
        genInputs.set("First", [1,2,3]);
        genInputs.set("Second", [4,5,6]);
        genInputs.set("Third", [7,8]);
        genInputs.set("Fourth", [9]);
        outputSize = 3;
        generator = new NetworkChromosomeGeneratorSparse(mutationOp, crossoverOp, genInputs, outputSize, 0.4, false);

        builder = new SearchAlgorithmBuilder(SearchAlgorithmType.NEAT);
        iterations = 20;
        populationSize = 100;
        random = Randomness.getInstance();
        properties = new NeuroevolutionProperties(populationSize);

        properties.networkFitness = new class implements NetworkFitnessFunction<NetworkChromosome> {
            compare(value1: number, value2: number): number {
                return value2 - value1;
            }

            getFitness(network: NetworkChromosome): Promise<number> {
                const fitness = random.nextInt(1, 100)
                network.networkFitness = fitness;
                return Promise.resolve(fitness);
            }

            getFitnessWithoutPlaying(network: NetworkChromosome): number {
                const fitness = random.nextInt(1, 100)
                network.networkFitness = fitness;
                return fitness;
            }

            getRandomFitness(network: NetworkChromosome): Promise<number> {
                const fitness = random.nextInt(1, 100)
                network.networkFitness = fitness;
                return Promise.resolve(fitness);
            }
        }
        properties.stoppingCondition = new OneOfStoppingCondition(new FixedIterationsStoppingCondition(iterations));
        properties.timeout = 25000;
        properties.ageSignificance = 1.0
        properties.parentsPerSpecies = 0.2
        properties.mutationWithoutCrossover = 0.3
        properties.interspeciesMating = 0.1;
        properties.distanceThreshold = 3;
        properties.excessCoefficient = 1;
        properties.disjointCoefficient = 1;
        properties.weightCoefficient = 1;
        properties.penalizingAge = 20;
        searchAlgorithm = builder.addProperties(properties as unknown as SearchAlgorithmProperties<Chromosome>)
            .addChromosomeGenerator(generator).initializeFitnessFunction(FitnessFunctionType.STATEMENT, null, null)
            .buildSearchAlgorithm();
    })

    test("Test findSolution()", () => {
        return searchAlgorithm.findSolution().then(() => {
            expect(searchAlgorithm.getNumberOfIterations()).toBe(20);
        });
    })

    /*
    Sanity Check if NEAT works correctly. Commented out since it can lead to a high increase in testing time.
    However, should be used for validating any changes made to the NEAT algorithm or its components.
    test("XOR Sanity Test", () => {
        const inputs = [[0, 0], [1, 1], [0, 1], [1, 0]];
        const inputMap = new Map<string, number[]>();
        inputMap.set("First", [0,0])
        generator = new NetworkChromosomeGeneratorSparse(mutationOp, crossoverOp, inputMap, 1, 0.5, false);
        const population = new NeatPopulation(150, 5, generator, properties)

        let found = false;
        let iteration = 0;
        while (!found) {
            for (const chromosome of population.chromosomes) {
                let fitness = 0;
                const stabCounter = chromosome.stabilizedCounter(10);
                chromosome.flushNodeValues();
                for (let i = 0; i < inputs.length; i++) {
                    inputMap.set("First", inputs[i])
                    for (let j = 0; j < stabCounter; j++) {
                        chromosome.activateNetwork(inputMap)
                    }

                    let output: number;
                    if (chromosome.outputNodes.get(0).nodeValue > 0)
                        output = 1;
                    else
                        output = 0;

                    let result: number;
                    if (i < 2)
                        result = 0;
                    else
                        result = 1;

                    if (output === result)
                        fitness++;
                }
                chromosome.networkFitness = fitness;
                if (fitness === 4)
                    found = true;
            }
            iteration++;
            population.evolution();
        }
        expect(population.populationChampion.networkFitness).toBe(4)
    })

     */
})
