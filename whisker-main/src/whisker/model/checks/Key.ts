import {AbstractCheck, Check, ICheckJSON, OptionalName} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {z} from "zod";

const name = "Key" as const;

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
    name: typeof name;
    args: KeyArgs;
}

export const KeyJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: KeyArgs,
});

export class Key extends AbstractCheck<KeyJSON> {
    constructor(edgeLabel: string, json: OptionalName<KeyJSON>) {
        super(edgeLabel, {...json, name}, KeyJSON.parse.bind(KeyJSON));
    }

    /**
     * Get a method for checking if a key was pressed or not pressed.
     * @param t Instance of the test driver.
     * @param cu Listener for the checks.
     */
    override _checkArgsWithTestDriver(t, cu: CheckUtility, _graphID: string): Check {
        const [key] = this.args;
        const negated = this.negated;
        return () => {
            return !negated == cu.isKeyDown(key);
        };
    }
}
