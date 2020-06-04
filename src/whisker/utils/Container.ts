import {WhiskerSearchConfiguration} from "./WhiskerSearchConfiguration";
import VirtualMachine from "scratch-vm/src/virtual-machine"
import VMWrapper from "../../vm/vm-wrapper"

export class Container {
    static config: WhiskerSearchConfiguration;
    static vm: VirtualMachine
    static vmWrapper: VMWrapper;
}
