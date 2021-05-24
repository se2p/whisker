import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NetworkChromosome} from "../NetworkChromosome";
import {Mutation} from "../../search/Mutation";
import {Crossover} from "../../search/Crossover";
import {List} from "../../utils/List";
import {NodeGene} from "../NetworkNodes/NodeGene";
import {ConnectionGene} from "../ConnectionGene";
import {NeatMutation} from "../NeatMutation";
import {ActivationFunction} from "../NetworkNodes/ActivationFunction";
import {InputNode} from "../NetworkNodes/InputNode";
import {BiasNode} from "../NetworkNodes/BiasNode";
import {ClassificationNode} from "../NetworkNodes/ClassificationNode";
import {RegressionNode} from "../NetworkNodes/RegressionNode";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";

export abstract class NetworkChromosomeGenerator implements ChromosomeGenerator<NetworkChromosome> {

    /**
     * The mutation operator of the NetworkChromosomes
     */
    private _mutationOp: Mutation<NetworkChromosome>;

    /**
     * The crossover operator of th NetworkChromosomes
     * @private
     */
    private _crossoverOp: Crossover<NetworkChromosome>;

    /**
     * A map which maps each sprite to its input feature-vector
     */
    private readonly _inputs: Map<string, number[]>;

    /**
     * All Scratch-Events the given Scratch project handles.
     */
    private readonly _scratchEvents: List<ScratchEvent>;

    /**
     * Constructs a new NetworkGenerator
     * @param mutationOp the used mutation operator
     * @param crossoverOp the used crossover operator
     * @param inputs a map which maps each sprite to its input feature-vector
     * @param scratchEvents all Scratch-Events the given Scratch-Project handles
     */
    constructor(mutationOp: Mutation<NetworkChromosome>, crossoverOp: Crossover<NetworkChromosome>,
                inputs: Map<string, number[]>, scratchEvents: List<ScratchEvent>) {
        this._mutationOp = mutationOp;
        this._crossoverOp = crossoverOp;
        this._inputs = inputs;
        this._scratchEvents = scratchEvents;
    }

    /**
     * Creates and returns a random NetworkChromosome with the specified number of input and output nodes
     * and a random set of connections in between them.
     * @return: generated NetworkChromosome
     */
    get(): NetworkChromosome {
        let nodeId = 0;
        const allNodes = new List<NodeGene>();

        // Create the Input Nodes and add them to the nodes list;
        // Sprites can have a different amount of infos i.e different amount of feature vector sizes.
        const inputList = new List<List<NodeGene>>()
        this._inputs.forEach((value, key) => {
            const spriteList = new List<NodeGene>();
            value.forEach(() => {
                const iNode = new InputNode(nodeId++, key);
                spriteList.add(iNode)
                allNodes.add(iNode);
            })
            inputList.add(spriteList)
        })


        // Add the Bias
        const biasNode = new BiasNode(nodeId++);
        allNodes.add(biasNode);

        // Create the classification output nodes and add them to the nodes list
        for (const event of this._scratchEvents) {
            const classificationNode = new ClassificationNode(nodeId++, event, ActivationFunction.SIGMOID);
            allNodes.add(classificationNode);
        }

        // Add regression nodes for each parameter of each parameterized Event
        const parameterizedEvents = this._scratchEvents.filter(event => event.getNumVariableParameters() > 0);
        if (!parameterizedEvents.isEmpty()) {
            this.addRegressionNodes(allNodes, parameterizedEvents, nodeId);
        }

        // Create connections between input and output nodes
        const outputNodes = allNodes.filter(node => node instanceof ClassificationNode || node instanceof RegressionNode);
        const connections = this.createConnections(inputList, outputNodes);
        const chromosome = new NetworkChromosome(connections, allNodes, this._mutationOp, this._crossoverOp);

        // Perturb the weights
        const mutationOp = chromosome.getMutationOperator() as NeatMutation;
        mutationOp.mutateWeight(chromosome, 1, 1);
        return chromosome;
    }

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
                const regressionNode = new RegressionNode(nodeId++, event.constructor.name + "-" + parameter, ActivationFunction.NONE)
                allNodes.add(regressionNode)
            }
        }
    }

    /**
     * Creates connections between input and output nodes according to the inputRate
     * @param inputNodes all inputNodes of the network sorted according to the sprites they represent
     * @param outputNodes all outputNodes of the network
     * @return the connectionGene List
     */
    abstract createConnections(inputNodes: List<List<NodeGene>>, outputNodes: List<NodeGene>): List<ConnectionGene>;

    setCrossoverOperator(crossoverOp: Crossover<NetworkChromosome>): void {
        this._crossoverOp = crossoverOp;
    }

    setMutationOperator(mutationOp: Mutation<NetworkChromosome>): void {
        this._mutationOp = mutationOp;
    }
}
