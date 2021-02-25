import {Mutation} from "../search/Mutation";
import {NeatChromosome} from "./NeatChromosome";
import {NeatParameter} from "./NeatParameter";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {ConnectionGene} from "./ConnectionGene";
import {NodeType} from "./NodeType";
import {Randomness} from "../utils/Randomness";


export class NeatMutation implements Mutation<NeatChromosome> {

    // Arbitrary easily detectable value in case of bugs => a connection should never have this value
    private static readonly TEMP_INNOVATION_NUMBER = 100000;

    public static _innovations = new List<ConnectionGene>();
    private _random = Randomness.getInstance();

    apply(chromosome: NeatChromosome): NeatChromosome {

        // Special treatment for population Champions => either add a Connection or change the weights
        if (chromosome.populationChampion) {
            if (Math.random() <= 0.8) {
                this.mutateWeight(chromosome, NeatParameter.MUTATE_WEIGHT_POWER, 1);
            } else {
                this.mutateAddConnection(chromosome);
            }
        }

        // If we dont have a population Champion apply either structural mutation or non structural mutation but not both!
        else {
            // Structural mutation
            if (Math.random() < NeatParameter.MUTATE_ADD_NODE) {
                this.mutateAddNode(chromosome);
            } else if (Math.random() < NeatParameter.MUTATE_ADD_CONNECTION) {
                this.mutateAddConnection(chromosome);
            }

            // Non structural mutation
            else {
                if (Math.random() < NeatParameter.MUTATE_WEIGHT_NETWORK_LEVEL)
                    this.mutateWeight(chromosome, NeatParameter.MUTATE_WEIGHT_POWER, 1);
                if (Math.random() < NeatParameter.MUTATE_CONNECTION_STATE)
                    this.mutateConnectionState(chromosome);
            }
        }
        return chromosome;
    }

    mutateAddConnection(chromosome: NeatChromosome): void {
        chromosome.generateNetwork();
        const fromList = new List<NodeGene>();
        const toList = new List<NodeGene>();
        // Collect all possible node from which and to which a connection is possible
        chromosome.layerMap.forEach(((value, key) => {
            // Exclude connections from outputNodes
            if (key < NeatParameter.MAX_HIDDEN_LAYERS)
                fromList.addList(value);
            // Exclude connections to inputNodes
            if (key > 0)
                toList.addList(value);
        }))

        // Pick random from and to Node
        const fromNode = this._random.pickRandomElementFromList(fromList);
        const toNode = this._random.pickRandomElementFromList(toList);

        const fromLayer = chromosome.findLayerOfNode(chromosome.layerMap, fromNode)
        const toLayer = chromosome.findLayerOfNode(chromosome.layerMap, toNode)

        // Create new Connection with temporary innovation number
        const mutatedConnection = new ConnectionGene(fromNode, toNode, this.randomNumber(-1, 1),
            Math.random() < 0.8, NeatMutation.TEMP_INNOVATION_NUMBER)

        // If its a new Connection assign the correct innovationNumber and add it to the list
        if (!this.containsConnection(chromosome.connections, mutatedConnection) && (fromLayer !== toLayer) && !(fromNode.equals(toNode))) {
            this.assignInnovationNumber(mutatedConnection)
            chromosome.connections.add(mutatedConnection);
        }
    }

    mutateAddNode(chromosome: NeatChromosome): void {
        chromosome.generateNetwork();
        const connections = chromosome.connections;
        // Select a random Connection to split => the new node is placed in between the connection
        const splitConnection = this._random.pickRandomElementFromList(connections);
        if (splitConnection === undefined) {
            console.error("Undefined connection")
            console.log(chromosome)
            return;
        }
        // Disable the old connection
        splitConnection.enabled = false;

        // Rewire the Network with the new Node
        const fromNode = splitConnection.from;
        const toNode = splitConnection.to;
        const newNode = new NodeGene(chromosome.allNodes.size(), NodeType.HIDDEN);

        // Restrict the network to mutate over MAX_HIDDEN_LAYERS layers
        const fromNodeLayer = chromosome.findLayerOfNode(chromosome.layerMap, fromNode)
        const toNodeLayer = chromosome.findLayerOfNode(chromosome.layerMap, toNode)
        if (fromNodeLayer + toNodeLayer >= (NeatParameter.MAX_HIDDEN_LAYERS * 2 - 1)) {
            return;
        }

        // The connection into the new Node gets a weight of 1
        const inConnection = new ConnectionGene(fromNode, newNode, 1, true,
            NeatMutation.TEMP_INNOVATION_NUMBER);
        this.assignInnovationNumber(inConnection)
        connections.add(inConnection)

        // The connection out of the new Node gets the same weight as the old connection
        const outConnection = new ConnectionGene(newNode, toNode, splitConnection.weight, true,
            NeatMutation.TEMP_INNOVATION_NUMBER);
        this.assignInnovationNumber(outConnection);
        connections.add(outConnection)
        toNode.incomingConnections.add(outConnection)
    }

    public mutateWeight(chromosome: NeatChromosome, power: number, rate: number): void {

        let gaussPoint = 0;
        let coldGaussPoint = 0;

        // Randomly shake things up!
        const severe = this._random.nextDouble() > 0.5;

        const connections = chromosome.connections;
        const connectionsSize = connections.size();
        const endPart = connectionsSize * 0.8;
        const powerMod = 1.0;
        let counter = 0;


        for (const connection of connections) {
            if (severe) {
                gaussPoint = 0.3;
                coldGaussPoint = 0.1;
            } else {

                if (connectionsSize >= 10 && counter > endPart) {
                    gaussPoint = 0.5;
                    coldGaussPoint = 0.3;
                } else {
                    if (this._random.nextDouble() > 0.5) {
                        gaussPoint = 1.0 - rate;
                        coldGaussPoint = 1.0 - rate - 0.1;
                    } else {
                        gaussPoint = 1.0 - rate;
                        coldGaussPoint = 1.0 - rate;
                    }
                }
            }

            const randomPosNegValue = this._random.randomBoolean() ? +1 : -1;
            const weightModification = randomPosNegValue * this._random.nextDouble() * power * powerMod;
            const randomDouble = this._random.nextDouble();
            if (randomDouble > gaussPoint)
                connection.weight += weightModification;
            else if (randomDouble > coldGaussPoint)
                connection.weight = weightModification;
            counter++;
        }

    }


    mutateConnectionState(chromosome: NeatChromosome): void {
        chromosome.generateNetwork();
        const connections = chromosome.connections;
        // Pick random connection
        const connection = this._random.pickRandomElementFromList(connections);
        if (connection === undefined) {
            console.error("Undefined connection")
            console.log(chromosome)
            return;
        }
        // Flip the state
        connection.enabled = !connection.enabled;

        //Check the network and re-enable the connection if by chance we destroyed the network
        chromosome.generateNetwork();
        const testInput = [];
        for (let i = 0; i < chromosome.inputNodes.size(); i++) {
            testInput.push(i);
        }
    }

    private randomNumber(min: number, max: number): number {
        return Math.random() * (max - min) + min
    }

    private containsConnection(connections: List<ConnectionGene>, connection: ConnectionGene): boolean {
        for (const con of connections) {
            if (con.equalsByNodes(connection)) return true;
        }
        return false;
    }

    private findConnection(connections: List<ConnectionGene>, connection: ConnectionGene): ConnectionGene {
        for (const con of connections) {
            if (con.equalsByNodes(connection)) return con;
        }
        return null;
    }

    private assignInnovationNumber(newInnovation: ConnectionGene): void {
        // Check if innovation already happened in this generation if Yes assign the same innovation number
        const oldInnovation = this.findConnection(NeatMutation._innovations, newInnovation)
        if (oldInnovation !== null)
            newInnovation.innovation = oldInnovation.innovation;
        // If No assign a new one
        else {
            newInnovation.innovation = ConnectionGene.getNextInnovationNumber();
            NeatMutation._innovations.add(newInnovation);
        }
    }
}
