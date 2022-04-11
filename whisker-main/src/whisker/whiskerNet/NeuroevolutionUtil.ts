import {NetworkChromosome} from "./Networks/NetworkChromosome";
import {ScratchEvent} from "../testcase/events/ScratchEvent";

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
     * Calculates the SOFTMAX function over all classification-outputNode values
     * @param network the network over which the softmax function should be calculated
     * @param events the list of available events for which the softmax function should be calculated
     */
    public static softmaxEvents(network: NetworkChromosome, events: ScratchEvent[]): Map<ScratchEvent, number> {
        const probabilityMap = new Map<ScratchEvent, number>();
        let denominator = 0;
        for (const event of events) {
            const oNode = network.classificationNodes.get(event.stringIdentifier());
            if (oNode.activatedFlag) {
                denominator += Math.exp(oNode.nodeValue);
            }
        }
        for (const event of events) {
            const oNode = network.classificationNodes.get(event.stringIdentifier());
            if (oNode.activatedFlag) {
                const probability = Math.exp(oNode.nodeValue) / denominator;
                probabilityMap.set(event, probability);
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
}
