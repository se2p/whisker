import {ActivationTrace} from "./ActivationTrace";
import Statistics from "../../utils/Statistics";
import {NeatChromosome} from "../Networks/NeatChromosome";

export class NetworkAnalysis {

    /**
     * Analyses the network's behaviour after being executed on a test program.
     * @param network the network that will be analysed.
     */
    public static analyseNetwork(network: NeatChromosome): void {
        // We can only apply node activation analysis if we have a reference trace
        if (network.referenceActivationTrace) {
            const lsa = NetworkAnalysis.LSANodeBased(network.referenceActivationTrace, network.testActivationTrace);
            network.averageNodeBasedLSA = lsa.averageLSA;

            // If the program could not be executed we set all nodes as being suspicious
            if (lsa.surpriseMap === undefined) {
                network.surpriseCount = network.referenceActivationTrace.tracedNodes.length;
            } else {
                const surpriseActivations = this.countSuspiciousActivations(lsa.surpriseMap);
                network.surpriseCount = surpriseActivations[0];
            }
        }
    }

    /**
     * Calculates LSA metrics by comparing the activation traces of individual nodes.
     * @param reference the ground truth activation traces.
     * @param test a single trace with which we are comparing the reference trace with.
     * @returns [averageLSA, map of raw lsa values, map of surprising activations]; both mappings follow the structure
     * Map<step, Map<node, raw lsa value | boolean indicating surprising activations>
     */
    private static LSANodeBased(reference: ActivationTrace, test: ActivationTrace): LSAResult {
        const surpriseMap = new Map<number, Map<string, boolean>>();
        const lsaMap = new Map<number, Map<string, number>>();
        let sa = 0;
        let stepCount = 0;
        if (!test) {
            for (const [step, stepTrace] of reference.trace.entries()) {
                surpriseMap.set(step, new Map<string, boolean>());
                for (const nodeId of stepTrace.keys()) {
                    surpriseMap.get(step).set(nodeId, true);
                }
            }
            return {
                "averageLSA": 100,
                "LSAMap": undefined,
                "surpriseMap": undefined,
            };
        }
        // For each step, compare the ATs during training and testing.
        for (const step of test.trace.keys()) {
            // If the test run performed more steps than the test run we stop since have no training AT to compare.
            if (!reference.trace.has(step)) {
                return {
                    "averageLSA": sa / stepCount,
                    "LSAMap": lsaMap,
                    "surpriseMap": surpriseMap,
                };
            }
            surpriseMap.set(step, new Map<string, boolean>());
            lsaMap.set(step, new Map<string, number>());

            for (const [nodeId, nodeTrace] of test.trace.get(step).entries()) {
                const testValue = nodeTrace[0];
                const referenceStepTrace = reference.trace.get(step);

                // If we do not have a reference trace, we cannot make any LSA calculations.
                if (!referenceStepTrace) {
                    return {
                        "averageLSA": sa / stepCount,
                        "LSAMap": lsaMap,
                        "surpriseMap": surpriseMap,
                    };
                }

                const referenceNodeTrace = referenceStepTrace.get(nodeId);

                // If a given node does not occur in the reference trace, or we have observed too few samples within
                // the reference trace we cannot calculate the LSA reliably.
                if (!referenceNodeTrace || referenceNodeTrace.length < 30) {
                    continue;
                }

                const LSA = this.calculateLSANodeBased(referenceNodeTrace, testValue);
                const threshold = this.getLSAThreshold(referenceNodeTrace);
                sa += Math.min(100, LSA);
                lsaMap.get(step).set(nodeId, sa);

                // Check if the test AT for the given step and node is surprising.
                if (LSA > threshold) {
                    console.log(`Suspicious at step ${step} with node ${nodeId} and a value of ${LSA} vs Threshold ${threshold}`);
                    surpriseMap.get(step).set(nodeId, true);
                } else {
                    surpriseMap.get(step).set(nodeId, false);
                }
            }
            stepCount++;
        }
        return {
            "averageLSA": sa / stepCount,
            "LSAMap": lsaMap,
            "surpriseMap": surpriseMap,
        };
    }

    /**
     * Calculates the LSA value at a given step between two traces of the same node.
     * @param referenceTrace the ground truth trace of activation values.
     * @param testActivation the observed activation value of the test execution.
     * @returns LSA value of the observed node activation during the test execution.
     */
    private static calculateLSANodeBased(referenceTrace: number[], testActivation: number): number {
        let kdeSum = 0;
        const bandwidth = Statistics.bandwidthSilverman(referenceTrace);

        // If both traces contain the same constant value, there is no surprise.
        if (referenceTrace.every(value => value == testActivation)) {
            return 0;
        }

        // If we have a low standard deviation in the reference trace, deviating values observed during the test
        // execution are rather surprising
        const std = Statistics.std(referenceTrace);
        if (std < 0.0001) {
            return Math.abs(referenceTrace[0] - testActivation) * 10;
        }

        // Calculate the kernel sum
        for (const trainingValue of referenceTrace) {
            const traceDifference = testActivation - trainingValue;
            kdeSum += Statistics.gaussianKernel(traceDifference / bandwidth);
        }

        // Use the kernel sum to calculate the LSA between two nodes.
        const density = kdeSum / (referenceTrace.length * bandwidth);
        return -Math.log(density);
    }

    /**
     * Obtain the threshold for a node at which LSA values are regarded as surprising. Special treatment for
     * scenarios in which the whole reference trace contains a constant activation value.
     * @param referenceTrace the ground truth trace of a given node at a given step.
     * @returns threshold for surprising activations.
     */
    private static getLSAThreshold(referenceTrace: number[]): number {
        if (referenceTrace.every(value => value == referenceTrace[0])) {
            return 1;
        } else
            return 10;
    }

    /**
     * Counts the number of suspicious node activations.
     * @param surpriseMap maps executed Scratch-Steps to obtained LSA values of input nodes.
     * @returns number indicating how often a surprising activations was encountered.
     */
    private static countSuspiciousActivations(surpriseMap: Map<number, Map<string, boolean>>): [number, Map<string, number>] {
        let surpriseCounter = 0;
        const nodeSurpriseMap = new Map<string, number>();
        for (const stepTrace of surpriseMap.values()) {
            for (const [node, surprise] of stepTrace.entries()) {
                if (!nodeSurpriseMap.has(node)) {
                    nodeSurpriseMap.set(node, 0);
                }
                if (surprise) {
                    surpriseCounter++;
                    nodeSurpriseMap.set(node, nodeSurpriseMap.get(node) + 1);
                }
            }
        }
        return [surpriseCounter, nodeSurpriseMap];
    }
}

export interface LSAResult {
    averageLSA: number,
    LSAMap: Map<number, Map<string, number>>
    surpriseMap: Map<number, Map<string, boolean>>
}
