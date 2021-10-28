import {NeatPopulation} from "./NeatPopulation";
import {NetworkChromosome} from "../NetworkChromosome";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NeuroevolutionProperties} from "../NeuroevolutionProperties";
import {List} from "../../utils/List";
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

export class StaticTestNetworkPopulation extends NeatPopulation<NetworkChromosome> {

    /**
     * Defines the static test cases including their events.
     */
    private readonly _eventTemplate: Record<string, any>

    /**
     * Holds the number of test cases
     */
    private readonly _numberTestCases: number;

    constructor(generator: ChromosomeGenerator<NetworkChromosome>, properties: NeuroevolutionProperties<NetworkChromosome>) {
        super(generator, properties);
        this._eventTemplate = JSON.parse(this.properties.testTemplate);
        this._numberTestCases = Object.keys(this._eventTemplate).length;
    }

    /**
     * During network generation, we add the events that should be executed to the chromosomes.
     */
    generatePopulation(): void {
        while (this.populationSize() < this.startSize) {
            const chromosome = this.generator.get();
            chromosome.trace = new ExecutionTrace(undefined, this.gatherEvents());
            this.chromosomes.add(chromosome);
            NeuroevolutionUtil.speciate(chromosome, this, this.properties);
        }
    }

    /**
     * Gathers and instantiates the events to execute from the eventTemplate.
     * @returns List<[ScratchEvent, number[]] List holding the events to execute including their arguments
     */
    private gatherEvents(): List<EventAndParameters> {
        const eventList = new List<EventAndParameters>();
        const testCaseKey = Object.keys(this._eventTemplate)[NetworkChromosome.idCounter % this._numberTestCases];
        const testCase = this._eventTemplate[testCaseKey];
        for (const eventKey in testCase) {
            const event = testCase[eventKey];
            switch (event.type) {
                case "ClickSpriteEvent": {
                    const target = Container.vmWrapper.getTargetBySpriteName(event.args.target);
                    const steps = event.args.steps;
                    eventList.add(new EventAndParameters(new ClickSpriteEvent(target, steps), [target, steps]));
                    break
                }
                case "ClickStageEvent":
                    eventList.add(new EventAndParameters(new ClickStageEvent(), []));
                    break;
                case "DragSpriteEvent": {
                    const target = Container.vmWrapper.getTargetBySpriteName(event.args.target);
                    const x = event.args.x;
                    const y = event.args.y;
                    eventList.add(new EventAndParameters(new DragSpriteEvent(target, x, y), [target, x, y]));
                    break
                }
                case "KeyPressEvent": {
                    const key = event.args.key;
                    const steps = event.args.steps;
                    eventList.add(new EventAndParameters(new KeyPressEvent(key, steps), [key, steps]));
                    break;
                }
                case "MouseDownEvent": {
                    const value = event.args.value;
                    eventList.add(new EventAndParameters(new MouseDownEvent(value), [value]));
                    break;
                }
                case "MouseMoveEvent": {
                    const x = event.args.x;
                    const y = event.args.y;
                    eventList.add(new EventAndParameters(new MouseMoveEvent(x, y), [x, y]));
                    break;
                }
                case "MouseMoveToEvent": {
                    const x = event.args.x;
                    const y = event.args.y;
                    eventList.add(new EventAndParameters(new MouseMoveToEvent(x, y), [x, y]));
                    break;
                }
                case "SoundEvent": {
                    eventList.add(new EventAndParameters(new SoundEvent(), []));
                    break;
                }
                case "TypeTextEvent": {
                    const text = event.args.text;
                    eventList.add(new EventAndParameters(new TypeTextEvent(text), [text]));
                    break;
                }
                case "WaitEvent": {
                    const steps = event.args.steps;
                    eventList.add(new EventAndParameters(new WaitEvent(steps), [steps]));
                    break;
                }
            }
        }
        return eventList;
    }
}
