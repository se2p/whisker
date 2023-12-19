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
}
