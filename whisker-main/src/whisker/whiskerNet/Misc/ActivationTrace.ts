import {NodeGene} from "../NetworkComponents/NodeGene";

export class ActivationTrace {

    private readonly _trace: Map<number, Map<string, number[]>>;
    private readonly _tracedNodes: NodeGene[];

    constructor(tracedNodes: NodeGene[]) {
        this._trace = new Map<number, Map<string, number[]>>();
        this._tracedNodes = tracedNodes;
    }


    /**
     * Updates the activation trace with novel node activations.
     * @param step the Scratch step in which these activations have been recorded.
     * @param nodes the nodes to record.
     */
    public update(step: number, nodes: NodeGene[]): void {
        // Check if we encountered a new node.
        const activatedNodes = nodes.filter(node => node.activatedFlag);
        const tracedIds = this._tracedNodes.map(node => node.identifier());
        for (const node of activatedNodes) {
            const nodeId = node.identifier();
            if (!tracedIds.includes(nodeId)) {
                this._tracedNodes.push(node);
            }
        }

        // Add the activation of each node to its corresponding activation trace.
        if (!this._trace.has(step)) {
            this._trace.set(step, new Map<string, number[]>());
        }
        const stepTrace = this._trace.get(step);
        for (const node of activatedNodes) {
            const nodeId = node.identifier();
            const activationValue = Math.round(node.activationValue * 1000) / 1000;
            if (!stepTrace.has(nodeId)) {
                stepTrace.set(nodeId, [activationValue]);
            } else {
                stepTrace.get(nodeId).push(activationValue);
            }
        }
    }

    public clone(): ActivationTrace {
        const clone = new ActivationTrace(this._tracedNodes);
        for (const [step, nodeMap] of this._trace.entries()) {
            clone.trace.set(step, new Map(nodeMap));
        }
        return clone;
    }

    public toJSON(): Record<number, number[][]> {
        const activationTrace = {};
        for (const [step, nodeMap] of this._trace.entries()) {
            const stepTrace = {};
            for (const [node, activationValues] of nodeMap) {
                stepTrace[node] = activationValues;
            }
            activationTrace[step] = stepTrace;
        }
        return activationTrace;
    }

    get trace(): Map<number, Map<string, number[]>> {
        return this._trace;
    }

    get tracedNodes(): NodeGene[] {
        return this._tracedNodes;
    }
}
