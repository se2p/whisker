import {CheckFun0, ICheckJSON, ImpureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "./CheckTypes";
import {doesModelExist, stopModel} from "../util/ModelUtil";
import {result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";

const name = "StopModels";

export type StopModelsArgs = [string, ...string[]];

export interface StopModelsJSON extends ICheckJSON {
    name: typeof name;
    args: StopModelsArgs;
}

const StopModelsArgs = z.string().or(z.array(z.string()).min(1));

export const StopModelsJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: StopModelsArgs,
});

export class StopModels extends ImpureCheck<StopModelsJSON, CheckFun0> {

    private _modelIds: string[];

    constructor(edgeLabel: string, json: SlimCheckJSON<StopModelsJSON>) {
        super(edgeLabel, {...json, name});
        this._modelIds = this._args;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(StopModelsJSON.safeParse(args));
    }

    protected _validate(checkJSON: StopModelsJSON): StopModelsJSON {
        return StopModelsJSON.parse(checkJSON) as StopModelsJSON;
    }

    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const nonExistentModels = this._modelIds.filter(id => !doesModelExist(id));
        if (nonExistentModels.length > 0) {
            throw new Error(`The following models do not exist: ${JSON.stringify(nonExistentModels)}`);
        }
        const modelIds = new Set<string>(this._modelIds);
        return () => {
            this._modelIds.forEach(id => stopModel(id));
            this.removeEffectsOfModels(modelIds);
            return result(true, {}, this.negated);
        };
    }
}
