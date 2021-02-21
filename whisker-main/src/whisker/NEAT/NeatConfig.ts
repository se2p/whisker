export class NeatConfig {

    // Network Settings
    public static INPUT_NEURONS = 6;
    public static MAX_HIDDEN_LAYERS = 10;
    public static OUTPUT_NEURONS = 2;

    // Compatibility Distance
    public static EXCESS_COEFFICIENT = 1.0
    public static DISJOINT_COEFFICIENT = 1.0
    public static WEIGHT_COEFFICIENT = 0.8
    public static DISTANCE_THRESHOLD = 1.0;

    // Population Management
    public static STALE_SPECIES = 15;
    public static STALE_POPULATION = 20;
    public static MUTATION_WITHOUT_CROSSOVER = 0.25;
    public static CHROMOSOME_IN_SPECIES_EXTINCTION = 0.2;
    public static ELITE_RATE = 0.2;
    public static PENALIZING_AGE = 50    // The amount of generations where species start to get penalized
    public static AGE_SIGNIFICANCE = 1.0; // How much of a boost young species should get
    public static SPECIES_PARENTS = 0.2;  // How many members of the species survive in each generation
    public static POPULATION_SIZE = 100;
    public static POPULATION_CHAMPION_CONNECTION_MUTATION = 0.2;
    public static INTERSPECIES_CROSSOVER_RATE = 0.001;
    public static CROSSOVER_ONLY_RATE = 0.2;


    // Mutation Rates
    public static MUTATE_WEIGHT_NETWORK_LEVEL = 0.9;
    public static MUTATE_WEIGHT_UNIFORMLY = 0.9;
    public static MUTATE_ADD_CONNECTION = 0.03;
    public static MUTATE_CONNECTION_STATE = 0.6;
    public static MUTATE_ADD_NODE = 0.02;
}
