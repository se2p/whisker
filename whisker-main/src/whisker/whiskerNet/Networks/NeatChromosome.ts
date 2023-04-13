import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {Species} from "../NeuroevolutionPopulations/Species";
import {InputConnectionMethod, NetworkChromosome, NetworkLayer} from "./NetworkChromosome";
import {NeatCrossover} from "../Operators/NeatCrossover";
import {NeatMutation} from "../Operators/NeatMutation";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {AddConnectionInnovation, AddNodeSplitConnectionInnovation, NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
import {HiddenNode} from "../NetworkComponents/HiddenNode";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {BiasNode} from "../NetworkComponents/BiasNode";

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
     * @param layers the networks {@link NetworkLayer}s.
     * @param connections the connections between the Nodes.
     * @param mutationOp the mutation operator.
     * @param crossoverOp the crossover operator.
     * @param inputConnectionMethod determines how novel nodes are being connected to the input layer.
     * @param activationFunction the activation function that will be used for hidden nodes.
     * @param incrementID determines whether the id counter should be incremented after constructing this chromosome.
     */
    constructor(layers: NetworkLayer, connections: ConnectionGene[],
                mutationOp: NeatMutation, crossoverOp: NeatCrossover,
                inputConnectionMethod: InputConnectionMethod,
                activationFunction = ActivationFunction.RELU, incrementID = true) {
        super(layers, connections, inputConnectionMethod, activationFunction, incrementID);
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
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
     * Deep clone of a NeatChromosome using a defined list of genes.
     * @param newGenes the ConnectionGenes the network should be initialised with.
     * @param incrementID determines whether the ID-Counter should be incremented during cloning.
     * @returns NeatChromosome the cloned network chromosome.
     */
    cloneWith(newGenes: ConnectionGene[], incrementID = true): NeatChromosome {
        const connectionsClone: ConnectionGene[] = [];
        const layerClone = this.cloneLayer();

        // duplicate connections
        const allNodes = [...layerClone.values()].flat();
        for (const connection of newGenes) {
            const fromNode = allNodes.find(node => node.equals(connection.source));
            const toNode = allNodes.find(node => node.equals(connection.target));
            const connectionClone = connection.cloneWithNodes(fromNode, toNode);
            connectionsClone.push(connectionClone);
        }
        return new NeatChromosome(layerClone, connectionsClone, this.getMutationOperator(),
            this.getCrossoverOperator(), this.inputConnectionMethod, this.activationFunction, incrementID);
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
        if (this.referenceActivationTrace !== undefined) {
            clone.referenceActivationTrace = this.referenceActivationTrace.clone();
        }
        clone.referenceUncertainty = new Map<number, number>(this.referenceUncertainty);
        return clone;
    }

    /**
     * Connects nodes to the specified input nodes using a defined connectionMethod to connect the nodes.
     * @param nodesToConnect the nodes that should be connected to the input layer.
     * @param inputRate the probability of adding additional sprites to the network in case a sparse method is used
     * @param connectionMethod determines how the input layer should be connected to the given nodes.
     */
    public connectNodeToInputLayer(nodesToConnect: NodeGene[], connectionMethod: InputConnectionMethod,
                                   inputRate = 0.3): void {
        switch (connectionMethod) {
            case "sparse":
                this.connectNodeSpriteSparse(nodesToConnect, inputRate);
                break;
            case "fullyHidden":
                this.connectNodeFullyHidden(nodesToConnect);
                break;
            default:
            case "fully":
                this.connectNodeFully(nodesToConnect);
        }
    }

    /**
     * Creates connections from each input to every specified node.
     * @param nodesToConnect the nodes that will be connected to the specified inputs.
     */
    private connectNodeFully(nodesToConnect: NodeGene[]) {
        for (const inputNode of this.layers.get(0)) {
            for (const nodeToConnect of nodesToConnect) {
                const newConnection = new ConnectionGene(inputNode, nodeToConnect, this._random.nextDoubleMinMax(-1, 1), true, 0);
                this.addConnection(newConnection);
            }
        }
    }

    /**
     * Creates connections from each input node to every specified node by placing a hidden node in between.
     * @param nodesToConnect the nodes that will be connected to the specified inputs.
     * @returns ConnectionGene[] the generated network's connections.
     */
    private connectNodeFullyHidden(nodesToConnect: NodeGene[]): ConnectionGene[] {
        const connections: ConnectionGene[] = [];
        let minDepth = 1;
        let minDepthNode = nodesToConnect[0];
        for(const node of nodesToConnect){
            if(node.depth < minDepth){
                minDepth = node.depth;
                minDepthNode = node;
            }
        }
        for (const featureMap of this.inputNodes.values()) {
            const depth = this.getDepthOfNewNode([...featureMap.values()][0], minDepthNode);
            const hiddenNode = new HiddenNode(this.getNumNodes(), depth, this.activationFunction);
            this.addNode(hiddenNode, [...featureMap.values()][0], minDepthNode);
            for (const inputNode of featureMap.values()) {
                const inputHiddenConnection = new ConnectionGene(inputNode, hiddenNode, this._random.nextDoubleMinMax(-1, 1), true, 0);
                this.addConnection(inputHiddenConnection);
            }
            for (const nodeToConnect of nodesToConnect) {
                const hiddenOutputConnection = new ConnectionGene(hiddenNode, nodeToConnect, this._random.nextDoubleMinMax(-1, 1), true, 0);
                this.addConnection(hiddenOutputConnection);
            }
        }
        return connections;
    }

    /**
     * Creates connections from a single sprite's input nodes to all specified nodes. With a defined probability more
     * sprite node groups are connected to the specified nodes.
     * @param nodesToConnect the nodes that will be connected to the inputs.
     * @param inputRate the probability of adding additional sprites to the network.
     * @returns ConnectionGene[] the generated network's connections.
     */
    private connectNodeSpriteSparse(nodesToConnect: NodeGene[], inputRate): ConnectionGene[] {
        const connections: ConnectionGene[] = [];
        const biasNode = this.layers.get(0).find(node => node instanceof BiasNode);
        for (const nodeToConnect of nodesToConnect) {
            const newConnection = new ConnectionGene(biasNode, nodeToConnect, this._random.nextDoubleMinMax(-1, 1), true, 0);
            this.addConnection(newConnection);
        }

        // Loop at least once and until we reach the maximum connection size or randomness tells us to Stop!
        const spriteKeys = [...this.inputNodes.keys()];
        do {
            // Choose a random Sprite to add its input nodes to the network;
            const spriteToConnect = this._random.pick(spriteKeys);

            // For each input node of the Sprite create a connection to each Output-Node.
            for (const inputNode of this.inputNodes.get(spriteToConnect).values()) {
                for (const nodeToConnect of nodesToConnect) {
                    const newConnection = new ConnectionGene(inputNode, nodeToConnect, this._random.nextDoubleMinMax(-1, 1), true, 0);
                    this.addConnection(newConnection);
                }
            }
            spriteKeys.splice(spriteKeys.indexOf(spriteToConnect), 1);
        }
        while (this._random.nextDouble() < inputRate && spriteKeys.length > 0);
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
        this.generateNetwork();
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
        const depth = this.getDepthOfNewNode(sourceNode, targetNode);
        if (innovation && innovation.type === 'addNodeSplitConnection') {
            newNode = new HiddenNode(innovation.idNewNode, depth, activationFunction);
            connection1 = new ConnectionGene(sourceNode, newNode, 1.0, true, innovation.firstInnovationNumber);
            connection2 = new ConnectionGene(newNode, targetNode, oldWeight, true, innovation.secondInnovationNumber);
        } else {
            const nextNodeId = NeatPopulation.highestNodeId + 1;
            newNode = new HiddenNode(nextNodeId, depth, activationFunction);

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
            connection1 = new ConnectionGene(sourceNode, newNode, 1.0, true, newInnovation.firstInnovationNumber);
            connection2 = new ConnectionGene(newNode, targetNode, oldWeight, true, newInnovation.secondInnovationNumber);
        }

        // We do not use the addConnection method here since we have already assigned innovation numbers to the
        // created connections.
        this.addNode(newNode, sourceNode, targetNode);
        this.connections.push(connection1);
        this.connections.push(connection2);
        this.generateNetwork();
    }

    /**
     * Transforms this NeatChromosome into a JSON representation.
     * @return Record containing most important attribute keys mapped to their values.
     */
    public toJSON(): Record<string, (number | NodeGene | ConnectionGene)> {
        const network = {};
        network['id'] = this.uID;
        network['aF'] = ActivationFunction[this.activationFunction];
        network['cM'] = this.inputConnectionMethod;

        if (this.targetFitness instanceof StatementFitnessFunction) {
            network['tf'] = this.targetFitness.getTargetNode().id;
        }

        const nodes = {};
        for (let i = 0; i < this.getAllNodes().length; i++) {
            nodes[`Node ${i}`] = this.getAllNodes()[i].toJSON();
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
