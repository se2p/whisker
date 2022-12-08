import groundTruth from "./GroundTruth.json";
import {Backpropagation} from "../../../../src/whisker/whiskerNet/Misc/Backpropagation";


describe('Test Backpropagation', () => {
    let backpropagation: Backpropagation;
    const statement = "}Gp_.7).xv-]IUt.!E1/-Bowl"; // Catching the apple for 30 seconds.

    beforeEach(() => {
        backpropagation = new Backpropagation(groundTruth as any);
    });

    test("Check number of recordings after initialisation", () => {
        let featureRecordings = 0;
        for (const recordings of Object.values(groundTruth)) {
            for (const [key, featureArray] of Object.entries(recordings)) {
                if (key === 'coverage' || !recordings['coverage'].includes(statement)) {
                    continue;
                }
                featureRecordings += featureArray.length;
            }
        }
        expect([...backpropagation._organiseData(statement).keys()].length).toBe(featureRecordings);
    });

    test("Check shuffle during initialisation", () => {
        const backpropagation2 = new Backpropagation(groundTruth as any);
        const actionString1 = [...backpropagation._organiseData(statement).values()].toString();
        const actionString2 = [...backpropagation2._organiseData(statement).values()].toString();
        expect(actionString1).not.toEqual(actionString2);
    });
});
