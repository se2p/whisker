import {EventObserver} from "../../testcase/EventObserver";
import {Container} from "../../utils/Container";
import cloneDeep from "lodash.clonedeep";
import RenderedTarget from "scratch-vm/@types/scratch-vm/sprites/rendered-target";
import Scratch3LooksBlocks from "scratch-vm/src/blocks/scratch3_looks.js";

export class AssertionObserver implements EventObserver {

    private _executionStates: Map<string, AssertionTargetState>[] = [];

    update(): void {
        // No operation
    }

    updateAfter(): void {
        this._executionStates.push(this._captureState());
    }

    public getExecutionTrace(): Map<string, AssertionTargetState>[] {
        return this._executionStates;
    }

    private _captureState(): Map<string, AssertionTargetState> {
        const currentState = new Map<string, AssertionTargetState>();
        for (const target of Object.values(Container.vm.runtime.targets) as RenderedTarget[]) {
            const targetKey = target.isOriginal ? `${target['sprite']['name']}` : `${target['sprite']['name']}Clone${target['cloneID']}`;
            const otherSpriteNames = Container.vm.runtime.targets
                .filter(t => t.sprite).filter(t => !t.isStage && t.getName() !== target.getName()).map(t => t.getName());

            const properties: AssertionTargetState = {
                target: target,
                name: target.sprite['name'],
                clone: !target.isOriginal,
                cloneIndex: target.sprite.clones.indexOf(target),
                direction: target["direction"],
                size: target["size"],
                layer: target.getLayerOrder(),
                costume: target["currentCostume"],
                effects: Object.assign({}, target["effects"]),
                visible: target["visible"],
                volume: target["volume"],
                x: target["x"],
                y: target["y"],
                variables: cloneDeep(target["variables"]),
                touching: Object.assign({}, ...((otherSpriteNames.map(x => ({[x]: target.isTouchingSprite(x)}))))),
                touchingEdge: target.isTouchingEdge(),
                cloneCount: (target.sprite.clones.filter(t => !t.isOriginal) as []).length, // wtf?
                bubbleState: target.getCustomState(Scratch3LooksBlocks.STATE_KEY) !== undefined ? target.getCustomState(Scratch3LooksBlocks.STATE_KEY).text : null
            } as const;
            currentState.set(targetKey, properties);
        }
        return currentState;
    }
}

export interface AssertionTargetState {
    target: RenderedTarget,
    name: string,
    clone: boolean,
    cloneIndex: number,
    direction: number,
    size: number,
    layer: number,
    costume: number,
    effects: Record<string, number>,
    visible: boolean,
    volume: number,
    x: number,
    y: number,
    variables: Record<string, Record<string, string | number | boolean | []>>,
    touching: Record<string, boolean>,
    touchingEdge: boolean,
    cloneCount: number,
    bubbleState: string
}
