import {NeatPopulation} from "./NeatPopulation";
import {NeatProperties} from "../HyperParameter/NeatProperties";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {Randomness} from "../../utils/Randomness";

export class NeatTrainPopulation extends NeatPopulation {

    /**
     * The starting networks based on which a generation of networks will be built.
     */
    private readonly startingNetworks: NeatChromosome[];

    constructor(hyperParameter: NeatProperties, startingNetworks: NeatChromosome[]) {
        super(undefined, hyperParameter);
        this.startingNetworks = startingNetworks;
    }

    /**
     * Generates an initial population of networks by duplicating and mutating an existing set of networks.
     */
    public generatePopulation(): void {
        if (this.startingNetworks.length > this.hyperParameter.populationSize) {
            throw Error("In order to re-train an existing population the desired population size must be bigger than" +
                " the number of networks one wants to re-train.");
        }
        // Add the starting networks to the population.
        this.networks.push(...this.startingNetworks);

        // Pick a random starting network, mutate it and add it to the population until we reach the desired
        // population size.
        const random = Randomness.getInstance();
        while (this.networks.length < this.hyperParameter.populationSize) {
            this.networks.push(random.pick(this.networks).mutate());
        }

        // Assign each network to a species.
        this.networks.forEach(network => this.speciate(network));
    }
}
