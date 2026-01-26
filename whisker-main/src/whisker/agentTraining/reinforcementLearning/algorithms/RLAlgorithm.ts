import {OptimizationAlgorithm} from "../../../core/OptimizationAlgorithm";
import {TfAgentWrapper} from "../agents/TfAgentWrapper";
import {RewardFunction} from "../rewards/RewardFunction";
import {RLEnvironment, Trajectory} from "../misc/RLEnvironment";

export interface RLAlgorithm<A extends TfAgentWrapper> extends OptimizationAlgorithm<A> {

    /**
     * Performs a single episode in the given environment by letting the agent perform actions in the environment
     * until a terminal state is reached. The agent's actions are evaluated based on the supplied reward function.
     *
     * @param environment The environment in which the agent is playing.
     * @param agent The agent that is playing the game.
     * @param rewardFunction The reward function that is used to evaluate the agent's actions.
     * @param greedily Whether the agent should perform actions greedily or not.
     *
     * @returns The {@link Trajectory} of visited states, executed actions, obtained rewards and
     * whether the episode ended in a terminal state.
     */
    performEpisode(environment: RLEnvironment, agent: A,
                   rewardFunction: RewardFunction, greedily: boolean): Promise<Trajectory>
}
