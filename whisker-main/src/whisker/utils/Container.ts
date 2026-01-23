import {WhiskerSearchConfiguration} from "./WhiskerSearchConfiguration";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import VMWrapper from "../../vm/vm-wrapper";
import TestDriver from "../../test/test-driver.js";
import {StatementFitnessFunction} from "../testcase/fitness/StatementFitnessFunction";
import {GradientDescent} from "../agentTraining/neuroevolution/misc/GradientDescent";
import {ControlDependenceGraph, ControlFlowGraph} from 'scratch-analysis';


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
