export class NeatConfig {

    // Network Settings
    public static readonly INPUT_NEURONS = 4;
    public static readonly MAX_HIDDEN_LAYERS = 10;
    public static readonly OUTPUT_NEURONS = 3;


    // Mutation Rates
    public static readonly MUTATE_WEIGHT_NETWORK_LEVEL = 0.9;
    public static readonly MUTATE_WEIGHT = 0.4;
    public static readonly MUTATE_ADD_CONNECTION= 0.2;
    public static readonly MUTATE_CONNECTION_STATE = 0.2;
}
