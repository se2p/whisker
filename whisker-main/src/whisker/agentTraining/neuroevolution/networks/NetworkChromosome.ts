import {NodeGene} from "../networkComponents/NodeGene";
import {ConnectionGene} from "../networkComponents/ConnectionGene";
import {NodeType} from "../networkComponents/NodeType";
import {FitnessFunction} from "../../../search/FitnessFunction";
import {InputNode} from "../networkComponents/InputNode";
import {Randomness} from "../../../utils/Randomness";
import {ActionNode} from "../networkComponents/ActionNode";
import {ScratchEvent} from "../../../testcase/events/ScratchEvent";
import {ActivationFunction} from "../networkComponents/ActivationFunction";
import {ActivationTrace} from "../misc/ActivationTrace";
import {NeatPopulation} from "../neuroevolutionPopulations/NeatPopulation";
import {name} from "ntc";
import assert from "assert";
import {BiasNode} from "../networkComponents/BiasNode";
import {MouseMoveToEvent} from "../../../testcase/events/MouseMoveToEvent";
import {MouseMoveDimensionEvent} from "../../../testcase/events/MouseMoveDimensionEvent";
import {InputFeatures} from "../../featureExtraction/FeatureExtraction";
import {TestCase} from "../../../core/TestCase";
import {ExecutionTrace} from "../../../testcase/ExecutionTrace";
import {NetworkCrossover} from "../operators/NetworkCrossover";
import {NetworkMutation} from "../operators/NetworkMutation";
import {Chromosome} from "../../../search/Chromosome";

export abstract class NetworkChromosome extends Chromosome implements TestCase {

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
     * Maps each uncovered objective to the number of times it has been covered using different seeds.
     */
    private _coverageObjectives: Map<number, number>;

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
     * The execution trace including the blockTraces and the executed events and their parameters after executing the
     * chromosome up to that point after which no more blocks have been covered.
     */
    private _trace: ExecutionTrace;

    /**
     * Determined if on a child with equivalent network structure, gradient descent has already been applied.
     * There is no reason for applying gradient descent on the same parent twice.
     */
    private _gradientDescentChild = false;

    /**
     * Saves the final state of the problem domain after the network was executed in it.
     */
    private _finalState: InputFeatures;

    /**
     * The novelty score of the network used as a secondary fitness criterion if a novelty-based fitness metric is used.
     */
    private _noveltyScore = 0;

    /**
     * Random number generator.
     */
    protected readonly _random = Randomness.getInstance();

    /**
     * The covered blocks represented by their id.
     */
    protected _coverage: Set<string> = new Set<string>();

    /**
     * The covered branches represented by their id.
     */
    protected _branchCoverage: Set<string> = new Set<string>();


    /**
     * Constructs a new NetworkChromosome.
     * @param _layers the networks {@link NetworkLayer}s.
     * @param _connections the connections of the network.
     * @param _crossoverOp the crossover operator.
     * @param _mutationOp the mutation operator.
     * @param _inputConnectionMethod determines how novel nodes are being connected to the input layer.
     * @param _hiddenActivationFunction the activation function that will be used for hidden nodes.
     * @param _outputActivationFunction the activation function that will be used for output nodes.
     * @param incrementID determines whether the id counter should be incremented after constructing this chromosome.
     */
    public constructor(protected _layers: NetworkLayer,
                       protected readonly _connections: ConnectionGene[],
                       protected readonly _mutationOp: NetworkMutation<NetworkChromosome>,
                       protected readonly _crossoverOp: NetworkCrossover<NetworkChromosome>,
                       protected readonly _inputConnectionMethod: InputConnectionMethod,
                       protected readonly _hiddenActivationFunction: ActivationFunction,
                       protected readonly _outputActivationFunction: ActivationFunction.SIGMOID | ActivationFunction.SOFTMAX,
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
            const featureKeys = [...spriteFeatures.keys()];

            // Check if we have encountered a new Sprite.
            if (!this.inputNodes.has(spriteKey)) {
                updated = true;
                const spriteNodes = new Map<string, InputNode>();
                for (const featureKey of featureKeys) {
                    const featureID = `I:${spriteKey}-${featureKey}`;
                    const id = NetworkChromosome.getNonHiddenNodeId(featureID);
                    const iNode = new InputNode(id, spriteKey, featureKey);
                    spriteNodes.set(featureKey, iNode);
                    this._layers.get(0).push(iNode);
                }
                this.inputNodes.set(spriteKey, spriteNodes);
            } else {
                // We have not encountered a new Sprite, but we still have to check
                // if we encountered new features of a Sprite.
                for (const featureKey of featureKeys) {
                    const savedSpriteMap = this.inputNodes.get(spriteKey);
                    if (!savedSpriteMap.has(featureKey)) {
                        updated = true;
                        const featureID = `I:${spriteKey}-${featureKey}`;
                        const id = NetworkChromosome.getNonHiddenNodeId(featureID);
                        const iNode = new InputNode(id, spriteKey, featureKey);
                        savedSpriteMap.set(featureKey, iNode);
                        this._layers.get(0).push(iNode);
                    }
                }
            }
        });

        // If the network's structure has changed, re-generate the new network.
        if (updated) {
            this.generateNetwork();
        }
    }

    /**
     * Adds additional output nodes if we have encountered new events during the playthrough.
     * @param events a list of encountered events.
     */
    public updateOutputNodes(events: ScratchEvent[]): void {
        let updated = false;
        for (const event of events) {

            // Update MouseMoveEvents by changing the Event itself to prevent an explosion of such events.
            if (event instanceof MouseMoveToEvent) {
                const targetSprite = event.sprite;
                for (const actionNode of this.getTriggerActionNodes()) {
                    const nodeEvent = actionNode.event;
                    if (nodeEvent instanceof MouseMoveToEvent && nodeEvent.sprite === targetSprite
                        && (nodeEvent.x !== event.x || nodeEvent.y !== event.y)) {
                        nodeEvent.x = event.x;
                        nodeEvent.y = event.y;
                        break;
                    }
                }
            }

            // Check if we have to add a new action node.
            const actionNodes = [...this.getTriggerActionNodes(), ...this.getContinuousActionNodes()];
            if (!actionNodes.some(node => node.event.stringIdentifier() === event.stringIdentifier())) {
                updated = true;
                const featureID = `A:${event.stringIdentifier()}`;
                const id = NetworkChromosome.getNonHiddenNodeId(featureID);
                const actionNode = new ActionNode(id, this._outputActivationFunction, event, event instanceof MouseMoveDimensionEvent);
                this._layers.get(1).push(actionNode);
                this.connectNodesToInputLayer([actionNode], this._inputConnectionMethod);
            }
        }
        // If the network's structure has changed, re-generate the new network.
        if (updated) {
            this.generateNetwork();
        }
    }

    /**
     * Connects nodes to the specified input nodes using defined mode to connect the nodes.
     * @param nodesToConnect the nodes that should be connected to the input layer.
     * @param mode determines how the input layer should be connected to the given nodes.
     */
    public abstract connectNodesToInputLayer(nodesToConnect: NodeGene[], mode: InputConnectionMethod): void;

    /**
     * Fetches the ID of a functional Node, i.e., a non-Hidden node.
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

        // After we looked at potential recurrent connections, we can reset the activation value.
        for (const node of this.getAllNodes()) {
            if (!(node instanceof BiasNode)) {
                node.activationValue = 0;
            }
        }

        const layers = [...this._layers.keys()].sort();
        for (const layer of layers) {
            if (layer === 0) {
                this.setUpInputs(inputs);
            } else if (layer < 1) {
                this.layers.get(layer).forEach(node => {
                    this._calculateNodeValue(node);
                    node.activationValue = node.activate();
                });
            } else {
                this._layers.get(layer).forEach(node => this._calculateNodeValue(node));
                const nodeValues = [...this._layers.get(layer)].map(node => node.nodeValue);
                this.layers.get(layer).forEach(node => node.activationValue = node.activate(nodeValues));
            }
        }
        return [...this.layers.get(1)].some(node => node.activatedFlag);
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
            const featureKeys = [...sprite.keys()];
            for (const featureKey of featureKeys) {
                spriteFeatures.set(featureKey, random.nextDouble());
            }
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
     * Initialises the coverage objectives map, setting every coverage count to zero.
     * @param fitnessKeys all objective keys of the given Scratch program.
     */
    public initialiseCoverageObjectives(fitnessKeys: number[]): void {
        this.coverageObjectives = new Map<number, number>();
        for (const t of fitnessKeys) {
            this.coverageObjectives.set(t, 0);
        }
    }

    /**
     * Resets the coverage objective map by setting all values to zero.
     */
    public resetCoverageMap(): void {
        for (const key of this.coverageObjectives.keys()) {
            this.coverageObjectives.set(key, 0);
        }
    }

    /**
     * Adds a single ActivationTrace to the network's current trace.
     * @param step the previously performed step whose ActivationTrace should be recorded.
     */
    public updateActivationTrace(step: number): void {
        const tracedNodes = this.getAllNodes()
            .filter(node => node.type === NodeType.HIDDEN || node.type === NodeType.OUTPUT);

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
        assert(this.getTrace() != null);
        return this.getTrace().events.length;
    }

    /**
     * Generates a string representation in the dot format of the given NetworkChromosome.
     * @returns string dot format of the given chromosome
     */
    public override toString(): string {
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
        return this.layers.size;
    }

    override async getFitness(fitnessFunction: FitnessFunction<this>, fitnessKey: number): Promise<number> {
        // The coverage objective was covered at least once.
        if (this.coverageObjectives.get(fitnessKey) > 0) {
            return this.coverageObjectives.get(fitnessKey);
        }

        // If the coverage objective has not been covered, compute the distance to the target.
        // Cast to maximising fitness function if necessary.
        return fitnessFunction.isMaximizing() ? await fitnessFunction.getFitness(this) : 1 - await fitnessFunction.getFitness(this);
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
     */
    public addNode(newNode: NodeGene): void {
        const depth = newNode.depth;
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
     * Returns all trigger action nodes of the network.
     * @returns all trigger action nodes of the network.
     */
    public getTriggerActionNodes(): ActionNode[] {
        return this.getActionNodes().filter(node => !node.continuous);
    }

    /**
     * Returns all continuous action nodes of the network.
     * @returns all continuous action nodes of the network.
     */
    public getContinuousActionNodes(): ActionNode[] {
        return this.getActionNodes().filter(node => node.continuous);
    }

    /**
     * Returns all action nodes of the network.
     * In theory, the final layer should only contain action nodes.
     * However, in practice, the final layer can also contain hidden nodes.
     * This can happen if a recurrent self-loop is added to one of the output neurons
     * and a hidden neuron is inserted by splitting this recurrent connection.
     *
     *
     * @returns all action nodes of the network.
     */
    public getActionNodes(): ActionNode[] {
        return [...this.layers.get(1)].filter(node => node instanceof ActionNode) as ActionNode[];
    }

    getTrace(): ExecutionTrace {
        return this._trace;
    }

    getCoveredBlocks(): Set<string> {
        return this._coverage;
    }

    getCoveredBranches(): Set<string> {
        return this._branchCoverage;
    }

    set trace(value: ExecutionTrace) {
        this._trace = value;
    }

    get trace(): ExecutionTrace {
        return this.getTrace();
    }

    set coverage(value: Set<string>) {
        this._coverage = value;
    }

    get coverage(): Set<string> {
        return this._coverage;
    }

    set branchCoverage(value: Set<string>) {
        this._branchCoverage = value;
    }

    get branchCoverage(): Set<string> {
        return this._branchCoverage;
    }


    /**
     * Sorts the layer map by increasing keys.
     */
    public sortLayer(): void {
        this._layers = new Map([...this.layers.entries()].sort(([keyA], [keyB]) => keyA - keyB));
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

    get outputActivationFunction(): ActivationFunction.SIGMOID | ActivationFunction.SOFTMAX {
        return this._outputActivationFunction;
    }

    get inputNodes(): Map<string, Map<string, InputNode>> {
        return this._inputNodes;
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

    get finalState(): InputFeatures {
        return this._finalState;
    }

    set finalState(value: InputFeatures) {
        this._finalState = value;
    }

    get noveltyScore(): number {
        return this._noveltyScore;
    }

    set noveltyScore(value: number) {
        this._noveltyScore = value;
    }

    get coverageObjectives(): Map<number, number> {
        return this._coverageObjectives;
    }

    set coverageObjectives(value: Map<number, number>) {
        this._coverageObjectives = value;
    }
}

export type InputConnectionMethod =
    | 'fully'
    | 'sparse'

/**
 * Maps a network layer to the list of nodes residing at the corresponding network depth. The value range of the keys
 * is restricted to [0,1] with 0 and 1 representing the input and output layer, respectively.
 */
export type NetworkLayer = Map<number, NodeGene[]>;
