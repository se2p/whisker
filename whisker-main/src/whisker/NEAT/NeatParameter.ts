export class NeatParameter {

    // Parameter

    // Network Settings
    public static INPUT_NEURONS = 6;
    public static MAX_HIDDEN_LAYERS = 20;
    public static OUTPUT_NEURONS = 3;
    public static STARTING_CONNECTION_RATE = 0.3;

    // Compatibility Distance
    public static EXCESS_COEFFICIENT = 0.25;
    public static DISJOINT_COEFFICIENT = 0.25;
    public static WEIGHT_COEFFICIENT = 0.4;
    public static DISTANCE_THRESHOLD = 2.0;

    // Population Management
    public static POPULATION_SIZE = 200;
    public static SPECIES_PARENTS = 0.20;  // How many members of the species survive in each generation
    public static MUTATION_WITHOUT_CROSSOVER = 0.25;        // Rate for only applying mutation and no crossover
    public static CROSSOVER_ONLY_RATE = 0.2;                // Rate for applying crossover without mutation
    public static PENALIZING_AGE = 15   // The amount of generations where species start to get penalized
    public static AGE_SIGNIFICANCE = 1.0; // How much of a boost young species should get

    // Crossover Rates
    public static INTERSPECIES_CROSSOVER_RATE = 0.001;
    public static CROSSOVER_WEIGHT_AVERAGES_RATE = 0.4

    // Mutation Rates
    public static MUTATE_WEIGHTS = 0.9;
    public static MUTATE_WEIGHT_POWER = 1.5;
    public static MUTATE_ADD_CONNECTION = 0.03;
    public static MUTATE_CONNECTION_STATE = 0.05;
    public static MUTATE_ADD_NODE = 0.01;
    public static POPULATION_CHAMPION_CONNECTION_MUTATION = 0.2;
    public static RECURRENCY_RATE = 0.1;
    public static ADD_CONNECTION_TRIES = 50;
    public static MUTATE_REENABLE_STATE = 0.1;
}
