import {Crossover} from "../search/Crossover";
import {NetworkChromosome} from "./NetworkChromosome";
import {Pair} from "../utils/Pair";
import {ConnectionGene} from "./ConnectionGene";
import {NodeGene} from "./NetworkNodes/NodeGene";
import {NodeType} from "./NetworkNodes/NodeType";
import {Randomness} from "../utils/Randomness";


export class NeatCrossover implements Crossover<NetworkChromosome> {

    /**
     * Random generator
     */
    private readonly random = Randomness.getInstance();

    /**
     * Probability of applying weight averaging during crossover
     */
    private readonly crossoverAverageWeights: number;

    /**
     * Constructs a new NeatCrossover object
     * @param crossoverConfig the configuration parameter for the NEAT-Crossover
     */
    constructor(crossoverConfig: Record<string, (string | number)>) {
        this.crossoverAverageWeights = crossoverConfig.weightAverageRate as number;
    }

    /**
     * Applies the crossover operator
     * @param parent1 the first parent of the crossover
     * @param parent2 the second parent of the crossover
     */
    apply(parent1: NetworkChromosome, parent2: NetworkChromosome): Pair<NetworkChromosome> {
        parent1.generateNetwork();
        parent2.generateNetwork();

        // Decide if we want to inherit the weight of one parent or
        // the average of both parents when we have a matching connection
        const avgWeights = this.random.nextDouble() < this.crossoverAverageWeights;
        const child = this.multipointCrossover(parent1, parent2, avgWeights);
        return new Pair<NetworkChromosome>(child, undefined);
    }

    /**
     * Applies the crossover operator
     * @param parents the parents to mate with each other
     */
    applyFromPair(parents: Pair<NetworkChromosome>): Pair<NetworkChromosome> {
        return this.apply(parents.getFirst(), parents.getSecond());
    }

    /**
     * Applies crossover by aligning the connection gene lists of both parents;
     * Matching genes are inherited randomly or by averaging the weight of both parents
     * Disjoint and Excess genes are inherited from the more fit parent
     * @param parent1 the first parent of the crossover
     * @param parent2 the second parent of the crossover
     * @param avgWeights decided if we inherit matching genes randomly or by averaging the weight of both parent connections
     */
    private multipointCrossover(parent1: NetworkChromosome, parent2: NetworkChromosome, avgWeights) {

        // Check which parent has the higher non-adjusted fitness value
        // The worse parent should not add additional connections
        // If they have the same fitness value, take the smaller ones excess and disjoint connections only
        let p1Better = false;
        const parent1Size = parent1.connections.length;
        const parent2Size = parent2.connections.length;

        if (parent1.networkFitness > parent2.networkFitness)
            p1Better = true;
        else if (parent1.networkFitness === parent2.networkFitness) {
            if (parent1Size < parent2Size) {
                p1Better = true;
            }
        }

        // Create Lists for the new Connections and Nodes
        const newConnections: ConnectionGene[] = [];
        const newNodes: NodeGene[] = [];
        const inputNodes: NodeGene[] = [];
        const outputNodes: NodeGene[] = [];

        // Create another List for saving disabled connections to check if we accidentally destroyed the
        // network by disabling some connections.
        const disabledConnections: ConnectionGene[] = [];

        // Search through all input/output nodes and add them to the newNodes List
        // This is necessary since we would otherwise loose nodes without a connection
        for (const node of parent1.allNodes) {
            const currentNode = node.clone();
            if (node.type === NodeType.INPUT || node.type === NodeType.BIAS || node.type === NodeType.OUTPUT) {
                newNodes.push(currentNode);
            }
            if (node.type === NodeType.INPUT || node.type === NodeType.BIAS) {
                inputNodes.push(currentNode);
            }
            if (node.type === NodeType.OUTPUT) {
                outputNodes.push(currentNode);
            }

        }

        // Iterators for the connections of both parents
        let i1 = 0;
        let i2 = 0;

        // Average weight, only used when the flag is activated
        let avgWeight = 0;

        // Booleans for deciding if we inherit a connection and if we enable the new Connection
        let skip = false;
        let disable = false;

        // Here we save the chosen connection for each iteration of the while loop and if its a recurrent one.
        let currentConnection: ConnectionGene;
        let recurrent = false;

        while (i1 < parent1Size || i2 < parent2Size) {

            // reset the skip value
            skip = false;

            // Excess Genes coming from parent2
            if (i1 >= parent1Size) {
                currentConnection = parent2.connections[i2];
                i2++;
                // Skip excess genes from the worse parent
                if (p1Better)
                    skip = true;
            }
            // Excess genes coming from parent 1
            else if (i2 >= parent2Size) {
                currentConnection = parent1.connections[i1];
                i1++;
                // Skip excess genes from the worse parent
                if (!p1Better)
                    skip = true;
            }

            // Matching genes or Disjoint Genes
            else {
                const parent1Connection = parent1.connections[i1];
                const parent2Connection = parent2.connections[i2];
                const parent1Innovation = parent1Connection.innovation;
                const parent2Innovation = parent2Connection.innovation;

                // Matching genes are chosen randomly between the parents
                if (parent1Innovation === parent2Innovation) {
                    if (this.random.nextDouble() < 0.5)
                        currentConnection = parent1Connection;
                    else
                        currentConnection = parent2Connection;

                    if (avgWeights)
                        avgWeight = (parent1Connection.weight + parent2Connection.weight) / 2.0;

                    // If one of both is disabled the new Connection is likely to be disabled as well
                    if (!parent1Connection.isEnabled || !parent2Connection.isEnabled) {
                        if (this.random.nextDouble() < 0.75) {
                            disable = true;
                        }
                    }
                    i1++;
                    i2++;
                }

                // Disjoint connections are inherited from the more fit parent
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

            // Now add the new Connection if we found a valid one.
            if (!skip) {
                // Check for the nodes and add them if they are not already in the new Nodes List
                const fromNode = currentConnection.source;
                const toNode = currentConnection.target;
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
                    newFromNode = fromNode.clone();
                    newNodes.push(newFromNode);
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
                    newOutNode = toNode.clone();
                    newNodes.push(newOutNode);
                }

                // Now add the new Connection
                const newConnection = new ConnectionGene(newFromNode, newOutNode, currentConnection.weight, !disable, currentConnection.innovation,
                    currentConnection.isRecurrent);

                // Set the isRecurrent flag if we added a isRecurrent connection
                if (newConnection.isRecurrent)
                    recurrent = true;

                // Collect the disabled Connections -> if we produce a defect network we sequentially enable the
                // connections stored here until we found a path from input to output, i.e repaired the network
                if (disable)
                    disabledConnections.push(newConnection);

                // Average the weight if we set the flag
                if (avgWeights)
                    newConnection.weight = avgWeight;

                disable = false;
                newConnections.push(newConnection);
            }
        }

        // Finally create the child with the selected Connections and Nodes
        const child = new NetworkChromosome(newConnections, newNodes, parent1.getMutationOperator(), parent1.getCrossoverOperator())
        child.generateNetwork();

        // Check if everything went fine and enable some connections to fix a defect network if necessary
        let i = 0;
        while (child.stabilizedCounter(10) < 0 && i < disabledConnections.length) {
            disabledConnections[i].isEnabled = true;
            child.generateNetwork();
            i++;
        }

        if (recurrent) {
            child.isRecurrent = true;
        }
        return child;
    }
}
