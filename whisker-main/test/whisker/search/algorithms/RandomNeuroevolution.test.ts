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
import {ScratchEvent} from "../../../../src/whisker/testcase/events/ScratchEvent";
import {List} from "../../../../src/whisker/utils/List";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {KeyDownEvent} from "../../../../src/whisker/testcase/events/KeyDownEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";


describe('Test RandomNeuroevolution', () => {

    let properties: NeuroevolutionProperties<NetworkChromosome>;
    let searchAlgorithm: SearchAlgorithm<NetworkChromosome>;
    let builder: SearchAlgorithmBuilder<NetworkChromosome>;
    let iterations: number;
    let populationSize: number;
    let mutationOp: NeatMutation;
    let crossoverOp: NeatCrossover;
    let generator: NetworkChromosomeGeneratorSparse;
    let genInputs: Map<string, number[]>;
    let events: List<ScratchEvent>;
    let random : Randomness;

    beforeEach(() => {
        const mock = new VMWrapperMock();
        mock.init();
        // @ts-ignore
        Container.vmWrapper = mock;

        crossoverOp = new NeatCrossover(0.4);
        mutationOp = new NeatMutation(0.03, 0.1, 30,
            0.2, 0.01, 0.8, 1.5,
            0.1, 3,0.1);
        genInputs = new Map<string, number[]>();
        genInputs.set("First", [1,2,3]);
        genInputs.set("Second", [4,5,6]);
        genInputs.set("Third", [7,8]);
        genInputs.set("Fourth", [9]);
        events = new List<ScratchEvent>([new WaitEvent(), new KeyDownEvent("left arrow", true),
            new KeyDownEvent("right arrow", true), new MouseMoveEvent()]);
        generator = new NetworkChromosomeGeneratorSparse(mutationOp, crossoverOp,genInputs, events, 0.4);

        builder = new SearchAlgorithmBuilder(SearchAlgorithmType.RANDOM_NEUROEVOLUTION);
        iterations = 20;
        populationSize = 100;
        random = Randomness.getInstance();
        properties = new NeuroevolutionProperties(populationSize);

        properties.networkFitness = new class implements NetworkFitnessFunction<NetworkChromosome> {
            compare(value1: number, value2: number): number {
                return value2-value1;
            }

            getFitness(network:NetworkChromosome): Promise<number> {
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
            .addChromosomeGenerator(generator).initializeFitnessFunction(FitnessFunctionType.SINGLE_BIT, null,null)
            .buildSearchAlgorithm();
    })

    test("Test findSolution()", () =>{
        return searchAlgorithm.findSolution().then(() => {
            expect(searchAlgorithm.getNumberOfIterations()).toBe(20);
        });
    })
})
