import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {InputFeatures} from "./InputExtraction";
import {Randomness} from "../../utils/Randomness";

export class Backpropagation {

    private readonly _groundTruthData: Record<string, unknown>;

    constructor(groundTruth: Record<string, unknown>) {
        this._groundTruthData = groundTruth;
    }

    public optimiseWeights(network: NetworkChromosome, statement:string): void {
        return;
    }

    private _forwardPass(network: NetworkChromosome) {
        return;
    }

    private _backwardPass(network: NetworkChromosome): number[] {
        return [];
    }

    private _adjustWeights(network: NetworkChromosome) {
        return;
    }

    /**
     * Restructures and shuffles the data obtained from the .json file such that it can be handily used during the
     * backpropagation process and only includes records that correspond to the current statement target.
     * @param statement the target for which the networks should be optimised.
     * @returns structured and shuffled input-label data for the backpropagation process.
     */
    public _organiseData(statement: string): StateActionRecord {
        // We may have multiple recordings within one file. Collect all recordings that covered the current target in
        // an action to feature map.
        const actionStateRecord = new Map<string, InputFeatures[]>();
        for (const recording of Object.values(this._groundTruthData)) {
            for (const [action, feature] of Object.entries(recording)) {
                if (action === 'coverage' || !(recording['coverage'].includes(statement))) {
                    continue;
                }
                if (!actionStateRecord.has(action)) {
                    actionStateRecord.set(action, []);
                }
                actionStateRecord.get(action).push(...feature);
            }
        }

        // Randomly pick one label (action) and corresponding input vector after another and add it to the structured
        // groundTruth map that maps input vector to output label.
        const random = Randomness.getInstance();
        const shuffledGroundTruth: StateActionRecord = new Map<InputFeatures, string>();
        while ([...actionStateRecord.keys()].length > 0) {
            const nextAction = random.pick([...actionStateRecord.keys()]);
            const featureArray = actionStateRecord.get(nextAction);
            const randomFeatureIndex = random.nextInt(0, featureArray.length);
            shuffledGroundTruth.set(featureArray[randomFeatureIndex], nextAction);
            featureArray.splice(randomFeatureIndex, 1);
            if (featureArray.length == 0) {
                actionStateRecord.delete(nextAction);
            }
        }
        return shuffledGroundTruth;
    }
}

export type StateActionRecord = Map<InputFeatures, string>;
