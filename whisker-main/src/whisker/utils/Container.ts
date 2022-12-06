import {WhiskerSearchConfiguration} from "./WhiskerSearchConfiguration";
import VirtualMachine from "scratch-vm/src/virtual-machine";
import VMWrapper from "../../vm/vm-wrapper";
import TestDriver from "../../test/test-driver.js";
import {ScratchPosition} from "../scratch/ScratchPosition";
import {StatementFitnessFunction} from "../testcase/fitness/StatementFitnessFunction";
import {Backpropagation} from "../whiskerNet/Misc/Backpropagation";

export class Container {
    static config: WhiskerSearchConfiguration;
    static vm: VirtualMachine
    static vmWrapper: VMWrapper;
    static testDriver: TestDriver;
    static acceleration: number;
    static pathToGoal: ScratchPosition[];
    static isNeuroevolution: boolean
    static debugLog: typeof console.log;
    static statementFitnessFunctions: StatementFitnessFunction[];
    static backpropagation: Backpropagation;
}
