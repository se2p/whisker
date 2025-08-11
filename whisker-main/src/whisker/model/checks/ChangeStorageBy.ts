import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {z} from "zod";
import {result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "./CheckTypes";

const name = "ChangeStorageBy" as const;

export interface ChangeStorageByJSON extends ICheckJSON {
    name: typeof name;
    args: [string, number];
}

const ChangeStorageByArgs = z.tuple([z.string(), z.number()]);

export const ChangeStorageByJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: ChangeStorageByArgs,
});

export class ChangeStorageBy extends AbstractCheck<ChangeStorageByJSON, CheckFun0> {
    private readonly _key: string;
    private readonly _value: number;

    constructor(edgeLabel: string, json: SlimCheckJSON<ChangeStorageByJSON>) {
        super(edgeLabel, {...json, name});
        this._key = this._args[0];
        this._value = this._args[1];
    }

    get key(): string {
        return this._key;
    }

    get value(): number {
        return this._value;
    }

    override get dependsOnSayText(): boolean {
        return false;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ChangeStorageByArgs.safeParse(args));
    }

    /**
     * Get a method for increasing/decreasing a value in the storage of the graph.
     * @param t Instance of the test driver for evaluating expression.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        return () => {
            const current = ModelUtil.getStorageValue(graphID, this.key);
            if (typeof current !== "number") {
                return fail({message: `Expected a number but got ${current} with type ${typeof current}`});
            }
            const nextValue = current + this.value;
            ModelUtil.setStorageValue(graphID, this.key, nextValue);
            return result(true, {}, this.negated);
        };
    }

    protected _validate(checkJSON: ChangeStorageByJSON): ChangeStorageByJSON {
        return ChangeStorageByJSON.parse(checkJSON) as ChangeStorageByJSON;
    }

    protected _contradicts(_that: ChangeStorageBy): boolean {
        return false;
    }
}
