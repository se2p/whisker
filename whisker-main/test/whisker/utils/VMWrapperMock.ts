import VMWrapper from "../../../src/vm/vm-wrapper";

export class VMWrapperMock {

    private startTime: number;
    private runStartTime: number;
    private stepsExecuted: number;

    init() {
        this.startTime = Date.now();
        this.stepsExecuted = 1; // Don't need that atm
        this.runStartTime = Date.now();
    }

    /**
     * @return {number} .
     */
    getTotalTimeElapsed() {
        return (Date.now() - this.startTime);
    }

    /**
     * @return {number} .
     */
    getRunTimeElapsed() {
        return (Date.now() - this.runStartTime);
    }

    /**
     * @return {number} .
     */
    getTotalStepsExecuted() {
        return this.stepsExecuted;
    }
}
