import {NeatPopulation} from "./NeatPopulation";
import {NeatProperties} from "../HyperParameter/NeatProperties";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";

export class TargetStatementPopulation extends NeatPopulation {

    private readonly _startingNetworks: NeatChromosome[];

    constructor(hyperParameter: NeatProperties, targetStatement: StatementFitnessFunction,
                startingNetworks: NeatChromosome[]) {
        super(undefined, hyperParameter, targetStatement);
        this._startingNetworks = startingNetworks;
        for (const network of startingNetworks) {
            network.targetFitness = this._targetStatement;
            network.initialiseStatementTargets([...network.statementTargets.keys()]);
        }
    }

    /**
     * Generates an initial population of networks by duplicating and mutating the starting network.
     * We also set the target fitness function.
     */
    public generatePopulation(): void {
        // Add the starting network to the population.
        for (const network of this._startingNetworks) {
            this.networks.push(network.clone());
        }
        console.log("Starting: ", this._startingNetworks)
        console.log("Before Mutation: ", this.networks.length)
        // Keep mutating the starting network until we have reached the desired population size.
        let i = 0;
        while (this.networks.length < this.hyperParameter.populationSize) {
            const parent = this._startingNetworks[i % this._startingNetworks.length];
            const mutant = parent.mutate();
            mutant.targetFitness = this._targetStatement;
            mutant.initialiseStatementTargets([...parent.statementTargets.keys()]);
            this.networks.push(mutant);
            i++;
        }
        console.log("After mutation: ", this.networks.length)

        // Assign each network to a species.
        this.networks.forEach(network => this.speciate(network));
    }
}
