import {OptimalSolutionStoppingCondition} from "../../../src/whisker/search/stoppingconditions/OptimalSolutionStoppingCondition";
import {NeatProperties} from "../../../src/whisker/whiskerNet/HyperParameter/NeatProperties";

describe("Test NeuroevolutionProperties", () => {

    test("Test Constructor", () => {
        const properties = new NeatProperties(10);
        expect(properties.populationSize).toBe(10);
    })

    test("Test Getter and Setter", () => {
        const properties = new NeatProperties(10);
        properties.populationSize = 50;
        properties.parentsPerSpecies = 0.3;
        properties.penalizingAge = 30;
        properties.ageSignificance = 0.1;
        properties.inputRate = 0.2;
        properties.mutationWithoutCrossover = 0.3;
        properties.mutationAddConnection = 0.04;
        properties.recurrentConnection = 0.1;
        properties.addConnectionTries = 20;
        properties.populationChampionConnectionMutation = 0.4;
        properties.mutationAddNode = 0.03;
        properties.mutateWeights = 0.7;
        properties.perturbationPower = 2;
        properties.mutateToggleEnableConnection = 0.1;
        properties.toggleEnableConnectionTimes = 3;
        properties.mutateEnableConnection = 0.01;
        properties.crossoverWithoutMutation = 0.4;
        properties.interspeciesMating = 0.01;
        properties.distanceThreshold = 3;
        properties.disjointCoefficient = 1;
        properties.excessCoefficient = 1;
        properties.weightCoefficient = 0.4;
        properties.stoppingCondition = new OptimalSolutionStoppingCondition();
        properties.networkFitness = null;
        properties.timeout = 20000;

        expect(properties.populationSize).toBe(50);
        expect(properties.parentsPerSpecies).toBe(0.3);
        expect(properties.penalizingAge).toBe(30);
        expect(properties.ageSignificance).toBe(0.1);
        expect(properties.inputRate).toBe(0.2);
        expect(properties.mutationWithoutCrossover).toBe(0.3);
        expect(properties.mutationAddConnection).toBe(0.04);
        expect(properties.recurrentConnection).toBe(0.1);
        expect(properties.addConnectionTries).toBe(20);
        expect(properties.populationChampionConnectionMutation).toBe(0.4);
        expect(properties.mutationAddNode).toBe(0.03);
        expect(properties.mutateWeights).toBe(0.7);
        expect(properties.perturbationPower).toBe(2);
        expect(properties.mutateToggleEnableConnection).toBe(0.1);
        expect(properties.toggleEnableConnectionTimes).toBe(3);
        expect(properties.mutateEnableConnection).toBe(0.01);
        expect(properties.crossoverWithoutMutation).toBe(0.4);
        expect(properties.interspeciesMating).toBe(0.01);
        expect(properties.distanceThreshold).toBe(3);
        expect(properties.disjointCoefficient).toBe(1);
        expect(properties.excessCoefficient).toBe(1);
        expect(properties.weightCoefficient).toBe(0.4);
        expect(properties.stoppingCondition).toBeInstanceOf(OptimalSolutionStoppingCondition);
        expect(properties.networkFitness).toBe(null);
        expect(properties.timeout).toBe(20000);
    })
})
