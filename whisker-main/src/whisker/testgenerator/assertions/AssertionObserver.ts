import {EventObserver} from "../../testcase/EventObserver";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {Container} from "../../utils/Container";
import cloneDeep from "lodash.clonedeep";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import Scratch3LooksBlocks from "scratch-vm/src/blocks/scratch3_looks.js";

export class AssertionObserver implements EventObserver {

    private _executionStates = [];

    update(event: ScratchEvent, args: number[]): void {
        Container.debugLog("Logging state");
        this._executionStates.push(this._captureState());
    }

    public getExecutionTrace() {
        return this._executionStates;
    }

    private _captureState() {
        const currentState = new Map<string, Map<string, any>>();
        for (const targetsKey in Container.vm.runtime.targets) {
            const target : RenderedTarget = Container.vm.runtime.targets[targetsKey];
            const otherSpriteNames = Container.vm.runtime.targets
                .filter(t => t.sprite).filter(t => !t.isStage && t.getName() !== target.getName()).map(t => t.getName());

            currentState[targetsKey] = {
                name: Container.vm.runtime.targets[targetsKey].sprite['name'],
                clone: !target.isOriginal,
                direction: Container.vm.runtime.targets[targetsKey]["direction"],
                size: Container.vm.runtime.targets[targetsKey]["size"],
                layer: Container.vm.runtime.targets[targetsKey].getLayerOrder(),
                costume: Container.vm.runtime.targets[targetsKey]["currentCostume"],
                effects: Object.assign({}, Container.vm.runtime.targets[targetsKey]["effects"]),
                visible: Container.vm.runtime.targets[targetsKey]["visible"],
                volume: Container.vm.runtime.targets[targetsKey]["volume"],
                x: Container.vm.runtime.targets[targetsKey]["x"],
                y: Container.vm.runtime.targets[targetsKey]["y"],
                variables: cloneDeep(Container.vm.runtime.targets[targetsKey]["variables"]),
                // touching: otherSpriteNames.filter(x =>
                //     (x !== target.getName() && target.isTouchingSprite(x))
                // ),
                // touching: ((otherSpriteNames.filter(x =>
                //         (x !== target.getName())) as []).map(x => ({x : target.isTouchingSprite(x) }))
                // ),
                touching: Object.assign({}, ...((otherSpriteNames.map(x => ({[x] : target.isTouchingSprite(x) })))
                )),
                cloneCount: (target.sprite.clones.filter(t => !t.isOriginal) as []).length, // wtf?
                bubbleState: target.getCustomState(Scratch3LooksBlocks.STATE_KEY) !== undefined ?  target.getCustomState(Scratch3LooksBlocks.STATE_KEY).text : null
            };
        }
        return currentState;
    }
}
