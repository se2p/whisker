import {AbstractCheck} from "./AbstractCheck";

export type ChangingCheck = AbstractCheck & { change: string };

export function contradicts<T extends ChangingCheck>(check1: T, check2: T): boolean {
    let change1 = check1.change;
    let change2 = check2.change;
    let negated1 = check1.negated;
    let negated2 = check2.negated;

    if (change1.length == 2 && change2.length == 2) {
        // += & +=, -= & -= are not getting until here, caught before call to checkChange
        // += & -=, -= & += only tested here
        return negated1 == negated2;
    }

    if (change1.length == 2) {
        change1 = getInvertedChangeOp(change1);
        negated1 = !negated1;
    } else if (change2.length == 2) {
        change2 = getInvertedChangeOp(change2);
        negated2 = !negated2;
    }

    if (change1 == change2) {
        return negated1 != negated2;
    }

    return !negated1 && !negated2;
}

// only for += and -=
function getInvertedChangeOp(change: string): string {
    return change == "+=" ? "-" : "+";
}

