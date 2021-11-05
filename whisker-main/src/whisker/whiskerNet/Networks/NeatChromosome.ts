import {List} from "../../utils/List";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {Crossover} from "../../search/Crossover";
import {Mutation} from "../../search/Mutation";
import {Species} from "../NeuroevolutionPopulations/Species";
import {NetworkChromosome} from "./NetworkChromosome";

export class NeatChromosome extends NetworkChromosome {

    /**
     * Defines the crossover operator of the chromosome.
     */
    private readonly _crossoverOp: Crossover<NetworkChromosome>

    /**
     * Defines the mutation operator of the chromosome.
     */
    private readonly _mutationOp: Mutation<NetworkChromosome>

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
    private _expectedOffspring: number;

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
    constructor(allNodes: NodeGene[], connections: ConnectionGene[], mutationOp: Mutation<NetworkChromosome>,
                crossoverOp: Crossover<NetworkChromosome>, incrementID = true) {
        super(allNodes, connections, incrementID);
        this._crossoverOp = crossoverOp;
        this._mutationOp = mutationOp;
    }

    /**
     * Deep clone of a NetworkChromosome's structure. Attributes that are not related to the network's structure
     * are initialised with default values.
     * @param incrementID determines whether the ID counter should be incremented during the cloning process.
     * @returns NeatChromosome the cloned Network with default attribute values.
     */
    public cloneStructure(incrementID: boolean): NeatChromosome {
        return this.cloneWith(this.connections, incrementID);
    }

    /**
     * Deep clone of a NetworkChromosome using a defined list of genes.
     * @param newGenes the ConnectionGenes the network should be initialised with.
     * @param incrementID determines whether the ID-Counter should be incremented during cloning.
     * @returns NeatChromosome the cloned network chromosome.
     */
    cloneWith(newGenes: List<ConnectionGene>, incrementID = true): NeatChromosome {
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
     * Deep clone of a network including its structure and attributes. Does not increment the ID-Counter.
     * @returns NeatChromosome the cloned chromosome.
     */
    clone(): NetworkChromosome {
        const clone = this.cloneStructure(false);
        clone.uID = this.uID;
        clone.trace = this.trace;
        clone.coverage = this.coverage;
        clone.fitness = this.fitness;
        clone.sharedFitness = this.sharedFitness;
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
        for (let i = 0; i < this.allNodes.size(); i++) {
            nodes[`Node ${i}`] = this.allNodes.get(i).toJSON();
        }
        network[`Nodes`] = nodes;

        const connections = {};
        for (let i = 0; i < this.connections.size(); i++) {
            connections[`Con ${i}`] = this.connections.get(i).toJSON();
        }
        network[`Cons`] = connections;
        return network;
    }


    get fitness(): number {
        return this._fitness;
    }

    set fitness(value: number) {
        this._fitness = value;
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
