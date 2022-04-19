export abstract class WhiskerAssertion {

    // evaluate a trace entry -> bool
    abstract evaluate(state): boolean;

    // String representation
    abstract toString(): string;

    // JavaScript representation
    abstract toJavaScript(): string;
}
