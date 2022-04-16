export abstract class WhiskerAssertion {

    // evaluate a trace entry -> bool

    // String representation
    abstract toString(): string;

    // JavaScript representation
    abstract toJavaScript(): string;
}
