import {NeatPopulation} from "./NeatPopulation";
import {NeatProperties} from "../HyperParameter/NeatProperties";
import {StatementFitnessFunction} from "../../testcase/fitness/StatementFitnessFunction";
import {NeatChromosome} from "../Networks/NeatChromosome";

export class TargetStatementPopulation extends NeatPopulation {

    private readonly _startingNetwork: NeatChromosome;

    constructor(hyperParameter: NeatProperties, targetStatement: StatementFitnessFunction, startingNetwork: NeatChromosome) {
        super(undefined, hyperParameter, targetStatement);
        this._startingNetwork = startingNetwork;
        this._startingNetwork.targetFitness = this._targetStatement;
        this._startingNetwork.initialiseStatementTargets([...this._startingNetwork.statementTargets.keys()]);
    }

    /**
     * Generates an initial population of networks by duplicating and mutating the starting network.
     * We also set the target fitness function.
     */
    public generatePopulation(): void {
        // Add the starting network to the population.
        this.networks.push(this._startingNetwork.clone());
        // Keep mutating the starting network until we have reached the desired population size.
        while (this.networks.length < this.hyperParameter.populationSize) {
            const mutant = this._startingNetwork.mutate();
            mutant.targetFitness = this._targetStatement;
            mutant.initialiseStatementTargets([...this._startingNetwork.statementTargets.keys()]);
            this.networks.push(mutant);
        }

        // Assign each network to a species.
        this.networks.forEach(network => this.speciate(network));
    }
}
