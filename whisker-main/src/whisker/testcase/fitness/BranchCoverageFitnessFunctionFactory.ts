import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {generateCFG, generateCDG, ControlFilter} from 'scratch-analysis';
import {Container} from "../../utils/Container";
import {StatementFitnessFunctionFactory} from "./StatementFitnessFunctionFactory";
import {BranchCoverageFitnessFunction} from "./BranchCoverageFitnessFunction";

export class BranchCoverageFitnessFunctionFactory extends StatementFitnessFunctionFactory {

    override extractFitnessFunctions(vm: VirtualMachine, targets: string[]): BranchCoverageFitnessFunction[] {
        const fitnessFunctions: BranchCoverageFitnessFunction[] = [];

        if (!(vm === undefined || vm === null)) {
            Container.cfg = generateCFG(vm);
            Container.cdg = generateCDG(Container.cfg);
            for (const node of Container.cdg.getAllNodes()) {
                if (this.skipNode(node, targets)) {
                    continue;
                }

                // Create two branch coverage fitness functions for each branch.
                if (ControlFilter.branchCoverage(node.block)) {
                    fitnessFunctions.push(new BranchCoverageFitnessFunction(node, true));

                    // Forever blocks cannot be passed and thus have no false branch.
                    if (node.block.opcode !== 'control_forever') {
                        fitnessFunctions.push(new BranchCoverageFitnessFunction(node, false));
                    }
                }
            }
        }
        return fitnessFunctions;
    }
}
