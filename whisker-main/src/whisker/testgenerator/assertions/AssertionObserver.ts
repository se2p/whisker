import {EventObserver} from "../../testcase/EventObserver";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {Container} from "../../utils/Container";
import cloneDeep from "lodash.clonedeep";

export class AssertionObserver implements EventObserver {

    private _executionStates = [];

    update(event: ScratchEvent, args: number[]): void {
        this._executionStates.push(this._captureState());
    }

    public getExecutionTrace() {
        return this._executionStates;
    }

    private _captureState() {
        const currentState = {};
        for (const targetsKey in Container.vm.runtime.targets) {
            const otherSpriteNames = Container.vm.runtime.targets
                .filter(t => t.sprite).map(t => t.getName());
            const target = Container.vm.runtime.targets[targetsKey];

            currentState[targetsKey] = {
                name: Container.vm.runtime.targets[targetsKey].sprite['name'],
                direction: Container.vm.runtime.targets[targetsKey]["direction"],
                currentCostume: Container.vm.runtime.targets[targetsKey]["currentCostume"],
                effects: Object.assign({}, Container.vm.runtime.targets[targetsKey]["effects"]),
                visible: Container.vm.runtime.targets[targetsKey]["visible"],
                volume: Container.vm.runtime.targets[targetsKey]["volume"],
                x: Container.vm.runtime.targets[targetsKey]["x"],
                y: Container.vm.runtime.targets[targetsKey]["y"],
                variables: cloneDeep(Container.vm.runtime.targets[targetsKey]["variables"]),
                touching: otherSpriteNames.filter(x =>
                    (x !== target.getName() && target.isTouchingSprite(x))
                )
                //,
                // bubbleState: target.getCustomState(Scratch3LooksBlocks.STATE_KEY) !== undefined ?  target.getCustomState(Scratch3LooksBlocks.STATE_KEY).text : null
            };
        }
        return currentState;
    }
}
