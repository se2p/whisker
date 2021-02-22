import {Mutation} from "../search/Mutation";
import {NeatChromosome} from "./NeatChromosome";
import {NeatConfig} from "./NeatConfig";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {ConnectionGene} from "./ConnectionGene";
import {NodeType} from "./NodeType";


export class NeatMutation implements Mutation<NeatChromosome> {

    // Arbitrary easily detectable value in case of bugs => a connection should never have this value
    private static readonly TEMP_INNOVATION_NUMBER = 100000;

    public static _innovations = new List<ConnectionGene>();

    apply(chromosome: NeatChromosome): NeatChromosome {

        // Special treatment for population Champions => either add a Connection or change the weights
        if(chromosome.populationChampion){
            if(Math.random() <= NeatConfig.POPULATION_CHAMPION_CONNECTION_MUTATION){
                this.mutateAddConnection(chromosome);
            }
            else {
                this.mutateWeight(chromosome);
            }
        }

        // If we dont have a population Champion apply either structural mutation or non structural mutation but not both!
        else {
            // Structural mutation
            if(Math.random() < NeatConfig.MUTATE_ADD_NODE) {
                this.mutateAddNode(chromosome);
            }
            else if(Math.random() < NeatConfig.MUTATE_ADD_CONNECTION)
                this.mutateAddConnection(chromosome);

            // Non structural mutation
            else{
                if(Math.random() < NeatConfig.MUTATE_WEIGHT_NETWORK_LEVEL)
                    this.mutateWeight(chromosome);
                if(Math.random() < NeatConfig.MUTATE_CONNECTION_STATE)
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
            if (key < NeatConfig.MAX_HIDDEN_LAYERS)
                fromList.addList(value);
            // Exclude connections to inputNodes
            if (key > 0)
                toList.addList(value);
        }))

        // Pick random from and to Node
        const fromNode = fromList.get(Math.floor(Math.random() * fromList.size()));
        const toNode = toList.get(Math.floor(Math.random() * toList.size()));

        const fromLayer = chromosome.findLayerOfNode(chromosome.layerMap,fromNode)
        const toLayer = chromosome.findLayerOfNode(chromosome.layerMap, toNode)

        // Create new Connection with temporary innovation number
        const mutatedConnection = new ConnectionGene(fromNode, toNode, this.randomNumber(-1, 1),
            Math.random() < 0.8, NeatMutation.TEMP_INNOVATION_NUMBER)

        // If its a new Connection assign the correct innovationNumber and add it to the list
        if (!this.containsConnection(chromosome.connections, mutatedConnection) && (fromLayer !== toLayer)) {
            this.assignInnovationNumber(mutatedConnection)
            chromosome.connections.add(mutatedConnection);
        }
    }

    mutateAddNode(chromosome: NeatChromosome): void {
        chromosome.generateNetwork();
        const connections = chromosome.connections;
        // Select a random Connection to split => the new node is placed in between the connection
        const splitConnection = connections.get(Math.floor(Math.random() * connections.size()))
        // Disable the old connection
        splitConnection.enabled = false;

        // Rewire the Network with the new Node
        const fromNode = splitConnection.from;
        const toNode = splitConnection.to;
        const newNode = new NodeGene(chromosome.allNodes.size(), NodeType.HIDDEN);

        // Restrict the network to mutate over MAX_HIDDEN_LAYERS layers
        const fromNodeLayer = chromosome.findLayerOfNode(chromosome.layerMap, fromNode)
        const toNodeLayer = chromosome.findLayerOfNode(chromosome.layerMap, toNode)
        if (fromNodeLayer + toNodeLayer >= NeatConfig.MAX_HIDDEN_LAYERS * 2 - 1) {
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

    mutateWeight(chromosome: NeatChromosome): void {
        chromosome.generateNetwork();
        for (const connection of chromosome.connections) {
            if (Math.random() <= NeatConfig.MUTATE_WEIGHT_UNIFORMLY) {
                connection.weight += this.randomNumber(-0.5, 0.5);
            }
            else
                connection.weight = this.randomNumber(-1, 1)
        }
    }


    mutateConnectionState(chromosome: NeatChromosome): void {
        chromosome.generateNetwork();
        const connections = chromosome.connections;
        // Pick random connection
        const connection = connections.get(Math.floor(Math.random() * connections.size()))
        // Flip the state
        connection.enabled = !connection.enabled;

        //Check the network and re-enable the connection if by chance we destroyed the network
        chromosome.generateNetwork();
        const testInput = [];
        for (let i = 0; i < chromosome.inputNodes.size(); i++) {
            testInput.push(i);
        }
        if(chromosome.activateNetwork(testInput, true) === null)
            connection.enabled = true;
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
