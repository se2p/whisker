import {Mutation} from "../search/Mutation";
import {NeatChromosome} from "./NeatChromosome";
import {NeatConfig} from "./NeatConfig";
import {List} from "../utils/List";
import {NodeGene} from "./NodeGene";
import {ConnectionGene} from "./ConnectionGene";


export class NeatMutation implements Mutation<NeatChromosome> {
    apply(chromosome: NeatChromosome): NeatChromosome {
        if (Math.random() <= NeatConfig.WEIGHT_MUTATION)
            this.mutateWeight(chromosome);
        if (Math.random() <= NeatConfig.ADD_CONNECTION_MUTATION)
            this.mutateAddConnection(chromosome);
        return chromosome;
    }

    mutateWeight(chromosome: NeatChromosome): NeatChromosome {
        for (const connection of chromosome.getConnections()) {
            if (Math.random() <= NeatConfig.WEIGHT_PERTURB_CHANCE) {
                const test = this.randomNumber(-1, 1)
                connection.weight += this.randomNumber(-1, 1);
            }
        }
        return chromosome;
    }

    mutateAddConnection(chromosome: NeatChromosome): NeatChromosome {
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

        return chromosome;
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
