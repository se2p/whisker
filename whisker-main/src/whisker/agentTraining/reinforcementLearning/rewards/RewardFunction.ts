import {RLEnvironment} from "../misc/RLEnvironment";

export interface RewardFunction {

    /**
     * Computes a reward for a Reinforcement Learning algorithm based on the current state of the environment.
     *
     * @param environment The Reinforcement Learning environment.
     * @returns The reward assigned to the agent based on the current state of the environment.
     */
    computeReward(environment: RLEnvironment): Promise<number>

    /**
     * The accumulated reward over the entire episode.
     * Equivalent to fitness functions in search-based algorithms.
     *
     * @returns The accumulated reward over the entire episode.
     */
    accumulatedReward(): number;

    /**
     * Whether the current goal has been achieved and no further rewards can be earned.
     *
     * @returns True if no further rewards can be earned, false otherwise.
     */
    goalAchieved(): boolean;

    /**
     * Resets the state of the reward function for the next episode.
     */
    reset(): void;

    /**
     * Returns a string representation of the reward function.
     *
     * @returns A string representation of the reward function.
     */
    toString(): string;
}
