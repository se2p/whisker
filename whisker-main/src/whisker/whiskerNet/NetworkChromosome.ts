import {Chromosome} from "../search/Chromosome";
import {NodeGene} from "./NetworkNodes/NodeGene";
import {ConnectionGene} from "./ConnectionGene";
import {Crossover} from "../search/Crossover";
import {Mutation} from "../search/Mutation";
import {NodeType} from "./NetworkNodes/NodeType";
import {FitnessFunction} from "../search/FitnessFunction";
import {ExecutionTrace} from "../testcase/ExecutionTrace";
import {Species} from "./NeuroevolutionPopulations/Species";
import assert from "assert";
import {InputNode} from "./NetworkNodes/InputNode";
import {Randomness} from "../utils/Randomness";
import {NeuroevolutionUtil} from "./NeuroevolutionUtil";
import {RegressionNode} from "./NetworkNodes/RegressionNode";
import {ClassificationNode} from "./NetworkNodes/ClassificationNode";
import {ScratchEvent} from "../testcase/events/ScratchEvent";
import {ActivationFunction} from "./NetworkNodes/ActivationFunction";

export class NetworkChromosome extends Chromosome {

    /**
     * Id Counter
     */
    public static idCounter = 0;

    /**
     * Unique identifier
     */
    private _id: number;
    /**
     * Holds all nodes of a Network
     */
    private readonly _allNodes: NodeGene[];

    /**
     * Holds all input nodes of a network mapped to the corresponding sprite.
     */
    private readonly _inputNodes: Map<string, Map<string, InputNode>>;

    /**
     * Holds all output nodes of a network
     */
    private readonly _outputNodes: NodeGene[];

    /**
     * Maps events to the corresponding classification Node
     */
    private readonly _classificationNodes: Map<string, ClassificationNode>;

    /**
     * Maps events which take at least one parameter as input to the corresponding regression Nodes
     */
    private readonly _regressionNodes: Map<string, RegressionNode[]>

    /**
     * Holds all connections of a network
     */
    private readonly _connections: ConnectionGene[];

    /**
     * Defines the crossover operator of the chromosome
     */
    private readonly _crossoverOp: Crossover<NetworkChromosome>

    /**
     * Defines the mutation operator of the chromosome
     */
    private readonly _mutationOp: Mutation<NetworkChromosome>

    /**
     * The non-shared fitness value of the chromosome
     */
    private _networkFitness: number

    /**
     * Shared fitness value of the chromosome
     */
    private _sharedFitness: number

    /**
     * The species this network belongs to
     */
    private _species: Species<NetworkChromosome>

    /**
     * Marks the best member of a species
     */
    private _isSpeciesChampion: boolean;

    /**
     * Marks the best member of the whole population
     */
    private _isPopulationChampion: boolean

    /**
     * Defines if this network should be used as a parent within its species.
     */
    private _hasDeathMark: boolean;

    /**
     * The number of offspring this network is allowed to produce.
     */
    private _expectedOffspring: number

    /**
     * The number of additional offspring the population champion is allowed to produce
     */
    private _numberOffspringPopulationChamp: number;

    /**
     * Saves the execution trace during the playthrough
     */
    private _trace: ExecutionTrace;

    /**
     * Saves the achieved coverage of the chromosome during the playthrough.
     */
    private _coverage: Set<string>;

    /**
     * Saves the codons of the network in a similar way to other non-Network chromosomes.
     * Used for transforming the network into a TestChromosome for evaluating its StatementFitness
     */
    private _codons: number[];

    /**
     * True if this network implements at least one recurrent connection
     */
    private _isRecurrent: boolean;

    /**
     * True if this network has loop in its connections (should not happen)
     */
    private _hasLoop: boolean;

    /**
     * Random number generator
     */
    private readonly _random: Randomness;

    /**
     * Constructs a new NetworkChromosome
     * @param connections the connections between the Nodes
     * @param allNodes all the nodes of a Chromosome
     * @param crossoverOp the crossover Operator
     * @param mutationOp the mutation Operator
     */
    constructor(connections: ConnectionGene[], allNodes: NodeGene[],
                mutationOp: Mutation<NetworkChromosome>, crossoverOp: Crossover<NetworkChromosome>) {
        super();
        this._id = NetworkChromosome.idCounter;
        this._allNodes = allNodes;
        this._inputNodes = new Map<string, Map<string, InputNode>>();
        this._outputNodes = [];
        this._classificationNodes = new Map<string, ClassificationNode>();
        this._regressionNodes = new Map<string, RegressionNode[]>();
        this._connections = connections;
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
        this._networkFitness = 0;
        this._sharedFitness = 0;
        this._species = null;
        this._isSpeciesChampion = false;
        this._isPopulationChampion = false;
        this._hasDeathMark = false;
        this._expectedOffspring = 0;
        this._numberOffspringPopulationChamp = 0;
        this._trace = null;
        this._coverage = new Set<string>();
        this._codons = [];
        this._isRecurrent = false;
        this._hasLoop = false;
        this._random = Randomness.getInstance();
        this.generateNetwork();
    }

    /**
     * Deep clone of a NetworkChromosome's structure. Attributes which are not related to the Network's structure
     * are initialised by the constructor.
     * @param doIncrementIdCounter determines whether the ID counter should be incremented during cloning.
     * @returns NetworkChromosome the cloned Network.
     */
    cloneStructure(doIncrementIdCounter = true): NetworkChromosome {
        return this.cloneWith(this.connections, doIncrementIdCounter)
    }

    /**
     * Deep clone of a NetworkChromosome using a defined list of genes.
     * @param newGenes the ConnectionGenes the network should be initialised with.
     * @param doIncrementIdCounter determines whether the ID counter should be incremented during cloning.
     * @returns NetworkChromosome the cloned network.
     */
    cloneWith(newGenes: ConnectionGene[], doIncrementIdCounter = true): NetworkChromosome {
        const connectionsClone: ConnectionGene[] = [];
        const nodesClone: NodeGene[] = [];

        // duplicate Nodes
        for (const node of this.allNodes) {
            const nodeClone = node.clone()
            nodesClone.push(nodeClone);
        }

        // duplicate connections
        for (const connection of newGenes) {
            const fromNode = NetworkChromosome.searchNode(connection.source, nodesClone)
            const toNode = NetworkChromosome.searchNode(connection.target, nodesClone)
            const connectionClone = connection.cloneWithNodes(fromNode, toNode);
            connectionsClone.push(connectionClone);
        }
        if (doIncrementIdCounter) {
            NetworkChromosome.idCounter++;
        }
        return new NetworkChromosome(connectionsClone, nodesClone, this.getMutationOperator(), this.getCrossoverOperator());
    }

    /**
     * Deep Clone of a Network including its structure and attributes.
     */
    clone(): NetworkChromosome {
        const clone = this.cloneStructure(false);
        clone.id = this.id;
        clone.trace = this.trace;
        clone.coverage = this.coverage;
        clone.networkFitness = this.networkFitness;
        clone.sharedFitness = this.sharedFitness;
        clone.species = this.species;
        clone.isSpeciesChampion = this.isSpeciesChampion;
        clone.isPopulationChampion = this.isPopulationChampion;
        clone.hasDeathMark = this.hasDeathMark;
        clone.expectedOffspring = this.expectedOffspring;
        clone.isRecurrent = this.isRecurrent;
        return clone;
    }

    /**
     * Adds additional input Nodes if we have encountered a new Sprite during the playthrough
     * @param sprites a map which maps each sprite to its input feature vector
     */
    private updateInputNodes(sprites: Map<string, Map<string, number>>): void {
        let updated = false;
        sprites.forEach((spriteFeatures, spriteKey) => {
            // Check if we have encountered a new Sprite
            if (!this.inputNodes.has(spriteKey)) {
                updated = true;
                const spriteNodes = new Map<string, InputNode>();
                spriteFeatures.forEach((featureValue, featureKey) => {
                    const iNode = new InputNode(this.allNodes.length, spriteKey, featureKey);
                    spriteNodes.set(featureKey, iNode);
                    this.allNodes.push(iNode);
                    // By Chance we connect the new Node to the network.
                    if (this._random.nextDouble() < 0.5) {
                        this.connectInputNode(iNode);
                    }
                })
                this.inputNodes.set(spriteKey, spriteNodes);
            }
            // We haven't encountered a new sprite but we still have to check if we encountered new features of a sprite.
            else {
                spriteFeatures.forEach((featureValue, featureKey) => {
                    const savedSpriteMap = this.inputNodes.get(spriteKey);
                    if (!savedSpriteMap.has(featureKey)) {
                        updated = true;
                        const iNode = new InputNode(this.allNodes.length, spriteKey, featureKey);
                        savedSpriteMap.set(featureKey, iNode);
                        this.allNodes.push(iNode);
                        // By Chance we connect the new Node to the network.
                        if (this._random.nextDouble() < 0.5) {
                            this.connectInputNode(iNode);
                        }
                    }
                })
            }
        })
        if (updated) {
            this.generateNetwork();
        }
    }

    /**
     * Adds additional classification/regression Nodes if we have encountered a new Event during the playthrough
     * @param events a list of encountered events
     */
    public updateOutputNodes(events: ScratchEvent[]): void {
        let updated = false;
        for (const event of events) {
            if (!this.classificationNodes.has(event.stringIdentifier())) {
                updated = true;
                const classificationNode = new ClassificationNode(this.allNodes.length, event, ActivationFunction.SIGMOID);
                this.allNodes.push(classificationNode);
                this.connectOutputNode(classificationNode);
                for (const parameter of event.getSearchParameterNames()) {
                    const regressionNode = new RegressionNode(this.allNodes.length, event, parameter, ActivationFunction.NONE)
                    this.allNodes.push(regressionNode);
                    this.connectOutputNode(regressionNode);
                }
            }
        }
        if (updated)
            this.generateNetwork();
    }

    /**
     * Connects an inputNode to the Network by creating a connection between the inputNode and all outputNodes
     * @param iNode the inputNode to connect
     */
    private connectInputNode(iNode: NodeGene): void {
        for (const oNode of this.outputNodes) {
            const newConnection = new ConnectionGene(iNode, oNode, this._random.nextDoubleMinMax(-1, 1), true, 0, false)
            NeuroevolutionUtil.assignInnovationNumber(newConnection);
            this.connections.push(newConnection)
            oNode.incomingConnections.push(newConnection);
        }
    }

    /**
     * Connects an outputNode to the Network by creating a connection between the outputNode and all inputNodes
     * @param oNode the outputNode to connect
     */
    private connectOutputNode(oNode: NodeGene): void {
        for (const iNodes of this.inputNodes.values()) {
            for (const iNode of iNodes.values()) {
                const newConnection = new ConnectionGene(iNode, oNode, this._random.nextDoubleMinMax(-1, 1), true, 0, false)
                NeuroevolutionUtil.assignInnovationNumber(newConnection);
                this.connections.push(newConnection)
                oNode.incomingConnections.push(newConnection);
            }
        }
    }

    /**
     * Generates the network by placing the Input and Output nodes in the corresponding List.
     * Furthermore, assign each node its incoming connections defined by the connectionGene List.
     */
    public generateNetwork(): void {
        this.sortConnections();
        this.sortNodes();
        // Place the input, regression and output nodes into the corresponding Map/List
        for (const node of this.allNodes) {
            // Add input nodes to the InputNode-Map
            if (node instanceof InputNode) {
                if (!this.inputNodes.has(node.sprite)) {
                    const newSpriteMap = new Map<string, InputNode>();
                    newSpriteMap.set(node.feature, node);
                    this.inputNodes.set(node.sprite, newSpriteMap);
                } else if (!this.inputNodes.get(node.sprite).has(node.feature))
                    this.inputNodes.get(node.sprite).set(node.feature, node);
            }
            // Add classification nodes to the Classification-Map
            if (node instanceof ClassificationNode) {
                if (!this.classificationNodes.has(node.event.stringIdentifier())) {
                    this.classificationNodes.set(node.event.stringIdentifier(), node);
                }
            }
            // Add Regression nodes to the RegressionNode-Map
            if (node instanceof RegressionNode) {
                if (!this.regressionNodes.has(node.event.stringIdentifier())) {
                    const newParameterVector = [];
                    newParameterVector.push(node);
                    this.regressionNodes.set(node.event.stringIdentifier(), newParameterVector);
                } else if (!this.regressionNodes.get(node.event.stringIdentifier()).includes(node))
                    this.regressionNodes.get(node.event.stringIdentifier()).push(node);
            }
            // Add output nodes to the OutputNode-Map
            if (node.type === NodeType.OUTPUT && !this.outputNodes.includes(node))
                this.outputNodes.push(node);

        }

        // Go through each connection and set up the incoming connections of each Node
        for (const connection of this.connections) {
            const toNode = connection.target;
            // Add the connection to the incoming connections of the toNode if it is not present yet and isEnabled
            if (!toNode.incomingConnections.includes(connection) && connection.isEnabled) {
                toNode.incomingConnections.push(connection);
            }
        }
    }

    /**
     * Calculates the number of activations this networks needs in order to produce a stabilised output.
     * @param period the number of iterations each outputNode has to be stable until this network is treated stabilised
     * @return the number of activations needed to stabilise this network.
     */
    public stabilizedCounter(period: number): number {
        this.generateNetwork();
        this.flushNodeValues();

        // Double Check if we really don't have a recurrent network
        if (!this.isRecurrent) {
            for (const connection of this.connections) {
                if (connection.isRecurrent && connection.isEnabled) {
                    this.isRecurrent = true;
                }
            }
        }

        let done = false;
        let rounds = 0;
        let stableCounter = 0;
        let level = 0;
        const limit = period + 90;

        // Recurrent Networks are by definition unstable; limit activations should be enough for the first activation
        if (this.isRecurrent)
            return limit;

        // activate the network repeatedly until it stabilises or we reach the defined limit
        while (!done) {

            // Network is unstable!
            if (rounds >= limit) {
                return -1;
            }

            // Activate network with some input values.
            const inputs = new Map<string, Map<string, number>>();
            this.inputNodes.forEach((sprite, k) => {
                const spriteFeatures = new Map<string, number>();
                sprite.forEach((featureNode, featureKey) => {
                    spriteFeatures.set(featureKey, 1);
                })
                inputs.set(k, spriteFeatures);
            })
            this.activateNetwork(inputs);

            // If our output nodes got activated check if they changed their values.
            if (!this.outputsOff()) {

                let hasChanged = false;
                for (const oNode of this.outputNodes) {
                    if (oNode.lastActivationValue !== oNode.activationValue) {
                        hasChanged = true;
                        break;
                    }
                }
                if (!hasChanged) {
                    stableCounter++;
                    if (stableCounter >= period) {
                        done = true;
                        level = rounds;
                        break;
                    }
                } else {
                    stableCounter = 0;
                }
            }
            rounds++;
        }
        this.flushNodeValues();
        return (level - period + 1);
    }

    /**
     * Activates the network in order to get an output corresponding to the fed inputs.
     * @param inputs a map which maps each sprite to its input feature vector
     * @return returns true if everything went well.
     */
    public activateNetwork(inputs: Map<string, Map<string, number>>): boolean {
        // Generate the network and load the inputs
        this.generateNetwork();
        this.setUpInputs(inputs);
        let activatedOnce = false;
        let abortCount = 0;
        let incomingValue = 0;

        while (this.outputsOff() || !activatedOnce) {
            abortCount++;
            if (abortCount >= 100) {
                return false
            }

            // For each node compute the sum of its incoming connections
            for (const node of this.allNodes) {
                if (node.type !== NodeType.INPUT && node.type !== NodeType.BIAS) {

                    // Reset the activation Flag and the activation value
                    node.nodeValue = 0.0
                    node.activatedFlag = false;

                    for (const connection of node.incomingConnections) {
                        incomingValue = connection.weight * connection.source.activationValue;
                        if (connection.source.activatedFlag) {
                            node.activatedFlag = true;
                        }
                        node.nodeValue += incomingValue;
                    }
                }
            }

            // Activate all the non-sensor nodes by their node values
            for (const node of this.allNodes) {
                if (node.type !== NodeType.INPUT && node.type !== NodeType.BIAS) {
                    // Only activate if we received some input
                    if (node.activatedFlag) {
                        node.lastActivationValue = node.activationValue;
                        node.activationValue = node.getActivationValue();
                        node.activationCount++;
                    }
                }
            }
            activatedOnce = true;
        }
        return true;
    }

    /**
     * Load the given inputs into the inputNodes of the network
     * @param inputs a map which maps each sprite to its input feature vector
     */
    private setUpInputs(inputs: Map<string, Map<string, number>>): void {
        // First check if we encountered new nodes.
        this.updateInputNodes(inputs);
        inputs.forEach((spriteValue, spriteKey) => {
            spriteValue.forEach((featureValue, featureKey) => {
                const iNode = this.inputNodes.get(spriteKey).get(featureKey);
                iNode.activationCount++;
                iNode.activatedFlag = true;
                iNode.nodeValue = featureValue;
                iNode.activationValue = featureValue;
            })
        })
    }

    /**
     * Flushes all saved node and activation values from the nodes of the network
     */
    flushNodeValues(): void {
        for (const node of this.allNodes) {
            node.reset();
        }
    }

    /**
     * Checks if at least one output node has been activated
     * @return true if all output nodes are deactivated
     */
    private outputsOff(): boolean {
        let activatedOnce = true
        for (const outputNode of this.outputNodes) {
            if (outputNode.activationCount !== 0)
                activatedOnce = false;
        }
        return activatedOnce;
    }

    /**
     * Checks if the network is a recurrent network and if the given path has some recurrency in it.
     * @param node1 the source node of the path
     * @param node2 the target node of the path
     * @param level the depth of the recursion
     * @param threshold after which depth we exit the recursion
     * @return true if the path is a recurrent one.
     */
    public isRecurrentPath(node1: NodeGene, node2: NodeGene, level: number, threshold: number): boolean {
        this.generateNetwork();

        if (level === 0) {
            // Reset the traverse flag
            for (const node of this.allNodes)
                node.traversed = false;
        }

        // if the source node is in the output layer it has to be a recurrent connection!
        if (node1.type === NodeType.OUTPUT) {
            return true;
        }

        level++;

        if (level > threshold) {
            return false;
        }

        // If we end up in node1 again we found a recurrent path.
        if (node1 === node2) {
            return true;
        }

        for (const inConnection of node1.incomingConnections) {
            if (!inConnection.isRecurrent) {
                if (!inConnection.source.traversed) {
                    inConnection.source.traversed = true;
                    if (this.isRecurrentPath(inConnection.source, node2, level, threshold)) {
                        return true;
                    }
                }
            }
        }
        node1.traversed = true;
        return false;
    }

    /**
     * Searches a given node from a node List using the equals operator
     * @param node the node we search for
     * @param allNodes the List in which we search the given node
     * @return the equal node of the node List
     */
    private static searchNode(node: NodeGene, allNodes: NodeGene[]): NodeGene {
        for (const n of allNodes)
            if (n.equals(node))
                return n;
        return null;
    }

    /**
     * Sorts the nodes of this network according to its types.
     */
    private sortNodes(): void {
        this.allNodes.sort((a, b) => a.type - b.type);
    }

    /**
     * Sorts the connections of this network according to its innovation numbers.
     */
    private sortConnections(): void {
        this.connections.sort((a, b) => a.innovation - b.innovation);
    }

    /**
     * Returns the number of events this network has executed. (Needed for WhiskerTest class)
     */
    public getNumEvents(): number {
        assert(this._trace != null);
        return this._trace.events.length;
    }

    toString(): string {
        return "Genome:\nNodeGenes: " + this.allNodes + "\nConnectionGenes: " + this.connections;
    }

    /**
     * Transforms this NetworkChromosome into a JSON representation.
     * @return Record containing most important attributes keys mapped to their values.
     */
    public toJSON(): Record<string, (number | NodeGene | ConnectionGene)> {
        const network = {};
        network[`Id`] = this.id;
        network[`NetworkFitness`] = this.networkFitness;
        network[`FitnessShared`] = this.sharedFitness;
        network[`ExpectedOffspring`] = this.expectedOffspring;
        network[`DeathMark`] = this.hasDeathMark;
        for (let i = 0; i < this.allNodes.length; i++) {
            network[`Node ${i}`] = this.allNodes[i].toJSON();
        }
        for (let i = 0; i < this.connections.length; i++) {
            network[`Connection ${i}`] = this.connections[i].toJSON();
        }
        return network;
    }

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    getLength(): number {
        return this._codons.length;
    }

    getCrossoverOperator(): Crossover<this> {
        return this._crossoverOp as Crossover<this>;
    }

    getMutationOperator(): Mutation<this> {
        return this._mutationOp as Mutation<this>;
    }

    getFitness(fitnessFunction: FitnessFunction<this>): number {
        if (this._fitnessCache.has(fitnessFunction)) {
            return this._fitnessCache.get(fitnessFunction);
        } else {
            const fitness = fitnessFunction.getFitness(this);
            this._fitnessCache.set(fitnessFunction, fitness);
            return fitness;
        }
    }

    get inputNodes(): Map<string, Map<string, InputNode>> {
        return this._inputNodes;
    }

    get outputNodes(): NodeGene[] {
        return this._outputNodes;
    }

    get classificationNodes(): Map<string, ClassificationNode> {
        return this._classificationNodes;
    }

    get regressionNodes(): Map<string, RegressionNode[]> {
        return this._regressionNodes;
    }

    get allNodes(): NodeGene[] {
        return this._allNodes;
    }

    get trace(): ExecutionTrace {
        return this._trace;
    }

    set trace(value: ExecutionTrace) {
        this._trace = value;
    }

    get coverage(): Set<string> {
        return this._coverage;
    }

    set coverage(value: Set<string>) {
        this._coverage = value;
    }

    get connections(): ConnectionGene[] {
        return this._connections;
    }

    set sharedFitness(value: number) {
        this._sharedFitness = value;
    }

    get sharedFitness(): number {
        return this._sharedFitness
    }

    get networkFitness(): number {
        return this._networkFitness;
    }

    set networkFitness(value: number) {
        this._networkFitness = value;
    }

    get isSpeciesChampion(): boolean {
        return this._isSpeciesChampion;
    }

    set isSpeciesChampion(value: boolean) {
        this._isSpeciesChampion = value;
    }

    get hasDeathMark(): boolean {
        return this._hasDeathMark;
    }

    set hasDeathMark(value: boolean) {
        this._hasDeathMark = value;
    }

    get expectedOffspring(): number {
        return this._expectedOffspring;
    }

    set expectedOffspring(value: number) {
        this._expectedOffspring = value;
    }

    get isPopulationChampion(): boolean {
        return this._isPopulationChampion;
    }

    set isPopulationChampion(value: boolean) {
        this._isPopulationChampion = value;
    }

    get numberOffspringPopulationChamp(): number {
        return this._numberOffspringPopulationChamp;
    }

    set numberOffspringPopulationChamp(value: number) {
        this._numberOffspringPopulationChamp = value;
    }

    get species(): Species<NetworkChromosome> {
        return this._species;
    }

    set species(value: Species<NetworkChromosome>) {
        this._species = value;
    }

    get codons(): number[] {
        return this._codons;
    }

    set codons(value: number[]) {
        this._codons = value;
    }

    get isRecurrent(): boolean {
        return this._isRecurrent;
    }

    set isRecurrent(value: boolean) {
        this._isRecurrent = value;
    }
}
