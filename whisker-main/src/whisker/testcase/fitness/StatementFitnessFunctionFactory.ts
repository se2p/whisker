import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {generateCFG, generateCDG, ControlFlowGraph, ControlDependenceGraph} from 'scratch-analysis'
import {List} from "../../utils/List";
import {StatementCoverageFitness} from "./StatementFitnessFunction";

export class StatementFitnessFunctionFactory {

    extractFitnessFunctions(vm: VirtualMachine, targets: List<string>): List<StatementCoverageFitness> {
        const fitnessFunctions: List<StatementCoverageFitness> = new List()

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
                    continue
                }

                // Check if explicit targets are specified
                if (targets && !targets.isEmpty()) {
                    if (!targets.contains(node.id)) {
                        // A target list is specified and the node is not in that target list
                        continue;
                    }
                }

                const statementCoverageFitness = new StatementCoverageFitness(node, cdg, cfg);
                fitnessFunctions.add(statementCoverageFitness)

            }
        }
        return fitnessFunctions;
    }
}
