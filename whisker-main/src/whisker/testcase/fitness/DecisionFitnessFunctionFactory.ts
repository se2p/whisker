import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {generateCFG, generateCDG, ControlFilter} from 'scratch-analysis';
import {Container} from "../../utils/Container";
import {StatementFitnessFunctionFactory} from "./StatementFitnessFunctionFactory";
import {DecisionFitnessFunction} from "./DecisionFitnessFunction";

export class DecisionFitnessFunctionFactory extends StatementFitnessFunctionFactory {

    override extractFitnessFunctions(vm: VirtualMachine, targets: string[]): DecisionFitnessFunction[] {
        const fitnessFunctions: DecisionFitnessFunction[] = [];

        if (!(vm === undefined || vm === null)) {
            Container.cfg = generateCFG(vm);
            Container.cdg = generateCDG(Container.cfg);
            for (const node of Container.cdg.getAllNodes()) {
                if (this.skipNode(node, targets)) {
                    continue;
                }

                // Create two decision fitness functions for each branch.
                if (ControlFilter.decision(node.block)) {
                    fitnessFunctions.push(new DecisionFitnessFunction(node, true));
                    fitnessFunctions.push(new DecisionFitnessFunction(node, false));
                }
            }
        }
        return fitnessFunctions;
    }
}
