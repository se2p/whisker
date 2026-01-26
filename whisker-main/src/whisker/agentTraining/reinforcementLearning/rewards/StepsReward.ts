import {RewardFunction} from "./RewardFunction";
import {RLEnvironment} from "../misc/RLEnvironment";

export class StepsReward implements RewardFunction {

    /**
     * The number of survived steps in the last episode.
     * @private
     */
    private _accumulatedSteps: number

    /**
     * Rewards the agent for surviving for as long as possible in the game.
     * Each step after which the player can continue playing, i.e., has not reached a GameOver state,
     * is rewarded with a reward of 1. If the player reaches a GameOver state, the reward is 0.
     *
     * @param environment The environment in which the agent is playing.
     * @returns The reward assigned to the agent based on the current state of the environment.
     */
    async computeReward(environment: RLEnvironment): Promise<number> {
        const reward = environment.terminalStateReached() ? 0 : 1;
        this._accumulatedSteps += reward;
        return reward;
    }

    /**
     * The number of survived steps in the last episode.
     *
     * @returns The number of survived steps in the last episode.
     */
    accumulatedReward(): number {
        return this._accumulatedSteps;
    }

    /**
     * The StepsReward class does not maintain a state.
     */
    reset(): void {
        this._accumulatedSteps = 0;
    }

    /**
     * There is no upper bound to the achievable steps value, except restrictions imposed by the environment.
     *
     * @returns False, since there is no upper limit to the achievable steps value.
     */
    goalAchieved(): boolean {
        return false;
    }

    /**
     * {@inheritDoc}
     */
    toString(): string {
        return "Maximize Survived Steps";
    }
}
