import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";

export class NeuroevolutionUtil {

    /**
     * SIGMOID activation function
     * @param x the value to which the SIGMOID function should be applied to
     * @param gain the gain of the SIGMOID function (set to 1 for a standard SIGMOID function)
     */
    public static sigmoid(x: number, gain: number): number {
        return (1 / (1 + Math.exp(gain * -x)));
    }

    /**
     * Generates a map of events and the corresponding probabilities determined via multiclass-classification using
     * softmax
     * @param network the network hosting the activated output nodes over which softmax has been applied.
     * @param events the list of available events to which the output of the classification nodes is being mapped.
     */
    public static softmaxEvents(network: NetworkChromosome, events: ScratchEvent[]): Map<ScratchEvent, number> {
        const probabilityMap = new Map<ScratchEvent, number>();
        for (const event of events) {
            const oNode = network.classificationNodes.get(event.stringIdentifier());
            if (oNode.activatedFlag) {
                probabilityMap.set(event, oNode.activationValue);
            }
        }
        return probabilityMap;
    }

    /**
     * RELU activation function.
     * @param x the value to which the RELU function should be applied to
     */
    public static relu(x: number): number {
        return Math.max(0, x);
    }

    /**
     * Computes the cosine similarity between two maps.
     * Keys present in one map but not the other are padded as 0.
     * @param map1 the first map to be compared.
     * @param map2 the second map to be compared.
     * @returns the cosine similarity between the two maps.
     */
    public static cosineSimilarityOfMaps(map1: Map<string, number>, map2: Map<string, number>): number {
        const keys = new Set([...map1.keys(), ...map2.keys()]);
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        for (const key of keys) {
            const value1 = map1.get(key) ?? 0;
            const value2 = map2.get(key) ?? 0;

            dotProduct += value1 * value2;
            magnitude1 += value1 * value1;
            magnitude2 += value2 * value2;
        }

        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0;
        }

        return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
    }
}
