import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {z} from "zod";
import {result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {Keys, ModelUtil} from "../util/ModelUtil";
import {InputErrorCodes} from "./newCheck";

const name = "Key" as const;

export type KeyArgs = [
    /**
     * Name of the key.
     */
    key: string,
];

const KeyArgs = z.tuple([
    z.enum(Keys),
]);

export interface KeyJSON extends ICheckJSON {
    name: typeof name;
    args: KeyArgs;
}

export const KeyJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: KeyArgs,
});

export class Key extends AbstractCheck<KeyJSON, CheckFun0> {
    constructor(edgeLabel: string, json: SlimCheckJSON<KeyJSON>) {
        super(edgeLabel, {...json, name});
    }

    protected _validate(checkJSON: KeyJSON): KeyJSON {
        return KeyJSON.parse(checkJSON) as KeyJSON;
    }

    /**
     * Get a method for checking if a key was pressed or not pressed.
     * @param t Instance of the test driver (unused).
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        const [key] = this._args;
        const negated = this.negated;
        return () => result(cu.isKeyDown(key), {}, negated);
    }

    protected _contradicts(_that: Key): boolean {
        return false; // Multiple keys can be pressed at the same time.
    }

    override get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): InputErrorCodes[] {
        return [ModelUtil.isKey(args[0]) ? "" : "InvalidKey"];
    }
}
