import {Mutation} from "../search/Mutation";
import {NeatChromosome} from "./NeatChromosome";
import {NeatConfig} from "./NeatConfig";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {ConnectionGene} from "./ConnectionGene";
import {NodeType} from "./NodeType";


export class NeatMutation implements Mutation<NeatChromosome> {
    apply(chromosome: NeatChromosome): NeatChromosome {
        if (Math.random() <= NeatConfig.MUTATE_WEIGHT_NETWORK_LEVEL)
            this.mutateWeight(chromosome);
        if (Math.random() <= NeatConfig.MUTATE_ADD_CONNECTION)
            this.mutateAddConnection(chromosome);
        if (Math.random() <= NeatConfig.MUTATE_CONNECTION_STATE)
            this.mutateConnectionState(chromosome);
        if (Math.random() <= NeatConfig.MUTATE_ADD_NODE)
            this.mutateAddNode(chromosome);
        return chromosome;
    }

    mutateAddConnection(chromosome: NeatChromosome): void {
        chromosome.generateNetwork();
        const fromList = new List<NodeGene>();
        const toList = new List<NodeGene>();
        // Collect all possible node from which and to which a connection is possible
        chromosome.nodes.forEach(((value, key) => {
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

        // Create new Connection
        const mutatedConnection = new ConnectionGene(fromNode, toNode, this.randomNumber(-1, 1), Math.random() < 0.8)

        // If its a new connection add it to the list of connections
        if (!this.containsConnection(chromosome.getConnections(), mutatedConnection))
            chromosome.getConnections().add(mutatedConnection);
    }

    mutateAddNode(chromosome: NeatChromosome): void {
        const connections = chromosome.getConnections();
        // Select a random Connection to split => the new node is placed in between the connection
        const splitConnection = connections.get(Math.floor(Math.random() * connections.size()))
        // Disable the old connection
        splitConnection.enabled = false;

        // Rewire the Network with the new Node
        const fromNode = splitConnection.from;
        const toNode = splitConnection.to;
        const newNode = new NodeGene(NodeType.HIDDEN, 0);

        // Restrict the network to mutate over MAX_HIDDEN_LAYERS layers
        const fromNodeLayer = chromosome.findLayerOfNode(chromosome.getNodes(), fromNode)
        const toNodeLayer = chromosome.findLayerOfNode(chromosome.getNodes(), toNode)
        if (fromNodeLayer + toNodeLayer >= NeatConfig.MAX_HIDDEN_LAYERS * 2 - 1) {
            return;
        }

        // The connection into the new Node gets a weight of 1
        const inConnection = new ConnectionGene(fromNode, newNode, 1, true);
        connections.add(inConnection)

        // The connection out of the new Node gets the same weight as the old connection
        const outConnection = new ConnectionGene(newNode, toNode, splitConnection.weight, true);
        connections.add(outConnection)
        toNode.inputConnections.add(outConnection)
    }

    mutateWeight(chromosome: NeatChromosome): void {
        for (const connection of chromosome.getConnections()) {
            if (Math.random() <= NeatConfig.MUTATE_WEIGHT) {
                connection.weight += this.randomNumber(-1, 1);
            }
        }
    }


    mutateConnectionState(chromosome: NeatChromosome): void {
        const connections = chromosome.getConnections();
        // Pick random connection
        const connection = connections.get(Math.floor(Math.random() * connections.size()))
        // Flip the state
        connection.enabled = !connection.enabled;
    }

    private randomNumber(min: number, max: number): number {
        return Math.random() * (max - min) + min
    }

    private containsConnection(connections: List<ConnectionGene>, connection: ConnectionGene): boolean {
        for (const con of connections) {
            if (con.equals(connection)) return true;
        }
        return false;
    }

}
