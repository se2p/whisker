import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {Species} from "../NeuroevolutionPopulations/Species";
import {InputConnectionMethod, NetworkChromosome} from "./NetworkChromosome";
import {NeatCrossover} from "../Operators/NeatCrossover";
import {NeatMutation} from "../Operators/NeatMutation";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
import {AddConnectionInnovation, AddNodeSplitConnectionInnovation} from "../Innovation/Innovation";
import {HiddenNode} from "../NetworkComponents/HiddenNode";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {BiasNode} from "../NetworkComponents/BiasNode";
import {InputNode} from "../NetworkComponents/InputNode";

export class NeatChromosome extends NetworkChromosome {
    /**
     * Defines the crossover operator of the chromosome.
     */
    private readonly _crossoverOp: NeatCrossover;

    /**
     * Defines the mutation operator of the chromosome.
     */
    private readonly _mutationOp: NeatMutation;

    /**
     * Fitness value of the chromosome shared within its species.
     */
    private _sharedFitness = 0;

    /**
     * The species this network belongs to.
     */
    private _species: Species<NeatChromosome>;

    /**
     * Marks the best member of a species.
     */
    private _isSpeciesChampion = false;

    /**
     * Marks the best member of the whole population.
     */
    private _isPopulationChampion = false;

    /**
     * Defines whether this network should be used as a parent for reproduction within its species.
     */
    private _isParent: boolean;

    /**
     * The number of offspring this network is allowed to produce.
     */
    private _expectedOffspring = 0;

    /**
     * The number of additional offspring the population champion is allowed to produce.
     */
    private _numberOffspringPopulationChamp: number;

    /**
     * Constructs a new NeatChromosome.
     * @param allNodes all nodes of a network.
     * @param connections the connections between the Nodes.
     * @param mutationOp the mutation operator.
     * @param crossoverOp the crossover operator.
     * @param inputConnectionMethod determines how novel nodes are being connected to the input layer.
     * @param activationFunction the activation function that will be used for hidden nodes.
     * @param incrementID determines whether the id counter should be incremented after constructing this chromosome.
     */
    constructor(allNodes: NodeGene[], connections: ConnectionGene[],
                mutationOp: NeatMutation, crossoverOp: NeatCrossover,
                inputConnectionMethod: InputConnectionMethod,
                activationFunction = ActivationFunction.TANH, incrementID = true) {
        super(allNodes, connections, inputConnectionMethod, activationFunction, incrementID);
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
    }

    /**
     * Deep clone of a NeatChromosome's structure. Attributes that are not related to the network's structure
     * are initialised with default values.
     * @param incrementID determines whether the ID counter should be incremented during the cloning process.
     * @returns NeatChromosome the cloned Network with default attribute values.
     */
    public cloneStructure(incrementID: boolean): NeatChromosome {
        return this.cloneWith(this.connections, incrementID);
    }

    /**
     * Clones the network during the test execution process.
     */
    public cloneAsTestCase(): NeatChromosome {
        const clone = this.cloneStructure(false);
        clone.uID = this.uID;
        clone.isRecurrent = this.isRecurrent;
        if (this.referenceActivationTrace !== undefined) {
            clone.referenceActivationTrace = this.referenceActivationTrace.clone();
        }
        clone.referenceUncertainty = new Map<number, number>(this.referenceUncertainty);
        return clone;
    }

    /**
     * Deep clone of a NeatChromosome using a defined list of genes.
     * @param newGenes the ConnectionGenes the network should be initialised with.
     * @param incrementID determines whether the ID-Counter should be incremented during cloning.
     * @returns NeatChromosome the cloned network chromosome.
     */
    cloneWith(newGenes: ConnectionGene[], incrementID = true): NeatChromosome {
        const connectionsClone: ConnectionGene[] = [];
        const nodesClone: NodeGene[] = [];

        // duplicate Nodes
        for (const node of this.allNodes) {
            nodesClone.push(node.clone());
        }

        // duplicate connections
        for (const connection of newGenes) {
            const fromNode = nodesClone.find(node => node.equals(connection.source));
            const toNode = nodesClone.find(node => node.equals(connection.target));
            const connectionClone = connection.cloneWithNodes(fromNode, toNode);
            connectionsClone.push(connectionClone);
        }
        return new NeatChromosome(nodesClone, connectionsClone, this.getMutationOperator(),
            this.getCrossoverOperator(), this.inputConnectionMethod, this.activationFunction, incrementID);
    }

    /**
     * Deep clone of a network including its structure and attributes. Does not increment the ID-Counter.
     * @returns NeatChromosome the cloned chromosome.
     */
    clone(): NeatChromosome {
        const clone = this.cloneStructure(false);
        clone.uID = this.uID;
        clone.trace = this.trace;
        clone.coverage = this.coverage;
        clone.fitness = this.fitness;
        clone.sharedFitness = this.sharedFitness;
        clone.targetFitness = this.targetFitness;
        clone.openStatementTargets = this.openStatementTargets;
        clone.species = this.species;
        clone.isSpeciesChampion = this.isSpeciesChampion;
        clone.isPopulationChampion = this.isPopulationChampion;
        clone.isParent = this.isParent;
        clone.expectedOffspring = this.expectedOffspring;
        clone.isRecurrent = this.isRecurrent;
        if (this.referenceActivationTrace !== undefined) {
            clone.referenceActivationTrace = this.referenceActivationTrace.clone();
        }
        if (this.testActivationTrace !== undefined) {
            clone.testActivationTrace = this.testActivationTrace.clone();
        }
        clone.referenceUncertainty = new Map<number, number>(this.referenceUncertainty);
        clone.testUncertainty = new Map<number, number>(this.testUncertainty);
        return clone;
    }

    /**
     * Connects nodes to the specified input nodes using a defined connectionMethod to connect the nodes.
     * @param nodesToConnect the nodes that should be connected to the input layer.
     * @param inputNodes defines the input nodes that should be connected to the node.
     * @param inputRate the probability of adding additional sprites to the network in case a sparse method is used
     * @param connectionMethod determines how the input layer should be connected to the given nodes.
     */
    public connectNodeToInputLayer(nodesToConnect: NodeGene[],
                                   inputNodes: Map<string, Map<string, InputNode | BiasNode>>,
                                   connectionMethod: InputConnectionMethod, inputRate = 0.3): ConnectionGene[] {
        // Clone the inputNodes, so we can safely add the bias node without changing the original.
        const inputNodesClone = new Map(inputNodes);
        const biasNode = this.allNodes.find(node => node instanceof BiasNode);
        const biasMap = new Map<string, BiasNode>();
        biasMap.set('Bias', biasNode);
        inputNodesClone.set('Bias', biasMap);
        switch (connectionMethod) {
            case "sparse":
                return this.connectNodeSpriteSparse(nodesToConnect, inputNodesClone, inputRate);
            case "fullyHidden":
                return this.connectNodeFullyHidden(nodesToConnect, inputNodesClone);
            default:
            case "fully":
                return this.connectNodeFully(nodesToConnect, inputNodesClone);
        }
    }

    /**
     * Creates connections from each input to every specified node.
     * @param inputNodes all input layer nodes that should be connected to the specified nodes.
     * @param nodesToConnect the nodes that will be connected to the specified inputs.
     * @returns ConnectionGene[] the generated network's connections.
     */
    private connectNodeFully(nodesToConnect: NodeGene[],
                             inputNodes: Map<string, Map<string, InputNode | BiasNode>>): ConnectionGene[] {
        const connections: ConnectionGene[] = [];
        // For each inputNode create a connection to each outputNode.
        for (const featureMap of inputNodes.values()) {
            for (const inputNode of featureMap.values()) {
                for (const nodeToConnect of nodesToConnect) {
                    const newConnection = new ConnectionGene(inputNode, nodeToConnect, 0, true, 0, false);
                    this.addConnection(newConnection);
                }
            }
        }
        return connections;
    }

    /**
     * Creates connections from each input node to every specified node by placing a hidden node in between.
     * @param inputNodes all input layer nodes that should be connected to the specified nodes.
     * @param nodesToConnect the nodes that will be connected to the specified inputs.
     * @returns ConnectionGene[] the generated network's connections.
     */
    private connectNodeFullyHidden(nodesToConnect: NodeGene[],
                                   inputNodes: Map<string, Map<string, InputNode | BiasNode>>): ConnectionGene[] {
        const connections: ConnectionGene[] = [];
        // For each inputNode create a connection to each outputNode.
        for (const featureMap of inputNodes.values()) {
            const hiddenNode = new HiddenNode(this.allNodes.length, this.activationFunction);
            this.allNodes.push(hiddenNode);
            for (const inputNode of featureMap.values()) {
                const inputHiddenConnection = new ConnectionGene(inputNode, hiddenNode, 0, true, 0, false);
                this.addConnection(inputHiddenConnection);
            }
            for(const nodeToConnect of nodesToConnect) {
                const hiddenOutputConnection = new ConnectionGene(hiddenNode, nodeToConnect, 0, true, 0, false);
                this.addConnection(hiddenOutputConnection);
            }
        }
        return connections;
    }

    /**
     * Creates connections from a single sprite's input nodes to all specified nodes. With a defined probability more
     * sprite node groups are connected to the specified nodes.
     * @param inputNodes all input layer nodes that should be connected to the specified nodes.
     * @param nodesToConnect the nodes that will be connected to the inputs.
     * @param inputRate the probability of adding additional sprites to the network.
     * @returns ConnectionGene[] the generated network's connections.
     */
    private connectNodeSpriteSparse(nodesToConnect: NodeGene[],
                                    inputNodes: Map<string, Map<string, InputNode | BiasNode>>,
                                    inputRate = 0.3): ConnectionGene[] {
        const connections: ConnectionGene[] = [];
        const inputMapClone = new Map<string, Map<string, InputNode | BiasNode>>(inputNodes);

        // We always connect the bias to mitigate the number of defect networks since it may happen that the only
        // connected sprite gets invisible, at which point the sparse network has no input signal.
        const biasKey = "Bias";
        const biasNode = inputMapClone.get(biasKey).get(biasKey);
        for(const nodeToConnect of nodesToConnect) {
            const newConnection = new ConnectionGene(biasNode, nodeToConnect, 0, true, 0, false);
            this.addConnection(newConnection);
        }
        inputMapClone.delete(biasKey);

        // Loop at least once and until we reach the maximum connection size or randomness tells us to Stop!
        do {
            // Choose a random Sprite to add its input nodes to the network;
            const spriteToConnect = this._random.pick([...inputMapClone.keys()]);

            // For each input node of the Sprite create a connection to each Output-Node
            for (const inputNode of inputMapClone.get(spriteToConnect).values()) {
                for(const nodeToConnect of nodesToConnect) {
                    const newConnection = new ConnectionGene(inputNode, nodeToConnect, 0, true, 0, false);
                    this.addConnection(newConnection);
                }
            }
            inputMapClone.delete(spriteToConnect);
        }
        while (this._random.nextDouble() < inputRate && inputMapClone.size > 0);
        return connections;
    }

    /**
     * Determines how a novel connection is added to the network. In NEAT-Chromosomes we have to keep track of the
     * innovation history.
     * @param connection the connection to add.
     */
    public addConnection(connection: ConnectionGene): void {
        const innovation = NeatPopulation.findInnovation(connection, "addConnection");

        // Check if this innovation has occurred before.
        if (innovation && innovation.type === 'addConnection') {
            connection.innovation = innovation.innovationNumber;
        } else {
            const newInnovation: AddConnectionInnovation = {
                type: 'addConnection',
                idSourceNode: connection.source.uID,
                idTargetNode: connection.target.uID,
                innovationNumber: NeatPopulation.getAvailableInnovationNumber(),
                recurrent: connection.isRecurrent
            };
            NeatPopulation.innovations.push(newInnovation);
            connection.innovation = newInnovation.innovationNumber;
        }
        this.connections.push(connection);
        if (connection.isRecurrent) {
            this.isRecurrent = true;
        }
    }

    /**
     * Adds a new node by splitting an existing connection and keeping track of the innovation history.
     * @param splitConnection the connection to be split by the new node.
     */
    public addNodeSplitConnection(splitConnection: ConnectionGene): void {
        // Disable the old connection
        splitConnection.isEnabled = false;

        // Save the old weight and the nodes of the connection
        const oldWeight = splitConnection.weight;
        const sourceNode = splitConnection.source;
        const targetNode = splitConnection.target;
        // Create the new HiddenNode and the two new connections.
        // Check if this innovation has already occurred previously.
        const innovation = NeatPopulation.findInnovation(splitConnection, 'addNodeSplitConnection');
        let newNode: HiddenNode;
        let connection1: ConnectionGene;
        let connection2: ConnectionGene;
        const activationFunction = this.activationFunction;
        if (innovation && innovation.type === 'addNodeSplitConnection') {
            newNode = new HiddenNode(innovation.idNewNode, activationFunction);
            connection1 = new ConnectionGene(sourceNode, newNode, 1.0, true, innovation.firstInnovationNumber, splitConnection.isRecurrent);
            connection2 = new ConnectionGene(newNode, targetNode, oldWeight, true, innovation.secondInnovationNumber, false);
        } else {
            const nextNodeId = NeatPopulation.highestNodeId + 1;
            newNode = new HiddenNode(nextNodeId, activationFunction);

            const newInnovation: AddNodeSplitConnectionInnovation = {
                type: 'addNodeSplitConnection',
                idSourceNode: sourceNode.uID,
                idTargetNode: targetNode.uID,
                firstInnovationNumber: NeatPopulation.getAvailableInnovationNumber(),
                secondInnovationNumber: NeatPopulation.getAvailableInnovationNumber(),
                idNewNode: nextNodeId,
                splitInnovation: splitConnection.innovation
            };
            NeatPopulation.innovations.push(newInnovation);
            connection1 = new ConnectionGene(sourceNode, newNode, 1.0, true, newInnovation.firstInnovationNumber, splitConnection.isRecurrent);
            connection2 = new ConnectionGene(newNode, targetNode, oldWeight, true, newInnovation.secondInnovationNumber, splitConnection.isRecurrent);
        }

        // We do not use the addConnection method here since we have already assigned innovation numbers to the
        // created connections.
        this.connections.push(connection1);
        this.connections.push(connection2);
        this.allNodes.push(newNode);

        const threshold = this.allNodes.length * this.allNodes.length;
        this.isRecurrentPath(sourceNode, newNode, 0, threshold);
        this.isRecurrentPath(newNode, targetNode, 0, threshold);
    }

    /**
     * Transforms this NeatChromosome into a JSON representation.
     * @return Record containing most important attribute keys mapped to their values.
     */
    public toJSON(): Record<string, (number | NodeGene | ConnectionGene)> {
        const network = {};
        network[`id`] = this.uID;
        network['aF'] = ActivationFunction[this.activationFunction];
        network['cM'] = this.inputConnectionMethod;

        if (this.targetFitness instanceof StatementFitnessFunction) {
            network[`tf`] = this.targetFitness.getTargetNode().id;
        }

        const nodes = {};
        for (let i = 0; i < this.allNodes.length; i++) {
            nodes[`Node ${i}`] = this.allNodes[i].toJSON();
        }
        network[`Nodes`] = nodes;

        const connections = {};
        for (let i = 0; i < this.connections.length; i++) {
            connections[`Con ${i}`] = this.connections[i].toJSON();
        }
        network[`Cons`] = connections;

        // Save the activation trace if one was recorded.
        if (this.testActivationTrace !== undefined) {
            network['AT'] = this.testActivationTrace.toJSON();
        } else {
            network['AT'] = undefined;
        }

        return network;
    }

    getCrossoverOperator(): any {
        return this._crossoverOp;
    }

    getMutationOperator(): any {
        return this._mutationOp;
    }


    get sharedFitness(): number {
        return this._sharedFitness;
    }

    set sharedFitness(value: number) {
        this._sharedFitness = value;
    }

    get species(): Species<NeatChromosome> {
        return this._species;
    }

    set species(value: Species<NeatChromosome>) {
        this._species = value;
    }

    get isSpeciesChampion(): boolean {
        return this._isSpeciesChampion;
    }

    set isSpeciesChampion(value: boolean) {
        this._isSpeciesChampion = value;
    }

    get isPopulationChampion(): boolean {
        return this._isPopulationChampion;
    }

    set isPopulationChampion(value: boolean) {
        this._isPopulationChampion = value;
    }

    get isParent(): boolean {
        return this._isParent;
    }

    set isParent(value: boolean) {
        this._isParent = value;
    }

    get expectedOffspring(): number {
        return this._expectedOffspring;
    }

    set expectedOffspring(value: number) {
        this._expectedOffspring = value;
    }

    get numberOffspringPopulationChamp(): number {
        return this._numberOffspringPopulationChamp;
    }

    set numberOffspringPopulationChamp(value: number) {
        this._numberOffspringPopulationChamp = value;
    }
}
