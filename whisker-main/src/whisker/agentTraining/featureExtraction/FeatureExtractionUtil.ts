import {RenderedTarget} from "scratch-vm/src/sprites/rendered-target";

export class FeatureExtractionUtil {

    /**
     * Adds variable values as features to the feature map.
     * @param target The rendered target hosting the variables to extract.
     * @param featureMap A map to which the variable features will be added.
     */
    public static addVariableFeatures(target: RenderedTarget, featureMap: Map<string, number>): void {
        for (const variable of Object.values(target.variables)) {
            if (!isNaN(parseFloat(variable['value']))) {
                const value = parseFloat(variable['value']);
                featureMap.set(`VAR${variable['name']}`, this.normaliseVariableValue(value));
            }
        }
    }

    /**
     * Adds the currently selected costume as a feature to the feature map.
     *
     * @param target The rendered target whose currently selected costume will be added to the feature map.
     * @param featureMap A map to which the costume feature will be added.
     */
    public static addCostumeFeature(target: RenderedTarget, featureMap: Map<string, number>): void {
        const costumeOpCode = target.isStage ? 'looks_switchbackdropto' : 'looks_switchcostumeto';
        const costumeBlocks = this.getBlocksWithOpcode(target, costumeOpCode);

        // Feature is meaningless if the target cannot switch its costume.
        if (costumeBlocks.length < 0) {
            return;
        }

        const costumeValue = target.currentCostume;
        const numberOfCostumes = target.sprite.costumes_.length;
        if (numberOfCostumes > 1) {
            const featureValue = this.mapValueIntoRange(costumeValue, 0, numberOfCostumes - 1);
            featureMap.set('Costume', featureValue);
        }
    }

    /**
     * Fetches all blocks of a rendered target that have the specified opcode.
     * @param target The rendered target whose blocks should be analyzed.
     * @param opcode The opcode to extract.
     *
     * @returns all blocks of the given target that have the specified opcode.
     */
    public static getBlocksWithOpcode(target: RenderedTarget, opcode: string): unknown[] {
        return Object.values(target.blocks._blocks).filter(block => block['opcode'] === opcode);
    }

    /**
     * Normalizes the extracted value of a variable into the range [-1, 1].
     * @param value the value to normalize.
     * @param constant a constant used for stretching the value.
     * @return the normalized value in the range [-1, 1].
     */
    public static normaliseVariableValue(value: number, constant = 1): number {
        let normalisationValue = Math.abs(value) / (Math.abs(value) + constant);
        if (value < 0) {
            normalisationValue *= -1;
        }
        return normalisationValue;
    }

    /**
     * Maps a given value in the input space onto the corresponding value of the output space.
     * @param value the value which should be mapped onto the output space
     * @param input_start the first value of the input_space
     * @param input_end the last value of the input_space
     * @param output_start the first value of the output_space
     * @param output_end the last value of the output_space
     * @returns number corresponding to the mapped value from input to output space.
     */
    public static mapValueIntoRange(value: number, input_start: number, input_end: number,
                                    output_start = -1, output_end = 1): number {
        const mappedValue = (value - input_start) / (input_end - input_start) * (output_end - output_start) + output_start;
        return Math.max(-1, Math.min(1, mappedValue));
    }

}
