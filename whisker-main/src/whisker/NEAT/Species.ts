import {List} from "../utils/List";
import {NeatChromosome} from "./NeatChromosome";
import {NeatUtil} from "./NeatUtil";
import {Randomness} from "../utils/Randomness";
import {NeatPopulation} from "./NeatPopulation";
import {NeuroevolutionProperties} from "./NeuroevolutionProperties";

export class Species<C extends NeatChromosome> {
    private _id: number;
    private _age: number;
    private _averageFitness: number;
    private _currentBestFitness: number;
    private _allTimeBestFitness: number;
    private _expectedOffspring: number;
    private _chromosomes: List<C>
    private _novel: boolean;
    private _ageOfLastImprovement: number;
    private _randomness: Randomness;
    private readonly _properties: NeuroevolutionProperties<C>;

    constructor(id: number, novel: boolean, properties: NeuroevolutionProperties<C>) {
        this._id = id;
        this._age = 1;
        this._averageFitness = 0.0;
        this._expectedOffspring = 0;
        this._novel = novel;
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
     * Assigns the Adjust-fitness value to each member of the species.
     * The Adjust-Fitness value is calculated as a shared fitness value between all the members of a species
     */
    public assignAdjustFitness(): void {
        // Calculate the age debt based on the penalizing factor -> Determines after how much generations of no improvement
        // the species gets penalized
        let ageDept = (this._age - this.ageOfLastImprovement + 1) - this._properties.penalizingAge;
        if (ageDept == 0)
            ageDept = 1;

        for (const chromosome of this.chromosomes) {
            // Save the original networkFitness value from the networkFitness function
            chromosome.nonAdjustedFitness = chromosome.networkFitness;

            // Penalize fitness if it has not improved for a certain amount of ages
            if (ageDept >= 1) {
                chromosome.networkFitness = chromosome.networkFitness * 0.3;
                console.log("Penalizing stagnant species: " + this.id)
            }

            // Boost fitness for young generations to give them a chance to evolve for some generations
            if (this._age <= 10)
                chromosome.networkFitness = chromosome.networkFitness * this._properties.ageSignificance;

            // Do not allow negative fitness values
            if (chromosome.networkFitness < 0.0)
                chromosome.networkFitness = 0.0001;

            // Share fitness with the entire species
            chromosome.networkFitness = chromosome.networkFitness / this.size();

        }
        this.markKillCandidates();
    }

    /**
     * Marks the members of the species which will not survive the current generation based on their shared fitness value
     * @private
     */
    public markKillCandidates(): void {

        // Sort the chromosomes in the species based on their fitness -> the first chromosome is the fittest
        this.sortChromosomes();
        const champion = this.chromosomes.get(0);

        // Update the age of last improvement based on the non AdjustedFitness value
        if (champion.nonAdjustedFitness > this._allTimeBestFitness) {
            this._ageOfLastImprovement = this._age;
            this._allTimeBestFitness = champion.nonAdjustedFitness;
        }

        // Determines which members of this species are allowed to reproduce
        // based on the parentsPerSpecies config factor
        // +1 ensures that the species will not go extinct -> at least one member survives
        const numberOfParents = Math.floor((this._properties.parentsPerSpecies * this.chromosomes.size())) + 1;

        this.chromosomes.get(0).champion = true;

        // Assign the death mark to the chromosomes which are not within the numberOfParents
        let position = 1;
        for (const chromosome of this.chromosomes) {
            if (position > numberOfParents) {
                chromosome.eliminate = true;
            }
            position++;
        }
    }

    /**
     * Computes the number of offsprings for this generation including leftOvers from previous generations.
     * Those leftOvers are carried on from generation to generation until they add up to one.
     * Implementation following the NEAT approach
     * @param leftOver
     */
    public getNumberOfOffspringsOriginal(leftOver: number): number {
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

    public getNumberOffspringsAvg(leftOver: number, totalAvgSpeciesFitness: number, populationSize: number): number {

        const expectedOffspring = (this.averageSpeciesFitness() / totalAvgSpeciesFitness) * populationSize;
        const intExpectedOffspring = Math.round(expectedOffspring);
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
     * @param population The total current population
     * @param sortedSpecies a sorted List of all existing species
     * @return returns the generated children
     */
    public breed(population: NeatPopulation<C>, sortedSpecies: List<Species<C>>): List<NeatChromosome> {
        if (this.expectedOffspring > 0 && this.chromosomes.size() == 0) {
            return new List<NeatChromosome>();
        }

        const children = new List<NeatChromosome>();

        this.sortChromosomes();
        const champion = this.chromosomes.get(0);

        if (this.expectedOffspring > population.startSize) {
            console.error("Attempt to produce more offsprings than the size of the population")
            this.expectedOffspring = Math.floor(population.startSize * 0.75);
        }

        // Create the calculated number of offspring of this species; one at a time
        let champCloned = false;
        for (let count = 0; count < this.expectedOffspring; count++) {

            let child: C;

            // If we have a population Champion in this species
            if (champion.numberOffspringPopulationChamp > 0 && champion.populationChampion) {
                child = this.breedPopulationChampion(champion)
            }

            // Species champions are cloned only -> Elitism
            else if (!champCloned) {
                child = champion.clone() as C;
                champCloned = true;
            }

                // In some cases we only mutate and do no crossover
            // Furthermore, if we have only one member in the species we cannot apply crossover
            else if ((this._randomness.nextDouble() <= this._properties.mutationWithoutCrossover) || (this.size() == 1)) {
                child = this.breedMutationOnly();
            }

            // Otherwise we apply crossover
            else {
                child = this.breedCrossover(sortedSpecies);
            }

            children.add(child);
        }
        return children;
    }

    private breedPopulationChampion(populationChampion: C): C {
        const parent = populationChampion.clone() as C;

        // If we have some offsprings left to generate allow mutation of the population champion to happen
        if (populationChampion.numberOffspringPopulationChamp > 1) {
            // We want the popChamp clone to be treated like a popChamp during mutation but not afterwards.
            parent.populationChampion = true;
            parent.mutate();
            parent.populationChampion = false;
        }
        // Otherwise just clone the champion -> Elitism
        populationChampion.numberOffspringPopulationChamp--;
        return parent;
    }

    private breedMutationOnly(): C {
        // Choose random parent and apply mutation
        const parent = this._randomness.pickRandomElementFromList(this.chromosomes).clone() as C;
        parent.mutate();
        return parent;
    }

    private breedCrossover(sortedSpecies: List<Species<C>>): C {
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
                randomSpecies = this._randomness.pickRandomElementFromList(sortedSpecies) as Species<C>;
                giveUp++;
            }
            parent2 = randomSpecies.chromosomes.get(0).clone() as C;
        }

        // Apply the Crossover Operation
        const child = parent1.crossover(parent2).getFirst();

        // Decide if we additionally apply mutation -> done randomly or
        // if both parents have a compatibility distance of 0 which means they have the same structure and weights
        const distance = NeatUtil.compatibilityDistance(parent1, parent2, this._properties.excessCoefficient, this._properties.disjointCoefficient,
            this._properties.weightCoefficient)
        if (this._randomness.nextDouble() > this._properties.crossoverWithoutMutation || parent1.equals(parent2) ||
            distance === 0) {
            child.mutate();
        }
        return child;
    }

    /**
     * Sorts the Chromosomes of the species in decreasing order according to its fitness values
     * @private
     */
    public sortChromosomes(): void {
        this.chromosomes.sort((a, b) => b.nonAdjustedFitness - a.nonAdjustedFitness)
    }

    public averageSpeciesFitness(): number {
        let sum = 0;
        for (const chromosome of this.chromosomes)
            sum += chromosome.networkFitness;
        this.averageFitness = sum / this.size();
        return this.averageFitness;
    }

    public sieveWeakChromosomes(amount: number): List<C> {
        this.sortChromosomes()
        this.chromosomes.reverse();
        const removedChromosomes = new List<C>()
        let removed = 0;
        let tries = 0;
        let finished = false;
        while (tries < this.size() && !finished) {
            for (let i = 0; i < this.chromosomes.size(); i++) {
                const chromosome = this.chromosomes.get(i);

                if (chromosome.nonAdjustedFitness > 0 && !chromosome.populationChampion && !chromosome.champion) {
                    this.chromosomes.remove(chromosome);
                    removedChromosomes.add(chromosome);
                    removed++;
                    if(removed >= amount) {
                        finished = true;
                        break
                    }
                }
            }
                tries++;
        }
        // Bring chromosomes back into order
        this.sortChromosomes();
        return removedChromosomes;
    }


    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
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

    set chromosomes(value: List<C>) {
        this._chromosomes = value;
    }

    get novel(): boolean {
        return this._novel;
    }

    set novel(value: boolean) {
        this._novel = value;
    }

    get ageOfLastImprovement(): number {
        return this._ageOfLastImprovement;
    }

    set ageOfLastImprovement(value: number) {
        this._ageOfLastImprovement = value;
    }
}
