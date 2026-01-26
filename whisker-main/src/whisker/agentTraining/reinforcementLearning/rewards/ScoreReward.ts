import {RewardFunction} from "./RewardFunction";
import {RLEnvironment} from "../misc/RLEnvironment";
import {ScoreFitness} from "../../neuroevolution/networkFitness/ScoreFitness";

export class ScoreReward implements RewardFunction {

    /**
     * The achieved score value of the previous step.
     */
    private _previousScore = 0;

    /**
     * The accumulated score over the entire episode.
     */
    private _accumulatedScore = 0;

    /**
     * Rewards the agent for increasing the score of the game.
     * If the score got increased by the agent's last action, the agent is rewarded by 1.
     * If the score got decreased by the agent's last action, the agent is rewarded by -1.
     * If there was no change in the game's score, the reward is set to 0.
     *
     * @param environment The environment in which the agent is playing.
     * @returns The reward assigned to the agent based on the current state of the environment.
     */
    async computeReward(environment: RLEnvironment): Promise<number> {
        const currentScore = ScoreFitness.gatherPoints(environment.vmWrapper.vm);

        let reward = 0;
        if (currentScore > this._previousScore) {
            reward = 1;
        } else if (currentScore < this._previousScore) {
            reward = -1;
        }

        this._previousScore = currentScore;
        this._accumulatedScore += currentScore;
        return reward;
    }

    /**
     * The accumulated score over the entire episode.
     *
     * @returns The accumulated score over the entire episode.
     */
    accumulatedReward(): number {
        return this._accumulatedScore;
    }

    /**
     * Resets the state of the score reward function for the next episode.
     */
    reset(): void {
        this._previousScore = 0;
    }

    /**
     * In general, there is no upper bound to the achievable score value.
     *
     * @returns False, since there is no upper bound to the achievable score value.
     */
    goalAchieved(): boolean {
        return false;
    }

    /**
     * {@inheritDoc}
     */
    toString(): string {
        return "Maximize Score";
    }
}
