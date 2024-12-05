import {AbstractCheck, Check, ICheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {z} from "zod";

const NAME = "Key" as const;

export type KeyArgs = [
    /**
     * Name of the key.
     */
    key: string,
];

const KeyArgs = z.tuple([
    z.string(),
]);

export interface KeyJSON extends ICheckJSON {
    name: typeof NAME;
    args: KeyArgs;
}

export const KeyJSON = ICheckJSON.extend({
    name: z.literal(NAME),
    args: KeyArgs,
});

export class Key extends AbstractCheck<KeyJSON> {
    constructor(edgeLabel: string, id: string, negated: boolean, args: KeyArgs) {
        super(edgeLabel, id, negated, NAME, args);
    }

    /**
     * Get a method for checking if a key was pressed or not pressed.
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, _graphID: string): Check {
        const [key] = this._args;
        const negated = this._negated;
        return () => {
            return !negated == cu.isKeyDown(key);
        };
    }
}
