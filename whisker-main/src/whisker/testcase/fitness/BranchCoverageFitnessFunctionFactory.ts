import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {generateCFG, generateCDG, ControlFilter} from 'scratch-analysis';
import {Container} from "../../utils/Container";
import {StatementFitnessFunctionFactory} from "./StatementFitnessFunctionFactory";
import {BranchCoverageFitnessFunction} from "./BranchCoverageFitnessFunction";

export class BranchCoverageFitnessFunctionFactory extends StatementFitnessFunctionFactory {

    override extractFitnessFunctions(vm: VirtualMachine, targets: string[]): BranchCoverageFitnessFunction[] {
        const fitnessFunctions: BranchCoverageFitnessFunction[] = [];

        if (vm === undefined || vm === null) {
            return fitnessFunctions;
        }

        Container.cfg = generateCFG(vm);
        Container.cdg = generateCDG(Container.cfg);
        for (const node of Container.cdg.getAllNodes()) {
            if (this.skipNode(node, targets)) {
                continue;
            }

            if (!ControlFilter.branchCoverage(node.block)) {
                continue;
            }

            fitnessFunctions.push(new BranchCoverageFitnessFunction(node, true));

            // Forever blocks cannot be passed and thus have no false branch.
            // Passing execution halting blocks and repeat blocks via the true branch,
            // implicitly also covers the false branch
            if (!ControlFilter.noFalseBranch(node.block)) {
                fitnessFunctions.push(new BranchCoverageFitnessFunction(node, false));
            }
        }

        return fitnessFunctions;
    }
}
