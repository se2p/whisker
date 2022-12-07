import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {InputFeatures} from "./InputExtraction";
import {Randomness} from "../../utils/Randomness";

export class Backpropagation {

    private readonly _groundTruth: StateActionRecord;

    constructor(groundTruth: Record<string, unknown>) {
        this._groundTruth = this._organiseData(groundTruth);
    }

    public optimiseWeights(network: NetworkChromosome): void {
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
     * backpropagation process.
     * @param originalData the data obtained from .json file.
     * @returns structured and shuffled input-label data for the backpropagation process.
     */
    private _organiseData(originalData: Record<string, unknown>): StateActionRecord {

        // We may have multiple recordings within one file. Collect all recordings and save them as ActionStateRecord.
        const actionStateRecord = new Map<string, InputFeatures[]>();
        for (const recording of Object.values(originalData)) {
            for (const [action, feature] of Object.entries(recording)) {
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


    get groundTruth(): StateActionRecord {
        return this._groundTruth;
    }
}

export type StateActionRecord = Map<InputFeatures, string>;
