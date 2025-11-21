import {Randomness} from "../../../utils/Randomness";
import {StatementFitnessFunction} from "../../../testcase/fitness/StatementFitnessFunction";
import {BranchCoverageFitnessFunction} from "../../../testcase/fitness/BranchCoverageFitnessFunction";
import {Container} from "../../../utils/Container";

export class TargetObjectiveSelection {

    /**
     * Extracts statements from the CDG that are immediate children of already covered statements.
     * @param allStatements of the Scratch program.
     * @param uncoveredStatements uncovered subset of allStatements.
     * @returns uncovered immediate children of already covered statements.
     */
    public static getNearestStatements(allStatements: StatementFitnessFunction[],
                                       uncoveredStatements: StatementFitnessFunction[]): StatementFitnessFunction[] {
        const nearestUncoveredStatements: StatementFitnessFunction[] = [];
        const cdg = Container.cdg;
        const uncoveredKeys = uncoveredStatements.map(node => node.getTargetNode().id);
        for (const statement of uncoveredStatements) {
            const parents = StatementFitnessFunction.getCDGParent(statement.getTargetNode());
            if (!parents) {
                throw (`Undefined parent of ${statement.getNodeId()}; cdg: ${cdg.toCoverageDot(uncoveredKeys)}`);
            }
            for (const parent of parents) {
                const parentStatement = StatementFitnessFunction.mapNodeToStatement(parent, allStatements);
                if (!uncoveredStatements.includes(parentStatement) ||
                    parentStatement.getNodeId() === statement.getNodeId()) {
                    nearestUncoveredStatements.push(statement);
                }
            }
        }
        return nearestUncoveredStatements;
    }

    /**
     * Extracts branches whose control nodes have already been covered or are direct parents of the flag-clicked node.
     * @param uncoveredBranches set of uncovered branches from which we will determine the closest to be covered.
     * @param coveredStatements set of covered statements determining which control nodes have been covered.
     * @returns The set of branching objectives that are the closest to be covered.
     * If we were unable to find preferred branches, the set of uncovered branches is returned.
     */
    public static getNearestBranches(uncoveredBranches: BranchCoverageFitnessFunction[],
                                     coveredStatements: StatementFitnessFunction[]): BranchCoverageFitnessFunction[] {
        const nearestBranches: BranchCoverageFitnessFunction[] = [];
        const coveredStatementIds = coveredStatements.map(node => node.getNodeId());
        for (const branch of uncoveredBranches) {
            // Extract branches whose control nodes have been covered.
            if (coveredStatementIds.some(node => branch.getNodeId().includes(node))) {
                nearestBranches.push(branch);
            }

            // Extract branches that are direct children of the flag-clicked node.
            if (StatementFitnessFunction.getCDGParent(branch.controlNode).some(parent => parent.id == "flagclicked")) {
                nearestBranches.push(branch);
            }
        }

        // If we were not able to find suitable branches, return the entire set of uncovered branches.
        if (nearestBranches.length === 0) {
            return uncoveredBranches;
        }

        return nearestBranches;
    }

    /**
     * Fetch the nearest objectives based on which objectives have already been covered within the CDG.
     * If we optimise for statement coverage, we filter for statements whose CDG parents have been covered.
     * If we optimise for branch coverage, we filter for branches whose control nodes have already been covered.
     *
     * @param allObjectives all coverage objectives that are part of the CDG.
     * @param uncoveredObjectives all coverage objectives that have not been covered yet.
     * @returns the nearest coverage objectives based on which objectives have already been covered.
     */
    public static getFeasibleCoverageObjectives(allObjectives: StatementFitnessFunction[],
                                                uncoveredObjectives: StatementFitnessFunction[]): StatementFitnessFunction[] {
        if (uncoveredObjectives.some(obj => obj instanceof BranchCoverageFitnessFunction)) {
            const coveredStatements = allObjectives.filter(obj => !uncoveredObjectives.includes(obj));
            return TargetObjectiveSelection.getNearestBranches(uncoveredObjectives as BranchCoverageFitnessFunction[], coveredStatements);
        } else {
            return TargetObjectiveSelection.getNearestStatements(allObjectives, uncoveredObjectives);
        }
    }

    /**
     * Filters objectives based on the precluded set of objectives and returns a random objective.
     * If no objective is left after filtering, we return a random objective from all feasible objectives.
     *
     * @param feasibleObjectives The set of feasible objectives from which we pick a random objective.
     * @param preclude The set of objectives to be precluded from the set of feasible objectives.
     * @returns a random promising objective from the set of feasible objectives.
     */
    public static getPromisingObjective(feasibleObjectives: StatementFitnessFunction[],
                                        preclude: StatementFitnessFunction[]): StatementFitnessFunction {
        // Prioritize greenFlag events
        const greenFlagBlock = feasibleObjectives
            .find(obj => this._isGreenFlagObjective(obj));
        if (greenFlagBlock !== undefined) {
            return greenFlagBlock;
        }

        // Filter precluded objectives
        const nonBlackListedObjectives = feasibleObjectives.filter(obj => !preclude.includes(obj));
        const promisingObjectives = nonBlackListedObjectives.length > 0 ? nonBlackListedObjectives : feasibleObjectives;

        // Pick a random objective from the remaining ones.
        return Randomness.getInstance().pick([...promisingObjectives]);
    }

    /**
     * Retrieves the CDG parent objectives of the supplied objective.
     * If the supplied objective is the green flag objective, the green flag objective itself is returned since the
     * green flag objective corresponds to the root node of the CDG.
     *
     * @param objective The objective whose parent objectives should be retrieved.
     * @param allObjectives All coverage objectives that are part of the CDG.
     * @returns The CDG parent objectives.
     */
    public static getCDGParentObjective(objective: StatementFitnessFunction,
                                        allObjectives: StatementFitnessFunction[]): StatementFitnessFunction[] {
        if (this._isGreenFlagObjective(objective)) {
            return [objective];
        }
        return StatementFitnessFunction.getCDGParent(objective.getTargetNode())
            .map(parent => StatementFitnessFunction.mapNodeToStatement(parent, allObjectives))
            .filter(parent => parent !== objective)
            .filter(parent => allObjectives.includes(parent));
    }

    /**
     * Determines whether the supplied objective corresponds to the green flag objective.
     *
     * @param objective The objective to be checked.
     * @returns True if the supplied objective corresponds to the green flag objective, false otherwise.
     */
    private static _isGreenFlagObjective(objective: StatementFitnessFunction): boolean {
        return objective.getTargetNode().block.opcode === "event_whenflagclicked";
    }
}
