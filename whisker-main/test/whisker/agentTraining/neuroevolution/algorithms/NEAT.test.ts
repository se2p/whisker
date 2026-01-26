import {VMWrapperMock} from "../../../utils/VMWrapperMock";
import {SearchAlgorithmBuilder} from "../../../../../src/whisker/search/SearchAlgorithmBuilder";
import {NetworkChromosome} from "../../../../../src/whisker/agentTraining/neuroevolution/networks/NetworkChromosome";
import {SearchAlgorithm} from "../../../../../src/whisker/search/SearchAlgorithm";
import {SearchAlgorithmProperties} from "../../../../../src/whisker/search/SearchAlgorithmProperties";
import {Chromosome} from "../../../../../src/whisker/search/Chromosome";
import {
    FixedIterationsStoppingCondition
} from "../../../../../src/whisker/search/stoppingconditions/FixedIterationsStoppingCondition";
import {NetworkFitnessFunction} from "../../../../../src/whisker/agentTraining/neuroevolution/networkFitness/NetworkFitnessFunction";
import {Randomness} from "../../../../../src/whisker/utils/Randomness";
import {FitnessFunctionType} from "../../../../../src/whisker/search/FitnessFunctionType";
import {WaitEvent} from "../../../../../src/whisker/testcase/events/WaitEvent";
import {MouseMoveEvent} from "../../../../../src/whisker/testcase/events/MouseMoveEvent";
import {KeyPressEvent} from "../../../../../src/whisker/testcase/events/KeyPressEvent";
import {
    NeatParameter
} from "../../../../../src/whisker/agentTraining/neuroevolution/hyperparameter/NeatParameter";
import {ActivationFunction} from "../../../../../src/whisker/agentTraining/neuroevolution/networkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../../../../../src/whisker/agentTraining/neuroevolution/networkGenerators/NeatChromosomeGenerator";
import {NeatMutation} from "../../../../../src/whisker/agentTraining/neuroevolution/operators/NeatMutation";
import {NeatCrossover} from "../../../../../src/whisker/agentTraining/neuroevolution/operators/NeatCrossover";
import {NeatPopulation} from "../../../../../src/whisker/agentTraining/neuroevolution/neuroevolutionPopulations/NeatPopulation";
import {ScratchEvent} from "../../../../../src/whisker/testcase/events/ScratchEvent";
import {ParameterType} from "../../../../../src/whisker/testcase/events/ParameterType";
import {NeuroevolutionUtil} from "../../../../../src/whisker/agentTraining/neuroevolution/misc/NeuroevolutionUtil";
import {generateNetworkInputs} from "../../../TestUtils";
import logger from "../../../../../src/util/logger";
import {ScratchScriptSnippet} from "../../../../../src/types/ScratchScriptSnippet";

describe('Test NEAT', () => {

    let searchAlgorithm: SearchAlgorithm<Chromosome>;
    let generator: NeatChromosomeGenerator;
    let properties: NeatParameter;

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
        logger.suggest.deny(/.*/, "debug");
        const mock = new VMWrapperMock();
        mock.init();
        const inputFeatures = generateNetworkInputs();
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        generator = new NeatChromosomeGenerator(inputFeatures, events, 'fully',
            ActivationFunction.SIGMOID, ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));

        const builder = new SearchAlgorithmBuilder('neat');
        const iterations = 20;
        const populationSize = 150;
        const random = Randomness.getInstance();
        properties = new NeatParameter();
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

    test.skip("XOR Sanity Test", async () => { // Skipped for now due to issue #389
        const inputMap = new Map<string, Map<string, number>>();
        inputMap.set("Test", new Map<string, number>());
        const mutation = new NeatMutation(mutationConfig);
        const crossover = new NeatCrossover(crossoverConfig);

        inputMap.get("Test").set("Gate1", 0);
        inputMap.get("Test").set("Gate2", 0);

        const events = [new XOR()];

        const generator = new NeatChromosomeGenerator(inputMap, events, "fully", ActivationFunction.SIGMOID, ActivationFunction.SIGMOID, mutation, crossover);
        const population = new NeatPopulation(generator, properties);
        await population.generatePopulation();

        let found = false;
        let speciesString = "Current fitness Target: XOR\n";
        while (!found) {
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

                        const networkOutput = NeuroevolutionUtil.sigmoid(network.getTriggerActionNodes().find(node => node.event.stringIdentifier() === 'XOR')?.nodeValue ?? 0, 1);
                        error_sum += Math.abs(groundTruth - Math.abs(networkOutput));
                    }
                }
                network.fitness = (4 - error_sum) ** 2;
                if (network.fitness >= 15.8) {
                    found = true;
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

            await population.evolve();
        }
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

        toScratchBlocks(): ScratchScriptSnippet {
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
