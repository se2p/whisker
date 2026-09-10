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
 * Reports the CDG to the UI as a Graphviz dot string, coloring each node by whether its statement is
 * covered, currently targeted, or neither. Nodes are walked via getSortedNodes() (a BFS from the CDG's
 * entry nodes) rather than getAllNodes() (arbitrary insertion order), so the UI can lay them out
 * following the actual control-dependency structure instead of an unrelated order.
 *
 * CDG nodes are statements, so the colouring and the covered/total count are always statement coverage
 * (read from StatisticsCollector) regardless of whether the run's objective is statements or branches.
 * `targetedKeys` is the only per-run input, marking the CDG node(s) of the objective(s) being pursued.
 */
export function emitCdgDot(cdg: ControlDependenceGraph, targetedKeys: Set<string>): void {
    const stats = StatisticsCollector.getInstance();
    if (!Container.vm || !cdg || !stats.statements) return;

    const coveredKeys = stats.getCoveredStatementNodeIds();

    const edges = [];
    const nodes = [];
    // Entry/Exit/start are structural bookkeeping nodes the graph builder adds for its own traversal -
    // they have no associated Scratch block and are never a real coverage target, so they shouldn't be
    // colored as "uncovered" - but they're kept (in a neutral color) since removing them would also
    // remove the edges routing through them, fragmenting the tree into disconnected pieces.
    const isStructuralNode = (n: GraphNode) => !n.block;
    for (const node of cdg.getSortedNodes()) {
        if (isStructuralNode(node)) {
            nodes.push(`\t"${node.toString()}" [style=filled,fillcolor="lightgray",fontcolor="black"];`);
        } else if (targetedKeys.has(node.id)) {
            nodes.push(`\t"${node.toString()}" [style=filled,fillcolor="yellow",fontcolor="black"];`);
        } else if (coveredKeys.has(node.id)) {
            nodes.push(`\t"${node.toString()}" [style=filled,fillcolor="darkgreen",fontcolor="white"];`);
        } else {
            nodes.push(`\t"${node.toString()}" [style=filled,fillcolor="red",fontcolor="white"];`);
        }
        for (const succ of cdg.successors(node.id)) {
            edges.push(`\t"${node.toString()}" -> "${succ.toString()}";`);
        }
    }
    const renderedEdges = edges.join('\n');
    const renderedNodes = nodes.join('\n');

    const dot = `digraph ScratchProgram {\n${renderedNodes}\n${renderedEdges}\n}`;
    Container.vm.emit('CDG_UPDATE', { dot, covered: coveredKeys.size, total: stats.statements.size });
}