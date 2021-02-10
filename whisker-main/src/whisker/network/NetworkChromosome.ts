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
 * A NetworkChromosome representing a neural network
 */
export class NetworkChromosome extends Chromosome {

    private readonly _NodeGenes: List<NodeGene>
    private readonly _ConnectionGenes: List<ConnectionGene>
    private readonly _crossoverOp: Crossover<NetworkChromosome>
    private readonly _mutationOp: Mutation<NetworkChromosome>
    private readonly _genome: List<NodeGene | ConnectionGene>

    /**
     * Constructs a new NetworkChromosome
     * @param nodeGenes the Nodes of a neural network
     * @param connectionGenes the connections between the Nodes
     * @param crossoverOp the crossover Operator
     * @param mutationOp the mutation Operator
     */
    constructor(nodeGenes: List<NodeGene>, connectionGenes: List<ConnectionGene>,
                crossoverOp: Crossover<NetworkChromosome>, mutationOp: Mutation<NetworkChromosome>) {
        super();
        this._NodeGenes = nodeGenes;
        this._ConnectionGenes = connectionGenes;
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
        this._genome[0] = nodeGenes
        this._genome[1] = connectionGenes
    }

    /**
     * Deep clone of a NetworkChromosome
     */
    clone(): NetworkChromosome {
        return new NetworkChromosome(this.getNodeGenes(), this.getConnectionGenes(),
            this.getCrossoverOperator(), this.getMutationOperator());
    }

    /**
     * Deep clone of a NetworkChromosome using a defined list of genes
     * @param newGenes the genes the network should be initialised with
     */
    cloneWith(newGenes: List<NodeGene | ConnectionGene>): NetworkChromosome {
        return new NetworkChromosome(newGenes[0], newGenes[1], this.getCrossoverOperator(), this.getMutationOperator());
    }

    /**
     * Returns the length of the NetworkChromosome by adding the size of the NodeGenes and ConnectionGenes Lists
     */
    getLength(): number {
        return this._genome[0].size() + this._genome[1].size();
    }

    getCrossoverOperator(): Crossover<this> {
        return this._crossoverOp as Crossover<this>;
    }

    getMutationOperator(): Mutation<this> {
        return this._mutationOp as Mutation<this>;
    }


    getNodeGenes(): List<NodeGene> {
        return this._NodeGenes;
    }

    getConnectionGenes(): List<ConnectionGene> {
        return this._ConnectionGenes;
    }

}
