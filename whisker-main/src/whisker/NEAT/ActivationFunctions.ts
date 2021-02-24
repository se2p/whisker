export class ActivationFunctions {
    /**
     * Modified Sigmoid function proposed by the paper
     * @param x the value the sigmoid function should be applied to
     * @private
     */
    public static sigmoid(x: number): number {
        return (1 / (1 + Math.exp(-4.9 * x)));
    }

    public static softmax(x: number, v: number[]): number {
        let denominator = 0;
        for (const num of v) {
            denominator += Math.exp(num);
        }
        return Math.exp(x) / denominator;
    }
}
