import {Mutation} from "../search/Mutation";
import {NetworkChromosome} from "./NetworkChromosome";
import {List} from "../utils/List";
import {NodeGene} from "./NetworkNodes/NodeGene";
import {ConnectionGene} from "./ConnectionGene";
import {NodeType} from "./NetworkNodes/NodeType";
import {Randomness} from "../utils/Randomness";
import {ActivationFunction} from "./NetworkNodes/ActivationFunction";
import {NeuroevolutionUtil} from "./NeuroevolutionUtil";
import {HiddenNode} from "./NetworkNodes/HiddenNode";


export class NeatMutation implements Mutation<NetworkChromosome> {

    /**
     * Saves all encountered innovations
     */
    public static _innovations = new List<ConnectionGene>();

    /**
     * Random generator
     */
    private _random = Randomness.getInstance();

    /**
     * Probability for applying the addConnection mutation
     */
    private readonly _mutationAddConnection;

    /**
     * Probability for adding a recurrent connection during the addConnection mutation
     */
    private readonly _recurrentConnection;

    /**
     * Number of tries for adding a new connection during the addConnection mutation
     */
    private readonly _addConnectionTries;

    /**
     * Probability for applying an addConnection mutation to a population champ (otherwise we only perturb its weights)
     */
    private readonly _populationChampionConnectionMutation;
    private readonly _mutationAddNode;

    /**
     * Probability for applying a weight mutation
     */
    private readonly _mutateWeights;

    /**
     * Power of the weight perturbation
     */
    private readonly _perturbationPower;

    /**
     * Probability for applying the toggleEnableConnection mutation
     */
    private readonly _mutateToggleEnableConnection;

    /**
     * Defines how many connections are toggled during the toggleEnableConnection mutation
     */
    private readonly _toggleEnableConnectionTimes;

    /**
     * Probability for applying the mutateConnectionReenable mutation
     */
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

    /**
     * Apply the mutation operator
     * @param chromosome the chromosome to mutate
     */
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

    /**
     * Adds a new connection to the network.
     * @param chromosome the chromosome to mutate
     * @param tries the number of tries after we give up finding a new valid connection
     */
    mutateAddConnection(chromosome: NetworkChromosome, tries: number): void {
        let rounds = 0;
        let node1: NodeGene;
        let node2: NodeGene;

        // Collect all nodes to which a new connection can point -> all nodes except the input and bias nodes
        const recurrentNodes = new List<NodeGene>();
        for (const node of chromosome.allNodes) {
            if ((node.type !== NodeType.INPUT) && (node.type !== NodeType.BIAS))
                recurrentNodes.add(node);
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
                if (this._random.nextDouble() < 0.25) {
                    loopRecurrency = true
                }
                // Loop: The node points to itself X -> X
                if (loopRecurrency) {
                    node1 = this._random.pickRandomElementFromList(recurrentNodes);
                    node2 = node1;
                }
                // Normal Recurrency: Y -> X
                else {
                    node1 = this._random.pickRandomElementFromList(recurrentNodes);
                    node2 = this._random.pickRandomElementFromList(recurrentNodes);
                }
            }

            // No recurrent connection
            else {
                node1 = this._random.pickRandomElementFromList(chromosome.allNodes);
                node2 = this._random.pickRandomElementFromList(recurrentNodes);
            }

            // Verify if the new connection already exists
            let skip = false;
            for (const connection of chromosome.connections) {
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
                // Verify if we got a recurrent connection if we wanted a recurrent one and vice versa
                const threshold = chromosome.allNodes.size() * chromosome.allNodes.size()
                const isRecurrent = chromosome.isRecurrentPath(node1, node2, 0, threshold);
                if ((!isRecurrent && recurrentConnection) || (isRecurrent && !recurrentConnection)) {
                    rounds++;
                } else {
                    // We found a connection so we exit the while loop
                    rounds = tries;
                    foundConnection = true;
                }
            } else {
                rounds++;
            }
        }

        // Assign a random weight and an innovation number to the new connection.
        // Finally, add it to the chromosome's connectionGene List
        if (foundConnection) {
            const posNeg = this._random.randomBoolean() ? +1 : -1;
            const weight = posNeg * this._random.nextDouble() * 10.0;
            const newConnection = new ConnectionGene(node1, node2, weight, true, 0, recurrentConnection);
            NeuroevolutionUtil.assignInnovationNumber(newConnection);
            chromosome.connections.add(newConnection);
            if (recurrentConnection) {
                chromosome.isRecurrent = true;
            }
        }
    }

    /**
     * Adds a new node to the network
     * @param chromosome the chromosome to mutate
     */
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

        // Create the new hiddenNode and the connections leading in and out of the new node
        const newNode = new HiddenNode(chromosome.allNodes.size(), ActivationFunction.SIGMOID)

        const newConnection1 = new ConnectionGene(fromNode, newNode, 1, true, 0, splitConnection.recurrent)
        NeuroevolutionUtil.assignInnovationNumber(newConnection1);
        newNode.incomingConnections.add(newConnection1);

        const newConnection2 = new ConnectionGene(newNode, toNode, oldWeight, true, 0, false)
        NeuroevolutionUtil.assignInnovationNumber(newConnection2);
        toNode.incomingConnections.add(newConnection2);

        chromosome.connections.add(newConnection1);
        chromosome.connections.add(newConnection2);
        chromosome.allNodes.add(newNode);

        const threshold = chromosome.allNodes.size() * chromosome.allNodes.size()
        chromosome.isRecurrentPath(fromNode, newNode, 0, threshold)
        chromosome.isRecurrentPath(newNode, toNode, 0, threshold)

    }

    /**
     * Perturbs all weights of a network.
     * @param chromosome the chromosome to mutate
     * @param power the strength of the perturbation
     * @param rate defines if we add a value to a connection weight or replace the connection weight entirely
     */
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

    /**
     * Toggles the enable state of times connections of the network
     * @param chromosome the chromosome to mutate
     * @param times defines how many connections are toggled
     */
    mutateToggleEnableConnection(chromosome: NetworkChromosome, times: number): void {
        for (let count = 0; count <= times; count++) {
            // Pick a random connection
            const chosenConnection = this._random.pickRandomElementFromList(chromosome.connections);

            // If we disable a connection, we have to make sure that another connection links out of the in-node
            // in order to not loose a bigger section of the network
            if (chosenConnection.isEnabled) {
                let save = false;
                for (const otherConnection of chromosome.connections) {
                    if (((otherConnection.source.equals(chosenConnection.source)) && (otherConnection.isEnabled) &&
                        (chosenConnection.innovation !== otherConnection.innovation)) || chosenConnection.recurrent) {
                        save = true;
                        break;
                    }
                }
                if (save)
                    chosenConnection.isEnabled = false;
            } else
                chosenConnection.isEnabled = true;
        }

        // Finally check if we changed the isRecurrent state by disabling or enabling a recurrent connection.
        chromosome.isRecurrent = false;
        for (const connection of chromosome.connections)
            if (connection.isEnabled && connection.recurrent) {
                chromosome.isRecurrent = true;
                break;
            }
    }

    /**
     * Enables one connection of a network.
     * @param chromosome the chromosome to mutate
     */
    mutateConnectionReenable(chromosome: NetworkChromosome): void {
        for (const connection of chromosome.connections) {
            if (!connection.isEnabled) {
                connection.isEnabled = true;
                if (connection.recurrent) {
                    chromosome.isRecurrent = true;
                }
                break;
            }
        }
    }
}
