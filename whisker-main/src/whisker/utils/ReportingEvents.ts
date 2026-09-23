import { ControlDependenceGraph, GraphNode } from "scratch-analysis";
import { Container } from "./Container";
import { StatisticsCollector } from "./StatisticsCollector";

/**
 * The FITNESS_UPDATE payload reported to the UI's fitness-over-time chart for a single best/average value.
 * Shared by every search algorithm's basic fitness reporting - many-objective algorithms extend this with
 * a `perTarget` breakdown instead of reporting just one value.
 */
export interface FitnessUpdateData {
    generation: number;
    best: number;
    average?: number;
    label?: string;
}

/**
 * Reports the current coverage (branch/statement percentages) to the UI's coverage-over-time chart.
 */
export function emitCoverageUpdate(iteration: number): void {
    if (!Container.vm) return;
    Container.vm.emit('COVERAGE_UPDATE', {
        iteration,
        branchCoverage: StatisticsCollector.getInstance().branchCoverage,
        statementCoverage: StatisticsCollector.getInstance().statementCoverage
    });
}

/**
 * Reports a single best/average fitness value to the UI's fitness-over-time chart.
 */
export function emitFitnessUpdate(iteration: number, best: number, average?: number, label?: string): void {
    if (!Container.vm) return;
    const data: FitnessUpdateData = {
        generation: iteration,
        best: Number(best.toFixed(4))
    };
    if (average != undefined)
        data.average = Number(average.toFixed(4));
    if (label != undefined)
        data.label = label;
    Container.vm.emit('FITNESS_UPDATE', data);
}

/**
 * Reports the CDG to the UI: its nodes and edges, plus the ids of the covered and the currently targeted
 * statements so the UI can color each node. Nodes are walked via getSortedNodes() (a BFS from the CDG's
 * entry nodes) rather than getAllNodes() (arbitrary insertion order), so the UI can lay them out
 * following the actual control-dependency structure instead of an unrelated order.
 *
 * CDG nodes are statements, so the covered ids and the covered/total count are always statement coverage
 * (read from StatisticsCollector) regardless of whether the run's objective is statements or branches.
 * `targetedKeys` is the only per-run input, marking the CDG node(s) of the objective(s) being pursued.
 */
export function emitCdgUpdate(cdg: ControlDependenceGraph, targetedKeys: Set<string>): void {
    const stats = StatisticsCollector.getInstance();
    if (!Container.vm || !cdg || !stats.statements) return;

    const coveredKeys = stats.getCoveredStatementNodeIds();

    // Block nodes are identified by their block id (the UI draws the block itself). Entry/start are structural
    // bookkeeping nodes with no Scratch block and are never a real coverage target, so they carry a label to
    // draw instead. The leaf Exit node is hidden.
    const nodes: { id: string, label?: string }[] = [];
    const edges: { from: string, to: string }[] = [];
    const isStructuralNode = (n: GraphNode) => !n.block;
    const isExitNode = (n: GraphNode) => n.id === 'Exit';
    for (const node of cdg.getSortedNodes()) {
        if (isExitNode(node)) continue;
        nodes.push(isStructuralNode(node) ? { id: node.id, label: node.toString() } : { id: node.id });
        for (const succ of cdg.successors(node.id)) {
            if (isExitNode(succ)) continue;
            // The CDG stores Entry as a successor of start; draw it as start's parent instead.
            edges.push(succ.id === 'Entry' ? { from: succ.id, to: node.id } : { from: node.id, to: succ.id });
        }
    }

    Container.vm.emit('CDG_UPDATE', {
        graph: { nodes, edges }, covered: coveredKeys.size, total: stats.statements.size,
        coveredBlockIds: [...coveredKeys], targetedBlockIds: [...targetedKeys]
    });
}