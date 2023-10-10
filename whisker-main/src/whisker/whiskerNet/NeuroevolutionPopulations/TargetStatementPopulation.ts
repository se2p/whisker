import {NeatPopulation} from "./NeatPopulation";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";
import {Container} from "../../utils/Container";
import {Randomness} from "../../utils/Randomness";
import {NeatestParameter} from "../HyperParameter/NeatestParameter";
import {NeuroevolutionTestGenerationParameter} from "../HyperParameter/NeuroevolutionTestGenerationParameter";
import {ScratchEvent} from "../../testcase/events/ScratchEvent";
import {FeatureGroup, InputFeatures} from "../Misc/InputExtraction";
import {NeatChromosomeGenerator} from "../NetworkGenerators/NeatChromosomeGenerator";

export class TargetStatementPopulation extends NeatPopulation {

    constructor(generator: ChromosomeGenerator<NeatChromosome>, hyperParameter: NeuroevolutionTestGenerationParameter,
                private readonly _allStatements: number[],
                private readonly _targetStatementFitness: StatementFitnessFunction,
                private readonly _startingNetworks: NeatChromosome[],
                private readonly _switchedToEasierTarget: boolean,
                private readonly _randomFraction: number) {
        super(generator, hyperParameter);
    }

    /**
     * Generates an initial population of networks by cloning and mutating networks that
     * proved to be viable solutions for their targeted statement. To not get stuck in certain network structures
     * and to favour simple network structures, we also generate some new networks. In case we have not yet covered
     * anything, we just generate the desired number of networks using the defined NetworkGenerator.
     */
    public override generatePopulation(): void {
        // If we don't have any starting networks, i.e. it's the first ever selected fitness target simply generate
        // the desired number of networks using the defined generator.
        if (this._startingNetworks.length === 0) {
            while (this.networks.length < this.populationSize) {
                const network = this.generator.get();
                this.networks.push(network);
            }
        } else {

            const discoveredInputs = this._fetchDiscoveredInputStates();
            const discoveredEvents = this._fetchDiscoveredOutputEvents();
            if (this.generator instanceof NeatChromosomeGenerator) {
                this.generator.inputSpace = discoveredInputs;
                this.generator.outputSpace = discoveredEvents;
            }

            // Otherwise, we start with cloning all starting networks.
            for (const network of this._startingNetworks) {
                // Stop if we already hit the population boundary.
                if (this.networks.length >= this.hyperParameter.populationSize) {
                    break;
                }
                const clone = network.cloneStructure(true);
                this.networks.push(clone);
            }

            // Then, we fill our population with new networks based on the supplied randomFraction.
            const newNetworksSize = Math.floor(this._randomFraction * this.hyperParameter.populationSize);
            const random = Randomness.getInstance();

            for (let i = 0; i < newNetworksSize; i++) {
                // Stop if we already hit the population boundary.
                if (this.networks.length >= this.hyperParameter.populationSize) {
                    break;
                }
                const network = this.generator.get();

                // With the given probability, we apply gradient descent if enabled
                if (Container.backpropagationInstance && !this._switchedToEasierTarget &&
                    random.nextDouble() <= (this.hyperParameter as NeatestParameter).gradientDescentProb) {
                    Container.backpropagationInstance.gradientDescent(network, this._targetStatementFitness.getNodeId());
                }

                this.networks.push(network);
            }

            // The remaining networks are generated by mutating prior solutions.
            this._startingNetworks.forEach(network => network.gradientDescentChild = false);
            let i = 0;
            while (this.networks.length < this.hyperParameter.populationSize) {
                const parent = this._startingNetworks[i % this._startingNetworks.length];
                const mutant = parent.mutate();
                this.networks.push(mutant);
                i++;
            }
        }

        // Finally, allocate the statementTarget map, set the fitness to the targeted statement and speciate each
        // generated network.
        for (const network of this.networks) {
            network.initialiseOpenStatements(this._allStatements);
            network.targetFitness = this._targetStatementFitness;
            this.speciate(network);
        }
    }


    /**
     * Ponders through the provided starting networks and collects all input states discovered so far.
     * @returns mapping of sprite names to corresponding sprite features.
     */
    private _fetchDiscoveredInputStates(): InputFeatures {
        const inputs: InputFeatures = new Map<string, FeatureGroup>();
        for (const network of this._startingNetworks) {
            const networkFeatures = network.extractInputFeatures();
            for (const [sprite, features] of networkFeatures.entries()) {
                inputs.set(sprite, features);
            }
        }
        return inputs;
    }

    /**
     * Ponders through the provided starting networks and collects all supported output events so far.
     * @returns array of found {@link ScratchEvent}s.
     */
    private _fetchDiscoveredOutputEvents(): ScratchEvent[] {
        const discoveredEvents = new Map<string, ScratchEvent>();
        for (const network of this._startingNetworks) {
            const networkOutputs = network.extractOutputFeatures();
            for (const [identifier, event] of networkOutputs.entries()) {
                discoveredEvents.set(identifier, event);
            }
        }
        return [...discoveredEvents.values()];
    }
}
