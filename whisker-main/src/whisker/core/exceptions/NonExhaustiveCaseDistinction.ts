/**
 * Represents a non-exhaustive case distinction, i.e., typically an `if`-`else` or `switch`-`case` construct where not
 * all possible outcomes have been handled. The error serves as a hack to enforce exhaustiveness checks by the type
 * checker, using TypeScript's `never` type.
 *
 * @example
 *
 * ```typescript
 * type Shape =
 *     | { kind: "circle", radius: number }
 *     | { kind: "square", length: number }
 *     ;
 *
 * function area(shape: Shape): number {
 *     const kind = shape.kind;
 *     switch (kind) {
 *         case "circle": return shape.radius * shape.radius * Math.PI;
 *         case "square": return shape.length * shape.length;
 *         default: throw new NonExhaustiveCaseDistinction(kind); // <=== HERE!
 *     }
 * }
 * ```
 *
 * In this example, if a new type is added to the `Shape` union, the type checker will report an error
 *
 * > Argument of type `…` is not assignable to parameter of type `never`
 *
 * in the `default`-case, signaling that the `case`-distinction for the newly added shape is missing.
 */
export class NonExhaustiveCaseDistinction extends Error {

    /**
     * Creates a new `NonExhaustiveCaseDistinction` error. Typically, one wants to construct and throw this error in an
     * `else`-branch or `default`-case, when it is assumed that all possibilities have been handled. Then, the `else`-
     * branch or `default`-case will never be entered, and as such the type of the `unhandled` value will be `never`.
     * TypeScript can statically check this, and will report a type error if a case distinction is missing:
     *
     * > Argument of type `…` is not assignable to parameter of type `never`
     *
     * @param unhandled The unhandled value
     * @param message An optional error message
     */
    constructor(unhandled: never, message = `Unhandled value: ${unhandled}`) {
        super(message);
    }
}
