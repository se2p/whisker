import {List} from "../utils/List";
import {NeatChromosome} from "./NeatChromosome";
import {NeatConfig} from "./NeatConfig";
import {Randomness} from "../utils/Randomness";
import {NeatPopulation} from "./NeatPopulation";

export class Species<C extends NeatChromosome> {
    private _id: number;
    private _age: number;
    private _averageFitness: number;
    private _maxFitness: number;
    private _allTimeBestFitness: number;
    private _expectedOffspring: number;
    private _chromosomes: List<C>
    private _novel: boolean;
    private _ageOfLastImprovement: number;
    private _randomness: Randomness;

    constructor(id: number, novel: boolean) {
        this._id = id;
        this._age = 1;
        this._averageFitness = 0.0;
        this._expectedOffspring = 0;
        this._novel = novel;
        this._ageOfLastImprovement = 0;
        this._maxFitness = 0;
        this._allTimeBestFitness = 0;
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
     * Assigns the Adjust-fitness value to each member of the species.
     * The Adjust-Fitness value is calculated as a shared fitness value between all the members of a species
     */
    public assignAdjustFitness(): void {

        // Calculate the age debt based on the penalizing factor -> Determines after how much generations of no improvement
        // the species gets penalized
        let ageDept = (this._age - this.ageOfLastImprovement + 1) - NeatConfig.PENALIZING_AGE;
        if(ageDept == 0)
            ageDept = 1;

        const speciesSize = this.chromosomes.size();

        for (const chromosome of this.chromosomes) {
            // Save the original fitness value from the fitness function
            chromosome.nonAdjustedFitness = chromosome.fitness;

            // Penalize fitness if it has not improved since NeatConfig.PENALIZING_AGEs
            if (ageDept >= 1)
                chromosome.fitness = chromosome.fitness * 0.01;

            // Boost fitness for young generations to give them a chance to evolve for some generations
            if (this._age <= 10)
                chromosome.fitness = chromosome.fitness * NeatConfig.AGE_SIGNIFICANCE;

            // Do not allow negative fitness values
            if (chromosome.fitness < 0.0)
                chromosome.fitness = 0.0001;

            // Share fitness with the entire species
            chromosome.fitness = chromosome.fitness / speciesSize;

            this.markKillCandidates();
        }
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
        // based on the NeatConfig.SPECIES_PARENTS factor
        // +1 ensures that the species will not go extinct -> at least one member survives
        const numberOfParents = Math.floor((NeatConfig.SPECIES_PARENTS * this.chromosomes.size()) + 1);

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
     * Calculates the generations since an improvement has happened in the generation
     * @private
     */
    private lastImproved(): number {
        return this._age - this._ageOfLastImprovement;
    }

    /**
     * Calculates the average fitness of the species
     * @private
     */
    private calculateAverageFitness() {
        let sum = 0.0;
        for (const chromosome of this.chromosomes)
            sum += chromosome.fitness;
        this._averageFitness = sum / this.chromosomes.size();
    }

    /**
     * Sets the value of the current best fitness value of the species
     * @private
     */
    private setMaxFitness(): void {
        this.sortChromosomes();
        this._maxFitness = this.chromosomes.get(0).fitness;
    }

    /**
     * Computes the number of offsprings for this generation including leftOvers from previous generations.
     * Those leftOvers are carried on from generation to generation until they add up to one.
     * @param leftOver
     */
    public getNumberOfOffsprings(leftOver: number): number {
        this._expectedOffspring = 0;

        let x1 = 0.0;
        let r1 = 0.0;
        let r2 = leftOver;
        let n1 = 0;
        let n2 = 0;

        for(const chromosome of this.chromosomes)
        {
            x1 = chromosome.expectedOffspring;

            n1 = Math.floor(x1);
            r1 = x1 - Math.floor(x1);
            n2 = n2 + n1;
            r2 = r2 + r1;

            if (r2 >= 1.0)
            {
                n2 = n2 + 1;
                r2 = r2 - 1.0;
            }
        }

        this._expectedOffspring = n2;
        return r2;
    }

    /**
     * Breed the children of this Species.
     * @param population The total current population
     * @param sortedSpecies a sorted List of all existing species
     * @return returns true if everything went fine and false otherwise
     */
    public breed(population: NeatPopulation<C>, sortedSpecies: List<Species<C>>): boolean {
        if (this.expectedOffspring > 0 && this.chromosomes.size() == 0) {
            console.error("An empty species cannot be reproduced!")
            return false;
        }

        const champion = this.chromosomes.get(0);

        if (this.expectedOffspring > NeatConfig.POPULATION_SIZE) {
            console.error("Attempt to produce more offsprings than the size of the population")
            this.expectedOffspring = Math.floor(NeatConfig.POPULATION_SIZE * 0.95);
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
            else if ((!champCloned) && (this.expectedOffspring > 5)) {
                child = champion.clone() as C;
                champCloned = true;
            }

            // In some cases we only mutate and do no crossover
            // Furthermore, if we have only one member in the species we cannot apply crossover
            else if (Math.random() <= NeatConfig.MUTATION_WITHOUT_CROSSOVER || this.chromosomes.size() == 1) {
                child = this.breedMutationOnly();
            }

            // Otherwise we apply crossover
            else {
                child = this.breedCrossover(population);
            }

            // Now add the child to the proper species
            // If we do not have species create the first one
            if (sortedSpecies.isEmpty()) {
                const newSpecies = new Species(population.speciesCount, true) as Species<C>;
                population.speciesCount++;
                population.species.add(newSpecies);
                newSpecies.addChromosome(child);
                child.species = newSpecies;
            }

            // Otherwise find the correct species or create a new one of the child fits in no existing species
            else {
                let foundSpecies = false;
                for (const specie of population.species) {
                    if(specie.chromosomes.size() > 0) {
                        const representative = specie.chromosomes.get(0);
                        const compatDistance = child.compatibilityDistance(representative);

                        // Found a matching Specie
                        if (compatDistance < NeatConfig.DISTANCE_THRESHOLD) {
                            specie.addChromosome(child);
                            child.species = specie;
                            foundSpecies = true;
                            break;
                        }
                    }
                }

                // If the child fits in no existing specie create a new one for it
                if (!foundSpecies) {
                    const newSpecie = new Species(population.speciesCount, true) as Species<C>;
                    population.speciesCount++;
                    population.species.add(newSpecie);
                    newSpecie.addChromosome(child);
                    child.species = newSpecie;
                }
            }
        }
        // Return true if everything went fine.
        return true;
    }

    private breedPopulationChampion(populationChampion: C): C {
        const parent = populationChampion.clone() as C;

        // If we have some offsprings left to generate allow mutation of the population champion to happen
        if (populationChampion.numberOffspringPopulationChamp > 1) {
            populationChampion.numberOffspringPopulationChamp--;
            return parent.mutate();
        }
        // Otherwise just clone the champion -> Elitism
        populationChampion.numberOffspringPopulationChamp--;
        return parent;
    }

    private breedMutationOnly(): C {
        // Choose random parent and apply mutation
        const parent = this._randomness.pickRandomElementFromList(this.chromosomes);
        parent.mutate();
        return parent;
    }

    private breedCrossover(population: NeatPopulation<C>): C {
        // Pick first parent
        const parent1 = this._randomness.pickRandomElementFromList(this.chromosomes);
        let parent2: C

        // Pick second parent either from within the species or from another species (interspecies mating)
        if (this._randomness.nextDouble() > NeatConfig.INTERSPECIES_CROSSOVER_RATE) {
            // Second parent picked from the same species (= this species)
            parent2 = this._randomness.pickRandomElementFromList(this.chromosomes)
        }
        // Mate outside of the species
        else {
            let randomSpecies = this as Species<C>;
            let giveUp = 0;
            // Give Up if by chance we do not find another Species
            while (randomSpecies === this && giveUp < 5) {
                randomSpecies = this._randomness.pickRandomElementFromList(population.species) as Species<C>;
                giveUp++;
            }
            parent2 = randomSpecies.chromosomes.get(0);
        }

        // Apply the Crossover Operation
        const child = parent1.crossover(parent2).getFirst();

        // Decide if we additionally apply crossover -> done randomly or
        // if both parents have a compatibility distance of 0 which means they are equal
        if (this._randomness.nextDouble() > NeatConfig.CROSSOVER_ONLY_RATE || parent1.equals(parent2) ||
            parent1.compatibilityDistance(parent2) === 0) {
            child.mutate();
        }
        return child;
    }

    /**
     * Sorts the Chromosomes of the species in decreasing order according to its fitness values
     * @private
     */
    private sortChromosomes(): void {
        this._chromosomes.sort((a, b) => a.fitness < b.fitness ? +1 : -1);
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

    get maxFitness(): number {
        return this._maxFitness;
    }

    set maxFitness(value: number) {
        this._maxFitness = value;
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
