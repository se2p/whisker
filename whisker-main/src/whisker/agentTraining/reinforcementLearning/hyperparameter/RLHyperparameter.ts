import {ActivationIdentifier} from "@tensorflow/tfjs-layers/dist/keras_format/activation_config";
import {StoppingCondition} from "../../../search/StoppingCondition";
import {TfAgentWrapper} from "../agents/TfAgentWrapper";

export class RLHyperparameter {

    private _epsilonGreedyParameter: EpsilonGreedyParameter;
    private _replayMemoryParameter: ReplayMemoryParameter;
    private _rewardParameter: RewardParameter;
    private _networkArchitecture: NetworkArchitecture;
    private _trainingParameter: TrainingParameter;
    private _environmentParameter: EnvironmentParameter;
    private _coverageObjectives: CoverageObjectiveParameter;
    private _stoppingCondition: StoppingCondition<TfAgentWrapper>

    private _logInterval: number

    public static fromJSON(json: any): RLHyperparameter {
        const parameter = new RLHyperparameter();
        parameter.epsilonGreedyParameter = json._epsilonGreedyParameter;
        parameter.replayMemoryParameter = json._replayMemoryParameter;
        parameter.rewardParameter = json._rewardParameter;
        parameter.networkArchitecture = json._networkArchitecture;
        parameter.environmentParameter = json._environmentParameter;
        parameter.trainingParameter = json._trainingParameter;
        return parameter;
    }

    get epsilonGreedyParameter(): EpsilonGreedyParameter {
        return this._epsilonGreedyParameter;
    }

    set epsilonGreedyParameter(value: EpsilonGreedyParameter) {
        this._epsilonGreedyParameter = value;
    }

    get replayMemoryParameter(): ReplayMemoryParameter {
        return this._replayMemoryParameter;
    }

    set replayMemoryParameter(value: ReplayMemoryParameter) {
        this._replayMemoryParameter = value;
    }

    get rewardParameter(): RewardParameter {
        return this._rewardParameter;
    }

    set rewardParameter(value: RewardParameter) {
        this._rewardParameter = value;
    }

    get networkArchitecture(): NetworkArchitecture {
        return this._networkArchitecture;
    }

    set networkArchitecture(value: NetworkArchitecture) {
        this._networkArchitecture = value;
    }

    get trainingParameter(): TrainingParameter {
        return this._trainingParameter;
    }

    set trainingParameter(value: TrainingParameter) {
        this._trainingParameter = value;
    }

    get environmentParameter(): EnvironmentParameter {
        return this._environmentParameter;
    }

    set environmentParameter(value: EnvironmentParameter) {
        this._environmentParameter = value;
    }

    get stoppingCondition(): StoppingCondition<TfAgentWrapper> {
        return this._stoppingCondition;
    }

    set stoppingCondition(value: StoppingCondition<TfAgentWrapper>) {
        this._stoppingCondition = value;
    }

    get coverageObjectives(): CoverageObjectiveParameter {
        return this._coverageObjectives;
    }

    set coverageObjectives(value: CoverageObjectiveParameter) {
        this._coverageObjectives = value;
    }

    get logInterval(): number {
        return this._logInterval;
    }

    set logInterval(value: number) {
        this._logInterval = value;
    }
}

export interface EpsilonGreedyParameter {
    epsilonStart: number,
    epsilonEnd: number,
    epsilonMaxFrames: number,
}

export interface ReplayMemoryParameter {
    size: number,
    warmUpSteps: number
}

export interface RewardParameter {
    type: RewardType,
    gamma: number
}

export interface NetworkArchitecture {
    inputShape: number,
    hiddenLayers: number[],
    hiddenActivationFunction: ActivationIdentifier,
    outputShape: number,
}

export interface TrainingParameter {
    optimizer: SupportedOptimizers,
    frequency: number,
    batchSize: number,
    learningRate: number,
    epochs: number
}

export interface EnvironmentParameter {
    skipFrames: number,
    maxSteps: number,
    maxTime: number,
    mouseMoveLength: number
}

export interface CoverageObjectiveParameter {
    type: CoverageType,
    targets: string[],
    stableCount: number,
    switchTargetThreshold: number
}

export type SupportedOptimizers = "rmsprop" | "adam";
export type RewardType = "score" | "steps" | "coverage";
export type CoverageType = "statement" | "branch";
