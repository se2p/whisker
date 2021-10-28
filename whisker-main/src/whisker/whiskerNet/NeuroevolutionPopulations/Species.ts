import {List} from "../../utils/List";
import {NetworkChromosome} from "../NetworkChromosome";
import {NeuroevolutionUtil} from "../NeuroevolutionUtil";
import {Randomness} from "../../utils/Randomness";
import {NeuroevolutionProperties} from "../NeuroevolutionProperties";
import {NeuroevolutionPopulation} from "./NeuroevolutionPopulation";

export class Species<C extends NetworkChromosome> {

    /**
     * The defined search parameters
     */
    private readonly _properties: NeuroevolutionProperties<C>;

    /**
     * Unique identifier for the Species
     */
    private readonly _id: number;

    /**
     * Saves the member of this species
     */
    private readonly _chromosomes: List<C>

    /**
     * The age of this species
     */
    private _age: number;

    /**
     * The average shared fitness value of all member of this species.
     */
    private _averageFitness: number;

    /**
     * Average networkFitness of this species.
     */
    private _averageNetworkFitness = 0;

    /**
     * The best networkFitness value of the current species population.
     */
    private _currentBestFitness: number;

    /**
     * The highest ever achieved networkFitness value of this species.
     */
    private _allTimeBestFitness: number;

    /**
     * The number of offspring this species is allowed to produce.
     */
    private _expectedOffspring: number;

    /**
     * Flag if this species was just born.
     */
    private _isNovel: boolean;

    /**
     * Age of last improvement.
     */
    private _ageOfLastImprovement: number;

    /**
     * Saves the best performing network of this species.
     */
    private _champion: C

    /**
     * Random generator
     */
    private _randomness: Randomness;


    /**
     * Constructs a new Species.
     * @param id the id of the species
     * @param novel true if its a new species
     * @param properties the search parameters
     */
    constructor(id: number, novel: boolean, properties: NeuroevolutionProperties<C>) {
        this._id = id;
        this._age = 1;
        this._averageFitness = 0;
        this._expectedOffspring = 0;
        this._isNovel = novel;
        this._ageOfLastImprovement = 0;
        this._currentBestFitness = 0;
        this._allTimeBestFitness = 0;
        this._properties = properties;
        this._chromosomes = new List<C>();
        this._randomness = Randomness.getInstance();
    }

    /**
     * Adds a new member to the species
     * @param chromosome
     */
    public addChromosome(chromosome: C): void {
        this.chromosomes.add(chromosome);
    }

    /**
     * Removes the given chromosome from the species
     * @param chromosome the member to remove
     */
    public removeChromosome(chromosome: C): void {
        this.chromosomes.remove(chromosome);
    }

    /**
     * Returns population size of this Specie.
     */
    public size(): number {
        return this.chromosomes.size();
    }

    /**
     * Assigns the Adjust-fitness (or sharedFitness) value to each member of the species.
     * The Adjust-Fitness value is calculated as a shared fitness value between all the members of a species
     */
    public assignAdjustFitness(): void {
        // Calculate the age debt based on the penalizing factor -> Determines after how much generations of no improvement
        // the species gets penalized
        let ageDept = (this.age - this.ageOfLastImprovement + 1) - this.properties.penalizingAge;
        if (ageDept == 0)
            ageDept = 1;

        for (const chromosome of this.chromosomes) {
            chromosome.sharedFitness = chromosome.networkFitness;
            // Penalize fitness if it has not improved for a certain amount of ages
            if (ageDept >= 1) {
                chromosome.sharedFitness = chromosome.sharedFitness * 0.01;
                console.log("Penalizing stagnant species: " + this.id)
            }

            // Boost fitness for young generations to give them a chance to evolve for some generations
            if (this._age <= 10)
                chromosome.sharedFitness = chromosome.sharedFitness * this.properties.ageSignificance;

            // Do not allow negative fitness values
            if (chromosome.sharedFitness <= 0.0)
                chromosome.sharedFitness = 0.0001;

            // Share fitness with the entire species
            chromosome.sharedFitness = chromosome.sharedFitness / this.size();

        }
        this.markKillCandidates();
    }

    /**
     * Marks the members of the species which will not be allowed to reproduce.
     */
    public markKillCandidates(): void {

        // Sort the chromosomes in the species based on their fitness -> the first chromosome is the fittest
        this.sortChromosomes();
        const champion = this.chromosomes.get(0);
        this.champion = champion;
        this.currentBestFitness = champion.networkFitness;

        // Update the age of last improvement based on the non-shared Fitness value
        if (champion.networkFitness > this.allTimeBestFitness) {
            this.ageOfLastImprovement = this._age;
            this.allTimeBestFitness = champion.networkFitness;
        }

        // Determines how many members of this species are allowed to reproduce
        // using the parentsPerSpecies hyperparameter.
        // Ensure that the species will not go extinct -> at least one member survives.
        let numberOfParents = Math.floor((this.properties.parentsPerSpecies * this.chromosomes.size()));
        if (numberOfParents === 0) {
            numberOfParents = 1;
        }

        this.chromosomes.get(0).isSpeciesChampion = true;

        // Assign the death mark to the chromosomes which are not within the numberOfParents
        let position = 1;
        for (const chromosome of this.chromosomes) {
            if (position > numberOfParents) {
                chromosome.hasDeathMark = true;
            }
            position++;
        }
    }

    /**
     * Computes the number of offsprings for this generation including leftOvers from previous generations.
     * Those leftOvers are carried on from generation to generation until they add up to one.
     * Implementation following the NEAT approach.
     * @param leftOver makes sure to not loose childs due to rounding errors
     */
    public getNumberOfOffspringsNEAT(leftOver: number): number {
        this.expectedOffspring = 0;
        this.calculateAverageSpeciesFitness();

        let intPart = 0;
        let fractionPart = 0.0;
        let leftOverInt = 0.0

        for (const chromosome of this.chromosomes) {
            intPart = Math.floor(chromosome.expectedOffspring);
            fractionPart = chromosome.expectedOffspring % 1;

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
     * Calculates the number of offspring based on the average fitness across all members of this species
     * @param leftOver leftOver makes sure to not loose childs due to rounding errors
     * @param totalAvgSpeciesFitness the average fitness of all species combined
     * @param populationSize the size of the whole population (NOT species population)
     */
    public getNumberOffspringsAvg(leftOver: number, totalAvgSpeciesFitness: number, populationSize: number): number {

        const expectedOffspring = (this.calculateAverageSpeciesFitness() / totalAvgSpeciesFitness) * populationSize;
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
     * Breed the children of this Species.
     * @param population The whole population (NOT species population)
     * @param speciesList a List of all species
     * @return returns the generated children
     */
    public breed(population: NeuroevolutionPopulation<C>, speciesList: List<Species<C>>): List<C> {
        if (this.expectedOffspring > 0 && this.chromosomes.size() == 0) {
            return new List<C>();
        }

        const children = new List<C>();

        this.sortChromosomes();
        this.champion = this.chromosomes.get(0);

        // Create the calculated number of offspring of this species; one at a time
        let champCloned = 0;
        for (let count = 0; count < this.expectedOffspring; count++) {

            let child: C;

            // If we have a population Champion in this species apply slight mutation or clone it
            if (this.champion.isPopulationChampion && this.champion.numberOffspringPopulationChamp > 0) {
                if (champCloned < this.properties.populationChampionNumberClones) {
                    child = this.champion.cloneStructure() as C;
                    champCloned++;
                    this.champion.numberOffspringPopulationChamp--;
                } else {
                    child = this.breedPopulationChampion()
                }
            }

            // Species champions are cloned only
            else if (champCloned < 1) {
                child = this.champion.cloneStructure() as C;
                champCloned++;
            }

                // In some cases we only mutate and do no crossover
            // Furthermore, if we have only one member in the species we cannot apply crossover
            else if ((this._randomness.nextDouble() <= this._properties.mutationWithoutCrossover) || (this.size() == 1)) {
                child = this.breedMutationOnly();
            }

            // Otherwise we apply crossover
            else {
                child = this.breedCrossover(speciesList);
            }

            children.add(child);
        }
        return children;
    }

    /**
     * Special treatment for population Champions. They are either just cloned
     * or mutated by changing their weights or adding a new connection.
     */
    private breedPopulationChampion(): C {// We want the popChamp clone to be treated like a popChamp during mutation but not afterwards.
        const mutant = this.champion.mutate();
        this.champion.numberOffspringPopulationChamp--;
        return mutant;
    }

    /**
     * Apply only the mutation operator to a network.
     */
    private breedMutationOnly(): C {
        // Choose random parent and apply mutation
        const parent = this._randomness.pickRandomElementFromList(this.chromosomes);
        parent.mutate();
        return parent;
    }

    /**
     * Apply the crossover operator
     * @param speciesList a List of all species in the current population
     * @private
     */
    private breedCrossover(speciesList: List<Species<C>>): C {
        // Pick first parent
        const parent1 = this._randomness.pickRandomElementFromList(this.chromosomes);
        let parent2: C

        // Pick second parent either from within the species or from another species (interspecies mating)
        if (this._randomness.nextDouble() > this._properties.interspeciesMating) {
            // Second parent picked from the same species (= this species)
            parent2 = this._randomness.pickRandomElementFromList(this.chromosomes);
        }
        // Mate outside of the species
        else {
            let randomSpecies = this as Species<C>;
            let giveUp = 0;
            // Give Up if by chance we do not find another Species or only species which are empty
            while ((randomSpecies === this && giveUp < 5) || randomSpecies.size() === 0) {
                randomSpecies = this._randomness.pickRandomElementFromList(speciesList) as Species<C>;
                giveUp++;
            }
            parent2 = randomSpecies.chromosomes.get(0);
        }

        // Apply the Crossover Operation
        const child = parent1.crossover(parent2).getFirst();

        // Decide if we additionally apply mutation -> done randomly or
        // if both parents have a compatibility distance of 0 which means they have the same structure and weights
        const distance = NeuroevolutionUtil.compatibilityDistance(parent1, parent2, this._properties.excessCoefficient, this._properties.disjointCoefficient,
            this._properties.weightCoefficient)
        if (this._randomness.nextDouble() > this._properties.crossoverWithoutMutation || distance === 0) {
            child.mutate();
        }
        return child;
    }

    /**
     * Sorts the networks of the species in decreasing order according to their fitness values
     */
    public sortChromosomes(): void {
        this.chromosomes.sort((a, b) => b.networkFitness - a.networkFitness)
    }

    /**
     * Calculates the average fitness across all members of the species.
     */
    public calculateAverageSpeciesFitness(): number {
        let sum = 0;
        for (const chromosome of this.chromosomes)
            sum += chromosome.sharedFitness;
        this.averageFitness = sum / this.size();
        return this.averageFitness;
    }

    /**
     * Calculates the average network fitness across all members of the species, used for reporting and refocusing
     * the search in stagnation phase.
     */
    public calculateAverageNetworkFitness(): number {
        const networkFitnessValues = this.chromosomes.map(a => a.networkFitness).getElements();
        this.averageNetworkFitness = networkFitnessValues.reduce((a, b) => a + b) / this.size();
        return this.averageNetworkFitness
    }

    /**
     * Deep Clone of this Species.
     * @returns Species clone of this.
     */
    clone(): Species<C> {
        const clone = new Species(this.id, this.isNovel, this.properties);
        clone.age = this.age;
        clone.averageFitness = this.averageFitness;
        clone.currentBestFitness = this.currentBestFitness;
        clone.allTimeBestFitness = this.allTimeBestFitness;
        clone.expectedOffspring = this.expectedOffspring;
        clone.ageOfLastImprovement = this.ageOfLastImprovement;
        clone.champion = this.chromosomes.get(0).clone() as C
        for (const network of this.chromosomes) {
            clone.chromosomes.add(network.clone() as C)
        }
        return clone;
    }

    /**
     * Transforms this Species into a JSON representation.
     * @return Record containing most important attributes keys mapped to their values.
     */
    public toJSON(): Record<string, (number | C)> {
        const species = {};
        species[`id`] = this.id;
        //species[`age`] = this.age;
        //species[`ageOfLastImprovement`] = this.ageOfLastImprovement;
        species[`aF`] = Number(this.averageNetworkFitness.toFixed(4));
        species[`cBF`] = Number(this.currentBestFitness.toFixed(4));
        species[`aBF`] = Number(this.allTimeBestFitness.toFixed(4));
        species[`eO`] = Number(this.expectedOffspring.toFixed(4));
        species[`C`] = this.champion.id;
        for (let i = 0; i < this.chromosomes.size(); i++) {
            species[`M ${i}`] = this.chromosomes.get(i).toJSON();
        }
        return species;
    }

    get id(): number {
        return this._id;
    }

    get age(): number {
        return this._age;
    }

    set age(value: number) {
        this._age = value;
    }

    get averageFitness(): number {
        return this._averageFitness;
    }

    set averageFitness(value: number) {
        this._averageFitness = value;
    }

    get averageNetworkFitness(): number {
        return this._averageNetworkFitness;
    }

    set averageNetworkFitness(value: number) {
        this._averageNetworkFitness = value;
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

    get chromosomes(): List<C> {
        return this._chromosomes;
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

    get properties(): NeuroevolutionProperties<C> {
        return this._properties;
    }
}
