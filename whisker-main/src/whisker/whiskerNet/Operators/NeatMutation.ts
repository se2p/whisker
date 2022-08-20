import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {NodeType} from "../NetworkComponents/NodeType";
import {Randomness} from "../../utils/Randomness";
import {NetworkMutation} from "./NetworkMutation";
import {NeatChromosome} from "../Networks/NeatChromosome";


export class NeatMutation implements NetworkMutation<NeatChromosome> {

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
        let mutated = false;
        const mutant = parent.cloneStructure(true);
        do {
            // Special treatment for population Champions => either add a Connection or change the weights
            if (parent.isPopulationChampion) {
                mutated = true;
                if (this._random.nextDouble() <= this._populationChampionConnectionMutation) {
                    this.mutateAddConnection(mutant, this._addConnectionTries);
                } else {
                    this.mutateWeight(mutant, this._perturbationPower);
                }
            }

            // If we don't have a population Champion apply either structural mutation or non-structural mutation but
            // not both!
            else {
                // Structural mutation
                if (this._random.nextDouble() < this._mutationAddNode) {
                    mutated = true;
                    this.mutateAddNode(mutant);
                } else if (this._random.nextDouble() < this._mutationAddConnection) {
                    mutated = true;
                    this.mutateAddConnection(mutant, this._addConnectionTries);
                }

                // Non structural mutation
                else {
                    if (this._random.nextDouble() < this._mutateWeights) {
                        mutated = true;
                        this.mutateWeight(mutant, this._perturbationPower);
                    }
                    if (this._random.nextDouble() < this._mutateToggleEnableConnection) {
                        mutated = true;
                        this.mutateToggleEnableConnection(mutant, this._toggleEnableConnectionTimes);
                    }
                    if (this._random.nextDouble() < this._mutateEnableConnection) {
                        mutated = true;
                        this.mutateConnectionReenable(mutant);
                    }
                }
            }
        } while (!mutated);
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
        const targetNodes = chromosome.allNodes.filter(node =>
            node.type !== NodeType.INPUT && node.type !== NodeType.BIAS);

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
                if (this._random.nextDouble() < 0.25) {
                    loopRecurrency = true;
                }
                // Loop: The node points to itself X -> X
                if (loopRecurrency) {
                    node1 = this._random.pick(targetNodes);
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

            // By chance, we could get a recurrent loop connection even though we don't want one.
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
                if (isRecurrent === recurrentConnection) {
                    rounds = tries;
                    foundConnection = true;
                } else {
                    rounds++;
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
            chromosome.addConnection(newConnection);
        }
    }

    /**
     * Adds a new node to the network.
     * @param chromosome the chromosome to mutate.
     */
    mutateAddNode(chromosome: NeatChromosome): void {

        let count = 0;
        let found = false;
        let splitConnection: ConnectionGene;

        // Find a connection which is isEnabled and not a bias
        while ((count < 20) && (!found)) {
            splitConnection = this._random.pick(chromosome.connections);
            if (splitConnection.isEnabled && splitConnection.source.type !== NodeType.BIAS)
                found = true;
            count++;
        }

        // If we did not manage to find a connection do nothing...
        if (!found) {
            return;
        }

        chromosome.addNodeSplitConnection(splitConnection);
    }

    /**
     * Perturbs all weights of a network.
     * @param chromosome the chromosome to mutate
     * @param power the strength of the perturbation
     */
    // TODO: Think about decreasing the mutation power for early genes since they proved to work...
    public mutateWeight(chromosome: NeatChromosome, power: number): void {
        const connections = chromosome.connections;
        for (const connection of connections) {
            if (this._random.nextDouble() < 0.1) {
                connection.weight = this._random.nextDoubleMinMax(-power, power);
            } else {
                connection.weight = this._random.nextGaussian(connection.weight, power);
            }
        }
    }

    /**
     * Toggles the enabled state of times connections of the network
     * @param chromosome the chromosome to mutate
     * @param times defines how many connections are toggled
     */
    mutateToggleEnableConnection(chromosome: NeatChromosome, times: number): void {
        for (let count = 0; count <= times; count++) {
            // Pick a random connection
            const chosenConnection = this._random.pick(chromosome.connections);

            // If we disable a connection, we have to make sure that another connection links out of the in-node
            // in order to not lose a bigger section of the network
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

        // Finally, check if we changed the isRecurrent state by disabling or enabling a recurrent connection.
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
