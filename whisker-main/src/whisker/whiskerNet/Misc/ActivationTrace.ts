import {NodeGene} from "../NetworkComponents/NodeGene";

export class ActivationTrace {

    private readonly _trace: Map<number, number[][]>;
    private readonly _tracedNodes: NodeGene[];

    constructor(_tracedNodes: NodeGene[]) {
        this._trace = new Map<number, number[][]>();
        this._tracedNodes = _tracedNodes;
    }


    public update(step: number, nodes: NodeGene[]): void {
        const nodeActivations = nodes.map(node => Number(node.activationValue.toFixed(4)));
        if (!this._trace.has(step)) {
            this._trace.set(step, [nodeActivations]);
        } else {
            this._trace.get(step).push(nodeActivations);
        }
    }

    public groupByNodes(): Map<number, Map<string, number[]>> {
        const nodeActivationTrace = new Map<number, Map<string, number[]>>();
        // Go through each recorded step.
        for (const [step, stepTraces] of this._trace.entries()) {
            const nodeStepTrace = new Map<string, number[]>();
            // Go through each repetition within a step.
            for (const repetitionTrace of stepTraces) {
                // Extract the node values of the current repetition.
                for (let i = 0; i < repetitionTrace.length; i++) {
                    const nodeKey = this._tracedNodes[i].identifier();
                    if (!nodeStepTrace.has(nodeKey)) {
                        nodeStepTrace.set(nodeKey, [repetitionTrace[i]]);
                    } else {
                        nodeStepTrace.get(nodeKey).push(repetitionTrace[i]);
                    }
                }
            }
            // Set the recorded nodeTraces to the corresponding step.
            nodeActivationTrace.set(step, nodeStepTrace);
        }
        return nodeActivationTrace;
    }

    public toJSON(): Record<number, number[][]> {
        const activationRecord = {}
        for (const [step, value] of this._trace.entries()) {
            activationRecord[step] = value;
        }
        return activationRecord
    }

    get trace(): Map<number, number[][]> {
        return this._trace;
    }
}
