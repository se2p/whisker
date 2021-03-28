import {Mutation} from "../search/Mutation";
import {NetworkChromosome} from "./NetworkChromosome";
import {List} from "../utils/List";
import {NodeGene} from "./NetworkNodes/NodeGene";
import {ConnectionGene} from "./ConnectionGene";
import {NodeType} from "./NetworkNodes/NodeType";
import {Randomness} from "../utils/Randomness";
import {ActivationFunction} from "./NetworkNodes/ActivationFunction";
import {HiddenNode} from "./NetworkNodes/HiddenNode";


export class NeatMutation implements Mutation<NetworkChromosome> {

    public static _innovations = new List<ConnectionGene>();
    private _random = Randomness.getInstance();

    private readonly _mutationAddConnection;
    private readonly _recurrentConnection;
    private readonly _addConnectionTries;
    private readonly _populationChampionConnectionMutation;
    private readonly _mutationAddNode;
    private readonly _mutateWeights;
    private readonly _perturbationPower;
    private readonly _mutateToggleEnableConnection;
    private readonly _toggleEnableConnectionTimes;
    private readonly _mutateEnableConnection;

    constructor(mutationAddConnection: number, recurrentConnection: number, addConnectionTries: number,
                populationChampionConnectionMutation: number, mutationAddNode: number, mutateWeights: number,
                perturbationPower: number, mutateToggleEnableConnection: number, toggleEnableConnectionTimes: number,
                mutateEnableConnection: number) {
        this._mutationAddConnection = mutationAddConnection;
        this._recurrentConnection = recurrentConnection;
        this._addConnectionTries = addConnectionTries;
        this._populationChampionConnectionMutation = populationChampionConnectionMutation;
        this._mutationAddNode = mutationAddNode;
        this._mutateWeights = mutateWeights;
        this._perturbationPower = perturbationPower;
        this._mutateToggleEnableConnection = mutateToggleEnableConnection;
        this._toggleEnableConnectionTimes = toggleEnableConnectionTimes;
        this._mutateEnableConnection = mutateEnableConnection;
    }

    apply(chromosome: NetworkChromosome): NetworkChromosome {
        // Special treatment for population Champions => either add a Connection or change the weights
        if (chromosome.isPopulationChampion) {
            if (this._random.nextDouble() <= this._populationChampionConnectionMutation) {
                this.mutateAddConnection(chromosome, this._addConnectionTries);
            } else {
                this.mutateWeight(chromosome, this._perturbationPower, 1);
            }
        }

        // If we dont have a population Champion apply either structural mutation or non structural mutation but not both!
        else {
            // Structural mutation
            if (this._random.nextDouble() < this._mutationAddNode) {
                this.mutateAddNode(chromosome);
            } else if (this._random.nextDouble() < this._mutationAddConnection) {
                this.mutateAddConnection(chromosome, this._addConnectionTries);
            }

            // Non structural mutation
            else {
                if (this._random.nextDouble() < this._mutateWeights)
                    this.mutateWeight(chromosome, this._perturbationPower, 1);
                if (this._random.nextDouble() < this._mutateToggleEnableConnection)
                    this.mutateToggleEnableConnection(chromosome, this._toggleEnableConnectionTimes);
                if (this._random.nextDouble() < this._mutateEnableConnection)
                    this.mutateConnectionReenable(chromosome);
            }
        }
        return chromosome;
    }

    mutateAddConnection(chromosome: NetworkChromosome, tries: number): void {

        let rounds = 0;
        let node1: NodeGene;
        let node2: NodeGene;

        // Collect all nodes to which a new connection can point -> all nodes except the input and bias nodes
        const possibleToNodes = new List<NodeGene>();
        for (const node of chromosome.allNodes) {
            if ((node.type !== NodeType.INPUT) && (node.type !== NodeType.BIAS))
                possibleToNodes.add(node);
        }

        // Decide if we want a recurrent Connection
        let recurrentConnection = false;
        if (this._random.nextDouble() < this._recurrentConnection) {
            recurrentConnection = true;
        }

        // Checks if we found a connection to add
        let foundConnection = false;
        while (rounds < tries) {

            // Recurrent connection
            if (recurrentConnection) {
                //Decide between loop and normal recurrency
                let loopRecurrency = false
                if (this._random.nextDouble() > 0.5) {
                    loopRecurrency = true
                }
                // Loop: The node points to itself X -> X
                if (loopRecurrency) {
                    node1 = this._random.pickRandomElementFromList(possibleToNodes);
                    node2 = node1;
                }
                // Normal Recurrency: Y -> X
                else {
                    node1 = this._random.pickRandomElementFromList(chromosome.allNodes);
                    node2 = this._random.pickRandomElementFromList(possibleToNodes);
                }
            }

            // No recurrent connection
            else {
                node1 = this._random.pickRandomElementFromList(chromosome.allNodes);
                node2 = this._random.pickRandomElementFromList(possibleToNodes);
            }

            // Verify if the new connection already exists
            let skip = false;
            for (const connection of chromosome.connections) {

                // Double Check if we dont have a connection pointing to an input or bias Node
                if (node2.type === NodeType.INPUT || node2.type === NodeType.BIAS) {
                    skip = true;
                    break;
                }

                if (connection.source === node1 && connection.target === node2 && connection.recurrent && recurrentConnection) {
                    skip = true;
                    break;
                }

                if (connection.source === node1 && connection.target === node2 && !connection.recurrent && !recurrentConnection) {
                    skip = true;
                    break;
                }
            }

            // We found a valid connection to add
            if (!skip) {
                const threshold = chromosome.allNodes.size() * chromosome.allNodes.size();
                const recurrentNetwork = chromosome.isRecurrentNetwork(node1, node2)
                if ((!recurrentNetwork && recurrentConnection) || (recurrentNetwork && !recurrentConnection)) {
                    rounds++;
                } else {
                    rounds = tries;
                    foundConnection = true;
                }
            } else {
                rounds++;
            }
        }

        if (foundConnection) {
            const posNeg = this._random.randomBoolean() ? +1 : -1;
            const weight = posNeg * this._random.nextDouble() * 10.0;
            const newConnection = new ConnectionGene(node1, node2, weight, true, 0, recurrentConnection);
            NeatMutation.assignInnovationNumber(newConnection);
            chromosome.connections.add(newConnection);
        }
    }

    mutateAddNode(chromosome: NetworkChromosome): void {

        let count = 0;
        let found = false;
        let splitConnection: ConnectionGene;

        // Find a connection which is isEnabled and not a bias
        while ((count < 20) && (!found)) {
            splitConnection = this._random.pickRandomElementFromList(chromosome.connections);
            if (splitConnection.isEnabled && (splitConnection.source.type !== NodeType.BIAS))
                found = true;
            count++;
        }

        // If we didnt find a connection do nothing.
        if (!found)
            return;

        // Disable the old connection
        splitConnection.isEnabled = false;

        // Save the old weight and the nodes of the connection
        const oldWeight = splitConnection.weight;
        const fromNode = splitConnection.source;
        const toNode = splitConnection.target;

        const newNode = new HiddenNode(chromosome.allNodes.size(), ActivationFunction.SIGMOID)

        const newConnection1 = new ConnectionGene(fromNode, newNode, 1, true, 0, splitConnection.recurrent)
        NeatMutation.assignInnovationNumber(newConnection1);
        newNode.incomingConnections.add(newConnection1);

        const newConnection2 = new ConnectionGene(newNode, toNode, oldWeight, true, 0, false)
        NeatMutation.assignInnovationNumber(newConnection2);
        toNode.incomingConnections.add(newConnection2);

        chromosome.connections.add(newConnection1);
        chromosome.connections.add(newConnection2);
        chromosome.allNodes.add(newNode);

        const threshold = chromosome.allNodes.size() * chromosome.allNodes.size();
        chromosome.isRecurrentNetwork(fromNode, newNode)
        chromosome.isRecurrentNetwork(newNode, toNode)

    }

    public mutateWeight(chromosome: NetworkChromosome, power: number, rate: number): void {
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


    mutateToggleEnableConnection(chromosome: NetworkChromosome, times: number): void {
        for (let count = 0; count <= times; count++) {
            // Pick a random connection
            const chosenConnection = this._random.pickRandomElementFromList(chromosome.connections);

            // If we disable a connection, we have to make sure that another connection links out of the in-node
            // in order to not loose a bigger section of the network
            if (chosenConnection.isEnabled) {
                let save = false;
                for (const otherConnection of chromosome.connections) {
                    if ((otherConnection.source.equals(chosenConnection.source)) && (otherConnection.isEnabled) &&
                        (chosenConnection.innovation !== otherConnection.innovation)) {
                        save = true;
                        break;
                    }
                }
                if (save)
                    chosenConnection.isEnabled = false;
            } else
                chosenConnection.isEnabled = true;

            const threshold = chromosome.allNodes.size() * chromosome.allNodes.size();
            chromosome.isRecurrentNetwork(chosenConnection.source, chosenConnection.target)
        }
    }

    mutateConnectionReenable(chromosome: NetworkChromosome): void {
        for (const connection of chromosome.connections) {
            if (!connection.isEnabled) {
                connection.isEnabled = true;
                const threshold = chromosome.allNodes.size() * chromosome.allNodes.size();
                chromosome.isRecurrentNetwork(connection.source, connection.target)
                break;
            }
        }
    }

    private static findConnection(connections: List<ConnectionGene>, connection: ConnectionGene): ConnectionGene {
        for (const con of connections) {
            if (con.equalsByNodes(connection)) return con;
        }
        return null;
    }

    private static assignInnovationNumber(newInnovation: ConnectionGene): void {
        // Check if innovation already happened in this generation if Yes assign the same innovation number
        const oldInnovation = NeatMutation.findConnection(NeatMutation._innovations, newInnovation)
        if (oldInnovation !== null)
            newInnovation.innovation = oldInnovation.innovation;
        // If No assign a new one
        else {
            newInnovation.innovation = ConnectionGene.getNextInnovationNumber();
            NeatMutation._innovations.add(newInnovation);
        }
    }
}
