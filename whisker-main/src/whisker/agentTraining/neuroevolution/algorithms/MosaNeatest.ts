import {NeatChromosome} from "../networks/NeatChromosome";
import {StatisticsCollector} from "../../../utils/StatisticsCollector";
import {SearchAlgorithmProperties} from "../../../search/SearchAlgorithmProperties";
import {ManyObjectiveNeatest} from "./ManyObjectiveNeatest";
import {NeatPopulation} from "../neuroevolutionPopulations/NeatPopulation";
import {preferenceSorting} from "../../../search/algorithms/MOSA";


/**
 * Combines Neatest with the MOSA algorithm.
 */
export class MosaNeatest extends ManyObjectiveNeatest {

    /**
     * Probability for a mutation.
     */
    protected _mutationProbability: number;

    /**
     * Probability for applying crossover.
     */
    protected _crossoverProbability: number;

    /**
     * Searches for a suite of networks that are able to cover all statements of a given Scratch program according to
     * the MOSA and Neatest algorithms.
     *
     * @return Mapping of a statement's key to the network capable of reaching the given statement.
     */
    override async findSolution(): Promise<Map<number, NeatChromosome>> {
        this.initialize();
        await this.initPopulation();
        this.updateCurrentTargets();
        await this.evaluatePopulation(this._population.networks);

        while (!await this.isResourceBudgetConsumed()) {

            // Breed and evaluate offspring population.
            const offspring = await this._breed(this._population, this._population.populationSize);
            await this.evaluatePopulation(offspring);

            if (await this.isResourceBudgetConsumed()) {
                break;
            }

            this.addToPopulation(this._population, offspring);

            // Form non-dominated fronts
            const nonOptimisedObjectives = new Map([...this._fitnessFunctions.entries()]
                .filter(([key]) => !this._archive.has(key)));
            const fronts = await preferenceSorting(this._population.networks, this._population.populationSize,
                nonOptimisedObjectives, this.compareChromosomes.bind(this));

            // Form the next generation based on non-dominated fronts.
            const nextPopulation: NeatChromosome[] = [];
            for (const front of fronts) {
                if (nextPopulation.length + front.length <= this._population.populationSize) {
                    nextPopulation.push(...front);
                } else {
                    // Sort last front by diversity in descending order as high diversity is preferred.
                    front.sort((c1: NeatChromosome, c2: NeatChromosome) => this.compareDiversity(c2, c1));
                    nextPopulation.push(...front.slice(0, (this._population.populationSize - nextPopulation.length)));
                    break;
                }
            }
            this._formNewGeneration(nextPopulation);

            // Update statistics, parameter and print generation report.
            this.updateBestIndividualAndStatistics();
            StatisticsCollector.getInstance().incrementIterationCount();
            this.iterationSummary();
        }
        return this._archive;
    }

    /**
     * Generates an offspring population by evolving the parent population using selection, crossover and mutation.
     *
     * @param parentPopulation The population to use for the evolution.
     * @param offspringSize The number of offspring to create.
     * @returns The offspring population networks.
     */
    private async _breed(parentPopulation: NeatPopulation, offspringSize: number): Promise<NeatChromosome[]> {
        const offspringPopulation: NeatChromosome[] = [];

        while (offspringPopulation.length < offspringSize) {
            const [parent1, parent2] = await this._selectParents(parentPopulation);

            let child1: NeatChromosome;
            let child2: NeatChromosome;

            // Apply crossover with a given probability.
            if (this._random.nextDouble() < this._crossoverProbability) {
                [child1, child2] = await parent1.crossover(parent2);

                // If NeatCrossover is chosen as crossover operator, child2 is undefined.
                // To compensate, we mutate the parent.
                child2 ??= await parent2.mutate();

                // With a given chance, mutate the crossover children.
                if (this._random.nextDouble() < this._mutationProbability) {
                    child1 = await child1.mutate();
                }
                if (this._random.nextDouble() < this._mutationProbability) {
                    child2 = await child2.mutate();
                }

            } else { // If no crossover is applied, we always mutate.
                child1 = await parent1.mutate();
                child2 = await parent2.mutate();
            }

            offspringPopulation.push(child1);
            if (offspringPopulation.length < offspringSize) {
                offspringPopulation.push(child2);
            }
        }

        this.initCoverageObjectivesMap(offspringPopulation);
        return offspringPopulation;
    }

    /**
     * Selects two parents for crossover and/or mutation.
     *
     * @param population The population to select two chromosomes from.
     * @returns Tuple of the selected crossover/mutation parents.
     */
    private async _selectParents(population: NeatPopulation): Promise<[NeatChromosome, NeatChromosome]> {
        const firstParent = this._random.pick(this._population.networks);
        const selectedSpecies = population.getSpeciesOfNetwork(firstParent);

        // If the first parent is the only member of its species. Draw randomly from another species.
        if (selectedSpecies.networks.length <= 1) {
            const remainingSpecies = this._population.species.filter(species => species.uID != selectedSpecies.uID);
            const randomSpecies = this._random.pick(remainingSpecies);
            return [firstParent, this._random.pick(randomSpecies.networks)];
        }

        // Otherwise, we draw a random second parent from the same species.
        const remainingSpeciesMember = selectedSpecies.networks.filter(network => network.uID != firstParent.uID);
        return [firstParent, this._random.pick(remainingSpeciesMember)];
    }

    /**
     * Forms a new generation by replacing the old networks with the new ones and updating population attributes.
     * @param nextPopulation The networks of the new generation.
     */
    private _formNewGeneration(nextPopulation: NeatChromosome[]): void {
        this.replaceGlobalPopulation(nextPopulation);
        this._population.generation++;
        this._population.species.forEach(specie => specie.age++);
        this._population.removeEmptySpecies();
        this._population.updateCompatibilityThreshold();
    }

    /**
     * Sets the required hyperparameter.
     * @param properties the user-defined hyperparameter.
     */
    public override setProperties(properties: SearchAlgorithmProperties<NeatChromosome>): void {
        super.setProperties(properties);
        this._crossoverProbability = this._neuroevolutionProperties.crossoverProbability;
        this._mutationProbability = this._neuroevolutionProperties.mutationProbability;
    }
}



