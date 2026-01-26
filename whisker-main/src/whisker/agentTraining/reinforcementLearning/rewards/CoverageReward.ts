import {RewardFunction} from "./RewardFunction";
import {StatementFitnessFunction} from "../../../testcase/fitness/StatementFitnessFunction";
import {TfAgentWrapper} from "../agents/TfAgentWrapper";
import {RLEnvironment} from "../misc/RLEnvironment";

export class CoverageReward implements RewardFunction {

    /**
     * The coverage fitness of the previous step.
     */
    private _previousCoverageFitness = null;

    /**
     * The accumulated reward over the entire episode.
     */
    private _accumulatedReward = 0;


    constructor(private readonly _coverageGoal: StatementFitnessFunction,
                private readonly _agent: TfAgentWrapper) {
    }

    /**
     * Rewards the agent based on progress towards covering the goal using
     * potential-based reward shaping.
     *
     * - Modest terminal bonus when the coverage goal is reached
     * - Modest penalty when the agent loses the game without reaching the goal
     * - Small Positive/Negative reward if the distance to the coverage objective decreased/increased
     * - Zero in all other cases, e.g., for the first step when there is no previous coverage fitness to compare to.
     */
    async computeReward(environment: RLEnvironment): Promise<number> {
        const currentCoverageFitness = await this._coverageGoal.getFitness(this._agent);

        let reward: number;
        if (currentCoverageFitness === 0) {
            // Terminal bonus for reaching the coverage goal
            reward = 1;
        } else if (environment.terminalStateReached() && currentCoverageFitness > 0) {
            // Terminal penalty for ending the game without reaching the objective.
            reward = -1;
        } else if (this._previousCoverageFitness !== null && !environment.terminalStateReached()) {
            // Else reward is the difference between the current and previous coverage fitness scaled by 1000 since
            // the differences between steps tend to be in the magnitudes of e-4.
            reward = Math.tanh((this._previousCoverageFitness - currentCoverageFitness) * 1000);
        } else {
            reward = 0;
        }

        this._accumulatedReward += reward;
        this._previousCoverageFitness = currentCoverageFitness;

        return reward;
    }

    /**
     * The accumulated coverage fitness over the entire episode.
     * Equivalent to the distance towards covering the specified coverage objective after the episode.
     *
     * @returns The accumulated coverage fitness over the entire episode.
     */
    accumulatedReward(): number {
        return this._accumulatedReward;
    }

    /**
     * Resets the state of the coverage reward function for the next episode.
     */
    reset(): void {
        this._accumulatedReward = 0;
        this._previousCoverageFitness = null;
    }

    /**
     * If the coverage objective has been reached, no further rewards can be assigned.
     *
     * @returns True if the coverage objective has been reached, false otherwise.
     */
    goalAchieved(): boolean {
        return this._previousCoverageFitness === 0;
    }

    /**
     * {@inheritDoc}
     */
    toString(): string {
        return `Cover ${this._coverageGoal.toString()}`;
    }

}
