import {AbstractCheck, Check, ICheckJSON, OptionalName} from "./AbstractCheck";
import {ModelUtil} from "../util/ModelUtil";
import {ErrorForAttribute} from "../util/ModelError";
import {z} from "zod";
import {CheckUtility} from "../util/CheckUtility";

const name = "BackgroundChange" as const;

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
    name: typeof name;
    args: BackgroundChangeArgs;
}

export const BackgroundChangeJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: BackgroundChangeArgs,
});

export class BackgroundChange extends AbstractCheck<BackgroundChangeJSON> {
    constructor(edgeLabel: string, json: OptionalName<BackgroundChangeJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: BackgroundChangeJSON): BackgroundChangeJSON {
        return BackgroundChangeJSON.parse(checkJSON) as BackgroundChangeJSON;
    }

    /**
     * Get a method checking whether the background of the stage changed.
     * @param t Instance of the test driver.
     */
    override _checkArgsWithTestDriver(t, _cu: CheckUtility, _graphID: string): Check {
        const [newBackground] = this.args;
        const negated = this.negated;

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

    protected override _contradicts(that: BackgroundChangeJSON): boolean {
        const [thisCostume] = this.args;
        const [thatCostume] = that.args;
        return thisCostume !== thatCostume; // Cannot change to two different costumes at the same time.
    }
}
