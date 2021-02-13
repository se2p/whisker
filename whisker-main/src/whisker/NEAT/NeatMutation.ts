import {Mutation} from "../search/Mutation";
import {NeatChromosome} from "./NeatChromosome";
import {NeatConfig} from "./NeatConfig";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {ConnectionGene} from "./ConnectionGene";


export class NeatMutation implements Mutation<NeatChromosome> {
    apply(chromosome: NeatChromosome): NeatChromosome {
        if (Math.random() <= NeatConfig.MUTATE_WEIGHT_NETWORK_LEVEL)
            this.mutateWeight(chromosome);
        if (Math.random() <= NeatConfig.MUTATE_ADD_CONNECTION)
            this.mutateAddConnection(chromosome);
        if (Math.random() <= NeatConfig.MUTATE_CONNECTION_STATE)
            this.mutateConnectionState(chromosome);
        return chromosome;
    }

    mutateWeight(chromosome: NeatChromosome): void {
        for (const connection of chromosome.getConnections()) {
            if (Math.random() <= NeatConfig.MUTATE_WEIGHT) {
                connection.weight += this.randomNumber(-1, 1);
            }
        }
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
