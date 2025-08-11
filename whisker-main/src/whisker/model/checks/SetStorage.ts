import {AbstractCheck, CheckFun0, ICheckJSON, SlimCheckJSON} from "./AbstractCheck";
import {CheckUtility} from "../util/CheckUtility";
import {ModelUtil} from "../util/ModelUtil";
import {z} from "zod";
import {result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";
import {ArgType, StorageValueType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "./CheckTypes";

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

export class SetStorage extends AbstractCheck<SetStorageJSON, CheckFun0> {
    private readonly _key: string;
    private readonly _type: "number" | "string" | "exprType";
    private readonly _value: number | string | string[];
    private readonly _code: string;

    constructor(edgeLabel: string, json: SlimCheckJSON<SetStorageJSON>) {
        super(edgeLabel, {...json, name});
        this._key = this._args[0];
        this._type = this._args[1];
        this._value = this._args[2];
        this._code = this.type !== "exprType" ? ""
            : Array.isArray(this._args[2]) ? this._args[2].join("\n") : String(this._args[2]);
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

    override get dependsOnSayText(): boolean {
        return this._code.includes(".sayText");
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(SetStorageArgs.safeParse(args));
    }

    /**
     * Generates a method that sets the value for the given key in the graph storage.
     * @param t Instance of the test driver for evaluating expressions in case of dynamic values for the storage.
     * @param cu Listener for the checks.
     * @param graphID ID of the parent graph of the check.
     */
    override _checkArgsWithTestDriver(t: TestDriver, cu: CheckUtility, graphID: string): CheckFun0 {
        if (this.type === "number" || this.type === "string") {
            // a static value is used, so there are no dependencies, and nothing has to be computed
            return () => {
                ModelUtil.setStorageValue(graphID, this.key, this.value);
                return result(true, {}, this.negated);
            };
        }
        const exprString = Array.isArray(this.value) ? this.value.join("\n") : this.value as string;
        const expr = ModelUtil.getExpressionForEval(t, exprString, graphID);
        const check = () => {
            const log = {};
            const value = ModelUtil.evaluateExpression(t, expr.expr, graphID, log);
            ModelUtil.setStorageValue(graphID, this.key, value);
            return result(true, log, this.negated);
        };
        ModelUtil.setupAllDependenciesForExpressions(this, cu, graphID, expr, exprString, check);
        return check;
    }

    protected _validate(checkJSON: SetStorageJSON): SetStorageJSON {
        return SetStorageJSON.parse(checkJSON) as SetStorageJSON;
    }

    protected _contradicts(_that: SetStorage): boolean {
        return false;
    }
}
