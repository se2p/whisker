import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {generateCFG, ControlFlowGraph} from 'scratch-analysis'
import {GraphNode} from 'scratch-analysis';
import {List} from "../../utils/List";
import {StatementCoverageFitness} from "./StatementFitnessFunction";
import {isNullOrUndefined} from "util";

export class StatementFitnessFunctionFactory {

    extractFitnessFunctions(vm: VirtualMachine): List<StatementCoverageFitness> {
        const fitnessFunctions: List<StatementCoverageFitness> = new List()

        if (!(vm === undefined || vm === null)) {
            const cfg: ControlFlowGraph = generateCFG(vm)
            for (const node of cfg.getAllNodes()) {
                // TODO: Do we need fitness functions for entry and exit
                if (node == cfg.getEntry()) {
                    continue;
                }

                // TODO: Do we need fitness functions for entry and exit
                if (node == cfg.getExit()) {
                    continue;
                }

                const statementCoverageFitness = new StatementCoverageFitness(node);
                fitnessFunctions.add(statementCoverageFitness)

            }
        }
        return fitnessFunctions;
    }
}
