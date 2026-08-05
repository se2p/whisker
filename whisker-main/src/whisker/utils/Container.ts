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
