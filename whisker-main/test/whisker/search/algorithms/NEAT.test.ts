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
import {NeatProperties} from "../../../../src/whisker/whiskerNet/HyperParameter/NeatProperties";
import {Container} from "../../../../src/whisker/utils/Container";
import {ActivationFunction} from "../../../../src/whisker/whiskerNet/NetworkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "../../../../src/whisker/whiskerNet/NetworkGenerators/NeatChromosomeGenerator";
import {NeatMutation} from "../../../../src/whisker/whiskerNet/Operators/NeatMutation";
import {NeatCrossover} from "../../../../src/whisker/whiskerNet/Operators/NeatCrossover";


describe('Test NEAT', () => {

    let searchAlgorithm: SearchAlgorithm<Chromosome>;
    let generator: NeatChromosomeGenerator;
    let properties: NeatProperties;

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

        const genInputs = new Map<string, Map<string, number>>();
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
        const events = [new WaitEvent(), new KeyPressEvent("left arrow", 1),
            new KeyPressEvent("right arrow", 1), new MouseMoveEvent()];
        generator = new NeatChromosomeGenerator(genInputs, events, 'fully',
            ActivationFunction.SIGMOID, new NeatMutation(mutationConfig), new NeatCrossover(crossoverConfig));

        const builder = new SearchAlgorithmBuilder('neat');
        const iterations = 20;
        const populationSize = 150;
        const random = Randomness.getInstance();
        properties = new NeatProperties();
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
        properties.timeout = 25000;
        properties.numberOfSpecies = 5;
        properties.parentsPerSpecies = 0.20;
        properties.penalizingAge = 20;
        properties.ageSignificance = 1.0;
        properties.inputRate = 0.3;
        properties.interspeciesMating = 0.001;
        properties.crossoverWithoutMutation = 0.2;
        properties.mutationWithoutCrossover = 0.25;
        properties.mutationAddConnection = 0.05;
        properties.recurrentConnection = 0.1;
        properties.addConnectionTries = 50;
        properties.populationChampionNumberOffspring = 3;
        properties.populationChampionNumberClones = 1;
        properties.populationChampionConnectionMutation = 0.3;
        properties.mutationAddNode = 0.03;
        properties.mutateWeights = 0.6;
        properties.perturbationPower = 1;
        properties.mutateToggleEnableConnection = 0.1;
        properties.toggleEnableConnectionTimes = 3;
        properties.mutateEnableConnection = 0.1;
        properties.compatibilityDistanceThreshold = 3.0;
        properties.disjointCoefficient = 1;
        properties.excessCoefficient = 1;
        properties.weightCoefficient = 0.4;
        searchAlgorithm = builder.addProperties(properties as unknown as SearchAlgorithmProperties<Chromosome>)
            .addChromosomeGenerator(generator).initializeFitnessFunction(FitnessFunctionType.STATEMENT, null, null)
            .buildSearchAlgorithm();
    });

    test("Test findSolution()", () => {
        return searchAlgorithm.findSolution().then(() => {
            expect(searchAlgorithm.getNumberOfIterations()).toBe(20);
        });
    });
});
/*
//Commented out since it greatly increases the CI-Pipeline duration. However, very useful for sanity checking.
    test("XOR Sanity Test", () => {
        const inputMap = new Map<string, Map<string, number>>();
        inputMap.set("Test", new Map<string, number>());

        inputMap.get("Test").set("Gate1", 0);
        inputMap.get("Test").set("Gate2", 0);

        const events = [new XOR()];

        const generator = new NeatChromosomeGeneratorFullyConnected(mutationConfig, crossoverConfig, inputMap, events);
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
                        network.updateStabiliseCount(20);
                        for (let j = 0; j < network.stabiliseCount; j++) {
                            network.activateNetwork(inputMap)
                        }

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
            population.updatePopulationStatistics();
            population.evolve();
        }
        expect(population.populationChampion.fitness).toBe(4)
    });


    class XOR extends ScratchEvent {

        apply(): Promise<void> {
            throw new Error("Method not implemented.");
        }

        getSearchParameterNames(): string[] {
            return ['GateInput'];
        }

        setParameter(): void {
            throw new Error("Method not implemented.");
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
    }
})

 */
