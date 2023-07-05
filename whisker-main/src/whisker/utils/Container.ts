import {WhiskerSearchConfiguration} from "./WhiskerSearchConfiguration";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import VMWrapper from "../../vm/vm-wrapper";
import TestDriver from "../../test/test-driver.js";
import {ScratchPosition} from "../scratch/ScratchPosition";
import {StatementFitnessFunction} from "../testcase/fitness/StatementFitnessFunction";
import {GradientDescent} from "../whiskerNet/Misc/GradientDescent";
import {ControlDependenceGraph, ControlFlowGraph} from 'scratch-analysis';


export class Container {
    static config: WhiskerSearchConfiguration;
    static vm: VirtualMachine
    static vmWrapper: VMWrapper;
    static testDriver: TestDriver;
    static acceleration: number;
    static pathToGoal: ScratchPosition[];
    static isNeuroevolution: boolean
    static debugLog: typeof console.log;
    static cfg: ControlFlowGraph;
    static cdg: ControlDependenceGraph;
    static statementFitnessFunctions: StatementFitnessFunction[];
    static backpropagationData: Record<string, unknown>;
    static backpropagationInstance: GradientDescent;
    static neatestTargetId: string
    static peerToPeerSharing: boolean;
}
