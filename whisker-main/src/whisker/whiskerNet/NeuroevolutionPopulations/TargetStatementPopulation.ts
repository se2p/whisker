import {NeatPopulation} from "./NeatPopulation";
import {NeatProperties} from "../HyperParameter/NeatProperties";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {FitnessFunction} from "../../search/FitnessFunction";
import {NetworkChromosome} from "../Networks/NetworkChromosome";
import {ChromosomeGenerator} from "../../search/ChromosomeGenerator";

export class TargetStatementPopulation extends NeatPopulation {

    constructor(generator: ChromosomeGenerator<NeatChromosome>, hyperParameter: NeatProperties,
                private readonly _allStatements: FitnessFunction<NetworkChromosome>[],
                private readonly _targetStatementFitness: StatementFitnessFunction,
                private readonly _startingNetworks: NeatChromosome[]) {
        super(generator, hyperParameter);
    }

    /**
     * Generates an initial population of networks by duplicating and mutating the saved starting networks, which
     * proved to be viable solutions for their targeted statement. In case we have not yet covered anything, just
     * generate the desired amount of networks using the defined NetworkGenerator.
     */
    public generatePopulation(): void {
        // If we don't have any starting networks, i.e. it's the first ever selected fitness target simply generate
        // the desired amount of networks using the defined generator.
        if (this._startingNetworks.length === 0) {
            while (this.networks.length < this.populationSize) {
                const network = this.generator.get();
                this.networks.push(network);
            }
        } else {
            // Otherwise, start by first cloning all starting networks.
            for (const network of this._startingNetworks) {
                this.networks.push(network.cloneStructure(true));
            }
            // Then, keep mutating the starting network until we have reached the desired population size.
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
            network.initialiseStatementTargets(this._allStatements);
            network.targetFitness = this._targetStatementFitness;
            this.speciate(network);
        }
    }
}
