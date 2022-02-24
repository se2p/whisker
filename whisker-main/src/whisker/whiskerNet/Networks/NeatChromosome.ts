import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {Species} from "../NeuroevolutionPopulations/Species";
import {NetworkChromosome} from "./NetworkChromosome";
import {NeatCrossover} from "../Operators/NeatCrossover";
import {NeatMutation} from "../Operators/NeatMutation";
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
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
     * @param incrementID determines whether the id counter should be incremented after constructing this chromosome.
     */
    constructor(allNodes: NodeGene[], connections: ConnectionGene[], mutationOp: NeatMutation,
                crossoverOp: NeatCrossover, incrementID = true) {
        super(allNodes, connections, incrementID);
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
            this.getCrossoverOperator(), incrementID);
    }

    /**
     * Adds additional input Nodes if we have encountered a new Sprite during the playthrough.
     * @param sprites a map which maps each sprite to its input feature vector.
     */
    protected updateInputNodes(sprites: Map<string, Map<string, number>>): void {
        let updated = false;
        sprites.forEach((spriteFeatures, spriteKey) => {

            // Check if we have encountered a new Sprite.
            if (!this.inputNodes.has(spriteKey)) {
                updated = true;
                const spriteNodes = new Map<string, InputNode>();
                spriteFeatures.forEach((featureValue, featureKey) => {
                    const iNode = new InputNode(spriteKey, featureKey);
                    spriteNodes.set(featureKey, iNode);
                    this.allNodes.push(iNode);
                    // By chance, we connect the new Node to the network.
                    if (this._random.nextDouble() < 0.5) {
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
                        const iNode = new InputNode(spriteKey, featureKey);
                        savedSpriteMap.set(featureKey, iNode);
                        this.allNodes.push(iNode);
                        // By chance or if we use fully connected networks, we connect the new Node to the network.
                        if (this._random.nextDouble() < 0.5) {
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
     * Connects an input node to the network by creating a connection between the input node and all output nodes.
     * @param iNode the input node to connect.
     */
    protected connectInputNode(iNode: NodeGene): void {
        for (const oNode of this.outputNodes) {
            const newConnection = new ConnectionGene(iNode, oNode, this._random.nextDoubleMinMax(-1, 1),
                true, 0, false);
            NeatPopulation.assignInnovationNumber(newConnection);
            this.connections.push(newConnection);
            oNode.incomingConnections.push(newConnection);
        }
    }

    /**
     * Connects an output node to the network by creating a connection between the output node and all input nodes.
     * @param oNode the output node to connect.
     */
    protected connectOutputNode(oNode: NodeGene): void {
        for (const iNodes of this.inputNodes.values()) {
            for (const iNode of iNodes.values()) {
                const newConnection = new ConnectionGene(iNode, oNode, this._random.nextDoubleMinMax(-1, 1),
                    true, 0, false)
                NeatPopulation.assignInnovationNumber(newConnection);
                this.connections.push(newConnection);
                oNode.incomingConnections.push(newConnection);
            }
        }
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
        clone.species = this.species;
        clone.isSpeciesChampion = this.isSpeciesChampion;
        clone.isPopulationChampion = this.isPopulationChampion;
        clone.isParent = this.isParent;
        clone.expectedOffspring = this.expectedOffspring;
        clone.isRecurrent = this.isRecurrent;
        return clone;
    }

    /**
     * Transforms this NeatChromosome into a JSON representation.
     * @return Record containing most important attribute keys mapped to their values.
     */
    public toJSON(): Record<string, (number | NodeGene | ConnectionGene)> {
        const network = {};
        network[`id`] = this.uID;
        network[`nF`] = Number(this.fitness.toFixed(4));
        network[`sF`] = Number(this.sharedFitness.toFixed(4));
        network[`eO`] = Number(this.expectedOffspring.toFixed(4));
        network[`k`] = this.isParent;

        const nodes = {}
        for (let i = 0; i < this.allNodes.length; i++) {
            nodes[`Node ${i}`] = this.allNodes[i].toJSON();
        }
        network[`Nodes`] = nodes;

        const connections = {};
        for (let i = 0; i < this.connections.length; i++) {
            connections[`Con ${i}`] = this.connections[i].toJSON();
        }
        network[`Cons`] = connections;

        network['AT'] = this.currentActivationTrace.toJSON();

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
