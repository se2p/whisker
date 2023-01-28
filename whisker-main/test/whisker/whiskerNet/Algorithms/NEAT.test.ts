import {VMWrapperMock} from "../../utils/VMWrapperMock";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {NetworkChromosome} from "../../../../src/whisker/whiskerNet/Networks/NetworkChromosome";
import {SearchAlgorithm} from "../../../../src/whisker/search/SearchAlgorithm";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {Chromosome} from "../../../../src/whisker/search/Chromosome";
import {FixedIterationsStoppingCondition} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {NetworkFitnessFunction} from "../../../../src/whisker/whiskerNet/NetworkFitness/NetworkFitnessFunction";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {NeuroevolutionTestGenerationParameter} from "../../../../src/whisker/whiskerNet/HyperParameter/NeuroevolutionTestGenerationParameter";
import {Container} from "../../../../src/whisker/utils/Container";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {InputFeatures} from "../../../../src/whisker/whiskerNet/Misc/InputExtraction";

export const generateInputs = (): InputFeatures => {
    const genInputs: InputFeatures = new Map<string, Map<string, number>>();
    const sprite1 = new Map<string, number>();
    sprite1.set("X-Position", 1);
    sprite1.set("Y-Position", 2);
    sprite1.set("Costume", 3);
    sprite1.set("DistanceToSprite2-X", 4);
    sprite1.set("DistanceToSprite2-y", 5);
    genInputs.set("Sprite1", sprite1);

    const sprite2 = new Map<string, number>();
    sprite2.set("X-Position", 6);
    sprite2.set("Y-Position", 7);
    sprite2.set("DistanceToWhite-X", 8);
    sprite2.set("DistanceToWhite-Y", 9);
    genInputs.set("Sprite2", sprite2);

    return genInputs;
};

describe('Test NEAT', () => {

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

        const builder = new SearchAlgorithmBuilder('neat');
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
            expect(searchAlgorithm.getNumberOfIterations()).toBe(20);
        });
    });

    /* Exclude due to long runtime
    test("XOR Sanity Test", () => {
        const inputMap = new Map<string, Map<string, number>>();
        inputMap.set("Test", new Map<string, number>());
        const mutation = new NeatMutation(mutationConfig);
        const crossover = new NeatCrossover(crossoverConfig);

        inputMap.get("Test").set("Gate1", 0);
        inputMap.get("Test").set("Gate2", 0);

        const events = [new XOR()];

        const generator = new NeatChromosomeGenerator(inputMap, events, "fully", ActivationFunction.RELU, mutation, crossover);
        const population = new NeatPopulation(generator, properties);
        population.generatePopulation();

        let found = false;
        while (!found) {
            for (const network of population.networks) {
                let fitness = 0;
                network.flushNodeValues();
                for (let i = 0; i < 2; i++) {
                    inputMap.get("Test").set("Gate1", i);
                    for (let k = 0; k < 2; k++) {
                        inputMap.get("Test").set("Gate2", k);
                        network.activateNetwork(inputMap);

                        let output: number;
                        if (network.regressionNodes.get('XOR')[0].nodeValue > 1)
                            output = 1;
                        else
                            output = 0;

                        let result: number;
                        if (i === k)
                            result = 0;
                        else
                            result = 1;

                        if (output === result)
                            fitness++;
                    }
                }
                network.fitness = fitness;
                if (fitness === 4)
                    found = true;
            }
            let fitness = 0;
            for(const net of population.networks){
                if (net.fitness > fitness){
                    fitness = net.fitness;
                }
            }
            population.updatePopulationStatistics();
            population.evolve();
        }
        expect(population.populationChampion.fitness).toBe(4);
    });


    class XOR extends ScratchEvent {

        apply(): Promise<void> {
            throw new Error("Method not implemented.");
        }

        getSearchParameterNames(): string[] {
            return ['GateInput'];
        }

        getParameters(): unknown[] {
            throw new Error("Method not implemented.");
        }

        toJavaScript(): string {
            throw new Error("Method not implemented.");
        }

        toString(): string {
            throw new Error("Method not implemented.");
        }

        stringIdentifier(): string {
            return "XOR";
        }

        toJSON(): Record<string, any> {
            throw new Error("Method not implemented.");
        }

        numSearchParameter(): number {
            return 1;
        }

        setParameter(args: number[], argType: ParameterType): number[] {
            throw new Error("Method not implemented");
        }
    }

     */
});
