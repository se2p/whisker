import {TfAgentWrapper} from "../agents/TfAgentWrapper";
import {StatementFitnessFunction} from "../../../testcase/fitness/StatementFitnessFunction";
import logger from "../../../../util/logger";
import {
    CoverageObjectiveParameter,
    EnvironmentParameter,
    EpsilonGreedyParameter,
    NetworkArchitecture,
    ReplayMemoryParameter,
    RewardParameter, RewardType, RLHyperparameter, TrainingParameter
} from "../hyperparameter/RLHyperparameter";
import {StoppingCondition} from "../../../search/StoppingCondition";
import {RLEnvironment, Trajectory} from "../misc/RLEnvironment";
import {RLAlgorithm} from "./RLAlgorithm";
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import {StepsReward} from "../rewards/StepsReward";
import {RewardFunction} from "../rewards/RewardFunction";
import {ScoreReward} from "../rewards/ScoreReward";
import {CoverageReward} from "../rewards/CoverageReward";
import {TargetObjectiveSelection} from "../../neuroevolution/misc/TargetObjectiveSelection";
import Arrays from "../../../utils/Arrays";
import {NonExhaustiveCaseDistinction} from "../../../core/exceptions/NonExhaustiveCaseDistinction";

export abstract class RLTestGenerationAlgorithm<A extends TfAgentWrapper> implements RLAlgorithm<A> {

    /**
     * Stores the start time of the algorithm.
     */
    protected _startTime: number;

    /**
     * The current epsilon value for the epsilon-greedy policy.
     * @private
     */
    protected _epsilon: number;

    /**
     * Number of steps that have been observed. Used for calculating the decay of the epsilon value.
     */
    protected _observedSteps: number;

    /**
     * Number of episodes that have been performed.
     */
    protected _observedEpisodes: number;

    /**
     * Number of evaluations that have been performed.
     */
    protected _evaluations: number

    /**
     * Stores the maximum reward achieved within an evaluation episode.
     */
    protected _maxReward: number;

    /**
     * Stores the maximum reward achieved over all evaluation episodes.
     */
    protected _overallMaxReward: number;

    /**
     * Average reward over all evaluation episodes.
     */
    protected _averageReward: number;

    /**
     * Maps coverage objectives to a unique identifier.
     */
    protected _coverageObjectives: Map<number, StatementFitnessFunction>

    /**
     * Objectives that are lower prioritized during the selection of the next objective to be covered.
     */
    protected _lowPrioritizedObjectives: Set<StatementFitnessFunction> = new Set();

    /**
     * The archive of agents that have been optimized during the optimization process.
     * Each key represents a unique coverage objective that can be reached by executing the respective agent.
     */
    protected _archive: Map<number, A> = new Map();

    protected readonly _epsilonGreedyParameter: EpsilonGreedyParameter;
    protected readonly _replayMemoryParameter: ReplayMemoryParameter;
    protected readonly _rewardParameter: RewardParameter;
    protected readonly _networkArchitecture: NetworkArchitecture;
    protected readonly _trainingParameter: TrainingParameter;
    protected readonly _environmentParameter: EnvironmentParameter;
    protected readonly _coverageObjectiveParameter: CoverageObjectiveParameter;
    protected readonly _stoppingCondition: StoppingCondition<A>;

    protected constructor(protected readonly _hyperparameter: RLHyperparameter,
                          protected readonly _environment: RLEnvironment) {
        this._epsilonGreedyParameter = _hyperparameter.epsilonGreedyParameter;
        this._replayMemoryParameter = _hyperparameter.replayMemoryParameter;
        this._rewardParameter = _hyperparameter.rewardParameter;
        this._networkArchitecture = _hyperparameter.networkArchitecture;
        this._trainingParameter = _hyperparameter.trainingParameter;
        this._environmentParameter = _hyperparameter.environmentParameter;
        this._coverageObjectiveParameter = _hyperparameter.coverageObjectives;
        this._stoppingCondition = _hyperparameter.stoppingCondition;
    }

    /**
     * Performs a single episode in the given environment by letting the agent perform actions in the environment
     * until a terminal state is reached. The agent's actions are evaluated based on the supplied reward function.
     *
     * @param environment The environment in which the agent is playing.
     * @param agent The agent that is playing the game.
     * @param rewardFunction The reward function that is used to evaluate the agent's actions.
     * @param greedily Whether the agent should perform actions greedily or not.
     */
    abstract performEpisode(environment: RLEnvironment, agent: A,
                            rewardFunction: RewardFunction, greedily: boolean): Promise<Trajectory>;

    /**
     * Initializes the reward function based on the specified reward type.
     * If the reward function is coverage-based, the agent to be optimized and the coverage objective to be covered
     * have to be specified additionally.
     *
     * @param type The type of the reward function to be initialized.
     * @param agent The agent to be optimized. Only required for coverage-based reward functions.
     * @param objective The coverage objective to be covered. Only required for coverage-based reward functions.
     *
     * @returns The {@link RewardFunction} based on which the agent should be optimized.
     */
    protected _initializeRewardFunction(type: RewardType, agent?: TfAgentWrapper,
                                        objective?: StatementFitnessFunction): RewardFunction {
        switch (type) {
            case "steps":
                return new StepsReward();
            case "score":
                return new ScoreReward();
            case "coverage":
                return new CoverageReward(objective, agent);
            default:
                throw new NonExhaustiveCaseDistinction(type, `Reward type ${type} not supported!`);
        }
    }

    /**
     * Initializes parameter of the Reinforcement Learning algorithm.
     */
    protected _initialize(): void {
        this._overallMaxReward = 0;
        this._maxReward = 0;
        this._averageReward = 0;
        this._observedSteps = 0;
        this._observedEpisodes = 0;
        this._evaluations = 0;
    }

    /**
     * Evaluates the agent by greedily executing it in the environment.
     * The agent is executed for {@link DeepQLearningHyperparameter#stableCount} steps and the resulting
     * coverage counts are updated.
     *
     * If the agent manages to reliably cover a previously uncovered coverage objective,
     * a clone of the agent is added to the archive.
     *
     * @param agent The agent to be evaluated.
     * @param environment The environment in which the agent is playing.
     * @param reward The reward function that is used to evaluate the agent's actions.
     *
     * @returns The trajectories of observed {@link StepData} while interacting with the environment.
     */
    protected async _evaluate(agent: A, environment: RLEnvironment, reward: RewardFunction): Promise<Trajectory[]> {
        logger.info("Evaluating agent");
        this._maxReward = 0;
        this._averageReward = 0;

        const coverageObjectives = this._getUncoveredObjectives();
        agent.resetCoverageMap(coverageObjectives);

        const trajectories: Trajectory[] = [];
        for (let i = 0; i < this._coverageObjectiveParameter.stableCount; i++) {
            const trajectory = await this.performEpisode(environment, agent, reward, true);
            trajectories.push(trajectory);

            agent.trace = this._environment.getExecutionTrace();
            agent.blockCoverage = this._environment.getBlockCoverage();
            agent.branchCoverage = this._environment.getBranchCoverage();
            await this._updateCoverageCounts(agent);

            const episodeReward = this._accumulateRewardOverTrajectory(trajectory);
            this._maxReward = Math.max(this._maxReward, episodeReward);
            this._averageReward += episodeReward;

            await StatisticsCollector.getInstance().updateStatementCoverage(agent);
            await StatisticsCollector.getInstance().updateBranchCoverage(agent);
        }

        this._overallMaxReward = Math.max(this._overallMaxReward, this._maxReward);
        this._averageReward /= this._coverageObjectiveParameter.stableCount;
        this._evaluations++;

        this._updateArchive(agent);

        StatisticsCollector.getInstance().computeStatementCoverage();
        StatisticsCollector.getInstance().computeBranchCoverage();

        return trajectories;
    }

    /**
     * Returns a list of all coverage objectives that have not been covered yet.
     */
    protected _getUncoveredObjectives(): StatementFitnessFunction[] {
        const uncoveredObjectives = [];
        for (const [key, objective] of this._coverageObjectives) {
            if (!this._archive.has(key)) {
                uncoveredObjectives.push(objective);
            }
        }
        return uncoveredObjectives;
    }

    /**
     * Updates the coverage counts, i.e., how often all yet uncovered objectives were covered, of the specified agent.
     *
     * @param agent The agent whose coverage counts should be updated.
     */
    private async _updateCoverageCounts(agent: A): Promise<void> {
        for (const [objective, count] of agent.coverageCounts.entries()) {
            if (await objective.isCovered(agent)) {
                agent.coverageCounts.set(objective, count + 1);
            }
        }
    }

    /**
     * Updates the archive if the specified agent has reliably covered a previously uncovered objective.
     *
     * @param agent The agent with whom the archive should be updated.
     */
    protected _updateArchive(agent: A): void {
        let coveredNewObjective = false;
        for (const [key, objective] of this._coverageObjectives) {
            if (this._coveredObjective(objective, agent)) {
                logger.info(`Covered objective ${objective}`);
                this._archive.set(key, agent);
                coveredNewObjective = true;
            }
        }
        if (coveredNewObjective) {
            this._minimizeArchive(agent);
        }
    }

    /**
     * Minimizes the number of agents stored in the archive by replacing old agents with agent's that were recently
     * added to the archive.
     *
     * @param agent A agent that was recently added to the archive.
     */
    private _minimizeArchive(agent: A): void {
        const sizeBefore = this.getCurrentSolution().length;
        for (const [key, objective] of this._coverageObjectives) {
            if (this._coveredObjective(objective, agent)) {
                this._archive.set(key, agent);
            }
        }
        const sizeAfter = this.getCurrentSolution().length;
        if (sizeAfter < sizeBefore) {
            logger.debug(`Minimized Archive: ${sizeBefore} -> ${sizeAfter}`);
        }
    }

    private _coveredObjective(objective: StatementFitnessFunction, agent: A): boolean {
        return agent.coverageCounts.get(objective) >= this._hyperparameter.coverageObjectives.stableCount;
    }

    /**
     * Selects the next target objective by filtering covered and lower prioritized objectives.
     * Places the selected objective on the list of lower prioritized objectives to prioritize objectives
     * that have not been selected as optimization target yet.
     *
     * @returns The next objective to be covered.
     */
    protected _selectNextObjective(): StatementFitnessFunction {
        const allObjectives = [...this._coverageObjectives.values()];
        const uncoveredObjectives = this._getUncoveredObjectives();
        const feasibleObjectives = TargetObjectiveSelection.getFeasibleCoverageObjectives(allObjectives, uncoveredObjectives);
        const preclude = [...this._lowPrioritizedObjectives.values()];
        const nextObjective = TargetObjectiveSelection.getPromisingObjective(feasibleObjectives, preclude);
        this._lowPrioritizedObjectives.add(nextObjective);
        return nextObjective;
    }

    /**
     * Linearly reduces the epsilon value of the epsilon-greedy policy based on the number of observed steps until
     * a minimal fixpoint is reached.
     */
    protected _epsilonDecay(): void {
        const {epsilonStart, epsilonEnd, epsilonMaxFrames} = this._epsilonGreedyParameter;

        if (this._epsilon > epsilonEnd) {
            const decayRate = (epsilonStart - epsilonEnd) / epsilonMaxFrames;
            this._epsilon = Math.max(this._epsilon - decayRate, epsilonEnd);
        }
    }

    /**
     * Accumulated the reward over an entire trajectory and returns the accumulated reward.
     *
     * @param trajectory The trajectory whose reward should be accumulated.
     * @returns The accumulated reward.
     */
    protected _accumulateRewardOverTrajectory(trajectory: Trajectory): number {
        return trajectory.reduce((acc, step) => acc + step.reward, 0);
    }

    /**
     * Fetches the key for a given coverage objective.
     *
     * @param objective The objective for which the key should be fetched.
     * @returns The key for the specified coverage objective.
     */
    protected _getKeyForObjective(objective: StatementFitnessFunction): number {
        for (const [key, value] of this._coverageObjectives) {
            if (value === objective) {
                return key;
            }
        }
        throw new Error("Coverage objective not found in coverage objectives map.");
    }

    /**
     * {@inheritDoc}
     */
    getStartTime(): number {
        return this._startTime;
    }

    abstract findSolution(): Promise<Map<number, A>>;

    /**
     * {@inheritDoc}
     */
    getFitnessFunctions(): Iterable<StatementFitnessFunction> {
        return this._coverageObjectives.values();
    }

    /**
     * {@inheritDoc}
     */
    setFitnessFunctions(coverageObjectives: Map<number, StatementFitnessFunction>): void {
        this._coverageObjectives = coverageObjectives;
    }

    /**
     * {@inheritDoc}
     */
    getCurrentSolution(): A[] {
        return Arrays.distinctObjects(this._archive.values());
    }
}
