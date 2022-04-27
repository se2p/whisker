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
import {NetworkSuite} from "./NetworkSuite";
import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {ScratchProgram} from "../../scratch/ScratchInterface";
import {MutationFactory} from "../../scratch/ScratchMutation/MutationFactory";
import {NetworkAnalysis} from "../Misc/NetworkAnalysis";


export class StaticSuite extends NetworkSuite {

    constructor(project: ArrayBuffer, vm: VirtualMachine, properties: Record<string, number | string | string[]>,
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
        this.executor = new NetworkExecutor(Container.vmWrapper, this.parameter.timeout, 'activation', false);
        Container.config = config;
    }

    /**
     * Loads the static test cases.
     */
    protected loadTestCases(): NeatChromosome[] {
        const networks: NeatChromosome[] = [];
        for (const test of Object.values(this._testFile)) {
            const testSource = test.test.toString();
            const trace = StaticSuite.getTraceFromSource(testSource);
            const network = new NeatChromosome([], [], undefined, undefined, undefined);
            network.trace = trace;
            networks.push(network);
        }
        return networks;
    }

    /**
     * Executes a single static test case and records corresponding statistics.
     * @param test the static test case to execute.
     * @param recordExecution determines whether we want to record this execution by updating the archive and the
     * test execution statistics
     */
    protected async executeTestCase(test: NeatChromosome, recordExecution: boolean): Promise<void> {
        test.recordNetworkStatistics = true;
        await this.executor.executeSavedTrace(test);
        if (recordExecution) {
            this.updateArchive(test);
            NetworkAnalysis.analyseNetwork(test);
        }
        test.recordNetworkStatistics = false;
        this.executor.resetState();
    }

    /**
     * Executes the static test suite consisting of Scratch input sequences.
     */
    protected async testSingleProject(): Promise<void> {
        for (const test of this.testCases) {
            await this.executeTestCase(test, true);
        }
        this.updateTestStatistics(this.testCases, this.projectName, this.testName);
    }

    /**
     * Performs mutation analysis on a given test project based on the specified mutation operators.
     */
    protected async mutationAnalysis(): Promise<ScratchProgram[]> {
        const mutantFactory = new MutationFactory(this.vm);
        const mutantPrograms = mutantFactory.generateScratchMutations(this.properties.mutators as string[]);
        for (const mutant of mutantPrograms) {
            const projectMutation = `${this.projectName}-${mutant.name}`;
            const executedTests: NeatChromosome[] = [];
            for (const test of this.testCases) {
                // We clone the network since it might get changed due to specific mutations.
                const testClone = test.cloneAsTestCase();
                testClone.trace = test.trace.clone();
                await this.loadMutant(mutant);
                await this.executeTestCase(testClone, true);
                executedTests.push(testClone);
            }
            this.updateTestStatistics(executedTests, projectMutation, this.testName);
        }
        return mutantPrograms;
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
                event = new MouseDownEvent(Number(parameter[0]));
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
                event = new TypeTextEvent(parameter[0]);
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

    /**
     * Executes a test for a user-defined amount of times on the sample solution to collect activationTraces that
     * can later be used to verify the correctness of a modified project.
     */
    protected async collectActivationTrace(): Promise<void> {
        Container.debugLog("Warning! You attempted to collect activation traces using a Static Network Suite.");
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

