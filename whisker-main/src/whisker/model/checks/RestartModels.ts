import {CheckFun0, ICheckJSON, ImpureCheck, SlimCheckJSON} from "./AbstractCheck";
import {z} from "zod";
import {ArgType} from "../util/schema";
import {parseNonUnionError, ParsingResult} from "./CheckTypes";
import {markModelAsRestartable, restartModel} from "../util/ModelUtil";
import {result} from "./CheckResult";
import TestDriver from "../../../test/test-driver";

const name = "RestartModels";

export type RestartModelsArgs = [string, ...string[]];

export interface RestartModelsJSON extends ICheckJSON {
    name: typeof name;
    args: RestartModelsArgs;
}

const RestartModelsArgs = z.string().or(z.array(z.string()).min(1));

export const RestartModelsJSON = ICheckJSON.extend({
    name: z.literal(name),
    args: RestartModelsArgs,
});


export class RestartModels extends ImpureCheck<RestartModelsJSON, CheckFun0> {

    private _modelIds: string[];

    constructor(edgeLabel: string, json: SlimCheckJSON<RestartModelsJSON>) {
        super(edgeLabel, {...json, name});
        this._modelIds = this._args;
    }

    public static convertArgs(args: ArgType[]): ParsingResult {
        return parseNonUnionError(RestartModelsJSON.safeParse(args));
    }

    protected _validate(checkJSON: RestartModelsJSON): RestartModelsJSON {
        return RestartModelsJSON.parse(checkJSON) as RestartModelsJSON;
    }

    override _checkArgsWithTestDriver(t: TestDriver): CheckFun0 {
        const nonExistentModels = this._modelIds.filter(markModelAsRestartable);
        if (nonExistentModels.length > 0) {
            throw new Error(`The following models do not exist: ${JSON.stringify(nonExistentModels)}`);
        }
        const modelIdsString = `restarted models: ${this._modelIds}`;
        return () => {
            const step = t.getTotalStepsExecuted();
            this._modelIds.forEach(id => restartModel(id, step));
            this._debug(modelIdsString);
            return result(true, {}, this.negated);
        };
    }
}
