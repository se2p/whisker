import {WhiskerSearchConfiguration} from "./WhiskerSearchConfiguration";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import VMWrapper from "../../vm/vm-wrapper";
import TestDriver from "../../test/test-driver.js";
import {StatementFitnessFunction} from "../testcase/fitness/StatementFitnessFunction";
import {GradientDescent} from "../agentTraining/neuroevolution/misc/GradientDescent";
import {ControlDependenceGraph, ControlFlowGraph} from 'scratch-analysis';


export function emitCoverageUpdate(iteration: number, archive: Map<unknown, unknown>, fitnessFunctions: Map<unknown, unknown>): void {
    if (!Container.vm) return;
    const total = fitnessFunctions ? fitnessFunctions.size : 0;
    Container.vm.emit('COVERAGE_UPDATE', {
        iteration,
        coverage: total > 0 ? archive.size / total : 0,
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
