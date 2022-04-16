import {WhiskerAssertion} from "./WhiskerAssertion";

export class BooleanAssertion extends WhiskerAssertion {

    constructor (private value: boolean) {
        super();
    }

    toString(): string {
        return `assert ${this.value}`;
    }

    toJavaScript(): string {
        return `// assert (${this.value});`;
    }
}
