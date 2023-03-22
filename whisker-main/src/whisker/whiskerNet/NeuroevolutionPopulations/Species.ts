import {Randomness} from "../../utils/Randomness";
import {NeatChromosome} from "../Networks/NeatChromosome";
import {NeatPopulation} from "./NeatPopulation";
import {NeuroevolutionTestGenerationParameter} from "../HyperParameter/NeuroevolutionTestGenerationParameter";
import Arrays from "../../utils/Arrays";
import {Container} from "../../utils/Container";

export class Species<C extends NeatChromosome> {

    /**
     * The hyperParameters defined by the user.
     */
    private readonly _hyperParameter: NeuroevolutionTestGenerationParameter;

    /**
     * Unique identifier for the species.
     */
    private readonly _uID: number;

    /**
     * Saves the member of the species.
     */
    private readonly _networks: C[] = []

    /**
     * The age of the species.
     */
    private _age = 1;

    /**
     * Average fitness across all member of the species.
     */
    private _averageFitness = 0;

    /**
     * Average shared fitness across all member of the species.
     */
    private _averageSharedFitness = 0;

    /**
     * The best fitness value of the species' current population.
     */
    private _currentBestFitness = 0;

    /**
     * The highest achieved fitness value of the species.
     */
    private _allTimeBestFitness = 0;

    /**
     * The number of offspring the species is allowed to produce.
     */
    private _expectedOffspring = 0;

    /**
     * Flag determining whether the species was just born.
     */
    private _isNovel: boolean;

    /**
     * Age value since at least one member of the species has achieved a new highest fitness value.
     */
    private _ageOfLastImprovement = 1;

    /**
     * Saves the best performing network of the species.
     */
    private _champion: C

    /**
     * Random number generator.
     */
    private _randomness = Randomness.getInstance();


    /**
     * Constructs a new Species.
     * @param uID the id of the species
     * @param novel true if it's a new species
     * @param hyperParameter the search parameters
     */
    constructor(uID: number, novel: boolean, hyperParameter: NeuroevolutionTestGenerationParameter) {
        this._uID = uID;
        this._isNovel = novel;
        this._hyperParameter = hyperParameter;
    }

    /**
     * Removes the specified network from the species.
     * @param network the network that should be removed.
     */
    public removeNetwork(network: C): void {
        Arrays.remove(this.networks, network);
    }

    /**
     * Assigns the shared fitness value to each member of the species.
     */
    public assignSharedFitness(): void {
        // Calculate the age debt based on the penalizing factor -> Determines after how many generations of no
        // improvement the species gets penalized
        let ageDept = (this.age - this.ageOfLastImprovement + 1) - this.hyperParameter.penalizingAge;
        if (ageDept == 0) {
            ageDept = 1;
        }

        for (const network of this.networks) {
            network.sharedFitness = network.fitness;

            // Penalize fitness if it has not improved for a certain amount of ages
            if (ageDept >= 1) {
                network.sharedFitness = network.sharedFitness * 0.01;
                Container.debugLog(`Penalizing stagnant species ${this.uID}`);
            }

            // Boost fitness for young generations to give them a chance to evolve for some generations.
            if (this._age <= 10) {
                network.sharedFitness *= this.hyperParameter.ageSignificance;
            }

            // Do not allow negative fitness values
            if (network.sharedFitness <= 0.0) {
                network.sharedFitness = 0.0001;
            }

            // Share fitness with the entire species.
            network.sharedFitness /= this.networks.length;

        }
        this.markParents();
    }

    /**
     * Marks the species' networks that are allowed to reproduce.
     */
    public markParents(): void {
        // Sort the networks contained in the species based on their fitness in decreasing order.
        this.sortNetworks();
        const champion = this.networks[0];
        this.champion = champion;
        this.champion.isSpeciesChampion = true;
        this.currentBestFitness = champion.fitness;


        // Update the age of last improvement based on the best performing network's fitness value.
        if (champion.fitness > this.allTimeBestFitness) {
            this.ageOfLastImprovement = this.age;
            this.allTimeBestFitness = champion.fitness;
        }

        // Determines how many members of this species are allowed to reproduce.
        // Ensure that the species will not go extinct -> at least one member survives.
        let numberOfParents = Math.floor((this.hyperParameter.parentsPerSpecies * this.networks.length));
        if (numberOfParents === 0) {
            numberOfParents = 1;
        }

        // Allow the first <numberOfParents> to reproduce.
        for (const network of this.networks.slice(0, numberOfParents + 1)) {
            network.isParent = true;
        }
    }

    /**
     * Computes the number of offsprings for this generation including leftOvers from previous generations.
     * Those leftOvers are carried on from calculation to calculation across all species and are awarded to the
     * population champion's species.
     * The given implementation follows the approach described within the NEAT publication.
     * @param leftOver makes sure to not lose childs due to rounding errors.
     * @returns number leftOver collects rounding errors to ensure a constant populationSize.
     */
    public getNumberOfOffspringsNEAT(leftOver: number): number {
        this.expectedOffspring = 0;
        this.calculateAverageSharedFitness();

        let intPart = 0;
        let fractionPart = 0.0;
        let leftOverInt = 0.0;

        for (const network of this.networks) {
            intPart = Math.floor(network.expectedOffspring);
            fractionPart = network.expectedOffspring % 1;

            this.expectedOffspring += intPart;
            leftOver += fractionPart;

            if (leftOver > 1) {
                leftOverInt = Math.floor(leftOver);
                this.expectedOffspring += leftOverInt;
                leftOver -= leftOverInt;
            }
        }

        return leftOver;
    }

    /**
     * Calculates the number of offspring based on the average fitness across all members of the species. Saves
     * leftOvers occurring due to rounding errors and carries them on from calculation to calculation across all
     * species to assign them to the population champion's species in the end.
     * @param leftOver leftOver makes sure to not lose childs due to rounding errors.
     * @param totalAvgSpeciesFitness the average fitness of all species combined.
     * @param populationSize the size of the whole population.
     * @returns number leftOver collects rounding errors to ensure a constant populationSize.
     */
    public getNumberOffspringsAvg(leftOver: number, totalAvgSpeciesFitness: number, populationSize: number): number {
        const expectedOffspring = (this.calculateAverageSharedFitness() / totalAvgSpeciesFitness) * populationSize;
        const intExpectedOffspring = Math.floor(expectedOffspring);
        const fractionExpectedOffspring = expectedOffspring % 1;

        this.expectedOffspring = intExpectedOffspring;
        leftOver += fractionExpectedOffspring;

        if (leftOver < 1) {
            const intLeftOver = Math.floor(leftOver);
            this.expectedOffspring += intLeftOver;
            leftOver -= intLeftOver;
        }
        return leftOver;
    }

    /**
     * Evolves the networks contained within the species.
     * @param population The whole population of networks across all species.
     * @param populationSpecies all currently existent species.
     * @returns NeatChromosome[] produced children.
     */
    public evolve(population: NeatPopulation, populationSpecies: Species<C>[]): C[] {
        if (this.expectedOffspring > 0 && this.networks.length == 0) {
            return [];
        }

        const children: C[] = [];

        this.sortNetworks();
        this.champion = this.networks[0];

        // Breed the assigned number of children.
        let champCloned = 0;
        while (children.length < this.expectedOffspring) {
            let child: C;

            // If we have a population Champion in this species apply slight mutation or clone it.
            if (this.champion.isPopulationChampion && this.champion.numberOffspringPopulationChamp > 0) {
                if (champCloned < this.hyperParameter.populationChampionNumberClones) {
                    child = this.champion.cloneStructure(true) as C;
                    champCloned++;
                    this.champion.numberOffspringPopulationChamp--;
                } else {
                    child = this.breedPopulationChampion();
                }
            }

            // Species champions are only cloned once.
            else if (champCloned < 1) {
                child = this.champion.cloneStructure(true) as C;
                champCloned++;
            }

                // With a user-defined probability or if the species holds only one network, we apply mutation without
            // crossover.
            else if (this._randomness.nextDouble() <= this._hyperParameter.mutationWithoutCrossover ||
                this.networks.length == 1) {
                child = this.breedMutationOnly();
            }

            // Otherwise, we apply crossover.
            else {
                child = this.breedCrossover(population, populationSpecies);
            }

            // Check if we produced a defect network and breed another child if we did so.
            if (!child.activateNetwork(child.generateDummyInputs())) {
                continue;
            }

            children.push(child);
        }
        return children;
    }

    /**
     * Special treatment for population Champions, which are either simply cloned or slightly mutated.
     * @returns NeatChromosome the produced child.
     */
    private breedPopulationChampion(): C {
        const mutant = this.champion.mutate();
        this.champion.numberOffspringPopulationChamp--;
        return mutant;
    }

    /**
     * Breed a new network by applying the mutation operator.
     * @returns NeatChromosome the mutated child.
     */
    private breedMutationOnly(): C {
        const parent = this._randomness.pick(this.networks);
        return parent.mutate();
    }

    /**
     * Breed a new network by applying the mutation operator, additionally apply mutation with a certain probability.
     * @param population The whole population of networks across all species.
     * @param populationSpecies all currently existent species.
     * @returns NeatChromosome representing the produced child.
     */
    private breedCrossover(population: NeatPopulation, populationSpecies: Species<C>[]): C {
        // Pick first parent
        const parent1 = this._randomness.pick(this.networks);
        let parent2: C;

        // Pick second parent either from within the species or from another species.
        if (this._randomness.nextDouble() > this._hyperParameter.interspeciesMating || populationSpecies.length < 2) {
            parent2 = this._randomness.pick(this.networks);
        }

        // Select second parent from a different species.
        else {
            const candidateSpecies = populationSpecies.filter(species => species.uID !== this.uID && species.networks.length > 0);
            // Check if we have at least one other species that contains at least 1 network.
            if (candidateSpecies.length > 0) {
                parent2 = this._randomness.pick(candidateSpecies).networks[0];
            }
            // If we don't find another suitable species we have to mate within our species.
            else {
                parent2 = this._randomness.pick(this.networks);
            }
        }

        // Apply crossover.
        let child = parent1.crossover(parent2)[0];

        // We may get a defect network. Just return it restart the breeding process for this child.
        if(!child){
            return undefined;
        }

        // Decide if we additionally apply mutation, which is done randomly with a user-defined probability or
        // if both parents have a compatibility distance of 0, i.e. they have the same structure and weights.
        const distance = population.compatibilityDistance(parent1, parent2);
        if (this._randomness.nextDouble() < 1 - this._hyperParameter.crossoverWithoutMutation || distance === 0) {
            child = child.mutate();
        }
        return child;
    }

    /**
     * Sorts the species' networks in decreasing order according to their fitness values.
     */
    public sortNetworks(): void {
        this.networks.sort((a, b) => b.fitness - a.fitness);
    }

    /**
     * Calculates the average fitness across all members of the species.
     * @returns number average fitness across all networks of the species.
     */
    public calculateAverageNetworkFitness(): number {
        this.averageFitness = this.networks.reduce((acc, network) => acc + network.fitness, 0) / this.networks.length;
        return this.averageFitness;
    }

    /**
     * Calculates the average shared fitness across all members of the species.
     * @returns number average shared fitness across all networks of the species.
     */
    public calculateAverageSharedFitness(): number {
        this.averageSharedFitness = this.networks.reduce((acc, network) => acc + network.sharedFitness, 0) / this.networks.length;
        return this.averageSharedFitness;
    }

    /**
     * Deep clones this species.
     * @returns Species deep clone of this species.
     */
    clone(): Species<C> {
        const clone = new Species(this.uID, this.isNovel, this.hyperParameter);
        clone.age = this.age;
        clone.averageSharedFitness = this.averageSharedFitness;
        clone.currentBestFitness = this.currentBestFitness;
        clone.allTimeBestFitness = this.allTimeBestFitness;
        clone.expectedOffspring = this.expectedOffspring;
        clone.ageOfLastImprovement = this.ageOfLastImprovement;
        clone.champion = this.networks[0].clone() as C;
        for (const network of this.networks) {
            clone.networks.push(network.clone() as C);
        }
        return clone as Species<C>;
    }

    /**
     * Transforms this Species into a JSON representation.
     * @return Record containing the most important attribute keys mapped to their values.
     */
    public toJSON(): Record<string, (number | C)> {
        const species = {};
        species[`id`] = this.uID;
        //species[`age`] = this.age;
        //species[`ageOfLastImprovement`] = this.ageOfLastImprovement;
        species[`aF`] = Number(this.averageFitness.toFixed(4));
        species[`cBF`] = Number(this.currentBestFitness.toFixed(4));
        species[`aBF`] = Number(this.allTimeBestFitness.toFixed(4));
        species[`eO`] = Number(this.expectedOffspring.toFixed(4));
        species[`C`] = this.champion.uID;
        for (let i = 0; i < this.networks.length; i++) {
            species[`M ${i}`] = this.networks[i].toJSON();
        }
        return species;
    }

    get uID(): number {
        return this._uID;
    }

    get age(): number {
        return this._age;
    }

    set age(value: number) {
        this._age = value;
    }

    get averageSharedFitness(): number {
        return this._averageSharedFitness;
    }

    set averageSharedFitness(value: number) {
        this._averageSharedFitness = value;
    }

    get averageFitness(): number {
        return this._averageFitness;
    }

    set averageFitness(value: number) {
        this._averageFitness = value;
    }

    get currentBestFitness(): number {
        return this._currentBestFitness;
    }

    set currentBestFitness(value: number) {
        this._currentBestFitness = value;
    }

    get allTimeBestFitness(): number {
        return this._allTimeBestFitness;
    }

    set allTimeBestFitness(value: number) {
        this._allTimeBestFitness = value;
    }

    get expectedOffspring(): number {
        return this._expectedOffspring;
    }

    set expectedOffspring(value: number) {
        this._expectedOffspring = value;
    }

    get networks(): C[] {
        return this._networks;
    }

    get isNovel(): boolean {
        return this._isNovel;
    }

    set isNovel(value: boolean) {
        this._isNovel = value;
    }

    get ageOfLastImprovement(): number {
        return this._ageOfLastImprovement;
    }

    set ageOfLastImprovement(value: number) {
        this._ageOfLastImprovement = value;
    }

    get champion(): C {
        return this._champion;
    }

    set champion(value: C) {
        this._champion = value;
    }

    get hyperParameter(): NeuroevolutionTestGenerationParameter {
        return this._hyperParameter;
    }
}
