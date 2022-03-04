import VirtualMachine from "scratch-vm/src/virtual-machine"
import WhiskerUtil from "../../../test/whisker-util";
import {ScratchProject} from "../../scratch/ScratchProject";
import {Container} from "../../utils/Container";
import {WhiskerSearchConfiguration} from "../../utils/WhiskerSearchConfiguration";
import {Randomness} from "../../utils/Randomness";
import {StatisticsCollector} from "../../utils/StatisticsCollector";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {StatementFitnessFunctionFactory} from "../../testcase/fitness/StatementFitnessFunctionFactory";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {FitnessFunction} from "../../search/FitnessFunction";
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

export class StaticSuite {

    private _statementMap: Map<number, FitnessFunction<NeatChromosome>>;
    private _archive = new Map<number, NetworkChromosome>();

    public async execute(vm: VirtualMachine, project: ScratchProject, testFile: Record<number, Test>,
                         properties: Record<string, (number | string)>): Promise<string> {

        const util = new WhiskerUtil(vm, project);
        const vmWrapper = util.getVMWrapper();

        // Check if a seed has been set.
        const seedString = properties.seed.toString();
        if (seedString !== 'undefined' && seedString !== "") {
            Randomness.setInitialSeeds(properties.seed);
        }
        // If not set a random seed.
        else {
            Randomness.setInitialSeeds(Date.now());
        }

        const sampleTest = Object.values(testFile)[0];
        const config = new WhiskerSearchConfiguration(sampleTest.configs);
        const parameter = config.dynamicSuiteParameter;
        parameter.train = false;

        Container.vm = vm;
        Container.vmWrapper = vmWrapper;
        Container.config = config;
        Container.testDriver = util.getTestDriver({});
        Container.acceleration = properties['acceleration'] as number;
        this.initialiseFitnessTargets();

        StatisticsCollector.getInstance().projectName = properties.projectName as string;
        StatisticsCollector.getInstance().testName = properties.testName as string;

        await util.prepare(properties['acceleration'] as number || 1);
        util.start();

        const executor = new NetworkExecutor(Container.vmWrapper, parameter.timeout, 'activation');

        for (const test of Object.values(testFile)) {
            const testSource = test.test.toString();
            const trace = StaticSuite.getTraceFromSource(testSource);
            const network = new NeatChromosome([], [], undefined, undefined);
            network.trace = trace;
            await executor.executeSavedTrace(network);
            this.updateArchive(network);
            executor.resetState();
            StatisticsCollector.getInstance().networks.push(network);
        }
        const csvOutput = StatisticsCollector.getInstance().asCsvStaticSuite();
        console.log(csvOutput)
        return csvOutput;
    }

    private initialiseFitnessTargets() {
        this._statementMap = new Map<number, FitnessFunction<NeatChromosome>>();
        const fitnessFactory = new StatementFitnessFunctionFactory();
        const fitnessTargets = fitnessFactory.extractFitnessFunctions(Container.vm, []);
        for (let i = 0; i < fitnessTargets.length; i++) {
            this._statementMap.set(i, fitnessTargets[i] as unknown as FitnessFunction<NeatChromosome>);
        }
        StatisticsCollector.getInstance().fitnessFunctionCount = fitnessTargets.length;
    }

    private updateArchive(network: NeatChromosome) {
        for (const statementKey of this._statementMap.keys()) {
            const fitnessFunction = this._statementMap.get(statementKey);
            const statementFitness = fitnessFunction.getFitness(network);
            if (fitnessFunction.isOptimal(statementFitness) && !this._archive.has(statementKey)) {
                StatisticsCollector.getInstance().incrementCoveredFitnessFunctionCount(fitnessFunction);
                this._archive.set(statementKey, network);
            }
        }
    }

    private static getTraceFromSource(source: string): ExecutionTrace {
        const sourceArray = source.split('\n');
        const events: EventAndParameters[] = [];

        // Remove first element (function header) and last element (closing curly bracket)
        sourceArray.shift();
        sourceArray.pop();

        for (const statement of sourceArray) {
            let event: ScratchEvent;
            let variableParameter: number[];
            const parameter = StaticSuite.getSourceParameter(statement);

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

    private static getSourceParameter(statement: string): string[] {
        let paramArgs = statement.substring(statement.indexOf('(') + 1, statement.indexOf(')'));
        paramArgs = paramArgs.split("'").join('');
        return paramArgs.split(',');
    }

}

interface Test {
    categories: [],
    description: string
    index: number
    name: string
    skip: boolean
    test: () => void,
    type: "neuroevolution"
    configs: Record<string, string | number>,
    activationTrace: Record<string, number[]>
}

