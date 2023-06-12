import {Chromosome} from "../../search/Chromosome";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {NodeType} from "../NetworkComponents/NodeType";
import {FitnessFunction} from "../../search/FitnessFunction";
import {EventAndParameters, ExecutionTrace} from "../../testcase/ExecutionTrace";
import {InputNode} from "../NetworkComponents/InputNode";
import {Randomness} from "../../utils/Randomness";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {ActivationTrace} from "../Misc/ActivationTrace";
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
import {name} from "ntc";
import assert from "assert";
import {FeatureGroup, InputFeatures} from "../Misc/InputExtraction";
import {eventAndParametersObject, ObjectInputFeatures, StateActionRecord} from "../Misc/GradientDescent";
import {BiasNode} from "../NetworkComponents/BiasNode";

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
    private readonly _inputNodes = new Map<string, Map<string, InputNode>>()

    /**
     * Maps events to the corresponding classification node.
     */
    protected readonly _classificationNodes = new Map<string, ClassificationNode>();

    /**
     * Maps events which take at least one parameter as input to the corresponding regression nodes.
     */
    protected readonly _regressionNodes = new Map<string, RegressionNode[]>();

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
    private _averageLSA = 0;

    /**
     * Counts the number of surprising node activations.
     */
    private _surpriseCount = 0;

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
     * Determined whether on a child with equivalent network structure, gradient descent has already been applied.
     * There is no reason in applying gradient descent on the same parent twice.
     */
    private _gradientDescentChild = false;

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
     * Records the network behaviour during its execution by mapping input states to the executed actions.
     */
    private _stateActionPairs: StateActionRecord = new Map<ObjectInputFeatures, eventAndParametersObject>();

    /**
     * Random number generator.
     */
    protected readonly _random = Randomness.getInstance();

    /**
     * Constructs a new NetworkChromosome.
     * @param _layers the networks {@link NetworkLayer}s.
     * @param _connections the connections of the network.
     * @param _inputConnectionMethod determines how novel nodes are being connected to the input layer.
     * @param _activationFunction the activation function that will be used for hidden nodes.
     * @param incrementID determines whether the id counter should be incremented after constructing this chromosome.
     */
    protected constructor(protected _layers: NetworkLayer,
                          protected readonly _connections: ConnectionGene[],
                          protected readonly _inputConnectionMethod: InputConnectionMethod,
                          protected readonly _activationFunction = ActivationFunction.RELU,
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
    public abstract cloneStructure(incrementID: boolean): NetworkChromosome;

    /**
     * Clones the network during the test execution process.
     */
    public abstract cloneAsTestCase(): NetworkChromosome;

    /**
     * Determines how a novel connection is added to the network.
     * @param connection the connection to add.
     */
    public abstract addConnection(connection: ConnectionGene): void;

    /**
     * Adds additional input Nodes if we have encountered new input features during the playthrough.
     * @param features a map which maps each sprite to its input feature vector.
     */
    public updateInputNodes(features: InputFeatures): void {
        let updated = false;
        features.forEach((spriteFeatures, spriteKey) => {

            // Check if we have encountered a new Sprite.
            if (!this.inputNodes.has(spriteKey)) {
                updated = true;
                const spriteNodes = new Map<string, InputNode>();
                spriteFeatures.forEach((featureValue, featureKey) => {
                    const featureID = `I:${spriteKey}-${featureKey}`;
                    const id = NetworkChromosome.getNonHiddenNodeId(featureID);
                    const iNode = new InputNode(id, spriteKey, featureKey);
                    spriteNodes.set(featureKey, iNode);
                    this._layers.get(0).push(iNode);
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
                        this._layers.get(0).push(iNode);
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
                this._layers.get(1).push(classificationNode);
                this.connectNodeToInputLayer([classificationNode], this._inputConnectionMethod);
            }
            // Check if we also have to add regression nodes.
            if (!this.regressionNodes.has(event.stringIdentifier()) && event.numSearchParameter() > 0) {
                updated = true;
                for (const parameter of event.getSearchParameterNames()) {
                    const featureID = `R:${event.stringIdentifier()}-${parameter}`;
                    const id = NetworkChromosome.getNonHiddenNodeId(featureID);
                    const regressionNode = new RegressionNode(id, event, parameter);
                    this._layers.get(1).push(regressionNode);
                    this.connectNodeToInputLayer([regressionNode], this._inputConnectionMethod);
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
     * @param mode determines how the input layer should be connected to the given nodes.
     */
    public abstract connectNodeToInputLayer(nodesToConnect: NodeGene[], mode: InputConnectionMethod): void;

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
        // Add input nodes to the InputNode-Map.
        for (const node of this._layers.get(0)) {
            if (node instanceof InputNode) {
                if (!this.inputNodes.has(node.sprite)) {
                    const newSpriteMap = new Map<string, InputNode>();
                    newSpriteMap.set(node.feature, node);
                    this.inputNodes.set(node.sprite, newSpriteMap);
                } else if (!this.inputNodes.get(node.sprite).has(node.feature))
                    this.inputNodes.get(node.sprite).set(node.feature, node);
            }
        }

        // Add output nodes to the corresponding maps.
        for (const node of this._layers.get(1)) {
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
     * Activates the network to get an output based on to the fed inputs.
     * @param inputs consisting of the extracted features from the current Scratch state.
     */
    public activateNetwork(inputs: InputFeatures): boolean {
        // Reset the node value of all nodes but pay attention to recurrent connections.
        for (const node of this.getAllNodes()) {
            node.nodeValue = 0;
            for (const inConnection of node.incomingConnections) {
                if (inConnection.isRecurrent) {
                    node.nodeValue += inConnection.weight * inConnection.source.activationValue;
                }
            }
        }

        // After we looked at potential recurrent connections we can reset the activation value.
        for (const node of this.getAllNodes()) {
            if (!(node instanceof BiasNode)) {
                node.activationValue = 0;
            }
        }

        const layers = [...this._layers.keys()].sort();
        for (const layer of layers) {
            const nodes = this.layers.get(layer);

            // In the first layer we set up our inputs.
            if (layer === 0) {
                this.setUpInputs(inputs);
            }

            // Hidden nodes
            else if (layer < 1) {
                // For each node fetch the incoming connections, calculate the node value and activate the node using
                // the defined activation function.
                for (const node of nodes) {
                    this._calculateNodeValue(node);
                    node.activationValue = node.activate();
                }
            }

                // For output nodes calculate the node values first since we require them for the softmax function within
            // the classification nodes.
            else {
                for (const node of nodes) {
                    this._calculateNodeValue(node);
                }

                // Check if at least one output node has received an input. If not we have a defect network.
                if (this.layers.get(1).every(node => !node.activatedFlag)) {
                    return false;
                }

                // Calculate softmax denominator
                let denominator = 0;
                for (const node of this.classificationNodes.values()) {
                    if (node.activatedFlag) {
                        denominator += Math.exp(node.nodeValue);
                    }
                }

                // Activate the classification nodes using softmax and
                // the regression nodes with their specified activation function.
                for (const node of nodes) {
                    if (node instanceof ClassificationNode) {
                        node.activationValue = node.activate(denominator);
                    } else if (node instanceof RegressionNode) {
                        node.activationValue = node.activate();
                    }
                }
            }
        }
        return true;
    }

    /**
     * Computes the node value of a given node gene by calculating the weighted sum.
     * @param node whose node value will be calculated.
     */
    private _calculateNodeValue(node: NodeGene): void {
        for (const inConnection of node.incomingConnections) {
            const sourceNode = inConnection.source;
            if (!inConnection.isRecurrent) {
                node.nodeValue += (inConnection.weight * sourceNode.activationValue);
            }
            node.activatedFlag = true;
        }
    }

    /**
     * Load the given inputs into the input nodes of the network.
     * @param inputs consists of input features extracted from the current Scratch path.
     */
    public setUpInputs(inputs: InputFeatures): void {

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
                    iNode.activationCount++;
                    iNode.activatedFlag = true;
                    iNode.nodeValue = featureValue;
                    iNode.activationValue = featureValue;
                }
            });
        });
    }

    /**
     * Generates dummy inputs for all input nodes.
     * @returns randomly generated input features.
     */
    public generateDummyInputs(): InputFeatures {
        const random = Randomness.getInstance();
        const inputs: InputFeatures = new Map<string, Map<string, number>>();
        this.inputNodes.forEach((sprite, k) => {
            const spriteFeatures = new Map<string, number>();
            sprite.forEach((featureNode, featureKey) => {
                spriteFeatures.set(featureKey, random.nextDouble());
            });
            inputs.set(k, spriteFeatures);
        });
        return inputs;
    }

    /**
     * Sorts the connections of this network according to their innovation numbers in increasing order.
     */
    public sortConnections(): void {
        this._connections.sort((a, b) => a.innovation - b.innovation);
    }

    /**
     * Initialises the open target statements, setting each coverage count to zero; Used for Explorative-NEAT's
     * robustness check.
     * @param targets all block statements of the given Scratch program.
     */
    public initialiseOpenStatements(targets: FitnessFunction<NetworkChromosome>[]): void {
        this.openStatementTargets = new Map<FitnessFunction<NetworkChromosome>, number>();
        for (const t of targets) {
            this.openStatementTargets.set(t, 0);
        }
    }

    /**
     * Adds a single ActivationTrace to the network's current trace.
     * @param step the previously performed step whose ActivationTrace should be recorded.
     */
    public updateActivationTrace(step: number): void {
        const tracedNodes = this.getAllNodes().filter(node => node.type === NodeType.HIDDEN);

        if (this.testActivationTrace === undefined) {
            this.testActivationTrace = new ActivationTrace(tracedNodes);
        }

        this.testActivationTrace.update(step, tracedNodes);
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
    override toString(): string {
        const edges = [];
        const minNodes: string[] = [];
        const maxNodes: string[] = [];

        const convertIdentifier = (identifier: string): string => {
            return identifier
                .replace(/-/g, '')
                .replace(/:/, '')
                // Rename colors in hex-format
                .replace(/#([a-fA-F\d]{6}|[a-fA-F\d]{3})$/g, substring => name(substring)[1])
                .replace(/ /g, '');
        };

        for (const node of this.getAllNodes()) {
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

    override async getFitness(fitnessFunction: FitnessFunction<this>): Promise<number> {
        if (this._fitnessCache.has(fitnessFunction)) {
            return this._fitnessCache.get(fitnessFunction);
        } else {
            const fitness = await fitnessFunction.getFitness(this);
            this._fitnessCache.set(fitnessFunction, fitness);
            return fitness;
        }
    }

    /**
     * Returns all nodes of the Network.
     * @returns all nodes of the network.
     */
    public getAllNodes(): NodeGene[] {
        return [...this._layers.values()].flat();
    }

    /**
     * Returns the number of nodes hosted by the network.
     * @returns number of nodes hosted by the network.
     */
    public getNumNodes(): number {
        return this.getAllNodes().length;
    }

    /**
     * Determines the depth of a node given its input and output nodes.
     * @param inNode the source node of the node whose depth is to be determined.
     * @param outNode the target node of the node whose depth is to be determined.
     * @returns depth of the node whose input and output nodes are provided.
     */
    public getDepthOfNewNode(inNode: NodeGene, outNode: NodeGene): number {
        return (inNode.depth + outNode.depth) / 2;
    }

    /**
     * Adds a new node to the network.
     * @param newNode the node to be added.
     * @param sourceNode the source node with a connection into the new node.
     * @param targetNode the target node to which the new node has an outgoing connection.
     */
    public addNode(newNode: NodeGene, sourceNode: NodeGene, targetNode: NodeGene): void {
        const depth = this.getDepthOfNewNode(sourceNode, targetNode);
        if (!this._layers.get(depth)) {
            this._layers.set(depth, []);
        }
        this._layers.get(depth).push(newNode);
    }

    /**
     * Creates a deep clone of the network layer by deep cloning each node.
     * @returns the deep cloned NetworkLayer.
     */
    public cloneLayer(): NetworkLayer {
        this.sortLayer();
        const layerClone: NetworkLayer = new Map<number, NodeGene[]>();
        for (const [layer, nodes] of this._layers.entries()) {
            const layerNodeClones: NodeGene[] = [];
            for (const node of nodes) {
                layerNodeClones.push(node.clone());
            }
            layerClone.set(layer, layerNodeClones);
        }
        return layerClone;
    }

    /**
     * Sorts the layer map by increasing keys.
     */
    public sortLayer(): void {
        this._layers = new Map([...this.layers.entries()].sort());
    }

    /**
     * Extracts the {@link InputFeatures} from the input neurons.
     * @return InputFeatures loaded in the input layer.
     */
    public extractInputFeatures(): InputFeatures {
        const features: InputFeatures = new Map<string, FeatureGroup>();
        for (const [sprite, spriteFeatures] of this.inputNodes.entries()) {
            const featureGroup: FeatureGroup = new Map<string, number>();
            for (const features of spriteFeatures.keys()) {
                featureGroup.set(features, 0);
            }
            features.set(sprite, featureGroup);
        }
        return features;
    }

    /**
     * Extracts the supported output features of this node from the output nodes.
     * @returns mapping of event identifier to found {@link ScratchEvent} in output nodes.
     */
    public extractOutputFeatures(): Map<string, ScratchEvent> {
        const outputFeatures = new Map<string, ScratchEvent>();
        for (const event of [...this.classificationNodes.values()].map(node => node.event)) {
            outputFeatures.set(event.stringIdentifier(), event);
        }
        return outputFeatures;
    }

    /**
     * Updates the record of encountered state and executed actions.
     * @param state the encountered state.
     * @param action the executed action for the encountered state.
     */
    public updateStateActionPair(state: InputFeatures, action: EventAndParameters): void {

        // Convert inputFeatures to ObjectInputFeatures for gradient descent.
        const objectInputFeatures: ObjectInputFeatures = {};
        for (const [sprite, featureGroups] of state.entries()) {
            objectInputFeatures[sprite] = Object.fromEntries(featureGroups);
        }

        // Convert action to eventAndParametersObject for gradient descent
        const parameterNames = action.event.getSearchParameterNames();
        const parameter = {};
        for (let i = 0; i < parameterNames.length; i++) {
            parameter[parameterNames[i]] = action.parameters[i];
        }
        const eventObject: eventAndParametersObject = {
            event: action.event.stringIdentifier(),
            parameter: parameter
        };
        this._stateActionPairs.set(objectInputFeatures, eventObject);
    }

    get uID(): number {
        return this._uID;
    }

    set uID(value: number) {
        this._uID = value;
    }

    get layers(): NetworkLayer {
        return this._layers;
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

    get gradientDescentChild(): boolean {
        return this._gradientDescentChild;
    }

    set gradientDescentChild(value: boolean) {
        this._gradientDescentChild = value;
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

    get averageLSA(): number {
        return this._averageLSA;
    }

    set averageLSA(value: number) {
        this._averageLSA = value;
    }

    get surpriseCount(): number {
        return this._surpriseCount;
    }

    set surpriseCount(value: number) {
        this._surpriseCount = value;
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

    get openStatementTargets(): Map<FitnessFunction<NetworkChromosome>, number> {
        return this._openStatementTargets;
    }

    set openStatementTargets(value: Map<FitnessFunction<NetworkChromosome>, number>) {
        this._openStatementTargets = value;
    }

    get stateActionPairs(): StateActionRecord {
        return this._stateActionPairs;
    }
}

export type InputConnectionMethod =
    | 'fully'
    | 'fullyHidden'
    | 'sparse'

/**
 * Maps a network layer to the list of nodes residing at the corresponding network depth. The value range of the keys
 * is restricted to [0,1] with 0 and 1 representing the input and output layer, respectively.
 */
export type NetworkLayer = Map<number, NodeGene[]>;
