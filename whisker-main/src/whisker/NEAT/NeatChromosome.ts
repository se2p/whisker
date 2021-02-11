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

import {Chromosome} from "../search/Chromosome";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {ConnectionGene} from "./ConnectionGene";
import {Crossover} from "../search/Crossover";
import {Mutation} from "../search/Mutation";

/**
 * A NeatChromosome representing a Chromosome in the NEAT-Algorithm
 */
export class NeatChromosome extends Chromosome {

    private readonly _nodes: List<NodeGene>
    private readonly _connections: List<ConnectionGene>
    private readonly _crossoverOp: Crossover<NeatChromosome>
    private readonly _mutationOp: Mutation<NeatChromosome>

    /**
     * Constructs a new NeatChromosome
     * @param nodes the Nodes of a neural network
     * @param connections the connections between the Nodes
     * @param crossoverOp the crossover Operator
     * @param mutationOp the mutation Operator
     */
    constructor(nodes: List<NodeGene>, connections: List<ConnectionGene>,
                crossoverOp: Crossover<NeatChromosome>, mutationOp: Mutation<NeatChromosome>) {
        super();
        this._nodes = nodes;
        this._connections = connections;
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
    }

    /**
     * Deep clone of a NeatChromosome
     */
    clone(): NeatChromosome {
        return new NeatChromosome(this.getNodes(), this.getConnections(),
            this.getCrossoverOperator(), this.getMutationOperator());
    }

    /**
     * Deep clone of a NeatChromosome using a defined list of genes
     * @param newGenes the genes the network should be initialised with
     */
    cloneWith(newGenes: List<NodeGene | ConnectionGene>): NeatChromosome {
        return new NeatChromosome(newGenes[0], newGenes[1], this.getCrossoverOperator(), this.getMutationOperator());
    }

    /**
     * Returns the length of the NeatChromosome by adding the size of the NodeGenes and ConnectionGenes Lists
     */
    getLength(): number {
        return this.getConnections().size() + this.getConnections().size();
    }

    getCrossoverOperator(): Crossover<this> {
        return this._crossoverOp as Crossover<this>;
    }

    getMutationOperator(): Mutation<this> {
        return this._mutationOp as Mutation<this>;
    }

    getNodes(): List<NodeGene> {
        return this._nodes;
    }

    getConnections(): List<ConnectionGene> {
        return this._connections;
    }

}
