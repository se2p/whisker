import {QNetwork} from "../agents/QNetwork";
import {RLEnvironment, StepData, Trajectory} from "../misc/RLEnvironment";
import {FixedSizeQueue} from "../../../utils/FixedSizeQueue";
import {Randomness} from "../../../utils/Randomness";
import {DeepQLearningHyperparameter} from "../hyperparameter/DeepQLearningHyperparameter";
import * as tf from "@tensorflow/tfjs";
import logger from "../../../../util/logger";
import {RLTestGenerationAlgorithm} from "./RLTestGenerationAlgorithm";
import {CoverageOverTime, StatisticsCollector} from "../../../utils/StatisticsCollector";
import {RewardFunction} from "../rewards/RewardFunction";


export class DeepQLearning extends RLTestGenerationAlgorithm<QNetwork> {

    /**
     * The network that is used to select actions to be sent to the environment.
     */
    protected _actingNetwork: QNetwork;

    /**
     * The target network used for computing the target Q-Values.
     */
    protected _targetNetwork: QNetwork;

    /**
     * Replay memory that stores the trajectories of the last N episodes.
     */
    protected _replayMemory: FixedSizeQueue<StepData>;

    /**
     * Counts how often the DQN has been trained.
     */
    private _trainingIterations: number;

    /**
     * Accumulates the sum of the training loss since the last time the log was printed.
     */
    private _lossSumSinceLog: number;

    /**
     * Instance of the random number generator.
     */
    protected _random: Randomness

    constructor(protected override readonly _hyperparameter: DeepQLearningHyperparameter, _environment: RLEnvironment) {
        super(_hyperparameter, _environment);
        this._random = Randomness.getInstance();
    }


    /**
     * Optimizes a DQL agent based on the specified reward function, which is not coverage-specific.
     * If a DQN agent is able to cover yet uncovered coverage objectives, a clone of the DQN agent is stored in the archive.
     *
     * @returns The optimized agents mapped to the coverage objectives.
     */
    public async findSolution(): Promise<Map<number, QNetwork>> {

        const rewardFunction = this._initialize();

        this._startTime = Date.now();

        while (!await this._stoppingCondition.isFinished(this)) {
            await this._qLearningIteration(rewardFunction);
        }

        this._updateGlobalStats();
        return this._archive;
    }

    /**
     * Initializes the Deep-Q-Learning algorithm.
     *
     * @returns The initialized acting and target Q-networks and the reward function.
     */
    protected override _initialize(): RewardFunction {
        super._initialize();
        this._actingNetwork = new QNetwork(this._hyperparameter);
        this._targetNetwork = this._actingNetwork.clone();

        this._replayMemory = new FixedSizeQueue(this._replayMemoryParameter.size);
        this._epsilon = this._epsilonGreedyParameter.epsilonStart;

        this._trainingIterations = 0;
        this._lossSumSinceLog = 0;

        return this._initializeRewardFunction(this._rewardParameter.type);
    }

    /**
     * Performs a single iteration of the Q-Learning algorithm.
     *
     * The algorithm consists of the following steps:
     * 1. Perform an episode and collect samples for the replay memory.
     * 2. Within the episode train the network every n-th step as configured by the hyperparameters.
     * 3. After training update the target network every n-th training iteration as configured by the hyperparameters.
     * 4. Reduce the epsilon value defining how often random actions are sampled.
     * 5. Periodically print the current training progress to the console.
     *
     * @param rewardFunction The reward function that is used to evaluate the agent's actions.
     */
    protected async _qLearningIteration(rewardFunction: RewardFunction): Promise<void> {
        // Perform an episode and collect samples for the replay memory.
        if (this._observedEpisodes % this._hyperparameter.evaluationFrequency === 0) {
            await this._evaluate(this._actingNetwork, this._environment, rewardFunction);
            this._updateTimeLineStats();
        } else {
            await this.performEpisode(this._environment, this._actingNetwork, rewardFunction, false);
        }

        this._epsilonDecay();

        // Periodically print the current training progress to the console.
        if (this._observedEpisodes % this._hyperparameter.logInterval === 0) {
            this._printLog(rewardFunction);
        }
    }

    /**
     * Performs a single episode in the given environment by letting the agent perform actions in the environment
     * until a terminal state is reached. The agent's actions are evaluated based on the supplied reward function.
     *
     * @param environment The environment in which the agent is playing.
     * @param actingQNetwork The Q-Network that is used to select actions to be sent to the environment.
     * @param rewardFunction The reward function that is used to evaluate the agent's actions.
     * @param evaluate Whether the agent is getting evaluated.
     *  If true, we select actions greedily and do not train the agent.
     */
    async performEpisode(environment: RLEnvironment, actingQNetwork: QNetwork,
                         rewardFunction: RewardFunction, evaluate: boolean): Promise<Trajectory> {
        const trajectory: Trajectory = [];

        await environment.reset();
        rewardFunction.reset();
        do {
            const nextAction = this._selectNextAction(actingQNetwork, evaluate);
            const stepData = await environment.step([nextAction], rewardFunction, actingQNetwork);

            // Stop if no further rewards can be collected.
            if (rewardFunction.goalAchieved()) {
                stepData.done = true;
            }

            this._replayMemory.enqueue(stepData);
            trajectory.push(stepData);

            if (!evaluate && this._observedSteps > this._replayMemoryParameter.warmUpSteps
                && trajectory.length % this._hyperparameter.trainingParameter.frequency === 0) {
                await this._train();
            }
        } while (!trajectory[trajectory.length - 1].done);
        environment.finalize();

        this._observedSteps += trajectory.length;
        this._observedEpisodes++;

        return trajectory;
    }

    /**
     * Select the index of the next action based on the epsilon-greedy policy.
     *
     * @param qNetwork The Q-Network to be used for the greedy action selection.
     * @param greedily If true, the Q-Network always selects the action with the highest expected value.
     * @returns the index of the selected action.
     */
    private _selectNextAction(qNetwork: QNetwork, greedily: boolean): number {
        const actions = this._environment.getAvailableActions();
        qNetwork.updateOutputLayer(actions.length);

        // Although the observation is not required for the non-greedy policy, we have to check whether the
        // observation length has increased.
        const observation = this._environment.getCurrentObservation();
        if (qNetwork.updateInputLayer(observation.length)) {
            this._padObservationsReplayMemory(observation.length);
        }

        if (!greedily && this._random.nextDouble() < this._epsilon) {
            return this._random.nextInt(0, actions.length);
        }

        const networkOutput = qNetwork.forwardPass(observation);
        return networkOutput.indexOf(Math.max(...networkOutput));
    }

    /**
     * Pads the recorded observations with zeros in the replay memory
     * if the observation length has increased during the optimization process.
     *
     * @param observationLength The new length of observations extracted from the environment.
     */
    private _padObservationsReplayMemory(observationLength: number): void {
        const replayMemoryData = this._replayMemory.toArray();
        for (const experience of replayMemoryData) {
            const prevState = experience.prevState;
            const prevStatePadding = new Array(observationLength - prevState.length).fill(0);
            experience.prevState = [...prevState, ...prevStatePadding];

            const nextState = experience.nextState;
            const nextStatePadding = new Array(observationLength - nextState.length).fill(0);
            experience.nextState = [...nextState, ...nextStatePadding];
        }
        this._replayMemory.clear();
        this._replayMemory.enqueueMany(replayMemoryData);

        logger.debug(`Padded the replay memory to support observations of length ${observationLength}.`);
    }

    /**
     * Trains the DQN network based on the Bellman Equation.
     * Also updated the target network periodically after a specified number of training steps were executed.
     *
     * @returns The training loss.
     */
    private async _train(): Promise<number> {
        // Skip training if we don't have enough samples in replay memory
        if (this._replayMemory.size() < this._trainingParameter.batchSize) {
            return 0;
        }

        const batch = this._replayMemory.sample(this._trainingParameter.batchSize);
        this._targetNetwork.updateInputLayer(batch[0].prevState.length);
        this._targetNetwork.updateOutputLayer(this._environment.getAvailableActions().length);

        // Predict target Q-values in batch
        const nextStates = tf.tensor2d(batch.map(experience => experience.nextState));
        const nextQBatchTensor = this._targetNetwork.model.predict(nextStates) as tf.Tensor;
        const nextQBatch = await nextQBatchTensor.array() as number[][];
        nextQBatchTensor.dispose();
        nextStates.dispose();

        const inputs: number[][] = [];
        const labels: number[][] = [];

        for (let i = 0; i < batch.length; i++) {
            // Acting network selects the next action
            const nextQValuesActing = this._actingNetwork.forwardPass(batch[i].nextState);
            const bestAction = nextQValuesActing.indexOf(Math.max(...nextQValuesActing));

            // Target network evaluates the selected action
            const targetValue = batch[i].done ? 0 : nextQBatch[i][bestAction];
            const targetQValue = batch[i].reward + this._rewardParameter.gamma * targetValue;

            const currentQValues = this._actingNetwork.forwardPass(batch[i].prevState);
            currentQValues[batch[i].actions[0]] = targetQValue;

            inputs.push(batch[i].prevState);
            labels.push(currentQValues);
        }

        const history = await this._actingNetwork.train(inputs, labels, this._trainingParameter.batchSize, this._trainingParameter.epochs);
        const losses = history.history.loss as number[];

        this._trainingIterations++;
        this._lossSumSinceLog += losses[losses.length - 1];

        // Periodically update the target network after a certain number of training steps.
        if (this._trainingIterations % this._hyperparameter.targetUpdateFrequency === 0) {
            logger.info("Updating target network");
            this._targetNetwork.dispose();
            this._targetNetwork = this._actingNetwork.clone();
        }

        return losses[losses.length - 1];
    }

    /**
     * Prints the current training progress to the console.
     */
    private _printLog(rewardFunction: RewardFunction): void {
        logger.info(`Episode ${this._observedEpisodes}`);
        logger.info(`Execution Time: ${(Date.now() - this._startTime) / 1000}s`);

        logger.info(`Covered Objectives: ${this._archive.size}/${this._coverageObjectives.size}`);
        logger.info(`Covered Statements: ${StatisticsCollector.getInstance().statementCoverage * 100}%`);
        logger.info(`Covered Branches: ${StatisticsCollector.getInstance().branchCoverage * 100}%`);

        logger.info(`Current Reward Function: ${rewardFunction}`);
        logger.info(`Overall Max Evaluation Reward: ${this._overallMaxReward}`);
        logger.info(`Current Max Evaluation Reward: ${this._maxReward}`);
        logger.info(`Current Average Evaluation Reward: ${(this._averageReward).toFixed(2)}`);
        logger.info(`Average Loss: ${(this._lossSumSinceLog / this._hyperparameter.logInterval).toFixed(4)}`);

        logger.info(`Replay Memory Size: ${this._replayMemory.size()}`);
        logger.info(`Epsilon: ${this._epsilon.toFixed(4)}`);
        logger.info("-----------------------------------------------------");

        this._lossSumSinceLog = 0;
    }

    /**
     * Updates over time statistics after each evaluation episode.
     */
    private _updateTimeLineStats(): void {
        const timelineData: CoverageOverTime = {
            statementCoverage: StatisticsCollector.getInstance().statementCoverage,
            branchCoverage: StatisticsCollector.getInstance().branchCoverage,
        };
        StatisticsCollector.getInstance().updateCoverageOverTime(Date.now() - this._startTime, timelineData);
    }

    /**
     * Updates global statistics at the end of the optimization process.
     */
    protected _updateGlobalStats(): void {
        const statisticsCollector = StatisticsCollector.getInstance();
        statisticsCollector.iterationCount = this._observedEpisodes;
        statisticsCollector.evaluations = this._evaluations;
        if (this._getUncoveredObjectives().length === 0) {
            statisticsCollector.timeToReachFullCoverage = (Date.now() - this._startTime) / 1000;
        }
        this._updateTimeLineStats();
    }
}
