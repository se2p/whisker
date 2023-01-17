import {NeatPopulation} from "./NeatPopulation";
import {NeuroevolutionTestGenerationParameter} from "../HyperParameter/NeuroevolutionTestGenerationParameter";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {FitnessFunction} from "../../search/FitnessFunction";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";

export class TargetStatementPopulation extends NeatPopulation {

    constructor(generator: ChromosomeGenerator<NeatChromosome>, hyperParameter: NeuroevolutionTestGenerationParameter,
                private readonly _allStatements: FitnessFunction<NetworkChromosome>[],
                private readonly _targetStatementFitness: StatementFitnessFunction,
                private readonly _startingNetworks: NeatChromosome[],
                private readonly _randomFraction: number) {
        super(generator, hyperParameter);
    }

    /**
     * Generates an initial population of networks by cloning and mutating networks that
     * proved to be viable solutions for their targeted statement. To not get stuck in certain network structures
     * and to favour simple network structures, we also generate some new networks. In case we have not yet covered
     * anything, we just generate the desired amount of networks using the defined NetworkGenerator.
     */
    public override generatePopulation(): void {
        // If we don't have any starting networks, i.e. it's the first ever selected fitness target simply generate
        // the desired amount of networks using the defined generator.
        if (this._startingNetworks.length === 0) {
            while (this.networks.length < this.populationSize) {
                const network = this.generator.get();
                this.networks.push(network);
            }
        } else {

            // Otherwise, we start with cloning all starting networks.
            for (const network of this._startingNetworks) {
                // Stop if we already hit the population boundary.
                if (this.networks.length >= this.hyperParameter.populationSize) {
                    break;
                }
                this.networks.push(network.cloneStructure(true));
            }

            // Then, we fill our population with new networks based on the supplied randomFraction.
            const newNetworksSize = Math.floor(this._randomFraction * this.hyperParameter.populationSize);
            for (let i = 0; i < newNetworksSize; i++) {
                // Stop if we already hit the population boundary.
                if (this.networks.length >= this.hyperParameter.populationSize) {
                    break;
                }
                const network = this.generator.get();
                this.networks.push(network);
            }

            // The remaining networks are generated by mutating prior solutions.
            // Reset the sgd parent flag for the new target.
            this._startingNetworks.forEach(network => network.hasSGDChild = false);
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
}
