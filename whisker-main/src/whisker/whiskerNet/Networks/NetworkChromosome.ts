import {Chromosome} from "../../search/Chromosome";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {NodeType} from "../NetworkComponents/NodeType";
import {FitnessFunction} from "../../search/FitnessFunction";
import {ExecutionTrace} from "../../testcase/ExecutionTrace";
import assert from "assert";
import {InputNode} from "../NetworkComponents/InputNode";
import {Randomness} from "../../utils/Randomness";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {ActivationTrace} from "../Misc/ActivationTrace";
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
import {name} from "ntc";
import {BiasNode} from "../NetworkComponents/BiasNode";
import {Container} from "../../utils/Container";

export abstract class NetworkChromosome extends Chromosome {

    /**
     * Unique-ID counter.
     */
    public static _uIDCounter = 0;

    /**
     * Unique identifier.
     */
    private _uID: number;

    /**
     * Maps sprites and their respective features to the corresponding input node.
     */
    private readonly _inputNodes = new Map<string, Map<string, InputNode>>();

    /**
     * Holds all output nodes of a network.
     */
    protected readonly _outputNodes: NodeGene[] = [];

    /**
     * Maps events to the corresponding classification node.
     */
    protected readonly _classificationNodes = new Map<string, ClassificationNode>();

    /**
     * Maps events which take at least one parameter as input to the corresponding regression nodes.
     */
    protected readonly _regressionNodes = new Map<string, RegressionNode[]>();

    /**
     * True if this network implements at least one recurrent connection
     */
    private _isRecurrent = false;

    /**
     * Reference activation trace serving as the ground truth.
     */
    private _referenceActivationTrace: ActivationTrace;

    /**
     * Test activation trace which will be compared to the reference to detect deviating program behaviour.
     */
    private _testActivationTrace: ActivationTrace;

    /**
     * Determines whether an ActivationTrace and uncertainty values should be recorded during a playthrough.
     */
    private _recordNetworkStatistics = false;

    /**
     * The average surprise value across all steps calculated between pairs of nodes.
     */
    private _averageNodeBasedLSA = 0;

    /**
     * Counts the number of surprising node activations.
     */
    private _surpriseCount = 0;

    /**
     * A set of suspicious sprites that caused the surprise count to rise.
     */
    private _suspiciousMutantReasons = new Set<string>()

    /**
     * Maps Scratch steps to the uncertainty values observed during the execution of a sample program.
     */
    private _referenceUncertainty = new Map<number, number>();

    /**
     * Maps Scratch steps to the uncertainty values observed during the test execution.
     * */
    private _testUncertainty = new Map<number, number>();

    /**
     * Maps each uncovered target statement to the number of times it has been covered using different seeds.
     */
    private _openStatementTargets: Map<FitnessFunction<NetworkChromosome>, number>;

    /**
     * The fitness value of the network.
     */
    private _fitness = 0;

    /**
     * The achieved score of a network.
     */
    private _score = 0;

    /**
     * The time a network has been playing a game.
     */
    private _playTime = 0;

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
    private _codons: number[] = [];

    /**
     * Random number generator.
     */
    protected readonly _random = Randomness.getInstance();

    /**
     * Constructs a new NetworkChromosome.
     * @param _allNodes all nodes of a network.
     * @param _connections the connections between the Nodes.
     * @param _inputConnectionMethod determines how novel nodes are being connected to the input layer.
     * @param _activationFunction the activation function that will be used for hidden nodes.
     * @param incrementID determines whether the id counter should be incremented after constructing this chromosome.
     */
    protected constructor(protected readonly _allNodes: NodeGene[],
                          protected readonly _connections: ConnectionGene[],
                          protected readonly _inputConnectionMethod: InputConnectionMethod,
                          protected readonly _activationFunction = ActivationFunction.TANH,
                          incrementID = true) {
        super();
        this._uID = NetworkChromosome._uIDCounter;
        this.generateNetwork();
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
    public abstract cloneStructure(incrementID: boolean);

    /**
     * Clones the network during the test execution process.
     */
    public abstract cloneAsTestCase();

    /**
     * Deep clone of a NetworkChromosome using a defined list of genes.
     * @param newGenes the ConnectionGenes the network should be initialised with.
     * @returns NetworkChromosome the cloned network.
     */
    abstract cloneWith(newGenes: ConnectionGene[]);

    /**
     * Deep clone of a network including its structure and attributes.
     * @returns NetworkChromosome the cloned network.
     */
    abstract clone();

    /**
     * Determines how a novel connection is added to the network.
     * @param connection the connection to add.
     */
    public abstract addConnection(connection: ConnectionGene): void;

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
                    const featureID = `I:${spriteKey}-${featureKey}`;
                    const id = NetworkChromosome.getNonHiddenNodeId(featureID);
                    const iNode = new InputNode(id, spriteKey, featureKey);
                    spriteNodes.set(featureKey, iNode);
                    this._allNodes.push(iNode);
                });
                this.inputNodes.set(spriteKey, spriteNodes);
            } else {
                // We haven't encountered a new Sprite, but we still have to check
                // if we encountered new features of a Sprite.
                spriteFeatures.forEach((featureValue, featureKey) => {
                    const savedSpriteMap = this.inputNodes.get(spriteKey);
                    if (!savedSpriteMap.has(featureKey)) {
                        updated = true;
                        const featureID = `I:${spriteKey}-${featureKey}`;
                        const id = NetworkChromosome.getNonHiddenNodeId(featureID);
                        const iNode = new InputNode(id, spriteKey, featureKey);
                        savedSpriteMap.set(featureKey, iNode);
                        this._allNodes.push(iNode);
                    }
                });
            }
        });

        // If the network's structure has changed re-generate the new network.
        if (updated) {
            this.generateNetwork();
        }
    }

    /**
     * Adds additional classification/regression nodes if we have encountered a new event during the playthrough.
     * @param events a list of encountered events.
     */
    public updateOutputNodes(events: ScratchEvent[]): void {
        let updated = false;
        for (const event of events) {
            if (!this.classificationNodes.has(event.stringIdentifier())) {
                updated = true;
                const featureID = `C:${event.stringIdentifier()}`;
                const id = NetworkChromosome.getNonHiddenNodeId(featureID);
                const classificationNode = new ClassificationNode(id, event, ActivationFunction.NONE);
                this._allNodes.push(classificationNode);
                this.connectNodeToInputLayer([classificationNode], this.inputNodes, this._inputConnectionMethod);
            }
            // Check if we also have to add regression nodes.
            if (!this.regressionNodes.has(event.stringIdentifier()) && event.numSearchParameter() > 0) {
                updated = true;
                for (const parameter of event.getSearchParameterNames()) {
                    const featureID = `R:${event.stringIdentifier()}-${parameter}`;
                    const id = NetworkChromosome.getNonHiddenNodeId(featureID);
                    const regressionNode = new RegressionNode(id, event, parameter, ActivationFunction.NONE);
                    this._allNodes.push(regressionNode);
                    this.connectNodeToInputLayer([regressionNode], this.inputNodes, this._inputConnectionMethod);
                }
            }
        }
        // If the network's structure has changed re-generate the new network.
        if (updated) {
            this.generateNetwork();
        }
    }

    /**
     * Connects nodes to the specified input nodes using defined mode to connect the nodes.
     * @param nodesToConnect the nodes that should be connected to the input layer.
     * @param inputNodes defines the input nodes that should be connected to the node.
     * @param mode determines how the input layer should be connected to the given nodes.
     */
    public abstract connectNodeToInputLayer(nodesToConnect: NodeGene[],
                                               inputNodes: Readonly<Map<string, Map<string, InputNode | BiasNode>>>,
                                               mode:InputConnectionMethod): void;

    /**
     * Fetches the ID of a functional Node, i.e. a non-Hidden node.
     * @param featureID the featureID of the node whose id should be extracted.
     * @returns the found ID.
     */
    private static getNonHiddenNodeId(featureID: string): number {
        if (NeatPopulation.nodeToId.has(featureID)) {
            return NeatPopulation.nodeToId.get(featureID);
        } else {
            const id = NeatPopulation.highestNodeId + 1;
            NeatPopulation.nodeToId.set(featureID, id);
            return id;
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
        for (const node of this._allNodes) {

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
        for (const connection of this._connections) {
            const targetNode = connection.target;
            // Add the connection to the incoming connections of the target node if it is not present yet and enabled.
            if (!targetNode.incomingConnections.includes(connection) && connection.isEnabled) {
                targetNode.incomingConnections.push(connection);
            }
        }
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
        let activationCount = 0;
        let incomingValue = 0;
        this.outputNodes.forEach(node => node.activatedFlag = false);

        // Repeatedly send the input signals through the network until at least one output node gets activated.
        while (this.outputsOff() || activationCount < 0) {
            activationCount++;

            // We may have a defect network if none of the activated input nodes has a valid path to an output node.
            if (activationCount == 20) {
                Container.debugLog("Defect network");
                return false;
            }

            // For each node compute the sum of its incoming connections.
            for (const node of this._allNodes) {
                if (node.type !== NodeType.INPUT && node.type !== NodeType.BIAS) {

                    // Reset the activation Flag and the node value.
                    node.nodeValue = 0.0;
                    node.activatedFlag = false;

                    for (const connection of node.incomingConnections) {

                        // Do not include disabled connections or connections coming from deactivated inputs.
                        if (!connection.isEnabled || (connection.source.type === NodeType.INPUT && !connection.source.activatedFlag)) {
                            continue;
                        }

                        // Handle time delayed connections.
                        if (connection.isRecurrent) {
                            incomingValue = connection.weight * connection.source.lastActivationValue;
                            node.nodeValue += incomingValue;
                        } else {
                            incomingValue = connection.weight * connection.source.activationValue;
                            if (connection.source.activatedFlag) {
                                node.activatedFlag = true;
                            }
                            node.nodeValue += incomingValue;
                        }
                    }
                }
            }

            // Activate all the non-input nodes based on their incoming activations   .
            for (const node of this._allNodes) {
                if (node.type !== NodeType.INPUT) {
                    // Only activate if we received some input
                    if (node.activatedFlag) {
                        // Keep track of previous activations
                        node.lastActivationValue = node.activationValue;
                        node.activationValue = node.activate();
                        node.activationCount++;
                    }
                }
            }
        }
        return true;
    }

    /**
     * Calculates the maximum depth of this network by traversing from each output node to the input nodes.
     * @returns depth of network.
     */
    public getMaxDepth(): number {
        let currentDepth: number;
        let maxDepth = 0;

        // Start at each output node and determine its maximum depth.
        for (const outNode of this.outputNodes) {
            currentDepth = outNode.depth(0);
            if (currentDepth > maxDepth) {
                maxDepth = currentDepth;
            }
        }

        return maxDepth;
    }

    /**
     * Load the given inputs into the input nodes of the network.
     * @param inputs a map which maps each sprite to its input feature vector.
     */
    public setUpInputs(inputs: Map<string, Map<string, number>>): void {

        // Reset the input nodes' activation flag to only use inputs during activation for which we collected values.
        for (const iNodeMap of this.inputNodes.values()) {
            for (const iNode of iNodeMap.values()) {
                iNode.activatedFlag = false;
            }
        }
        this.updateInputNodes(inputs);
        inputs.forEach((spriteValue, spriteKey) => {
            spriteValue.forEach((featureValue, featureKey) => {
                const iNode = this.inputNodes.get(spriteKey).get(featureKey);
                if (iNode) {
                    iNode.lastActivationValue = iNode.activationValue;
                    iNode.activationCount++;
                    iNode.activatedFlag = true;
                    iNode.nodeValue = featureValue;
                    iNode.activationValue = featureValue;
                }
            });
        });
    }

    /**
     * Flushes all saved node and activation values from the nodes of the network.
     */
    flushNodeValues(): void {
        for (const node of this._allNodes) {
            node.reset();
        }
    }

    /**
     * Checks if at least one output node has been activated.
     * @return true if not a single output node has been activated at least once.
     */
    private outputsOff(): boolean {
        return this.outputNodes.every(node => !node.activatedFlag || node.nodeValue === 0);
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
            for (const node of this._allNodes)
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
     * Generates dummy inputs that match the input nodes.
     * @returns dummy inputs to test a network.
     */
    public generateDummyInputs(): Map<string, Map<string, number>> {
        const inputs = new Map<string, Map<string, number>>();
        this.inputNodes.forEach((sprite, k) => {
            const spriteFeatures = new Map<string, number>();
            sprite.forEach((featureNode, featureKey) => {
                spriteFeatures.set(featureKey, 1);
            });
            inputs.set(k, spriteFeatures);
        });
        return inputs;
    }

    /**
     * Sorts the nodes of this network according to their types and uIDs in increasing order.
     */
    private sortNodes(): void {
        this._allNodes.sort((a, b) => a.type - b.type || a.uID - b.uID);
    }

    /**
     * Sorts the connections of this network according to their innovation numbers in increasing order.
     */
    private sortConnections(): void {
        this._connections.sort((a, b) => a.innovation - b.innovation);
    }

    /**
     * Returns the number of events this network has executed.
     * @returns number of executed events.
     */
    public getNumEvents(): number {
        assert(this._trace != null);
        return this._trace.events.length;
    }

    /**
     * Generates a string representation in dot format of the given NetworkChromosome.
     * @returns string dot format of the given chromosome
     */
    toString(): string {
        const edges = [];
        const minNodes: string[] = [];
        const maxNodes: string[] = [];

        const convertIdentifier = (identifier: string): string => {
            return identifier
                .replace(/-/g, '')
                .replace(/:/, '')
                // Rename colors in hex-format
                .replace(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/g, substring => name(substring)[1])
                .replace(/ /g, '');
        };

        for (const node of this._allNodes) {
            if (node.type === NodeType.INPUT || node.type === NodeType.BIAS) {
                minNodes.push(convertIdentifier(node.identifier()));
            } else if (node.type === NodeType.OUTPUT) {
                maxNodes.push(convertIdentifier(node.identifier()));
            }
        }

        const minRanks = `\t{ rank = min; ${minNodes.toString()} }`.replace(/,/g, '; ');
        const maxRanks = `\t{ rank = max; ${maxNodes.toString()} }`.replace(/,/g, '; ');

        for (const connection of this._connections) {
            const source = convertIdentifier(connection.source.identifier());
            const target = convertIdentifier(connection.target.identifier());
            const lineStyle = connection.isEnabled ? 'solid' : 'dotted';
            const weight = connection.weight.toFixed(2);
            const color = Math.min(11, Math.max(1, Math.round(Number(weight) + 6)));
            edges.push(`\t"${source}" -> "${target}" [label=${weight} style=${lineStyle} color="/rdylgn11/${color}" penwidth=3];`);
        }

        const renderedEdges = edges.join('\n');
        const graphConfigs = "\trankdir = BT;\n\tranksep = 10;";
        return `digraph Network {\n${graphConfigs}\n${renderedEdges}\n${minRanks}\n${maxRanks}\n}`;
    }

    /**
     * Transforms this NetworkChromosome into a JSON representation.
     * @return Record containing most important attribute keys mapped to their values.
     */
    public abstract toJSON(): Record<string, (number | NodeGene | ConnectionGene)>;

    getLength(): number {
        return this._codons.length;
    }

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

    /**
     * Initialises the target statements, setting each coverage count to zero.
     * @param targets all block statements of the given Scratch program.
     */
    public initialiseOpenStatements(targets: FitnessFunction<NetworkChromosome>[]): void {
        this.openStatementTargets = new Map<FitnessFunction<NetworkChromosome>, number>();
        for (const t of targets) {
            this.openStatementTargets.set(t, 0);
        }
    }

    /**
     * Adds a single ActivationTrace after executing a Scratch-Step to the ActivationTrace map.
     * @param step the previously performed step whose ActivationTrace should be recorded.
     */
    public updateActivationTrace(step: number): void {
        this.sortNodes();
        const tracedNodes = this._allNodes.filter(node => node.type === NodeType.HIDDEN);

        if (this.testActivationTrace === undefined) {
            this.testActivationTrace = new ActivationTrace(tracedNodes);
        }

        this.testActivationTrace.update(step, tracedNodes);
    }

    get allNodes(): NodeGene[] {
        return this._allNodes;
    }

    get connections(): ConnectionGene[] {
        return this._connections;
    }

    get inputConnectionMethod(): InputConnectionMethod {
        return this._inputConnectionMethod;
    }

    get activationFunction(): ActivationFunction {
        return this._activationFunction;
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

    get fitness(): number {
        return this._fitness;
    }

    set fitness(value: number) {
        this._fitness = value;
    }

    get score(): number {
        return this._score;
    }

    set score(value: number) {
        this._score = value;
    }

    get playTime(): number {
        return this._playTime;
    }

    set playTime(value: number) {
        this._playTime = value;
    }

    get testActivationTrace(): ActivationTrace {
        return this._testActivationTrace;
    }

    set testActivationTrace(value: ActivationTrace) {
        this._testActivationTrace = value;
    }

    get referenceActivationTrace(): ActivationTrace {
        return this._referenceActivationTrace;
    }

    set referenceActivationTrace(value: ActivationTrace) {
        this._referenceActivationTrace = value;
    }

    get recordNetworkStatistics(): boolean {
        return this._recordNetworkStatistics;
    }

    set recordNetworkStatistics(value: boolean) {
        this._recordNetworkStatistics = value;
    }

    get averageNodeBasedLSA(): number {
        return this._averageNodeBasedLSA;
    }

    set averageNodeBasedLSA(value: number) {
        this._averageNodeBasedLSA = value;
    }

    get surpriseCount(): number {
        return this._surpriseCount;
    }

    set surpriseCount(value: number) {
        this._surpriseCount = value;
    }

    get suspiciousMutantReasons(): Set<string> {
        return this._suspiciousMutantReasons;
    }

    set suspiciousMutantReasons(value: Set<string>) {
        this._suspiciousMutantReasons = value;
    }

    get referenceUncertainty(): Map<number, number> {
        return this._referenceUncertainty;
    }

    set referenceUncertainty(value: Map<number, number>) {
        this._referenceUncertainty = value;
    }

    get testUncertainty(): Map<number, number> {
        return this._testUncertainty;
    }

    set testUncertainty(value: Map<number, number>) {
        this._testUncertainty = value;
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

    set codons(value: number[]) {
        this._codons = value;
    }

    get codons(): number[] {
        return this._codons;
    }

    get isRecurrent(): boolean {
        return this._isRecurrent;
    }

    set isRecurrent(value: boolean) {
        this._isRecurrent = value;
    }

    get openStatementTargets(): Map<FitnessFunction<NetworkChromosome>, number> {
        return this._openStatementTargets;
    }

    set openStatementTargets(value: Map<FitnessFunction<NetworkChromosome>, number>) {
        this._openStatementTargets = value;
    }
}

export type InputConnectionMethod =
    | 'fully'
    | 'fullyHidden'
    | 'sparse'
