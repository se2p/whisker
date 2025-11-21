/*
 * Copyright (C) 2020 Whisker contributors
 *
 * This file is part of the Whisker test generator for Scratch.
 *
 * Whisker is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Whisker is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Whisker. If not, see http://www.gnu.org/licenses/.
 *
 */


import {GraphNode} from 'scratch-analysis';
import {StatementFitnessFunction} from "./StatementFitnessFunction";
import {NetworkChromosome} from "../../agentTraining/neuroevolution/networks/NetworkChromosome";
import logger from '../../../util/logger';
import {TestCase} from "../../core/TestCase";

export class BranchCoverageFitnessFunction extends StatementFitnessFunction {

    constructor(readonly controlNode: GraphNode, private readonly _isTrueBranch: boolean) {
        super(controlNode);
    }

    override getBranchDistance(solution: TestCase): number {
        // If the control node is not covered, compute the branch distance toward the control node.
        if (!solution.getCoveredBlocks().has(this._targetNode.id)) {
            return super.getBranchDistance(solution);
        }

        // Otherwise, compute the distance toward the desired branch.
        const blockTrace = Object.values(solution.getTrace().blockTraces).find(block => block.id === this._targetNode.block.id);
        if (!blockTrace) {   // If we cannot find the block trace return a default value of 1.
            logger.debug(`No block trace found for ${this.toString()}`);
            return 1;
        }

        return this._isTrueBranch ? blockTrace.getTrueDistance() : blockTrace.getFalseDistance();
    }

    override async getFitness(solution: TestCase): Promise<number> {
        if (solution.getTrace() == null) {
            throw Error("Test case not executed");
        }

        const approachLevel = this.getApproachLevel(solution);
        const branchDistance = this.getBranchDistance(solution);

        // When dealing with NetworkChromosomes, ignore the cfgDistance.
        if (solution instanceof NetworkChromosome) {
            return StatementFitnessFunction.normalize(approachLevel + StatementFitnessFunction.normalize(branchDistance));
        }

        let cfgDistanceNormalized: number;
        if (branchDistance === 0 && approachLevel < Number.MAX_SAFE_INTEGER) {
            cfgDistanceNormalized = StatementFitnessFunction.normalize(this.getCFGDistance(solution, approachLevel > 0));
        } else {
            cfgDistanceNormalized = 1;
        }
        return 2 * approachLevel + StatementFitnessFunction.normalize(branchDistance) + cfgDistanceNormalized;
    }

    public override toString = (): string => {
        return `${this._targetNode.id} of type ${this._targetNode.block.opcode} -> ${this._isTrueBranch}`;
    }

    public override getNodeId(): string {
        return `${this._targetNode.id}-${this._isTrueBranch ? "True" : "False"}`;
    }
}
