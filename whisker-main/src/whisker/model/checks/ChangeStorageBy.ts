import {CheckFun0, ICheckJSON, ImpureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "./CheckTypes";
import {getStorageValue, setStorageValue} from "../util/ModelUtil";

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

export class ChangeStorageBy extends ImpureCheck<ChangeStorageByJSON, CheckFun0> {
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

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(ChangeStorageByArgs.safeParse(args));
    }

    protected _validate(checkJSON: ChangeStorageByJSON): ChangeStorageByJSON {
        return ChangeStorageByJSON.parse(checkJSON) as ChangeStorageByJSON;
    }

    /**
     * Get a method for increasing/decreasing a value in the storage of the graph.
     * @param t Instance of the test driver for evaluating expression.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        return () => {
            const current = getStorageValue(this.graphID, this.key);
            if (typeof current !== "number") {
                return fail({message: `Expected a number but got ${current} with type ${typeof current}`});
            }
            const nextValue = current + this.value;
            setStorageValue(this.graphID, this.key, nextValue);
            return result(true, {}, this.negated);
        };
    }
}
