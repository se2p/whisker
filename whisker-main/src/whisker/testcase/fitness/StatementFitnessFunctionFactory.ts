import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {generateCFG, generateCDG, ControlFlowGraph, ControlDependenceGraph} from 'scratch-analysis';
import {StatementFitnessFunction} from "./StatementFitnessFunction";

export class StatementFitnessFunctionFactory {

    extractFitnessFunctions(vm: VirtualMachine, targets: string[]): StatementFitnessFunction[] {
        const fitnessFunctions: StatementFitnessFunction[] = [];

        if (!(vm === undefined || vm === null)) {
            const cfg: ControlFlowGraph = generateCFG(vm);
            const cdg: ControlDependenceGraph = generateCDG(cfg);
            for (const node of cdg.getAllNodes()) {
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

                const statementCoverageFitness = new StatementFitnessFunction(node, cdg, cfg);
                fitnessFunctions.push(statementCoverageFitness);

            }
        }
        return fitnessFunctions;
    }
}
