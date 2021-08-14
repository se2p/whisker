import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NetworkChromosome} from "../NetworkChromosome";
import {Mutation} from "../../search/Mutation";
import {Crossover} from "../../search/Crossover";
import {List} from "../../utils/List";
import {NodeGene} from "../NetworkNodes/NodeGene";
import {ConnectionGene} from "../ConnectionGene";
import {NeatMutation} from "../NeatMutation";
import {ActivationFunction} from "../NetworkNodes/ActivationFunction";
import {RegressionNode} from "../NetworkNodes/RegressionNode";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {NeatCrossover} from "../NeatCrossover";

export abstract class NetworkChromosomeGenerator implements ChromosomeGenerator<NetworkChromosome> {

    /**
     * The mutation operator of the NetworkChromosomes
     */
    protected _mutationOp: Mutation<NetworkChromosome>;

    /**
     * The crossover operator of th NetworkChromosomes
     * @private
     */
    protected _crossoverOp: Crossover<NetworkChromosome>;

    /**
     * Constructs a new NetworkGenerator
     * @param mutationConfig the configuration parameters for the mutation operator
     * @param crossoverConfig the configuration parameters for the crossover operator
     */
    protected constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>) {
        const mutationOperator = new NeatMutation(mutationConfig);
        const crossOverOperator = new NeatCrossover(crossoverConfig);
        this._mutationOp = mutationOperator;
        this._crossoverOp = crossOverOperator;

    }

    /**
     * Method to obtain a single network from a specific NetworkGenerator.
     * @return Returns a working NetworkChromosome
     */
    abstract get(): NetworkChromosome;

    /**
     * Creates connections between input and output nodes according to the inputRate
     * @param inputNodes all inputNodes of the network sorted according to the sprites they represent
     * @param outputNodes all outputNodes of the network
     * @return the connectionGene List
     */
    abstract createConnections(inputNodes?: List<List<NodeGene>>, outputNodes?: List<NodeGene>): List<ConnectionGene>;

    /**
     * Adds regression nodes to the network
     * @param allNodes contains all nodes of the network
     * @param parameterizedEvents contains all parameterized Events of the given Scratch-Project
     * @param nodeId counter to assign id's to the new regression nodes
     */
    protected addRegressionNodes(allNodes: List<NodeGene>, parameterizedEvents: List<ScratchEvent>, nodeId: number): void {
        for (const event of parameterizedEvents) {
            for (const parameter of event.getVariableParameterNames()) {
                // Create the regression Node and add it to the NodeList
                const regressionNode = new RegressionNode(nodeId++, event, parameter, ActivationFunction.NONE)
                allNodes.add(regressionNode)
            }
        }
    }

    setCrossoverOperator(crossoverOp: Crossover<NetworkChromosome>): void {
        this._crossoverOp = crossoverOp;
    }

    setMutationOperator(mutationOp: Mutation<NetworkChromosome>): void {
        this._mutationOp = mutationOp;
    }
}
