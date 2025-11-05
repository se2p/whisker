import {CheckFun0, ICheckJSON, ImpureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType, StorageValueType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "./CheckTypes";
import {evaluateExpression, getExpressionForEval, setStorageValue,} from "../util/ModelUtil";

const name = "SetStorage" as const;

export type SetStorageArgs = [string, ...StorageValueType];

export interface SetStorageJSON extends ICheckJSON {
    name: typeof name;
    args: SetStorageArgs;
}

const SetStorageArgs = z.union([
    z.tuple([z.string(), z.literal("string"), z.string()]),
    z.tuple([z.string(), z.literal("number"), z.number()]),
    z.tuple([z.string(), z.literal("exprType"), z.string().or(z.array(z.string()))])
]);

export const SetStorageJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: SetStorageArgs,
});

export class SetStorage extends ImpureCheck<SetStorageJSON, CheckFun0> {
    private readonly _key: string;
    private readonly _type: "number" | "string" | "exprType";
    private readonly _value: number | string | string[];

    constructor(edgeLabel: string, json: SlimCheckJSON<SetStorageJSON>) {
        super(edgeLabel, {...json, name});
        this._key = this._args[0];
        this._type = this._args[1];
        this._value = this._args[2];
    }

    get key(): string {
        return this._key;
    }

    get type(): "number" | "string" | "exprType" {
        return this._type;
    }

    get value(): number | string | string[] {
        return this._value;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(SetStorageArgs.safeParse(args));
    }

    protected _validate(checkJSON: SetStorageJSON): SetStorageJSON {
        return SetStorageJSON.parse(checkJSON) as SetStorageJSON;
    }

    /**
     * Generates a method that sets the value for the given key in the graph storage.
     * @param t Instance of the test driver for evaluating expressions in case of dynamic values for the storage.
     */
    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        if (this.type === "number" || this.type === "string") {
            return () => {
                setStorageValue(this.graphID, this.key, this.value);
                return result(true, {}, this.negated);
            };
        }
        const exprString = Array.isArray(this.value) ? this.value.join("\n") : this.value as string;
        const expr = getExpressionForEval(t, exprString, this.graphID);
        return () => {
            const log = {};
            const value = evaluateExpression(t, expr.expr, this.graphID, log);
            setStorageValue(this.graphID, this.key, value);
            return result(true, log, this.negated);
        };
    }
}
