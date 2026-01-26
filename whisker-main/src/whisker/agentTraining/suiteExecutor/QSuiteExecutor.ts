import VirtualMachine from "scratch-vm";
import {TfAgentWrapper} from "../reinforcementLearning/agents/TfAgentWrapper";
import JSZip from "jszip";
import {QNetwork} from "../reinforcementLearning/agents/QNetwork";
import {AgentExecutor} from "./AgentExecutor";
import {ModelTester} from "../../model/ModelTester";
import logger from "../../../util/logger";
import {RLEnvironment, StepData} from "../reinforcementLearning/misc/RLEnvironment";
import {Container} from "../../utils/Container";
import {StepsReward} from "../reinforcementLearning/rewards/StepsReward";
import {SpriteTrace} from "../../testcase/ExecutionTrace";
import {Project} from "../../../assembler/project/Project";
import {EnvironmentParameter} from "../reinforcementLearning/hyperparameter/RLHyperparameter";

export class QSuiteExecutor extends AgentExecutor {

    private _environment: RLEnvironment;

    constructor(project: ArrayBuffer, vm: VirtualMachine,
                properties: Record<string, number | string | string[] | boolean>,
                private readonly _agentsZip: JSZip) {
        super(project, vm, properties);
    }

    /**
     * Initializes components required for executing the suite on the specified program.
     * @param modelTester Handles the execution of MBT.
     */
    protected override async _initialize(modelTester: ModelTester): Promise<void> {
        await super._initialize(modelTester);
    }

    /**
     * Loads and initializes the given agents.
     * @returns The initialized agents.
     */
    protected override async _loadAgents(): Promise<QNetwork[]> {
        const agents = await QSuiteExecutor.parseAgents(this._agentsZip) as QNetwork[];
        this._initializeEnvironment(agents[0].hyperparameter.environmentParameter);
        return agents;
    }


    /**
     * Initializes the RL Environment.
     */
    private _initializeEnvironment(parameter: EnvironmentParameter) {
        this._environment = new RLEnvironment(Container.vmWrapper, parameter);
    }


    /**
     * Executes the given suite against the specified program.
     * @param agents The suite of agents to be executed.
     * @returns Empty list since sprite traces are not yet defined for DQN executions.
     */
    protected override async _executeSuiteOnOriginal(agents: QNetwork[]): Promise<SpriteTrace[]> {
        for (let i = 0; i < agents.length; i++) {
            logger.info(`Executing agent ${i}`);
            await this._executeAgent(agents[i]);
        }
        await this.updateTestStatistics(agents, this.projectName, `QNetworks`);
        return [];
    }

    /**
     * Performs a mutation analysis experiment to determine how many mutants the given suite can detect.
     * Not yet implemented for DQNs since no oracle has been defined.
     */
    protected _mutationAnalysis(): Promise<Project[]> {
        throw new Error("No Oracle defined for DQNs.");
    }

    /**
     * Executes a single agent in the RL Environment.
     * @param agent The agent to be executed.
     */
    private async _executeAgent(agent: TfAgentWrapper): Promise<void> {
        await this._environment.reset();
        const rewardFunction = new StepsReward();

        let stepData: StepData;
        do {
            const observation = this._environment.getCurrentObservation();
            const agentOutput = agent.forwardPass(observation);
            const action = agentOutput.indexOf(Math.max(...agentOutput));
            stepData = await this._environment.step([action], rewardFunction, agent);
        } while (!stepData.done);
        this._environment.finalize();

        agent.trace = this._environment.getExecutionTrace();
        agent.blockCoverage = this._environment.getBlockCoverage();
        agent.branchCoverage = this._environment.getBranchCoverage();

        await this.updateStatementArchive(agent);
        await this.updateBranchArchive(agent);
    }


    /**
     * Parses the agents test suite that is bundled in the supplied .zip file.
     * @param zip The zipped agents.
     * @returns The parsed agents.
     */
    public static async parseAgents(zip: JSZip): Promise<TfAgentWrapper[]> {
        const agents = [];

        await new Promise(resolve => setTimeout(resolve, 1000));
        const modelFolders = Object.keys(zip.files)
            .filter(path => path.endsWith("/"))                     // only folders
            .map(path => path.replace(/\/$/, ""));      // remove trailing slash

        for (const folder of modelFolders) {
            const modelJSONFile = zip.file(`${folder}/model.json`);
            const weightsFile = zip.file(`${folder}/weights.bin`);
            const modelJSON = await modelJSONFile.async("string");
            const weightData = await weightsFile.async("arraybuffer");
            const agent = await QNetwork.loadModelFromMemory(modelJSON, weightData);
            agents.push(agent);
        }
        return agents;
    }


}
