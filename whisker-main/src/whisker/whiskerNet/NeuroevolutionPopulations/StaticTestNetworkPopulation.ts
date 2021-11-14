import {NeatPopulation} from "./NeatPopulation";
import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {ClickSpriteEvent} from "../../testcase/events/ClickSpriteEvent";
import {WaitEvent} from "../../testcase/events/WaitEvent";
import {EventAndParameters, ExecutionTrace} from "../../testcase/ExecutionTrace";
import {Container} from "../../utils/Container";
import {ClickStageEvent} from "../../testcase/events/ClickStageEvent";
import {DragSpriteEvent} from "../../testcase/events/DragSpriteEvent";
import {KeyPressEvent} from "../../testcase/events/KeyPressEvent";
import {MouseDownEvent} from "../../testcase/events/MouseDownEvent";
import {MouseMoveEvent} from "../../testcase/events/MouseMoveEvent";
import {MouseMoveToEvent} from "../../testcase/events/MouseMoveToEvent";
import {SoundEvent} from "../../testcase/events/SoundEvent";
import {TypeTextEvent} from "../../testcase/events/TypeTextEvent";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {NeatProperties} from "../NeatProperties";
import {NetworkChromosome} from "../Networks/NetworkChromosome";

export class StaticTestNetworkPopulation extends NeatPopulation {

    /**
     * Defines the static test cases including their events.
     */
    private readonly _eventTemplate: Record<string, any>;

    /**
     * Holds the number of test cases.
     */
    private readonly _numberTestCases: number;

    constructor(generator: ChromosomeGenerator<NeatChromosome>, properties: NeatProperties) {
        super(generator, properties);
        this._eventTemplate = JSON.parse(this.hyperParameter.testTemplate);
        this._numberTestCases = Object.keys(this._eventTemplate).length;
    }

    /**
     * During network generation, we add the events that should be executed to the population by saving them in the
     * trace of generated networks.
     */
    generatePopulation(): void {
        while (this.networks.length < this.populationSize) {
            const network = this.generator.get();
            network.trace = new ExecutionTrace(undefined, this.gatherEvents());
            this.networks.push(network);
            this.speciate(network);
        }
    }

    /**
     * Gathers and instantiates the events that should be executed from the eventTemplate.
     * @returns EventAndParameters[] Array holding the events that should be executed, including their arguments.
     */
    private gatherEvents(): EventAndParameters[] {
        const eventList: EventAndParameters[] = [];
        const testCaseKey = Object.keys(this._eventTemplate)[NetworkChromosome._uIDCounter % this._numberTestCases];
        const testCase = this._eventTemplate[testCaseKey];
        for (const eventKey in testCase) {
            const event = testCase[eventKey];
            switch (event.type) {
                case "ClickSpriteEvent": {
                    const target = Container.vmWrapper.getTargetBySpriteName(event.args.target);
                    const steps = event.args.steps;
                    eventList.push(new EventAndParameters(new ClickSpriteEvent(target, steps), [target, steps]));
                    break
                }
                case "ClickStageEvent":
                    eventList.push(new EventAndParameters(new ClickStageEvent(), []));
                    break;
                case "DragSpriteEvent": {
                    const target = Container.vmWrapper.getTargetBySpriteName(event.args.target);
                    const x = event.args.x;
                    const y = event.args.y;
                    eventList.push(new EventAndParameters(new DragSpriteEvent(target, x, y), [target, x, y]));
                    break
                }
                case "KeyPressEvent": {
                    const key = event.args.key;
                    const steps = event.args.steps;
                    eventList.push(new EventAndParameters(new KeyPressEvent(key, steps), [key, steps]));
                    break;
                }
                case "MouseDownEvent": {
                    const value = event.args.value;
                    eventList.push(new EventAndParameters(new MouseDownEvent(value), [value]));
                    break;
                }
                case "MouseMoveEvent": {
                    const x = event.args.x;
                    const y = event.args.y;
                    eventList.push(new EventAndParameters(new MouseMoveEvent(x, y), [x, y]));
                    break;
                }
                case "MouseMoveToEvent": {
                    const x = event.args.x;
                    const y = event.args.y;
                    eventList.push(new EventAndParameters(new MouseMoveToEvent(x, y), [x, y]));
                    break;
                }
                case "SoundEvent": {
                    eventList.push(new EventAndParameters(new SoundEvent(), []));
                    break;
                }
                case "TypeTextEvent": {
                    const text = event.args.text;
                    eventList.push(new EventAndParameters(new TypeTextEvent(text), [text]));
                    break;
                }
                case "WaitEvent": {
                    const steps = event.args.steps;
                    eventList.push(new EventAndParameters(new WaitEvent(steps), [steps]));
                    break;
                }
            }
        }
        return eventList;
    }
}
