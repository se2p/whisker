import {VMWrapperMock} from "../../utils/VMWrapperMock";
import {SearchAlgorithmBuilder} from "../../../../src/whisker/search/SearchAlgorithmBuilder";
import {NetworkChromosome} from "../../../../src/whisker/whiskerNet/Networks/NetworkChromosome";
import {SearchAlgorithm} from "../../../../src/whisker/search/SearchAlgorithm";
import {SearchAlgorithmProperties} from "../../../../src/whisker/search/SearchAlgorithmProperties";
import {Chromosome} from "../../../../src/whisker/search/Chromosome";
import {
    FixedIterationsStoppingCondition
} from "../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {NetworkFitnessFunction} from "../../../../src/whisker/whiskerNet/NetworkFitness/NetworkFitnessFunction";
import {Randomness} from "../../../../src/whisker/utils/Randomness";
import {FitnessFunctionType} from "../../../../src/whisker/search/FitnessFunctionType";
import {WaitEvent} from "../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../src/whisker/testcase/events/KeyPressEvent";
import {
    NeuroevolutionTestGenerationParameter
} from "../../../../src/whisker/whiskerNet/HyperParameter/NeuroevolutionTestGenerationParameter";
import {Container} from "../../../../src/whisker/utils/Container";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";
import {InputFeatures} from "../../../../src/whisker/whiskerNet/Misc/InputExtraction";
import {NeatPopulation} from "../../../../src/whisker/whiskerNet/NeuroevolutionPopulations/NeatPopulation";
import {ScratchEvent} from "../../../../src/whisker/testcase/events/ScratchEvent";
import {ParameterType} from "../../../../src/whisker/testcase/events/ParameterType";
import {NeuroevolutionUtil} from "../../../../src/whisker/whiskerNet/Misc/NeuroevolutionUtil";
import {NodeType} from "../../../../src/whisker/whiskerNet/NetworkComponents/NodeType";

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
        "mutationAddConnection": 0.5,
        "recurrentConnection": 0,
        "addConnectionTries": 20,
        "populationChampionNumberOffspring": 3,
        "populationChampionNumberClones": 1,
        "populationChampionConnectionMutation": 0.3,
        "mutationAddNode": 0.05,
        "mutateWeights": 0.6,
        "perturbationPower": 1.5,
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

    test("XOR Sanity Test", () => {
        const inputMap = new Map<string, Map<string, number>>();
        inputMap.set("Test", new Map<string, number>());
        const mutation = new NeatMutation(mutationConfig);
        const crossover = new NeatCrossover(crossoverConfig);

        inputMap.get("Test").set("Gate1", 0);
        inputMap.get("Test").set("Gate2", 0);

        const events = [new XOR()];

        const generator = new NeatChromosomeGenerator(inputMap, events, "fully", ActivationFunction.SIGMOID, mutation, crossover);
        const population = new NeatPopulation(generator, properties);
        population.generatePopulation();

        let found = false;
        let generation = 0;
        let speciesString = "Current fitness Target: XOR\n";
        while (!found) {
            // console.log("Generation: " + generation);
            for (const network of population.networks) {
                let error_sum = 0;
                for (let i = 0; i < 2; i++) {
                    inputMap.get("Test").set("Gate1", i);
                    for (let k = 0; k < 2; k++) {
                        let groundTruth: number;
                        if (i === k)
                            groundTruth = 0;
                        else
                            groundTruth = 1;

                        inputMap.get("Test").set("Gate2", k);
                        network.activateNetwork(inputMap);

                        const networkOutput = NeuroevolutionUtil.sigmoid(network.classificationNodes.get('XOR').nodeValue, 1);
                        error_sum += Math.abs(groundTruth - Math.abs(networkOutput));
                    }
                }
                network.fitness = (4 - error_sum) ** 2;
                if (network.fitness >= 15.8) {
                    found = true;
                    // console.log(network.toString());
                    break;
                }
            }
            population.updatePopulationStatistics();

            const sortedSpecies = population.species.sort((a, b) => b.uID - a.uID);
            speciesString = speciesString.concat(`Population of ${population.populationSize} distributed in ${sortedSpecies.length} species\n`);
            speciesString = speciesString.concat("\tID\tage\tsize\tfitness\n");
            for (const species of sortedSpecies) {
                speciesString = speciesString.concat(`\t${species.uID}\t${species.age}\t${species.networks.length}\t${Math.round(species.averageFitness * 100) / 100}\t${species.expectedOffspring}\n`);
            }
            speciesString = speciesString.concat("\n");

            population.evolve();
            generation++;
        }
        // console.log(speciesString);
        expect(population.populationChampion.fitness).toBeGreaterThan(15.7);
    });


    class XOR extends ScratchEvent {

        apply(): Promise<void> {
            throw new Error("Method not implemented.");
        }

        getSearchParameterNames(): string[] {
            return [];
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
            const json = {};
            json['type'] = "XOR";
            return json;
        }

        numSearchParameter(): number {
            return 0;
        }

        setParameter(args: number[], argType: ParameterType): number[] {
            throw new Error("Method not implemented");
        }
    }


});
