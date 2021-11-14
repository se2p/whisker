import {NodeGene} from "../NetworkComponents/NodeGene";
import {ConnectionGene} from "../NetworkComponents/ConnectionGene";
import {InputNode} from "../NetworkComponents/InputNode";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {HiddenNode} from "../NetworkComponents/HiddenNode";
import {BiasNode} from "../NetworkComponents/BiasNode";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {NeatChromosomeGenerator} from "./NeatChromosomeGenerator";
import {NeatChromosome} from "../Networks/NeatChromosome";

export class NeatChromosomeGeneratorTemplateNetwork extends NeatChromosomeGenerator {

    /**
     * The template of the existing Network from which a new network will be generated.
     */
    private readonly _networkTemplate: Record<string, (number | string | Record<string, (number | string)>)>

    /**
     * All ScratchEvents for which output nodes have to be generated.
     */
    private readonly _scratchEvents: ScratchEvent[];

    /**
     * The number of networks that should be generated.
     */
    private readonly _numberNetworks: number;

    /**
     * Constructs a new NeatChromosomeGeneratorTemplateNetwork that loads networks from a specified networkTemplate
     * file.
     * @param mutationConfig the configuration parameters for the mutation operator.
     * @param crossoverConfig the configuration parameters for the crossover operator.
     * @param networkTemplate the template of the existing Network from which a new network will be generated.
     * @param scratchEvents all ScratchEvents for which output nodes have to be generated.
     */
    constructor(mutationConfig: Record<string, (string | number)>, crossoverConfig: Record<string, (string | number)>,
                networkTemplate: string, scratchEvents: ScratchEvent[]) {
        super(mutationConfig, crossoverConfig);
        this._networkTemplate = JSON.parse(networkTemplate);
        this._numberNetworks = Object.keys(this._networkTemplate).length;
        this._scratchEvents = scratchEvents;
    }

    /**
     * Generates NeatChromosome that resemble the NeatChromosomes specified within the networkTemplate. The networks
     * are generated in a round robin fashion from the networkTemplate.
     * @returns NeatChromosome the loaded network from the networkTemplate file.
     */
    get(): NeatChromosome {
        const networkKey = Object.keys(this._networkTemplate)[NeatChromosome._uIDCounter % this._numberNetworks];
        const networkTemplate = this._networkTemplate[networkKey];
        const allNodes: NodeGene[] = [];
        for (const nodeKey in networkTemplate['Nodes']) {
            const node = networkTemplate['Nodes'][nodeKey];
            switch (node.t) {
                case "I": {
                    const iNode = new InputNode(node.sprite, node.feature, false);
                    iNode.uID = node.id;
                    allNodes.push(iNode);
                }
                    break;
                case "B": {
                    const biasNode = new BiasNode(false);
                    biasNode.uID = node.id;
                    allNodes.push(biasNode);
                }
                    break;
                case "H": {
                    const hiddenNode = new HiddenNode(ActivationFunction.SIGMOID, false);
                    hiddenNode.uID = node.id;
                    allNodes.push(hiddenNode);
                }
                    break;
                case "C": {
                    const event = this._scratchEvents.find(event => event.stringIdentifier() === node.event);
                    if (event) {
                        const classificationNode = new ClassificationNode(event, ActivationFunction.SIGMOID, false);
                        classificationNode.uID = node.id;
                        allNodes.push(classificationNode);
                    }
                    break;
                }
                case "R": {
                    const event = this._scratchEvents.find(event => event.stringIdentifier() === node.event);
                    if (event) {
                        const regressionNode = new RegressionNode(event, node.eventParameter, ActivationFunction.NONE);
                        regressionNode.uID = node.id;
                        allNodes.push(regressionNode);
                    }
                    break;
                }
            }
        }
        const allConnections: ConnectionGene[] = [];
        for (const connectionKey in networkTemplate['Cons']) {
            const connection = networkTemplate['Cons'][connectionKey];
            const sourceNode = allNodes.find(node => node.uID === connection.s);
            const targetNode = allNodes.find(node => node.uID === connection.t);
            const recurrent = connection.r === `true`;
            if (sourceNode && targetNode) {
                allConnections.push(new ConnectionGene(sourceNode, targetNode, connection.w, connection.e,
                    connection.i, recurrent));
            }
        }
        const network = new NeatChromosome(allNodes, allConnections, this._mutationOp, this._crossoverOp);

        // Only copy the first network. No need to have multiple copies of the same chromosome.
        if (network.uID > this._numberNetworks) {
            network.mutate();
        }
        return network
    }

    /**
     * Creates connections between input and output nodes. Function not required since connections are already defined
     * through the networks contained within the template file.
     * @return [] empty array since this function is not used within the template generator.
     */
    createConnections(): ConnectionGene[] {
        return [];
    }
}
