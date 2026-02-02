import VMWrapper from "../../../../vm/vm-wrapper";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {WaitEvent} from "../../../testcase/events/WaitEvent";
import {EventAndParameters, ExecutionTrace} from "../../../testcase/ExecutionTrace";
import {RewardFunction} from "../rewards/RewardFunction";
import {TfAgentWrapper} from "../agents/TfAgentWrapper";
import {EnvironmentParameter} from "../hyperparameter/RLHyperparameter";
import {FeatureExtraction} from "../../featureExtraction/FeatureExtraction";
import {RLEventExtractor} from "./RLEventExtractor";
import {MouseMoveFixedDirection} from "../../../testcase/events/MouseMoveFixedDirection";

export class RLEnvironment {

    /**
     * The time at which the current episode has started.
     */
    private _startTime: number;

    /**
     * The number of steps that have been executed in the current episode.
     */
    private _steps: number;

    /**
     * Extracts the available actions from the current state of the environment.
     */
    private readonly _actionExtractor: RLEventExtractor;

    /**
     * The initial state of the Scratch-VM
     */
    private readonly _initialState = {};

    /**
     * Records the performed actions in the current episode.
     */
    private _performedEpisodeActions: EventAndParameters[] = [];

    /**
     * Creates a new instance of the RLEnvironment class.
     *
     * @param _vmWrapper The VMWrapper that is used to interact with the Scratch VM.
     * @param _parameter The environment parameter used to configure the environment.
     */
    constructor(private readonly _vmWrapper: VMWrapper, private readonly _parameter: EnvironmentParameter) {
        this._actionExtractor = new RLEventExtractor(_vmWrapper.vm);
        this._initialState = this._vmWrapper._recordInitialState();
    }

    /**
     * Resets the environment to its initial state and starts the game by pressing the green flag.
     */
    public async reset(): Promise<void> {
        await this._vmWrapper.resetProject(this._initialState);
        await this._vmWrapper.start();
        this._steps = 0;
        this._startTime = Date.now();
        this._performedEpisodeActions = [];
    }

    /**
     * Cleans the ScratchVM environment. Should be used after every episode.
     */
    public finalize(): void {
        this._vmWrapper.end();
    }


    /**
     * Performs a single step in the Scratch environment based on the supplied actions.
     * @param actions the indices of the actions to be performed.
     * @param reward The reward function to be used for computing the reward for the current step.
     * @param agent The agent that is playing the game.
     *
     * @returns the trajectory of visited states, the executed action and the obtained reward.
     */
    public async step(actions: number[], reward: RewardFunction, agent: TfAgentWrapper): Promise<StepData> {
        const prevState = this.getCurrentObservation();
        const availableActions = this.getAvailableActions();
        const triggerActions = actions
            .map(action => availableActions[action])
            .filter(action => action !== undefined) // The RL agent might chose an action that is not available at the current state
            .filter(action => action !== null && !(action instanceof WaitEvent)); // Wait events are executed implicitly.
        if (triggerActions.length > 0) {
            for (const action of triggerActions) {
                const actionParameter = this._getActionParameter(action);
                action.setParameter(actionParameter, "activation");
                this._performedEpisodeActions.push(new EventAndParameters(action, actionParameter));
                await action.apply();
            }
        }

        await new WaitEvent(this._parameter.skipFrames).apply();
        const nextState = this.getCurrentObservation();

        agent.trace = this.getExecutionTrace();
        agent.blockCoverage = this.getBlockCoverage();

        this._steps++;
        return {
            prevState: prevState,
            nextState: nextState,
            actions: actions,
            reward: await reward.computeReward(this),
            done: this.terminalStateReached()
        };
    }

    private _getActionParameter(action: ScratchEvent): number[] {
        if (action instanceof MouseMoveFixedDirection) {
            return [this._parameter.skipFrames, this._parameter.mouseMoveLength];
        }
        return [this._parameter.skipFrames];
    }

    /**
     * Fetches the current observation from the environment.
     * @returns the current observation.
     */
    public getCurrentObservation(): number[] {
        return FeatureExtraction.getFeatureArray(this._vmWrapper.vm);
    }

    /**
     * Fetches the actions that can be performed in the current state of the environment.
     * @returns the actions that can be performed in the current state of the environment.
     */
    public getAvailableActions(): ScratchEvent[] {
        return this._actionExtractor.extractEvents(this._vmWrapper.vm);
    }

    /**
     * Checks if the terminal state has been reached.
     *
     * @returns true if the terminal state has been reached, false otherwise.
     */
    public terminalStateReached(): boolean {
        return !this._vmWrapper._whiskerRunning ||
            Date.now() - this._startTime > this._parameter.maxTime ||
            this._steps > this._parameter.maxSteps;
    }

    /**
     * Returns the execution trace of the current episode.
     *
     * @returns the execution trace of the current episode.
     */
    public getExecutionTrace(): ExecutionTrace {
        return new ExecutionTrace(this._vmWrapper.vm.getTraces().branchDistances, [...this._performedEpisodeActions]);
    }

    /**
     * Returns the block coverage of the current episode.
     *
     * @returns the block coverage of the current episode.
     */
    public getBlockCoverage(): Set<string> {
        return this._vmWrapper.vm.getTraces().blockCoverage;
    }

    /**
     * Returns the branch coverage of the current episode.
     *
     * @returns the branch coverage of the current episode.
     */
    public getBranchCoverage(): Set<string> {
        return this._vmWrapper.vm.getTraces().branchCoverage;
    }


    get vmWrapper(): VMWrapper {
        return this._vmWrapper;
    }
}

export type StepData = {
    prevState: number[];
    nextState: number[];
    actions: number[];
    reward: number;
    done: boolean;
};

export type Trajectory = StepData[];

