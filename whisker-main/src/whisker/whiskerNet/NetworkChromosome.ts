import {Chromosome} from "../search/Chromosome";
import {List} from "../utils/List";
import {NodeGene} from "./NetworkNodes/NodeGene";
import {ConnectionGene} from "./ConnectionGene";
import {Crossover} from "../search/Crossover";
import {Mutation} from "../search/Mutation";
import {NodeType} from "./NetworkNodes/NodeType";
import {FitnessFunction} from "../search/FitnessFunction";
import {ExecutionTrace} from "../testcase/ExecutionTrace";
import {Species} from "./Species";
import assert from "assert";

export class NetworkChromosome extends Chromosome {
    /**
     * Holds all nodes of a Network
     */
    private readonly _allNodes = new List<NodeGene>()

    /**
     * Holds all input nodes of a network
     */
    private readonly _inputNodes = new List<NodeGene>();

    /**
     * Holds all output nodes of a network
     */
    private readonly _outputNodes = new List<NodeGene>();

    /**
     * Holds all connections of a network
     */
    private readonly _connections: List<ConnectionGene>

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
     * Saves the codons of the network in a similar way to other non-Network chromosomes.
     * Used for transforming the network into a TestChromosome for evaluating its StatementFitness
     */
    private _codons: List<number>

    /**
     * True if this network implements at least one recurrent connection
     */
    private _isRecurrent: boolean

    /**
     * True if this network has loop in its connections (should not happen)
     */
    private _hasLoop: boolean

    /**
     * True if this network has regression nodes
     */
    private _hasRegression: boolean;

    /**
     * Constructs a new NetworkChromosome
     * @param connections the connections between the Nodes
     * @param allNodes all the nodes of a Chromosome
     * @param crossoverOp the crossover Operator
     * @param mutationOp the mutation Operator
     */
    constructor(connections: List<ConnectionGene>, allNodes: List<NodeGene>,
                mutationOp: Mutation<NetworkChromosome>, crossoverOp: Crossover<NetworkChromosome>) {
        super();
        this._allNodes = allNodes;
        this._inputNodes = new List<NodeGene>();
        this._outputNodes = new List<NodeGene>();
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
        this._codons = new List<number>();
        this._isRecurrent = false;
        this._hasLoop = false;
        this._hasRegression = false;
        this.generateNetwork();
    }

    /**
     * Deep clone of a NetworkChromosome
     * @return the cloned network
     */
    clone(): NetworkChromosome {
        return this.cloneWith(this.connections)
    }

    /**
     * Deep clone of a NetworkChromosome using a defined list of genes
     * @param newGenes the ConnectionGenes the network should be initialised with
     * @return the cloned network
     */
    cloneWith(newGenes: List<ConnectionGene>): NetworkChromosome {
        const connectionsClone = new List<ConnectionGene>();
        const nodesClone = new List<NodeGene>();

        // duplicate Nodes
        for (const node of this.allNodes) {
            const nodeClone = node.clone()
            nodesClone.add(nodeClone);
        }

        // duplicate connections
        for (const connection of newGenes) {
            const fromNode = NetworkChromosome.searchNode(connection.source, nodesClone)
            const toNode = NetworkChromosome.searchNode(connection.target, nodesClone)
            const connectionClone = connection.cloneWithNodes(fromNode, toNode);
            connectionsClone.add(connectionClone);
        }

        return new NetworkChromosome(connectionsClone, nodesClone, this.getMutationOperator(), this.getCrossoverOperator());
    }

    /**
     * Generates the network by placing the Input and Output nodes in the corresponding List.
     * Furthermore, assign each node its incoming connections defined by the connectionGene List.
     */
    generateNetwork(): void {
        this.sortConnections();
        // Place the input and output nodes into the corresponding List
        for (const node of this.allNodes) {
            if ((!this.inputNodes.contains(node)) && (node.type === NodeType.INPUT || node.type === NodeType.BIAS)) {
                this.inputNodes.add(node);
            }
            if ((!this.outputNodes.contains(node)) && (node.type === NodeType.OUTPUT))
                this.outputNodes.add(node);
        }

        // Go through each connection and set up the incoming connections of each Node
        for (const connection of this.connections) {
            const toNode = connection.target;
            // Add the connection to the incoming connections of the toNode if it is not present yet and isEnabled
            if (!toNode.incomingConnections.contains(connection) && connection.isEnabled) {
                toNode.incomingConnections.add(connection);
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
                if (connection.recurrent && connection.isEnabled) {
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
            this.activateNetwork(new Array(this.inputNodes.size()).fill(1));

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
        return (level - period + 1);
    }

    /**
     * Activates the network in order to get an output corresponding to the fed inputs.
     * @return returns true if everything went well.
     */
    activateNetwork(inputs: number[]): boolean {
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
     * @param inputs the inputs the nodes should be loaded with
     */
    private setUpInputs(inputs: number[]): void {
        for (let i = 0; i < this.inputNodes.size(); i++) {
            const iNode = this.inputNodes.get(i);
            if (iNode.type === NodeType.INPUT) {
                iNode.activationCount++;
                iNode.activatedFlag = true;
                iNode.nodeValue = inputs[i];
                iNode.activationValue = inputs[i];
            }
        }
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
    public isRecurrentPath(node1: NodeGene, node2: NodeGene, level:number, threshold:number): boolean {
        this.generateNetwork();

        if(level === 0){
            // Reset the traverse flag
            for (const node of this.allNodes)
                node.traversed = false;
        }

        // if the source node is in the output layer it has to be a recurrent connection!
        if(node1.type === NodeType.OUTPUT){
            return true;
        }

        level++;

        if(level > threshold){
            return false;
        }

        // If we end up in node1 again we found a recurrent path.
        if (node1 === node2) {
            return true;
        }

        for (const inConnection of node1.incomingConnections) {
            if (!inConnection.recurrent) {
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
    private static searchNode(node: NodeGene, allNodes: List<NodeGene>): NodeGene {
        for (const n of allNodes)
            if (n.equals(node))
                return n;
        return null;
    }

    /**
     * Sorts the connections of this network corresponding to its innovation numbers.
     */
    private sortConnections(): void {
        this.connections.sort((a, b) => a.innovation - b.innovation);
    }

    /**
     * Returns the number of events this network has executed. (Needed for WhiskerTest class)
     */
    public getNumEvents(): number {
        assert(this._trace != null);
        return this._trace.events.size();
    }

    toString(): string {
        return "Genome:\nNodeGenes: " + this.allNodes + "\nConnectionGenes: " + this.connections;
    }

    getLength(): number {
        return this._codons.size();
    }

    getCrossoverOperator(): Crossover<this> {
        return this._crossoverOp as Crossover<this>;
    }

    getMutationOperator(): Mutation<this> {
        return this._mutationOp as Mutation<this>;
    }

    getFitness(fitnessFunction: FitnessFunction<this>): number {
        return fitnessFunction.getFitness(this);
    }

    get inputNodes(): List<NodeGene> {
        return this._inputNodes;
    }

    get outputNodes(): List<NodeGene> {
        return this._outputNodes;
    }

    get allNodes(): List<NodeGene> {
        return this._allNodes;
    }

    get trace(): ExecutionTrace {
        return this._trace;
    }

    set trace(value: ExecutionTrace) {
        this._trace = value;
    }

    get connections(): List<ConnectionGene> {
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

    get codons(): List<number> {
        return this._codons;
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

    get hasRegression(): boolean {
        return this._hasRegression;
    }

    set hasRegression(value: boolean) {
        this._hasRegression = value;
    }
}
