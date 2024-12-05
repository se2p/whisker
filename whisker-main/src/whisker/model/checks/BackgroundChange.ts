import {AbstractCheck, Check, ICheckJSON} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute} from "../util/ModelError";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const NAME = "BackgroundChange" as const;

export type BackgroundChangeArgs = [
    /**
     * Name of the new background.
     */
    newBackground: string,
];

const BackgroundChangeArgs = z.tuple([
    z.string(),
]);

export interface BackgroundChangeJSON extends ICheckJSON {
    name: typeof NAME;
    args: BackgroundChangeArgs;
}

export const BackgroundChangeJSON = ICheckJSON.extend({
    name: z.literal(NAME),
    args: BackgroundChangeArgs,
});

export class BackgroundChange extends AbstractCheck<BackgroundChangeJSON> {
    constructor(edgeLabel: string, id: string, negated: boolean, args: BackgroundChangeArgs) {
        super(edgeLabel, id, negated, NAME, args);
    }

    /**
     * Get a method checking whether the background of the stage changed.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [newBackground] = this._args;
        const negated = this._negated;

        // without movement
        return () => {
            const stage = t.getStage();
            try {
                if (ModelUtil.compare(stage["currentCostumeName"], newBackground, "=")) {
                    return !negated;
                }
            } catch (e) {
                // should not even happen...
                throw new ErrorForAttribute("_stage_", "costume", e);
            }
            return negated;
        };
    }
}
