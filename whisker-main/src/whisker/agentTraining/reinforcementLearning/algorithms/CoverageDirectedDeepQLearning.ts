import {DeepQLearning} from "./DeepQLearning";
import {DeepQLearningHyperparameter} from "../hyperparameter/DeepQLearningHyperparameter";
import {RLEnvironment} from "../misc/RLEnvironment";
import {QNetwork} from "../agents/QNetwork";
import logger from "../../../../util/logger";
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import {CoverageReward} from "../rewards/CoverageReward";
import {StatementFitnessFunction} from "../../../testcase/fitness/StatementFitnessFunction";

export class CoverageDirectedDeepQLearning extends DeepQLearning {

    constructor(protected override readonly _hyperparameter: DeepQLearningHyperparameter, _environment: RLEnvironment) {
        super(_hyperparameter, _environment);
    }

    /**
     * Optimizes one or several DQN agents based on the specified coverage-specific reward function.
     * If a DQN agent is able to cover yet uncovered coverage objectives, a clone of the DQN agent is stored in the archive.
     *
     * @returns The optimized agents mapped to the coverage objectives.
     */
    public override async findSolution(): Promise<Map<number, QNetwork>> {

        this._startTime = Date.now();

        // Outer Loop: Iterate over all yet uncovered coverage objectives.
        while (this._getUncoveredObjectives().length > 0 && !(await this._stoppingCondition.isFinished(this))) {
            this._initialize();

            const currentObjective = this._selectNextObjective();
            const objectiveKey = this._getKeyForObjective(currentObjective);
            const rewardFunction = new CoverageReward(currentObjective, this._actingNetwork);

            logger.info(`Current objective: ${currentObjective}`);
            logger.info(`Covered Objectives: ${this._archive.size}/${this._coverageObjectives.size}`);
            logger.info(`Covered Statements: ${StatisticsCollector.getInstance().statementCoverage * 100}%`);
            logger.info(`Covered Branches: ${StatisticsCollector.getInstance().branchCoverage * 100}%`);

            // Inner Loop: Optimize Q-Network for the current coverage objective.
            let maxAverageReward = 0;
            let lastImprovedEvaluationCount = this._evaluations;
            while (!await this._stopQLearningOptimization(objectiveKey)) {
                await this._qLearningIteration(rewardFunction);

                // Print fitness towards the coverage objective after each evaluation round.
                if ((this._observedEpisodes - this._coverageObjectiveParameter.stableCount) % this._hyperparameter.evaluationFrequency === 0) {
                    logger.info(`Fitness to target objective ${currentObjective}: ${this._actingNetwork.coverageCounts.get(currentObjective)}`);
                }

                if (this._averageReward > maxAverageReward) {
                    lastImprovedEvaluationCount = this._evaluations;
                    maxAverageReward = this._averageReward;
                }

                if (this._switchTargetObjective(lastImprovedEvaluationCount, currentObjective)) {
                    logger.info(`Switching optimization target ${currentObjective} due to missing improvement.`);
                    break;
                }
            }
        }

        this._updateGlobalStats();
        return this._archive;
    }

    /**
     * Determines whether the Q-Learning optimization for the current coverage objective should be stopped.
     *
     * If the current coverage objective has already been covered, the optimization is stopped.
     * If the stopping condition is met, the optimization is stopped.
     *
     * @param objectiveKey The key of the current coverage objective.
     * @returns True if the Q-Learning optimization for the current coverage objective should be stopped, false otherwise.
     */
    private async _stopQLearningOptimization(objectiveKey: number): Promise<boolean> {
        return this._archive.has(objectiveKey) || await this._stoppingCondition.isFinished(this);
    }

    /**
     * Determines whether the current coverage objective should be switched.
     * We switch the current coverage objective if the number of evaluations since the last improvement is greater than
     * the specified threshold.
     *
     * @param lastImprovedEvaluation The evaluation count since the last improvement in the average reward was seen.
     * @param currentObjective The current coverage objective.
     * @returns True if the current coverage objective should be switched, false otherwise.
     */
    private _switchTargetObjective(lastImprovedEvaluation: number, currentObjective: StatementFitnessFunction) {
        const switchingTargets = this._getUncoveredObjectives()
            .filter(obj => obj.getNodeId() !== currentObjective.getNodeId());
        return switchingTargets.length > 1 &&
            (this._evaluations - lastImprovedEvaluation) > this._coverageObjectiveParameter.switchTargetThreshold;
    }
}
