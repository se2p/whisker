import {List} from "../utils/List";
import {NetworkChromosome} from "./NetworkChromosome";
import {NeuroevolutionUtil} from "./NeuroevolutionUtil";
import {Randomness} from "../utils/Randomness";
import {NeatPopulation} from "./NeatPopulation";
import {NeuroevolutionProperties} from "./NeuroevolutionProperties";

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
     * The average fitness value of all member of this species.
     */
    private _averageFitness: number;

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

        // Determines which members of this species are allowed to reproduce
        // based on the parentsPerSpecies config factor
        // +1 ensures that the species will not go extinct -> at least one member survives
        const numberOfParents = Math.floor((this.properties.parentsPerSpecies * this.chromosomes.size())) + 1;

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

        const expectedOffspring = (this.averageSpeciesFitness() / totalAvgSpeciesFitness) * populationSize;
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
    public breed(population: NeatPopulation<C>, speciesList: List<Species<C>>): List<NetworkChromosome> {
        if (this.expectedOffspring > 0 && this.chromosomes.size() == 0) {
            return new List<NetworkChromosome>();
        }

        const children = new List<NetworkChromosome>();

        this.sortChromosomes();
        this.champion = this.chromosomes.get(0);

        // Create the calculated number of offspring of this species; one at a time
        let champCloned = 0;
        for (let count = 0; count < this.expectedOffspring; count++) {

            let child: C;

            // If we have a population Champion in this species apply slight mutation or clone it
            if (this.champion.isPopulationChampion && this.champion.numberOffspringPopulationChamp > 0) {
                if (champCloned < this.properties.populationChampionNumberClones) {
                    child = this.champion.clone() as C;
                    champCloned++;
                    this.champion.numberOffspringPopulationChamp--;
                } else {
                    child = this.breedPopulationChampion()
                }
            }

            // Species champions are cloned only
            else if (champCloned < 1) {
                child = this.champion.clone() as C;
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
    private breedPopulationChampion(): C {
        const parent = this.champion.clone() as C;
        // We want the popChamp clone to be treated like a popChamp during mutation but not afterwards.
        parent.isPopulationChampion = true;
        parent.mutate();
        parent.isPopulationChampion = false;
        this.champion.numberOffspringPopulationChamp--;
        return parent;
    }

    /**
     * Apply only the mutation operator to a network.
     */
    private breedMutationOnly(): C {
        // Choose random parent and apply mutation
        const parent = this._randomness.pickRandomElementFromList(this.chromosomes).clone() as C;
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
        const parent1 = this._randomness.pickRandomElementFromList(this.chromosomes).clone() as C;
        let parent2: C

        // Pick second parent either from within the species or from another species (interspecies mating)
        if (this._randomness.nextDouble() > this._properties.interspeciesMating) {
            // Second parent picked from the same species (= this species)
            parent2 = this._randomness.pickRandomElementFromList(this.chromosomes).clone() as C
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
            parent2 = randomSpecies.chromosomes.get(0).clone() as C;
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
    public averageSpeciesFitness(): number {
        let sum = 0;
        for (const chromosome of this.chromosomes)
            sum += chromosome.sharedFitness;
        this.averageFitness = sum / this.size();
        return this.averageFitness;
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

    toJSON(){
        return {
            id: this.id,
            age: this.age,
            ageOfLastImprovement: this.ageOfLastImprovement,
            averageFitness: this.averageFitness,
            currentBestFitness: this.currentBestFitness,
            allTimeBestFitness: this.allTimeBestFitness,
            expectedOffspring: this.expectedOffspring,
        }
    }
}
