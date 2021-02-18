export class NeatConfig {

    // Network Settings
    public static INPUT_NEURONS = 6;
    public static MAX_HIDDEN_LAYERS = 10;
    public static OUTPUT_NEURONS = 2;

    // Compatibility Distance
    public static EXCESS_COEFFICIENT = 4.5
    public static DISJOINT_COEFFICIENT = 4.5
    public static WEIGHT_COEFFICIENT = 0.9
    public static DISTANCE_THRESHOLD = 1.9;

    // Population Management
    public static STALE_SPECIES = 15;
    public static STALE_POPULATION = 20;
    public static MUTATION_WITHOUT_CROSSOVER = 0.25;
    public static CHROMOSOME_IN_SPECIES_EXTINCTION = 0.2;
    public static ELITE_RATE = 0.2;


    // Mutation Rates
    public static MUTATE_WEIGHT_NETWORK_LEVEL = 0.8;
    public static MUTATE_WEIGHT_UNIFORMLY = 0.9;
    public static MUTATE_ADD_CONNECTION = 0.4;
    public static MUTATE_CONNECTION_STATE = 0.5;
    public static MUTATE_ADD_NODE = 0.2;
}
