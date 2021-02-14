export class NeatConfig {

    // Network Settings
    public static INPUT_NEURONS = 4;
    public static MAX_HIDDEN_LAYERS = 10;
    public static OUTPUT_NEURONS = 3;

    // Compatibility Distance
    public static EXCESS_COEFFICIENT = 1
    public static DISJOINT_COEFFICIENT = 1
    public static WEIGHT_COEFFICIENT = 1
    public static DISTANCE_THRESHOLD = 3.0;


    // Mutation Rates
    public static MUTATE_WEIGHT_NETWORK_LEVEL = 0.9;
    public static MUTATE_WEIGHT = 0.4;
    public static MUTATE_ADD_CONNECTION= 0.2;
    public static MUTATE_CONNECTION_STATE = 0.2;
    public static MUTATE_ADD_NODE = 0.3;
}
