import {Pair} from "../../utils/Pair";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {Randomness} from "../../utils/Randomness";
import {NetworkCrossover} from "./NetworkCrossover";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {NetworkLayer} from "../Networks/NetworkChromosome";


export class NeatCrossover extends NetworkCrossover<NeatChromosome> {

    /**
     * Random number generator.
     */
    private readonly random = Randomness.getInstance();

    /**
     * Probability of averaging the weight of two matching genes during crossover.
     */
    private readonly crossoverWeightAverageRate: number;

    /**
     * Constructs a new NeatCrossover object.
     * @param crossoverConfig the configuration parameter for the NEAT-Crossover.
     */
    constructor(crossoverConfig: Record<string, (string | number)>) {
        super();
        this.crossoverWeightAverageRate = crossoverConfig.weightAverageRate as number;
    }

    /**
     * Applies the crossover operator.
     * @param parent1 the first crossover parent.
     * @param parent2 the second crossover parent.
     */
    apply(parent1: NeatChromosome, parent2: NeatChromosome): Pair<NeatChromosome> {
        const parent1Clone = parent1.clone() as NeatChromosome;
        const parent2Clone = parent2.clone() as NeatChromosome;

        parent1Clone.sortConnections();
        parent2Clone.sortConnections();

        // Decide if we want to inherit the weight of one parent or
        // the average of both parents when we have a matching connection
        const avgWeights = this.random.nextDouble() < this.crossoverWeightAverageRate;
        const child = this.multipointCrossover(parent1Clone, parent2Clone, avgWeights);
        return [child, undefined];
    }

    /**
     * Applies the crossover operator.
     * @param parents the parents that should be mated with each other.
     */
    override applyFromPair(parents: Pair<NeatChromosome>): Pair<NeatChromosome> {
        return this.apply(parents[0], parents[1]);
    }

    /**
     * Applies crossover by aligning the connection gene lists of both parents.
     * Matching genes are inherited randomly or by averaging the weight of both parents.
     * Disjoint and Excess genes are inherited from the more fit parent.
     * @param parent1 the first crossover parent.
     * @param parent2 the second crossover parent.
     * @param avgWeights determines whether we inherit matching genes randomly or by averaging the weight of both parent
     * connections.
     */
    private multipointCrossover(parent1: NeatChromosome, parent2: NeatChromosome, avgWeights) {

        // Check which parent has the higher non-adjusted fitness value
        // The worst performing parent should not add additional connections
        // If they have the same fitness value, take the smaller ones excess and disjoint connections only
        let p1Better = false;
        const parent1Size = parent1.connections.length;
        const parent2Size = parent2.connections.length;

        if (parent1.fitness > parent2.fitness)
            p1Better = true;
        else if (parent1.fitness === parent2.fitness) {
            if (parent1Size < parent2Size) {
                p1Better = true;
            }
        }

        // Create Lists for the new Connections and the layer map that includes the new nodes.
        const newConnections: ConnectionGene[] = [];
        const newLayers: NetworkLayer = new Map<number, NodeGene[]>();

        // Iterators for the connections of both parents
        let i1 = 0;
        let i2 = 0;

        // Average weight, only used when the flag is activated.
        let avgWeight = undefined;

        // Booleans for deciding if we inherit a connection and if we enable the new Connection.
        let skip = false;

        // Here we save the chosen connection for each iteration of the while loop and if it's a recurrent one.
        let currentConnection: ConnectionGene;

        while (i1 < parent1Size || i2 < parent2Size) {

            // reset the skip value and the avgWeight value
            skip = false;
            avgWeight = undefined;

            // Excess Genes coming from parent2
            if (i1 >= parent1Size) {
                currentConnection = parent2.connections[i2];
                i2++;
                // Skip excess genes from the worse parent
                if (p1Better) {
                    skip = true;
                }
            }
            // Excess genes coming from parent 1
            else if (i2 >= parent2Size) {
                currentConnection = parent1.connections[i1];
                i1++;
                // Skip excess genes from the worse parent
                if (!p1Better) {
                    skip = true;
                }
            }

            // Matching genes or Disjoint Genes
            else {
                const parent1Connection = parent1.connections[i1];
                const parent2Connection = parent2.connections[i2];
                const parent1Innovation = parent1Connection.innovation;
                const parent2Innovation = parent2Connection.innovation;

                // Matching genes are chosen randomly between the parents
                if (parent1Innovation === parent2Innovation) {
                    if (this.random.randomBoolean()) {
                        currentConnection = parent1Connection;
                    } else {
                        currentConnection = parent2Connection;
                    }

                    if (avgWeights) {
                        avgWeight = (parent1Connection.weight + parent2Connection.weight) / 2.0;
                    }

                    i1++;
                    i2++;
                }

                // Disjoint connections are inherited from the more fit parent
                else if (parent1Innovation < parent2Innovation) {
                    currentConnection = parent1Connection;
                    i1++;
                    if (!p1Better) {
                        skip = true;
                    }
                } else {
                    currentConnection = parent2Connection;
                    i2++;
                    if (p1Better) {
                        skip = true;
                    }
                }
            }

            // Now add the new Connection if we found a valid one.
            if (!skip) {
                // Check for the nodes and add them if they are not already in the new Nodes List
                const sourceNode = currentConnection.source;
                const targetNode = currentConnection.target;

                // Clone and add the sourceNode to the new layer map.
                let newSourceNode = [...newLayers.values()].flat().find(node => node.uID === sourceNode.uID);
                if (!newSourceNode) {
                    newSourceNode = sourceNode.clone();
                    if (!newLayers.has(newSourceNode.depth)) {
                        newLayers.set(newSourceNode.depth, []);
                    }
                    newLayers.get(newSourceNode.depth).push(newSourceNode);
                }

                // Clone and add the targetNode to the new layer map.
                let newTargetNode = [...newLayers.values()].flat().find(node => node.uID === targetNode.uID);
                if (!newTargetNode) {
                    newTargetNode = targetNode.clone();
                    if (!newLayers.has(newTargetNode.depth)) {
                        newLayers.set(newTargetNode.depth, []);
                    }
                    newLayers.get(newTargetNode.depth).push(newTargetNode);
                }

                // Now add the new Connection
                const newConnection = new ConnectionGene(newSourceNode, newTargetNode, currentConnection.weight,
                    currentConnection.isEnabled, currentConnection.innovation);

                // Average the weight if we calculated a value for matching genes.
                if (avgWeight) {
                    newConnection.weight = avgWeight;
                }

                newConnections.push(newConnection);
            }
        }

        // Finally, create the child with the selected Connections and Nodes
        return new NeatChromosome(newLayers, newConnections, parent1.getMutationOperator(),
            parent1.getCrossoverOperator(), parent1.inputConnectionMethod, parent1.activationFunction);
    }
}
