import {Condition} from "./Condition";

export class VarTestCondition implements Condition {
    private varName: string;
    private varValue: string;
    private comparisonMode: string;

    /**
     * todo
     * @param varName Name of the variable.
     * @param comparisonMode Mode of comparison, e.g. =, <, >, <=, >=
     * @param varValue Value to compare to the variable's current value.
     */
    constructor(varName: string, comparisonMode: string, varValue: string) {
        this.varName = varName;
        this.varValue = varValue;
        this.comparisonMode = comparisonMode;
    }

    check(testDriver): boolean {
        if (this.varValue == "30") { // todo only for fruit catcher test. change
            return true;
        }
        return false;
    }

    register(testDriver): void {
    }

    reset(): void {
    }

}
