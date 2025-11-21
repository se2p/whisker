import {SpriteFeatureExtractor} from "./SpriteFeatureExtractor";
import {StageFeatureExtractor} from "./StageFeatureExtractor";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";


export class FeatureExtraction {

    /**
     * Maintains a feature order to ensure that the {@link getFeatureArray} method returns its feature always in the
     * same order.
     */
    private static readonly _canonicalFeatureOrder: CanonicalFeature[] = [];

    /**
     * Generates a map of features based on the stage and all sprites of a given VirtualMachine instance.
     *
     * @param vm The VirtualMachine instance from which to extract features.
     *
     * @return A map where the keys represent the rendered target names,
     * and the values are mappings from feature name to feature value.
     */
    public static getFeatureMap(vm: VirtualMachine): InputFeatures {
        const inputFeatures: InputFeatures = new Map();
        const stage = vm.runtime.targets.find((target: RenderedTarget) => target.isStage);
        const sprites = vm.runtime.targets.filter((target: RenderedTarget) => !target.isStage);

        const stageFeatures = StageFeatureExtractor.getFeatures(vm, stage);
        inputFeatures.set("Stage", stageFeatures);

        for (const sprite of sprites) {
            const spriteName = sprite.isOriginal ? sprite.sprite.name : `${sprite.sprite.name}-Clone`;

            // Since all clones have the same identifier (-Clone), we do not differentiate between them and only
            // store the features of one clone to avoid an explosion of input features.
            if (!inputFeatures.has(spriteName)) {
                const spriteFeatures = SpriteFeatureExtractor.getFeatures(vm, sprite);
                inputFeatures.set(spriteName, spriteFeatures);
            }
        }

        return inputFeatures;
    }

    /**
     * Transforms the features obtained by the {@link getFeatureMap} method into a flat array of values.
     * The order of features is maintained via the {@link _canonicalFeatureOrder} array.
     *
     * @param vm the Scratch-VM describing the Scratch state.
     * @returns the extracted input features as a flat array of values.
     */
    static getFeatureArray(vm: VirtualMachine): number[] {
        const features = this.getFeatureMap(vm);
        this._updateCanonicalOrder(features);
        return this._flattenFeatures(features);
    }

    /**
     * Fetches the input feature dimension.
     * The input feature dimension is defined to represent the number of distinct features found so far.
     *
     * @param vm The Scratch-VM describing the Scratch state.
     * @returns the dimension of the input features.
     */
    static getFeatureDimension(vm: VirtualMachine): number {
        this._updateCanonicalOrder(this.getFeatureMap(vm));
        return this._canonicalFeatureOrder.length;
    }


    /**
     * Flattens features into a consistent array while maintaining the feature order.
     * Missing values are replaced with 0.
     *
     * @param features The input features to be flattened.
     * @returns The flattened input features.
     */
    private static _flattenFeatures(features: InputFeatures): number[] {
        const result: number[] = [];

        for (const [group, key] of this._canonicalFeatureOrder) {
            const value = features.get(group)?.get(key) ?? 0;
            result.push(value);
        }

        return result;
    }

    /**
     * Updates the canonical order of features if new features were discovered.
     *
     * @param features The features to update the canonical feature order with.
     */
    private static _updateCanonicalOrder(features: InputFeatures): void {
        const seen = new Set(this._canonicalFeatureOrder.map(([g, k]) => `${g}::${k}`));
        for (const [group, featureGroup] of features) {
            for (const [key] of featureGroup) {
                const id = `${group}::${key}`;
                if (!seen.has(id)) {
                    this._canonicalFeatureOrder.push([group, key]);
                    seen.add(id);
                }
            }
        }
    }

}

/**
 * A feature group found within a hosting sprite or the stage. Maps feature to the extracted values.
 */
export type FeatureGroup = Map<string, number>;

/**
 * Input features are mapped from the hosting sprite to the extracted {@link FeatureGroup}.
 */
export type InputFeatures = Map<string, FeatureGroup>;

/**
 * A flattened canonical representation of [groupKey, featureKey] for consistent ordering.
 */
export type CanonicalFeature = [string, string];
