import {SearchAlgorithm} from "../../../../src/whisker/search/SearchAlgorithm";
import {Chromosome} from "../../../../src/whisker/search/Chromosome";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {NeuroevolutionTestGenerationParameter} from "../../../../src/whisker/whiskerNet/HyperParameter/NeuroevolutionTestGenerationParameter";
import {Container} from "../../../../src/whisker/utils/Container";
import {VMWrapperMock} from "../../utils/VMWrapperMock";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {NetworkFitnessFunction} from "../../../../src/whisker/whiskerNet/NetworkFitness/NetworkFitnessFunction";
import {NetworkChromosome} from "../../../../src/whisker/whiskerNet/Networks/NetworkChromosome";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";
import {generateInputs} from "./NEAT.test";

describe('Test Neatest', () => {

    let searchAlgorithm: SearchAlgorithm<Chromosome>;
    let generator: NeatChromosomeGenerator;
    let properties: NeuroevolutionTestGenerationParameter;

    const crossoverConfig = {
        "operator": "neatCrossover",
        "crossoverWithoutMutation": 0.2,
        "interspeciesRate": 0.001,
        "weightAverageRate": 0.4
    };

    const mutationConfig = {
        "operator": "neatMutation",
        "mutationWithoutCrossover": 0.25,
        "mutationAddConnection": 0.2,
        "recurrentConnection": 0.1,
        "addConnectionTries": 20,
        "populationChampionNumberOffspring": 10,
        "populationChampionNumberClones": 5,
        "populationChampionConnectionMutation": 0.3,
        "mutationAddNode": 0.1,
        "mutateWeights": 0.6,
        "perturbationPower": 2.5,
        "mutateToggleEnableConnection": 0.1,
        "toggleEnableConnectionTimes": 3,
        "mutateEnableConnection": 0.03
    };

    beforeEach(() => {
        Container.debugLog = () => { /* suppress output */};
        const mock = new VMWrapperMock();
        mock.init();
        const inputFeatures = generateInputs();
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        generator = new NeatChromosomeGenerator(inputFeatures, events, 'fully',
            ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));

        const builder = new SearchAlgorithmBuilder('neatest');
        const iterations = 20;
        const populationSize = 150;
        const random = Randomness.getInstance();
        properties = new NeuroevolutionTestGenerationParameter();
        properties.populationSize = populationSize;

        properties.networkFitness = new class implements NetworkFitnessFunction<NetworkChromosome> {
            compare(value1: number, value2: number): number {
                return value2 - value1;
            }

            getFitness(network: NetworkChromosome): Promise<number> {
                const fitness = random.nextInt(1, 100);
                network.fitness = fitness;
                return Promise.resolve(fitness);
            }

            identifier(): string {
                return 'Dummy';
            }
        };

        properties.stoppingCondition = new FixedIterationsStoppingCondition(iterations);
        searchAlgorithm = builder.addProperties(properties as unknown as SearchAlgorithmProperties<Chromosome>)
            .addChromosomeGenerator(generator).initializeFitnessFunction(FitnessFunctionType.STATEMENT, null, null)
            .buildSearchAlgorithm();
    });

    test("Test findSolution()", () => {
        return searchAlgorithm.findSolution().then(() => {
            expect(searchAlgorithm.getNumberOfIterations()).toBe(0);
        });
    });
});
