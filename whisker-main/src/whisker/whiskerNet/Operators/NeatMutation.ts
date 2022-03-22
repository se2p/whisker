import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {NodeType} from "../NetworkComponents/NodeType";
import {Randomness} from "../../utils/Randomness";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {HiddenNode} from "../NetworkComponents/HiddenNode";
import {NetworkMutation} from "./NetworkMutation";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {NeatPopulation} from "../NeuroevolutionPopulations/NeatPopulation";
import {Pair} from "../../utils/Pair";


export class NeatMutation implements NetworkMutation<NeatChromosome> {

    /**
     * Saves all encountered innovations.
     */
    public static _innovations: ConnectionGene[] = [];

    /**
     * Random generator.
     */
    private _random = Randomness.getInstance();

    /**
     * Probability for applying the addConnection mutation.
     */
    private readonly _mutationAddConnection: number;

    /**
     * Probability for adding a recurrent connection during the addConnection mutation.
     */
    private readonly _recurrentConnection: number;

    /**
     * Number of tries for adding a new connection during the addConnection mutation.
     */
    private readonly _addConnectionTries: number;

    /**
     * Probability for applying an addConnection mutation to a population champ (otherwise we only perturb its weights).
     */
    private readonly _populationChampionConnectionMutation: number;

    /**
     * Probability of apply an add node mutation.
     */
    private readonly _mutationAddNode: number;

    /**
     * Probability for applying a weight mutation.
     */
    private readonly _mutateWeights: number;

    /**
     * Power of the weight perturbation.
     */
    private readonly _perturbationPower: number;

    /**
     * Probability for applying the toggleEnableConnection mutation.
     */
    private readonly _mutateToggleEnableConnection: number;

    /**
     * Defines how many connections are toggled during the toggleEnableConnection mutation.
     */
    private readonly _toggleEnableConnectionTimes: number;

    /**
     * Probability for applying the mutateConnectionReenable mutation.
     */
    private readonly _mutateEnableConnection: number;

    /**
     * Saves the source and target node for each generated hidden node.
     */
    private readonly _hiddenNodes = new Map<HiddenNode, Pair<NodeGene>>();

    constructor(mutationConfig: Record<string, (string | number)>) {
        this._mutationAddConnection = mutationConfig.mutationAddConnection as number;
        this._recurrentConnection = mutationConfig.recurrentConnection as number;
        this._addConnectionTries = mutationConfig.addConnectionTries as number;
        this._populationChampionConnectionMutation = mutationConfig.populationChampionConnectionMutation as number;
        this._mutationAddNode = mutationConfig.mutationAddNode as number;
        this._mutateWeights = mutationConfig.mutateWeights as number;
        this._perturbationPower = mutationConfig.perturbationPower as number;
        this._mutateToggleEnableConnection = mutationConfig.mutateToggleEnableConnection as number;
        this._toggleEnableConnectionTimes = mutationConfig.toggleEnableConnectionTimes as number;
        this._mutateEnableConnection = mutationConfig.mutateEnableConnection as number;
    }

    /**
     * Apply the mutation operator
     * @param parent the chromosome to mutate
     */
    apply(parent: NeatChromosome): NeatChromosome {
        const mutant = parent.cloneStructure(true);
        // Special treatment for population Champions => either add a Connection or change the weights
        if (parent.isPopulationChampion) {
            if (this._random.nextDouble() <= this._populationChampionConnectionMutation) {
                this.mutateAddConnection(mutant, this._addConnectionTries);
            } else {
                this.mutateWeight(mutant, this._perturbationPower, 1);
            }
        }

        // If we dont have a population Champion apply either structural mutation or non structural mutation but not both!
        else {
            // Structural mutation
            if (this._random.nextDouble() < this._mutationAddNode) {
                this.mutateAddNode(mutant);
            } else if (this._random.nextDouble() < this._mutationAddConnection) {
                this.mutateAddConnection(mutant, this._addConnectionTries);
            }

            // Non structural mutation
            else {
                if (this._random.nextDouble() < this._mutateWeights)
                    this.mutateWeight(mutant, this._perturbationPower, 1);
                if (this._random.nextDouble() < this._mutateToggleEnableConnection)
                    this.mutateToggleEnableConnection(mutant, this._toggleEnableConnectionTimes);
                if (this._random.nextDouble() < this._mutateEnableConnection)
                    this.mutateConnectionReenable(mutant);
            }
        }
        return mutant;
    }

    /**
     * Adds a new connection to the network.
     * @param chromosome the chromosome to mutate
     * @param tries the number of tries after we give up finding a new valid connection
     */
    mutateAddConnection(chromosome: NeatChromosome, tries: number): void {
        let rounds = 0;
        let node1: NodeGene;
        let node2: NodeGene;

        // Collect all nodes to which a new connection can point -> all nodes except the input and bias nodes
        const targetNodes: NodeGene[] = [];
        const loopRecurrentNodes: HiddenNode[] = [];
        for (const node of chromosome.allNodes) {
            if ((node.type !== NodeType.INPUT) && (node.type !== NodeType.BIAS)) {
                targetNodes.push(node);
            }
            // LoopRecurrency in outputNodes lead to defect network since they never stabilize
            if (node instanceof HiddenNode) {
                loopRecurrentNodes.push(node);
            }
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
                let loopRecurrency = false;
                if (loopRecurrentNodes.length !== 0 && this._random.nextDouble() < 0.25) {
                    loopRecurrency = true;
                }
                // Loop: The node points to itself X -> X
                if (loopRecurrency) {
                    node1 = this._random.pick(loopRecurrentNodes);
                    node2 = node1;
                }
                // Normal Recurrency: Y -> X
                else {
                    node1 = this._random.pick(targetNodes);
                    node2 = this._random.pick(targetNodes);
                }
            }

            // No recurrent connection
            else {
                node1 = this._random.pick(chromosome.allNodes);
                node2 = this._random.pick(targetNodes);
            }

            // Verify if the new connection is a valid one
            let skip = false;

            // By chance we could get a recurrent loop connection even though we don't want one.
            if (!recurrentConnection && node1 === node2) {
                skip = true;
            }

            // Verify if we truly found a new connection.
            if (!skip) {
                for (const connection of chromosome.connections) {
                    if (connection.source === node1 && connection.target === node2 && connection.isRecurrent && recurrentConnection) {
                        skip = true;
                        break;
                    }

                    if (connection.source === node1 && connection.target === node2 && !connection.isRecurrent && !recurrentConnection) {
                        skip = true;
                        break;
                    }
                }
            }

            // We found a valid connection to add
            if (!skip) {
                // Verify if we got a recurrent connection if we wanted a recurrent one and vice versa
                const threshold = chromosome.allNodes.length * chromosome.allNodes.length;
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
            const weight = posNeg * this._random.nextDouble() * this._perturbationPower;
            const newConnection = new ConnectionGene(node1, node2, weight, true, 0, recurrentConnection);
            NeatPopulation.assignInnovationNumber(newConnection);
            chromosome.connections.push(newConnection);
            if (recurrentConnection) {
                chromosome.isRecurrent = true;
            }
        }
    }

    /**
     * Adds a new node to the network
     * @param chromosome the chromosome to mutate
     */
    mutateAddNode(chromosome: NeatChromosome): void {

        let count = 0;
        let found = false;
        let splitConnection: ConnectionGene;

        // Find a connection which is isEnabled and not a bias
        while ((count < 20) && (!found)) {
            splitConnection = this._random.pick(chromosome.connections);
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
        const newNode = new HiddenNode(ActivationFunction.SIGMOID);

        let foundNode = false;
        for (const hiddenNode of this._hiddenNodes.keys()) {
            const nodePair = this._hiddenNodes.get(hiddenNode);
            if(nodePair[0].equals(fromNode) && nodePair[1].equals(toNode)){
                newNode.uID = hiddenNode.uID;
                foundNode = true;
                break;
            }
        }

        if(!foundNode){
            this._hiddenNodes.set(newNode, [fromNode, toNode]);
        }

        const newConnection1 = new ConnectionGene(fromNode, newNode, 1, true, 0, splitConnection.isRecurrent);
        NeatPopulation.assignInnovationNumber(newConnection1);
        newNode.incomingConnections.push(newConnection1);

        const newConnection2 = new ConnectionGene(newNode, toNode, oldWeight, true, 0, false);
        NeatPopulation.assignInnovationNumber(newConnection2);
        toNode.incomingConnections.push(newConnection2);

        chromosome.connections.push(newConnection1);
        chromosome.connections.push(newConnection2);
        chromosome.allNodes.push(newNode);

        const threshold = chromosome.allNodes.length * chromosome.allNodes.length;
        chromosome.isRecurrentPath(fromNode, newNode, 0, threshold);
        chromosome.isRecurrentPath(newNode, toNode, 0, threshold);

    }

    /**
     * Perturbs all weights of a network.
     * @param chromosome the chromosome to mutate
     * @param power the strength of the perturbation
     * @param rate defines if we add a value to a connection weight or replace the connection weight entirely
     */
    public mutateWeight(chromosome: NeatChromosome, power: number, rate: number): void {
        let gaussPoint = 0;
        let coldGaussPoint = 0;

        // Randomly shake things up!
        const severe = this._random.nextDouble() > 0.5;

        const connections = chromosome.connections;
        const connectionsSize = connections.length;
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
    mutateToggleEnableConnection(chromosome: NeatChromosome, times: number): void {
        for (let count = 0; count <= times; count++) {
            // Pick a random connection
            const chosenConnection = this._random.pick(chromosome.connections);

            // If we disable a connection, we have to make sure that another connection links out of the in-node
            // in order to not loose a bigger section of the network
            if (chosenConnection.isEnabled) {
                let save = false;
                for (const otherConnection of chromosome.connections) {
                    if (((otherConnection.source.equals(chosenConnection.source)) && (otherConnection.isEnabled) &&
                        (chosenConnection.innovation !== otherConnection.innovation)) || chosenConnection.isRecurrent) {
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
            if (connection.isEnabled && connection.isRecurrent) {
                chromosome.isRecurrent = true;
                break;
            }
    }

    /**
     * Enables one connection of a network.
     * @param chromosome the chromosome to mutate
     */
    mutateConnectionReenable(chromosome: NeatChromosome): void {
        for (const connection of chromosome.connections) {
            if (!connection.isEnabled) {
                connection.isEnabled = true;
                if (connection.isRecurrent) {
                    chromosome.isRecurrent = true;
                }
                break;
            }
        }
    }
}
