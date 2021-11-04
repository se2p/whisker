import {Chromosome} from "../../search/Chromosome";
import {List} from "../../utils/List";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {Crossover} from "../../search/Crossover";
import {Mutation} from "../../search/Mutation";
import {NodeType} from "../NetworkComponents/NodeType";
import {FitnessFunction} from "../../search/FitnessFunction";
import {ExecutionTrace} from "../../testcase/ExecutionTrace";
import assert from "assert";
import {InputNode} from "../NetworkComponents/InputNode";
import {Randomness} from "../../utils/Randomness";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {Container} from "../../utils/Container";
import {NetworkChromosomeGeneratorFullyConnected} from "../NetworkGenerators/NetworkChromosomeGeneratorFullyConnected";

export abstract class NetworkChromosome extends Chromosome {

    /**
     * Unique-ID counter.
     */
    private static _uIDCounter = 0;

    /**
     * Unique identifier.
     */
    private _uID: number;
    /**
     * Holds all nodes of a network.
     */
    private readonly _allNodes: NodeGene[];

    /**
     * Maps sprites and their respective features to the corresponding input node.
     */
    private readonly _inputNodes = new Map<string, Map<string, InputNode>>();

    /**
     * Holds all output nodes of a network.
     */
    private readonly _outputNodes: NodeGene[] = [];

    /**
     * Maps events to the corresponding classification node.
     */
    private readonly _classificationNodes = new Map<string, ClassificationNode>();

    /**
     * Maps events which take at least one parameter as input to the corresponding regression nodes.
     */
    private readonly _regressionNodes = new Map<string, RegressionNode[]>();

    /**
     * Holds all connections of a network.
     */
    private readonly _connections: ConnectionGene[];

    /**
     * The stabilize count of the network defining how often the network has to be executed in order to reach a
     * stable state.
     */
    private _stabiliseCount = 0;

    /**
     * True if this network implements at least one recurrent connection
     */
    private _isRecurrent = false;

    /**
     * Saves the execution trace during the playthrough.
     */
    private _trace: ExecutionTrace;

    /**
     * Saves the achieved coverage of the chromosome during the playthrough.
     */
    private _coverage = new Set<string>();

    /**
     * Saves the codons of the network in a similar way to other non-network chromosomes.
     * Used for transforming the network into a TestChromosome for evaluating its StatementFitness.
     */
    private _codons = new List<number>();

    /**
     * Random number generator.
     */
    protected readonly _random = Randomness.getInstance();

    /**
     * Constructs a new NetworkChromosome.
     * @param allNodes all nodes of a network.
     * @param connections the connections between the Nodes.
     * @param incrementID determines whether the id counter should be incremented after constructing this chromosome.
     */
    protected constructor(allNodes: NodeGene[], connections: ConnectionGene[], incrementID = true) {
        super();
        this._uID = NetworkChromosome._uIDCounter;
        this._allNodes = allNodes;
        this._connections = connections;
        this.generateNetwork();
        this._stabiliseCount = this.updateStabiliseCount(100);
        if (incrementID) {
            NetworkChromosome._uIDCounter++;
        }
    }

    /**
     * Deep clone of a NetworkChromosome's structure. Attributes that are not related to the network's structure
     * are initialised with default values.
     * @param incrementID determines whether the ID counter should be incremented during the cloning process.
     * @returns NetworkChromosome the cloned Network with default attribute values.
     */
    public abstract cloneStructure(incrementID: boolean): NetworkChromosome;

    /**
     * Deep clone of a NetworkChromosome using a defined list of genes.
     * @param newGenes the ConnectionGenes the network should be initialised with.
     * @returns NetworkChromosome the cloned network.
     */
    abstract cloneWith(newGenes: List<ConnectionGene>): NetworkChromosome;

    /**
     * Deep clone of a network including its structure and attributes.
     * @returns NetworkChromosome the cloned network.
     */
    abstract clone(): NetworkChromosome;

    /**
     * Adds additional input Nodes if we have encountered a new Sprite during the playthrough.
     * @param sprites a map which maps each sprite to its input feature vector.
     */
    private updateInputNodes(sprites: Map<string, Map<string, number>>): void {
        let updated = false;
        sprites.forEach((spriteFeatures, spriteKey) => {

            // Check if we have encountered a new Sprite.
            if (!this.inputNodes.has(spriteKey)) {
                updated = true;
                const spriteNodes = new Map<string, InputNode>();
                spriteFeatures.forEach((featureValue, featureKey) => {
                    const iNode = new InputNode(this.allNodes.length, spriteKey, featureKey);
                    spriteNodes.set(featureKey, iNode);
                    this.allNodes.push(iNode);
                    // By Chance we connect the new Node to the network.
                    if (this._random.nextDouble() < 0.5 ||
                        Container.config.getChromosomeGenerator() instanceof NetworkChromosomeGeneratorFullyConnected) {
                        this.connectInputNode(iNode);
                    }
                })
                this.inputNodes.set(spriteKey, spriteNodes);
            }

                // We haven't encountered a new Sprite but we still have to check if we encountered new features of a
            // Sprite.
            else {
                spriteFeatures.forEach((featureValue, featureKey) => {
                    const savedSpriteMap = this.inputNodes.get(spriteKey);
                    if (!savedSpriteMap.has(featureKey)) {
                        updated = true;
                        const iNode = new InputNode(this.allNodes.length, spriteKey, featureKey);
                        savedSpriteMap.set(featureKey, iNode);
                        this.allNodes.push(iNode);
                        // By chance or if we use fully connected networks, we connect the new Node to the network.
                        if (this._random.nextDouble() < 0.5 ||
                            Container.config.getChromosomeGenerator() instanceof NetworkChromosomeGeneratorFullyConnected) {
                            this.connectInputNode(iNode);
                        }
                    }
                })
            }
        })

        // If the network's structure has changed generate the new network and update the stabilize count.
        if (updated) {
            this.generateNetwork();
            this.updateStabiliseCount(100);
        }
    }

    /**
     * Adds additional classification/regression nodes if we have encountered a new event during the playthrough.
     * @param events a list of encountered events.
     */
    public updateOutputNodes(events: List<ScratchEvent>): void {
        let updated = false;
        for (const event of events) {
            if (!this.classificationNodes.has(event.stringIdentifier())) {
                updated = true;
                const classificationNode = new ClassificationNode(this.allNodes.length, event,
                    ActivationFunction.SIGMOID);
                this.allNodes.push(classificationNode);
                this.connectOutputNode(classificationNode);
                for (const parameter of event.getSearchParameterNames()) {
                    const regressionNode = new RegressionNode(this.allNodes.length, event, parameter,
                        ActivationFunction.NONE);
                    this.allNodes.push(regressionNode);
                    this.connectOutputNode(regressionNode);
                }
            }
        }
        // If the network's structure has changed generate the new network and update the stabilize count.
        if (updated) {
            this.generateNetwork();
            this.updateStabiliseCount(100);
        }
    }

    /**
     * Connects an input node to the network by creating a connection between the input node and all output nodes.
     * @param iNode the input node to connect.
     */
    private connectInputNode(iNode: NodeGene): void {
        for (const oNode of this.outputNodes) {
            const newConnection = new ConnectionGene(iNode, oNode, this._random.nextDoubleMinMax(-1, 1),
                true, 0, false);
            NeuroevolutionUtil.assignInnovationNumber(newConnection);
            this.connections.push(newConnection);
            oNode.incomingConnections.add(newConnection);
        }
    }

    /**
     * Connects an output node to the network by creating a connection between the output node and all input nodes.
     * @param oNode the output node to connect.
     */
    private connectOutputNode(oNode: NodeGene): void {
        for (const iNodes of this.inputNodes.values()) {
            for (const iNode of iNodes.values()) {
                const newConnection = new ConnectionGene(iNode, oNode, this._random.nextDoubleMinMax(-1, 1),
                    true, 0, false)
                NeuroevolutionUtil.assignInnovationNumber(newConnection);
                this.connections.push(newConnection);
                oNode.incomingConnections.add(newConnection);
            }
        }
    }

    /**
     * Generates the network by placing the input and output nodes in the corresponding List.
     * Furthermore, assign each node its incoming connections that are defined by the connection gene array.
     */
    public generateNetwork(): void {
        this.sortConnections();
        this.sortNodes();
        // Place the input, regression and output nodes into the corresponding Map/List.
        for (const node of this.allNodes) {

            // Add input nodes to the InputNode-Map.
            if (node instanceof InputNode) {
                if (!this.inputNodes.has(node.sprite)) {
                    const newSpriteMap = new Map<string, InputNode>();
                    newSpriteMap.set(node.feature, node);
                    this.inputNodes.set(node.sprite, newSpriteMap);
                } else if (!this.inputNodes.get(node.sprite).has(node.feature))
                    this.inputNodes.get(node.sprite).set(node.feature, node);
            }

            // Add classification nodes to the ClassificationNode-Map.
            if (node instanceof ClassificationNode) {
                if (!this.classificationNodes.has(node.event.stringIdentifier())) {
                    this.classificationNodes.set(node.event.stringIdentifier(), node);
                }
            }

            // Add Regression nodes to the RegressionNode-Map.
            if (node instanceof RegressionNode) {
                if (!this.regressionNodes.has(node.event.stringIdentifier())) {
                    const newParameterVector: RegressionNode[] = [];
                    newParameterVector.push(node);
                    this.regressionNodes.set(node.event.stringIdentifier(), newParameterVector);
                } else if (!this.regressionNodes.get(node.event.stringIdentifier()).includes(node))
                    this.regressionNodes.get(node.event.stringIdentifier()).push(node);
            }

            // Add output nodes to the OutputNode-Map.
            if (node.type === NodeType.OUTPUT && !this.outputNodes.includes(node)) {
                this.outputNodes.push(node);
            }
        }

        // Go through each connection and set up the incoming connections of each node.
        for (const connection of this.connections) {
            const targetNode = connection.target;
            // Add the connection to the incoming connections of the target node if it is not present yet and enabled.
            if (!targetNode.incomingConnections.contains(connection) && connection.isEnabled) {
                targetNode.incomingConnections.add(connection);
            }
        }
    }

    /**
     * Calculates the number of activations this networks needs in order to produce a stabilised output.
     * @param period the number of iterations each outputNode has to be stable until this network is regarded
     * stabilised.
     * @returns number of activations required to stabilise this network.
     */
    public updateStabiliseCount(period: number): number {
        this.generateNetwork();
        this.flushNodeValues();

        // Check if we have a recurrent network.
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

        // Recurrent Networks are by definition unstable.
        if (this.isRecurrent)
            return 0;

        // Activate the network repeatedly until it stabilises or we reach the defined limit.
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

        // Clean the nodes and report the stabilise count.
        this.flushNodeValues();
        const stableCount = (level - period + 1);
        this._stabiliseCount = stableCount;
        return stableCount;
    }

    /**
     * Activates the network in order to get an output in regard to the fed inputs.
     * @param inputs a map which maps each sprite to its input feature vector.
     * @returns returns true if the network generated an appropriate output as expected.
     */
    public activateNetwork(inputs: Map<string, Map<string, number>>): boolean {
        // Generate the network and load the inputs
        this.generateNetwork();
        this.setUpInputs(inputs);
        let activatedOnce = false;
        let abortCount = 0;
        let incomingValue = 0;

        // Repeatedly send the input signals through the network until at least one output node gets activated.
        while (this.outputsOff() || !activatedOnce) {
            abortCount++;
            if (abortCount >= 100) {
                return false;
            }

            // For each node compute the sum of its incoming connections.
            for (const node of this.allNodes) {
                if (node.type !== NodeType.INPUT && node.type !== NodeType.BIAS) {

                    // Reset the activation Flag and the activation value.
                    node.nodeValue = 0.0;
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

            // Activate all the non-input nodes.
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
     * Load the given inputs into the input nodes of the network.
     * @param inputs a map which maps each sprite to its input feature vector.
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
     * Flushes all saved node and activation values from the nodes of the network.
     */
    flushNodeValues(): void {
        for (const node of this.allNodes) {
            node.reset();
        }
    }

    /**
     * Checks if at least one output node has been activated.
     * @return true if not a single output node has been activated at least once.
     */
    private outputsOff(): boolean {
        let activatedOnce = true
        this.outputNodes
        for (const outputNode of this.outputNodes) {
            if (outputNode.activationCount !== 0)
                activatedOnce = false;
        }
        return activatedOnce;
    }

    /**
     * Checks if the network is a recurrent network and if the given path has some recurrency in it.
     * @param node1 the source node of the path.
     * @param node2 the target node of the path.
     * @param level the depth of the recursion.
     * @param threshold after which depth we stop the recursion check.
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
     * Sorts the nodes of this network according to their types.
     */
    private sortNodes(): void {
        this.allNodes.sort((a, b) => a.type - b.type);
    }

    /**
     * Sorts the connections of this network according to their innovation numbers.
     */
    private sortConnections(): void {
        this.connections.sort((a, b) => a.innovation - b.innovation);
    }

    /**
     * Returns the number of events this network has executed.
     * @returns number of executed events.
     */
    public getNumEvents(): number {
        assert(this._trace != null);
        return this._trace.events.size();
    }

    toString(): string {
        let outputString = 'NodeGenes: \n';
        for (const node of this.allNodes) {
            outputString += node.toString() + '\n';
        }
        outputString += 'ConnectionGenes: \n';
        for (const connection of this.connections) {
            outputString += connection.toString() + '\n';
        }
        return outputString;
    }

    /**
     * Transforms this NetworkChromosome into a JSON representation.
     * @return Record containing most important attribute keys mapped to their values.
     */
    public abstract toJSON(): Record<string, (number | NodeGene | ConnectionGene)>;

    getLength(): number {
        return this._codons.size();
    }

    abstract getCrossoverOperator(): Crossover<this>;

    abstract getMutationOperator(): Mutation<this>;

    get uID(): number {
        return this._uID;
    }

    set uID(value: number) {
        this._uID = value;
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

    get stabiliseCount(): number {
        return this._stabiliseCount;
    }

    set stabiliseCount(value: number) {
        this._stabiliseCount = value;
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

    set codons(value: List<number>) {
        this._codons = value;
    }

    get isRecurrent(): boolean {
        return this._isRecurrent;
    }

    set isRecurrent(value: boolean) {
        this._isRecurrent = value;
    }
}
