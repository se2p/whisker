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
import {TestChromosome} from "../TestChromosome";
import {NetworkChromosome} from "../../whiskerNet/Networks/NetworkChromosome";
import {Container} from "../../utils/Container";

export class BranchCoverageFitnessFunction extends StatementFitnessFunction {

    constructor(readonly controlNode: GraphNode, private readonly _isTrueBranch: boolean) {
        super(controlNode);
    }

    override getBranchDistance(chromosome: TestChromosome): number {

        // If the control node is not covered, compute branch distance toward the control node.
        if (!chromosome.coverage.has(this._targetNode.id)) {
            return super.getBranchDistance(chromosome);
        }

        // Otherwise, compute the distance toward the desired branch.
        const blockTrace = Object.values(chromosome.trace.blockTraces).find(block => block.id === this._targetNode.block.id);
        if (!blockTrace){   // If we cannot find the block trace return a default value of 1.
            Container.debugLog(`No block trace found for ${this.toString()}`, chromosome.trace.blockTraces);
            return 1;
        }
        if (this._isTrueBranch) {
            return blockTrace['distances'][0][0];
        } else {
            return blockTrace['distances'][0][1];
        }
    }

    override async getFitness(chromosome: TestChromosome): Promise<number> {
        if (chromosome.trace == null) {
            throw Error("Test case not executed");
        }

        const approachLevel = this.getApproachLevel(chromosome);
        const branchDistance = this.getBranchDistance(chromosome);

        // When dealing with NetworkChromosomes, ignore the cfgDistance.
        if (chromosome instanceof NetworkChromosome){
            return StatementFitnessFunction.normalize(approachLevel + StatementFitnessFunction.normalize(branchDistance));
        }

        let cfgDistanceNormalized: number;
        if (branchDistance === 0 && approachLevel < Number.MAX_SAFE_INTEGER) {
            cfgDistanceNormalized = StatementFitnessFunction.normalize(this.getCFGDistance(chromosome, approachLevel > 0));
        } else {
            cfgDistanceNormalized = 1;
        }
        return 2 * approachLevel + StatementFitnessFunction.normalize(branchDistance) + cfgDistanceNormalized;
    }

    public override toString = (): string => {
        return `${this._targetNode.id} of type ${this._targetNode.block.opcode} -> ${this._isTrueBranch}`;
    }

    public override getNodeId(): string {
        return `${this._targetNode.id}-${this._isTrueBranch}`;
    }
}
