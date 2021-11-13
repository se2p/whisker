import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {NeatMutation} from "../Operators/NeatMutation";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {NeatCrossover} from "../Operators/NeatCrossover";
import {NeatChromosome} from "../Networks/NeatChromosome";

export abstract class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {

    /**
     * The mutation operator
     */
    protected _mutationOp: NeatMutation;

    /**
     * The crossover operator.
     */
    protected _crossoverOp: NeatCrossover;

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
    abstract get(): NeatChromosome;

    /**
     * Creates connections between input and output nodes according to the inputRate
     * @param inputNodes all inputNodes of the network sorted according to the sprites they represent
     * @param outputNodes all outputNodes of the network
     * @return the connectionGene List
     */
    abstract createConnections(inputNodes?: NodeGene[][], outputNodes?: NodeGene[]): ConnectionGene[];

    /**
     * Adds regression nodes to the network
     * @param allNodes contains all nodes of the network
     * @param parameterizedEvents contains all parameterized Events of the given Scratch-Project
     * @param nodeId counter to assign id's to the new regression nodes
     */
    protected addRegressionNodes(allNodes: List<NodeGene>, parameterizedEvents: List<ScratchEvent>, nodeId: number): void {
        for (const event of parameterizedEvents) {
            for (const parameter of event.getSearchParameterNames()) {
                // Create the regression Node and add it to the NodeList
                const regressionNode = new RegressionNode(nodeId++, event, parameter, ActivationFunction.NONE)
                allNodes.add(regressionNode)
            }
        }
    }

    setCrossoverOperator(crossoverOp: NeatCrossover): void {
        this._crossoverOp = crossoverOp;
    }

    setMutationOperator(mutationOp: NeatMutation): void {
        this._mutationOp = mutationOp;
    }
}
