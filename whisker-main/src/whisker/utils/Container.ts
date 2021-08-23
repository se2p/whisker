import {WhiskerSearchConfiguration} from "./WhiskerSearchConfiguration";
import VirtualMachine from "scratch-vm/src/virtual-machine"
import VMWrapper from "../../vm/vm-wrapper"
import TestDriver from "../../test/test-driver.js"
import {ScratchPosition} from "../scratch/ScratchPosition";

export class Container {
    static config: WhiskerSearchConfiguration;
    static vm: VirtualMachine
    static vmWrapper: VMWrapper;
    static testDriver: TestDriver;
    static acceleration: number;
    static pathToGoal: ScratchPosition[];
    static networkTemplate: string;
}
