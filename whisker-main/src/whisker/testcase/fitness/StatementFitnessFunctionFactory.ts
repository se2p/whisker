import VirtualMachine from 'scratch-vm/src/virtual-machine.js';
import {generateCFG, generateCDG, GraphNode} from 'scratch-analysis';
import {StatementFitnessFunction} from "./StatementFitnessFunction";
import {Container} from "../../utils/Container";

export class StatementFitnessFunctionFactory {

    extractFitnessFunctions(vm: VirtualMachine, targets: string[]): StatementFitnessFunction[] {
        const fitnessFunctions: StatementFitnessFunction[] = [];

        if (!(vm === undefined || vm === null)) {
            Container.cfg = generateCFG(vm);
            Container.cdg = generateCDG(Container.cfg);
            for (const node of Container.cdg.getAllNodes()) {
                if (this.skipNode(node, targets)) {
                    continue;
                }

                const statementCoverageFitness = new StatementFitnessFunction(node);
                fitnessFunctions.push(statementCoverageFitness);

            }
        }
        return fitnessFunctions;
    }

    /**
     * Determines whether a given graph node should be skipped and not added as a fitness target.
     * @param node The graph node that might be added to the set of fitness targets.
     * @param targets Specifies an explicit set of fitness targets based on their node ids.
     *                If undefined, all appropriate graph nodes will be added as fitness targets.
     */
    protected skipNode(node: GraphNode, targets: string[]): boolean {
        if (node.id == "Entry" || node.id == "Exit" || node.id == "start") {
            return true;
        }

        if (node.block == undefined) {
            return true;
        }

        // Exclude blocks that are not explicit block statements.
        if ("userEvent" in node || "event" in node) {
            return true;
        }

        // Check if explicit targets are specified
        return targets && targets.length !== 0 && !targets.includes(node.id);

    }
}
