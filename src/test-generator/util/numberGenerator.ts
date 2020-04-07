/**
 * Helper class to guarantee that results are deterministically reproducible.
 * 
 * @author Sophia Geserer
 */
export interface NumberGenerator {

    /**
     * Generation of a deterministically reproducible number.
     */
    generate(): number;

}