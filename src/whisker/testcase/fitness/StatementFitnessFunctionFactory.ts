import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {generateCFG, generateCDG, ControlFlowGraph, ControlDependenceGraph} from 'scratch-analysis'
import {List} from "../../utils/List";
import {StatementCoverageFitness} from "./StatementFitnessFunction";

export class StatementFitnessFunctionFactory {

    extractFitnessFunctions(vm: VirtualMachine): List<StatementCoverageFitness> {
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

                const statementCoverageFitness = new StatementCoverageFitness(node, cdg);
                fitnessFunctions.add(statementCoverageFitness)

            }
        }
        return fitnessFunctions;
    }
}
