import {List} from "../../utils/List";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {NetworkChromosomeGenerator} from "./NetworkChromosomeGenerator";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {InputNode} from "../NetworkComponents/InputNode";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {HiddenNode} from "../NetworkComponents/HiddenNode";
import {BiasNode} from "../NetworkComponents/BiasNode";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";

export class NetworkChromosomeGeneratorTemplateNetwork extends NetworkChromosomeGenerator {

    /**
     * The template of the existing Network
     */
    private readonly _networkTemplate: Record<string, (number | string | Record<string, (number | string)>)>

    /**
     * All Scratch-Events the given Scratch project handles.
     */
    private readonly _scratchEvents: List<ScratchEvent>;

    /**
     * The number of networks that should be generated.
     */
    private readonly _numberNetworks: number;

    /**
     * Constructs a new NetworkGenerator which generates copies of an existing network.
     * @param networkTemplate the template of the existing network from which we want to create a population of.
     * @param mutationConfig the configuration parameters for the mutation operator.
     * @param crossoverConfig the configuration parameters for the crossover operator.
     * @param scratchEvents all Scratch-Events found in the project.
     */
    constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>,
                networkTemplate: string, scratchEvents: List<ScratchEvent>) {
        super(mutationConfig, crossoverConfig);
        this._networkTemplate = JSON.parse(networkTemplate);
        this._numberNetworks = Object.keys(this._networkTemplate).length;
        this._scratchEvents = scratchEvents;
    }

    /**
     * Creates and returns a random NetworkChromosome with the specified number of input and output nodes
     * and a random set of connections in between them.
     * @return: generated NetworkChromosome
     */
    get(): NetworkChromosome {
        const networkKey = Object.keys(this._networkTemplate)[NetworkChromosome._uIDCounter % this._numberNetworks];
        const networkTemplate = this._networkTemplate[networkKey];
        const allNodes = new List<NodeGene>();
        for (const nodeKey in networkTemplate['Nodes']) {
            const node = networkTemplate['Nodes'][nodeKey];
            switch (node.t) {
                case "I":
                    allNodes.add(new InputNode(node.id, node.sprite, node.feature));
                    break;
                case "B":
                    allNodes.add(new BiasNode(node.id));
                    break;
                case "H":
                    allNodes.add(new HiddenNode(node.id, ActivationFunction.SIGMOID));
                    break;
                case "C": {
                    const event = this._scratchEvents.find(event => event.stringIdentifier() === node.event);
                    if (event) {
                        allNodes.add(new ClassificationNode(node.id, event, ActivationFunction.SIGMOID));
                    }
                    break;
                }
                case "R": {
                    const event = this._scratchEvents.find(event => event.stringIdentifier() === node.event);
                    if (event) {
                        allNodes.add(new RegressionNode(node.id, event, node.eventParameter, ActivationFunction.NONE));
                    }
                    break;
                }
            }
        }
        const allConnections = new List<ConnectionGene>();
        for (const connectionKey in networkTemplate['Cons']) {
            const connection = networkTemplate['Cons'][connectionKey];
            const sourceNode = allNodes.find(node => node.uID === connection.s);
            const targetNode = allNodes.find(node => node.uID === connection.t);
            const recurrent = connection.r === `true`;
            if (sourceNode && targetNode) {
                allConnections.add(new ConnectionGene(sourceNode, targetNode, connection.w, connection.e,
                    connection.i, recurrent));
            }
        }
        const network = new NetworkChromosome(allConnections, allNodes, this._mutationOp, this._crossoverOp);

        // Only copy the first network. No need to have multiple copies of the same chromosome.
        if (network.uID > this._numberNetworks) {
            network.mutate();
        }
        return network
    }

    /**
     * Creates connections between input and output nodes. Function not required since connections are already defined
     * through template network.
     * @return undefined since connections are defined through template
     */
    createConnections(): List<ConnectionGene> {
        return undefined;
    }
}
