import {Crossover} from "../search/Crossover";
import {NeatChromosome} from "./NeatChromosome";
import {Pair} from "../utils/Pair";
import {ConnectionGene} from "./ConnectionGene";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {NodeType} from "./NodeType";
import {Randomness} from "../utils/Randomness";
import {NeatParameter} from "./NeatParameter";


export class NeatCrossover implements Crossover<NeatChromosome> {

    private readonly random = Randomness.getInstance();

    apply(parent1: NeatChromosome, parent2: NeatChromosome): Pair<NeatChromosome> {
        parent1.generateNetwork();
        parent2.generateNetwork();

        // Decide if we want to inherit the weight of one parent or
        // the average of both parents when we have a matching connection
        const avgWeights = this.random.nextDouble() < NeatParameter.CROSSOVER_WEIGHT_AVERAGES_RATE;
        const child = this.multipointCrossover(parent1, parent2, avgWeights);
        return new Pair<NeatChromosome>(child, undefined);
    }

    applyFromPair(parents: Pair<NeatChromosome>): Pair<NeatChromosome> {
        return this.apply(parents.getFirst(), parents.getSecond());
    }

    private multipointCrossover(parent1: NeatChromosome, parent2: NeatChromosome, avgWeights) {

        // Check which parent has the higher non-adjusted fitness value
        // The worse parent should not add additional connections
        // If they have the same fitness value, take the smaller ones excess and disjoint connections only

        let p1Better = false;
        const parent1Size = parent1.connections.size();
        const parent2Size = parent2.connections.size();

        if (parent1.nonAdjustedFitness > parent2.nonAdjustedFitness)
            p1Better = true;
        else if (parent1.nonAdjustedFitness === parent2.nonAdjustedFitness) {
            if (parent1Size < parent2Size) {
                p1Better = true;
            }
        }

        // Create Lists for the new Connections and Nodes
        const newConnections = new List<ConnectionGene>();
        const newNodes = new List<NodeGene>();
        const inputNodes = new List<NodeGene>();
        const outputNodes = new List<NodeGene>();

        // Search through all input/output nodes and add them to the newNodes List
        // This is necessary since we would otherwise loose nodes without a connection
        for (const node of parent1.allNodes) {
            const currentNode = node.clone();
            if (node.type === NodeType.INPUT || node.type === NodeType.BIAS || node.type === NodeType.OUTPUT) {
                newNodes.add(currentNode);
            }
            if (node.type === NodeType.INPUT || node.type === NodeType.BIAS) {
                inputNodes.add(currentNode)
            }
            if (node.type === NodeType.OUTPUT) {
                outputNodes.add(currentNode);
            }

        }

        // Iterators for the connections of both parents
        let i1 = 0;
        let i2 = 0;

        // Average weight, only used when the flag is activated
        let avgWeight = 0;

        // Boolean for deciding if we inherit a connection and if we enable the new Connection
        let skip = false;
        let disable = false;

        // Here we save the chosen connection for each iteration of the while loop
        let currentConnection: ConnectionGene

        while (i1 < parent1Size || i2 < parent2Size) {

            // reset the skip value
            skip = false;

            // Excess Genes coming from parent2
            if (i1 >= parent1Size) {
                currentConnection = parent2.connections.get(i2);
                i2++;
                // Skip excess genes from the worse parent
                if (p1Better)
                    skip = true;
            }
            // Excess genes coming from parent 1
            else if (i2 >= parent2Size) {
                currentConnection = parent1.connections.get(i1);
                i1++;
                // Skip excess genes from the worse parent
                if (!p1Better)
                    skip = true;
            }

            // Matching genes or Disjoint Genes
            else {
                const parent1Connection = parent1.connections.get(i1);
                const parent2Connection = parent2.connections.get(i2);
                const parent1Innovation = parent1Connection.innovation;
                const parent2Innovation = parent2Connection.innovation;

                // Matching genes
                if (parent1Innovation === parent2Innovation) {
                    if (this.random.nextDouble() < 0.5)
                        currentConnection = parent1Connection;
                    else
                        currentConnection = parent2Connection;

                    if(avgWeights)
                        avgWeight = (parent1Connection.weight + parent2Connection.weight) / 2.0;

                    // If one of both is disabled the new Connection is likely to be disabled aswell
                    if (!parent1Connection.enabled || !parent2Connection.enabled) {
                        if (this.random.nextDouble() < 0.75) {
                            disable = true;
                        }
                    }
                    i1++;
                    i2++;
                }

                // Disjoint connections
                else if (parent1Innovation < parent2Innovation) {
                    currentConnection = parent1Connection;
                    i1++;
                    if (!p1Better)
                        skip = true;
                } else {
                    currentConnection = parent2Connection;
                    i2++;
                    if (p1Better)
                        skip = true;
                }
            }

            // At this point we found a potential new Connection now set up everything for the mating process
            // First Check if the new Connection does not conflict with an already chosen connection

            for (const c of newConnections) {
                if (c.equalsByNodes(currentConnection)) {
                    skip = true;
                    break;
                }
            }

            // Now add the new Connection if we do not skip it
            if (!skip) {

                // Check for the nodes and add them if they are not already in the new Nodes List
                const fromNode = currentConnection.from;
                const toNode = currentConnection.to;
                let found: boolean;
                let newFromNode: NodeGene;
                let newOutNode: NodeGene;

                // Search for the fromNode
                for (const iNode of newNodes) {
                    if (iNode.equals(fromNode)) {
                        found = true;
                        newFromNode = iNode;
                    }
                }

                if (!found) {
                    newFromNode = new NodeGene(fromNode.id, fromNode.type)
                    newNodes.add(newFromNode);
                }


                // Search for the outNode
                found = false;
                for (const oNode of newNodes) {
                    if (oNode.equals(toNode)) {
                        found = true;
                        newOutNode = oNode;
                    }
                }

                if (!found) {
                    newOutNode = new NodeGene(toNode.id, toNode.type)
                    newNodes.add(newOutNode);
                }

                // Now add the new Connection
                const newConnection = new ConnectionGene(newFromNode, newOutNode, currentConnection.weight, !disable, currentConnection.innovation)
                if(avgWeights)
                    newConnection.weight = avgWeight;
                disable = false;
                newConnections.add(newConnection);
            }
        }

        // Finally create the child with the selected Connections and Nodes
        const child = new NeatChromosome(newConnections, inputNodes, outputNodes, parent1.getCrossoverOperator(), parent1.getMutationOperator())
        //child.allNodes = newNodes;
        child.generateNetwork();
        return child;

    }
}
