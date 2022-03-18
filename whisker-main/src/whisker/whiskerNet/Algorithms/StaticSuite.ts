import VirtualMachine from "scratch-vm/src/virtual-machine"
import {ScratchProject} from "../../scratch/ScratchProject";
import {Container} from "../../utils/Container";
import {WhiskerSearchConfiguration} from "../../utils/WhiskerSearchConfiguration";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {EventAndParameters, ExecutionTrace} from "../../testcase/ExecutionTrace";
import {KeyPressEvent} from "../../testcase/events/KeyPressEvent";
import {NetworkExecutor} from "../NetworkExecutor";
import {ClickSpriteEvent} from "../../testcase/events/ClickSpriteEvent";
import {ClickStageEvent} from "../../testcase/events/ClickStageEvent";
import {MouseDownEvent} from "../../testcase/events/MouseDownEvent";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {MouseMoveEvent} from "../../testcase/events/MouseMoveEvent";
import {MouseMoveToEvent} from "../../testcase/events/MouseMoveToEvent";
import {SoundEvent} from "../../testcase/events/SoundEvent";
import {TypeTextEvent} from "../../testcase/events/TypeTextEvent";
import {WaitEvent} from "../../testcase/events/WaitEvent";
import {NetworkLoader} from "../NetworkGenerators/NetworkLoader";
import {NetworkSuite} from "./NetworkSuite";

export class StaticSuite extends NetworkSuite {

    constructor(project: ScratchProject, vm: VirtualMachine, properties: Record<string, number | string>,
                private _testFile: Record<number, Test>,) {
        super(project, vm, properties);
    }

    /**
     * Initialises the used parameter for test execution.
     */
    protected initialiseExecutionParameter(): void {
        const sampleTest = Object.values(this._testFile)[0];
        const config = new WhiskerSearchConfiguration(sampleTest.configs);
        this.parameter = config.dynamicSuiteParameter;
        this.parameter.train = false;
        this.executor = new NetworkExecutor(Container.vmWrapper, this.parameter.timeout, 'activation');
        Container.config = config;
    }

    /**
     * Executes the static test suite of Scratch input sequences loaded within networks.
     */
    protected async executeTestCases(): Promise<void> {
        const tests = this.loadTestCases()
        for (const test of tests) {
            test.recordActivationTrace = true;
            await this.executor.executeSavedTrace(test);
            this.executor.resetState();
            this.updateArchive(test);
            if (test.savedActivationTrace) {
                this.extractTestCaseResults(test);
            }
        }
    }

    /**
     * Loads the static test cases.
     */
    protected loadTestCases(): NeatChromosome[] {
        const networks: NeatChromosome[] = [];
        for (const test of Object.values(this._testFile)) {
            const testSource = test.test.toString();
            const trace = StaticSuite.getTraceFromSource(testSource);
            const network = new NeatChromosome([], [], undefined, undefined);
            network.trace = trace;
            NetworkLoader.loadActivationTrace(network, test.activationTrace);
            networks.push(network);
        }
        return networks;
    }

    /**
     * Extracts the static Scratch input sequence that will be executed from the JavaScript source code saved in the
     * static test case.
     * @param source JavaScript source code containing the static Scratch input sequence.
     * @returns the extracted ExecutionTrace that will be executed on the application under test.
     */
    private static getTraceFromSource(source: string): ExecutionTrace {
        const sourceArray = source.split('\n');
        const events: EventAndParameters[] = [];

        // Remove first element (function header) and last element (closing curly bracket)
        sourceArray.shift();
        sourceArray.pop();

        for (const statement of sourceArray) {
            let event: ScratchEvent;
            let variableParameter: number[];
            const parameter = StaticSuite.getEventArguments(statement);

            if (statement.includes('clickSprite')) {
                event = new ClickSpriteEvent(parameter[0]);
                variableParameter = [];
            } else if (statement.includes('clickCloneByCoords')) {
                const target = Container.vmWrapper.getTargetBySpriteCoords(Number(parameter[0]), Number(parameter[1]));
                event = new ClickSpriteEvent(target, 1, Number(parameter[0]), Number(parameter[1]));
                variableParameter = [];
            } else if (statement.includes('clickStage')) {
                event = new ClickStageEvent();
                variableParameter = [];
            } else if (statement.includes('keyPress')) {
                variableParameter = [Number(parameter[1])];
                event = new KeyPressEvent(parameter[0], Number(parameter[1]));
            } else if (statement.includes('mouseDown')) {
                event = new MouseDownEvent(Boolean(parameter[0]));
                variableParameter = [];
            } else if (statement.includes('mouseMove')) {
                event = new MouseMoveEvent(Number(parameter[0]), Number(parameter[1]));
                variableParameter = [Number(parameter[0]), Number(parameter[1])];
            } else if (statement.includes('mouseMoveTo')) {
                event = new MouseMoveToEvent(Number(parameter[0]), Number(parameter[1]));
                variableParameter = [Number(parameter[0]), Number(parameter[1])];
            } else if (statement.includes('sendSound')) {
                event = new SoundEvent(Number(parameter[0]), Number(parameter[1]));
                variableParameter = [Number(parameter[0]), Number(parameter[1])];
            } else if (statement.includes('typeText')) {
                event = new TypeTextEvent(parameter[0])
                variableParameter = [];
            } else if (statement.includes('runForSteps')) {
                event = new WaitEvent(Number(parameter[0]));
                variableParameter = [Number(parameter[0])];
            }

            events.push(new EventAndParameters(event, variableParameter));
        }
        return new ExecutionTrace([], events);
    }

    /**
     * Extracts arguments for an event that requires at least a single parameter from the JavaScript source code.
     * @param statement the statement whose arguments should be extracted
     * @returns Array of strings, with each element representing an extracted argument.
     */
    private static getEventArguments(statement: string): string[] {
        let paramArgs = statement.substring(statement.indexOf('(') + 1, statement.indexOf(')'));
        paramArgs = paramArgs.split("'").join('');
        return paramArgs.split(',');
    }

}

/**
 * Interface for a static test case.
 */
interface Test {
    categories: [],
    description: string
    index: number
    name: string
    skip: boolean
    test: () => void,
    type: "neuroevolution"
    configs: Record<string, string | number>,
    activationTrace: Record<string, Record<string, number[]>>
}

