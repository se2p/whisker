import { WhiskerSearchConfiguration } from "./WhiskerSearchConfiguration";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import VMWrapper from "../../vm/vm-wrapper";
import TestDriver from "../../test/test-driver.js";
import { StatementFitnessFunction } from "../testcase/fitness/StatementFitnessFunction";
import { GradientDescent } from "../agentTraining/neuroevolution/misc/GradientDescent";
import { ControlDependenceGraph, ControlFlowGraph } from 'scratch-analysis';
import { StatisticsCollector } from "./StatisticsCollector";


export function emitCoverageUpdate(iteration: number, archive: Map<unknown, unknown>, fitnessFunctions: Map<unknown, unknown>): void {
    if (!Container.vm) return;
    Container.vm.emit('COVERAGE_UPDATE', {
        iteration,
        branchCoverage: StatisticsCollector.getInstance().branchCoverage,
        statementCoverage: StatisticsCollector.getInstance().statementCoverage
    });
}
export function emitFitnessUpdate(iteration: number, best: number, average?: number, label?: string): void {
    if (!Container.vm) return;
    const data: { generation: number; best: number; average?: number; label?: string } = {
        generation: iteration,
        best: Number(best.toFixed(4))
    };
    if (average != undefined)
        data.average = Number(average.toFixed(4));
    if (label != undefined)
        data.label = label;
    Container.vm.emit('FITNESS_UPDATE', data);
}

export class Container {
    static config: WhiskerSearchConfiguration;
    static vm: VirtualMachine
    static vmWrapper: VMWrapper;
    static testDriver: TestDriver;
    static acceleration: number;
    static isNeuroevolution: boolean
    static cfg: ControlFlowGraph;
    static cdg: ControlDependenceGraph;
    static coverageObjectives: StatementFitnessFunction[];
    static backpropagationData: Record<string, unknown>;
    static backpropagationInstance: GradientDescent;
    static neatestTargetId: string
}
