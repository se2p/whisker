import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {NodeGene} from "../NetworkComponents/NodeGene";
import {NeatMutation} from "../Operators/NeatMutation";
import {ActivationFunction} from "../NetworkComponents/ActivationFunction";
import {RegressionNode} from "../NetworkComponents/RegressionNode";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {NeatCrossover} from "../Operators/NeatCrossover";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {InputConnectionMethod} from "../Networks/NetworkChromosome";
import {InputNode} from "../NetworkComponents/InputNode";
import {BiasNode} from "../NetworkComponents/BiasNode";
import {ClassificationNode} from "../NetworkComponents/ClassificationNode";

export class NeatChromosomeGenerator implements ChromosomeGenerator<NeatChromosome> {

    /**
     * Constructs a new NeatChromosomeGenerator.
     * @param _inputSpace determines the input nodes of the network to generate.
     * @param _outputSpace determines the output nodes of the network to generate.
     * @param _inputConnectionMethod determines how the input layer will be connected to the output layer.
     * @param _activationFunction the activation function used for the generated nodes.
     * @param _mutationOperator the mutation operator.
     * @param _crossoverOperator the crossover operator.
     * @param _inputRate governs the probability of adding multiple input groups to the network when a sparse
     * connection method is being used.
     */
    public constructor(private readonly _inputSpace: Map<string, Map<string, number>>,
                          private readonly _outputSpace: ScratchEvent[],
                          protected readonly _inputConnectionMethod: InputConnectionMethod,
                          protected readonly _activationFunction: ActivationFunction,
                          private _mutationOperator: NeatMutation,
                          private _crossoverOperator: NeatCrossover,
                          private _inputRate = 0.3) {
    }

    /**
     * Generates a single NeatChromosome using the specified connection method.
     * @returns generated NeatChromosome.
     */
    get():
        NeatChromosome {
        NodeGene._uIDCounter = 0;
        const allNodes: NodeGene[] = [];

        // Create the Input Nodes
        const inputNodes = new Map<string, Map<string, InputNode | BiasNode>>();
        for (const [sprite, featureMap] of this._inputSpace) {
            const spriteFeatureMap = new Map<string, InputNode>();
            for (const feature of featureMap.keys()) {
                const featureInputNode = new InputNode(allNodes.length, sprite, feature);
                allNodes.push(featureInputNode);
                spriteFeatureMap.set(feature, featureInputNode);
            }
            inputNodes.set(sprite, spriteFeatureMap);
        }

        // Add the Bias
        const biasNode = new BiasNode(allNodes.length);
        const biasMap = new Map<string, BiasNode>();
        allNodes.push(biasNode);
        biasMap.set("Bias", biasNode);
        inputNodes.set("Bias", biasMap);

        // Create the classification output nodes and add them to the nodes list
        for (const event of this._outputSpace) {
            const classificationNode = new ClassificationNode(allNodes.length, event, ActivationFunction.NONE);
            allNodes.push(classificationNode);
        }

        // Add regression nodes for each parameter of each parameterized Event
        const parameterizedEvents = this._outputSpace.filter(event => event.numSearchParameter() > 0);
        if (parameterizedEvents.length !== 0) {
            this.addRegressionNodes(allNodes, parameterizedEvents);
        }

        // Create connections between input and output nodes
        const chromosome = new NeatChromosome(allNodes, [], this._mutationOperator, this._crossoverOperator,
            this._inputConnectionMethod, this._activationFunction);
        const outputNodes = chromosome.allNodes.filter(
            node => node instanceof ClassificationNode || node instanceof RegressionNode);
            chromosome.connectNodeToInputLayer(outputNodes, inputNodes, this._inputConnectionMethod);

        // Mutate weights to randomise initial weight configuration
        const mutationOperator = chromosome.getMutationOperator();
        if (mutationOperator instanceof NeatMutation) {
            mutationOperator.mutateWeight(chromosome, 1);
        }
        chromosome.generateNetwork();
        return chromosome;
    }

    /**
     * Adds regression nodes to the network.
     * @param allNodes contains all nodes of the generated network.
     * @param parameterizedEvents contains all parameterized Events of the given Scratch-Project.
     */
    protected addRegressionNodes(allNodes: NodeGene[], parameterizedEvents: ScratchEvent[]): void {
        for (const event of parameterizedEvents) {
            for (const parameter of event.getSearchParameterNames()) {
                // Create the regression Node and add it to the NodeList
                const regressionNode = new RegressionNode(allNodes.length, event, parameter, ActivationFunction.NONE);
                allNodes.push(regressionNode);
            }
        }
    }

    setMutationOperator(mutationOp: NeatMutation): void {
        this._mutationOperator = mutationOp;
    }

    setCrossoverOperator(crossoverOp: NeatCrossover): void {
        this._crossoverOperator = crossoverOp;
    }
}
