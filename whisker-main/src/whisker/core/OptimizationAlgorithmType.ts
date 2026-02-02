import {SearchAlgorithmType} from "../search/algorithms/SearchAlgorithmType";
import {ReinforcementAlgorithmType} from "../agentTraining/reinforcementLearning/algorithms/ReinforcementAlgorithmType";

export type OptimizationAlgorithmType =
    SearchAlgorithmType
    | ReinforcementAlgorithmType
