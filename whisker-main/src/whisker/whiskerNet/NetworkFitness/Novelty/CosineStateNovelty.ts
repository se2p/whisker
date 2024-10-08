import {NetworkChromosome} from "../../Networks/NetworkChromosome";
import {NoveltyFitness} from "./NoveltyFitness";
import {InputFeatures} from "../../Misc/InputExtraction";
import similarity from "compute-cosine-similarity";

export class CosineStateNovelty extends NoveltyFitness<Map<string, number>> {

    /**
     * The behaviour to be compared corresponds to the final state of the problem domain.
     * The final state of the problem domain is approximated by input features extracted after the network execution.
     * @param network The network hosting the final state of the problem domain.
     * @returns the final state of the problem domain after the supplied network was executed.
     */
    protected extractBehaviour(network: NetworkChromosome): Map<string, number> {
        return this.flattenInputFeatureMap(network.finalState);
    }


    /**
     * Compares two final states of the problem domain that are approximated by extracted input features.
     * @param state1 first state to be compared.
     * @param state2 second state to be compared.
     * @returns distance between the two states based on the cosine similarity.
     */
    protected compareBehaviours(state1: Map<string, number>, state2: Map<string, number>): number {
        const keys = new Set([...state1.keys(), ...state2.keys()]);
        const valueArray1: number[] = [];
        const valueArray2: number[] = [];

        for (const key of keys) {
            valueArray1.push(state1.get(key) ?? 0);
            valueArray2.push(state2.get(key) ?? 0);
        }

        // Invert similarity score since we model novelty objectives as maximisation targets.
        return 1 - (similarity(valueArray1, valueArray2) + 1) / 2;
    }

    /**
     * Flattens the input feature map from a two-layered map to a single-layered map.
     * During the flattening process, we also round the value
     * to avoid distinguishing tiny difference during the novelty calculation.
     * @param features the input feature map to be flattened.
     * @returns flattened input feature map.
     */
    private flattenInputFeatureMap(features: InputFeatures): Map<string, number> {
        const flattened = new Map<string, number>();
        for (const [spriteKey, spriteFeatures] of features.entries()) {
            for (const [featureKey, featureValue] of spriteFeatures.entries()) {
                flattened.set(`${spriteKey}-${featureKey}`, Math.round(featureValue * 100) / 100);
            }
        }
        return flattened;
    }
}
