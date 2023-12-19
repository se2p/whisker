import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {generateCFG, generateCDG} from 'scratch-analysis';
import {StatementFitnessFunction} from "./StatementFitnessFunction";
import {Container} from "../../utils/Container";

export class StatementFitnessFunctionFactory {

    extractFitnessFunctions(vm: VirtualMachine, targets: string[]): StatementFitnessFunction[] {
        const fitnessFunctions: StatementFitnessFunction[] = [];

        if (!(vm === undefined || vm === null)) {
            Container.cfg = generateCFG(vm);
            Container.cdg = generateCDG(Container.cfg);
            for (const node of Container.cdg.getAllNodes()) {
                // TODO: Do we need fitness functions for entry and exit
                if (node.id == "Entry" || node.id == "Exit" || node.id == "start") {
                    continue;
                }

                if (node.block == undefined) {
                    continue;
                }

                if (node.hasOwnProperty("userEvent") || node.hasOwnProperty("event")) {
                    // we not need to cover nodes that are not real blocks
                    continue;
                }

                // Check if explicit targets are specified
                if (targets && targets.length !== 0) {
                    if (!targets.includes(node.id)) {
                        // A target list is specified and the node is not in that target list
                        continue;
                    }
                }

                const statementCoverageFitness = new StatementFitnessFunction(node);
                fitnessFunctions.push(statementCoverageFitness);

            }
        }
        return fitnessFunctions;
    }
}
