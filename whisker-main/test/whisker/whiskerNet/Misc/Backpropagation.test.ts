import groundTruth from "./GroundTruth.json";
import {Backpropagation} from "../../../../src/whisker/whiskerNet/Misc/Backpropagation";


describe('Test Backpropagation', () => {
    let backpropagation: Backpropagation;

    beforeEach(() => {
        backpropagation = new Backpropagation(groundTruth as any);
    });

    test("Check number of recordings during initialisation", () => {
        let featureRecordings = 0;
        for(const recordings of Object.values(groundTruth)){
            for(const featureArray of Object.values(recordings)){
                featureRecordings += featureArray.length;
            }
        }
        expect([...backpropagation.groundTruth.keys()].length).toBe(featureRecordings);
    });

    test("Check shuffle during initialisation", () =>{
        const backpropagation2 = new Backpropagation(groundTruth as any);
        const actionString1 = [...backpropagation.groundTruth.values()].toString();
        const actionString2 = [...backpropagation2.groundTruth.values()].toString();
        expect(actionString1).not.toEqual(actionString2);
    });
});
