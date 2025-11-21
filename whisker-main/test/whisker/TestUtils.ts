import {InputFeatures} from "../../src/whisker/agentTraining/featureExtraction/FeatureExtraction";

export const generateNetworkInputs = (): InputFeatures => {
    const genInputs: InputFeatures = new Map<string, Map<string, number>>();
    const sprite1 = new Map<string, number>();
    sprite1.set("X-Position", 1);
    sprite1.set("Y-Position", 2);
    sprite1.set("Costume", 3);
    sprite1.set("DistanceToSprite2-X", 4);
    sprite1.set("DistanceToSprite2-y", 5);
    genInputs.set("Sprite1", sprite1);

    const sprite2 = new Map<string, number>();
    sprite2.set("X-Position", 6);
    sprite2.set("Y-Position", 7);
    sprite2.set("DistanceToWhite-X", 8);
    sprite2.set("DistanceToWhite-Y", 9);
    genInputs.set("Sprite2", sprite2);

    return genInputs;
};
