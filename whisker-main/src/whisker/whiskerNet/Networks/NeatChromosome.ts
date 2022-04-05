import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {Species} from "../NeuroevolutionPopulations/Species";
import {NetworkChromosome} from "./NetworkChromosome";
import {NeatCrossover} from "../Operators/NeatCrossover";
import {NeatMutation} from "../Operators/NeatMutation";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
import {Innovation, InnovationProperties} from "../NetworkComponents/Innovation";

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
        if (this.currentActivationTrace !== undefined) {
            clone.currentActivationTrace = this.currentActivationTrace.clone();
        }
        return clone;
    }

    /**
     * Determines how a novel connection is added to the network. In NEAT-Chromosomes we have to keep track of the
     * innovation history.
     * @param connection the connection to add.
     */
    public addConnection(connection: ConnectionGene): void {
        const innovation = NeatPopulation.findInnovation(connection, 'newConnection');

        // Check if this innovation has occurred before.
        if (innovation) {
            connection.innovation = innovation.firstInnovationNumber;
        } else {
            const innovationProperties: InnovationProperties = {
                type: 'newConnection',
                idSourceNode: connection.source.uID,
                idTargetNode: connection.target.uID,
                firstInnovationNumber: Innovation._currentHighestInnovationNumber + 1,
                recurrent: connection.isRecurrent
            };
            const newInnovation = Innovation.createInnovation(innovationProperties);
            NeatPopulation.innovations.push(newInnovation);
            connection.innovation = newInnovation.firstInnovationNumber;
        }
        this.connections.push(connection);
        if (connection.isRecurrent) {
            this.isRecurrent = true;
        }
    }

    /**
     * Transforms this NeatChromosome into a JSON representation.
     * @return Record containing most important attribute keys mapped to their values.
     */
    public toJSON(): Record<string, (number | NodeGene | ConnectionGene)> {
        const network = {};
        network[`id`] = this.uID;

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
        if (this.currentActivationTrace !== undefined) {
            network['AT'] = this.currentActivationTrace.toJSON();
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
